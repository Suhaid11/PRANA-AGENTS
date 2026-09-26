from datetime import timedelta
import pytest
from app.core.security import create_access_token
from app.database import SessionLocal
from app.domain.models import UserModel, SecurityEventModel

# 1. Valid login
def test_valid_login(client):
    res = client.post("/api/v1/auth/login", json={
        "username": "medic@demo.prana",
        "password": "prana-demo-2026"
    })
    assert res.status_code == 200
    data = res.json()
    assert "accessToken" in data or "access_token" in data
    token = data.get("accessToken") or data.get("access_token")
    assert token is not None
    user = data["user"]
    assert user["displayName"] == "Paramedic Rajesh Kumar"
    assert user["role"] == "FIELD_MEDIC"

# 2. Invalid password
def test_invalid_password(client):
    res = client.post("/api/v1/auth/login", json={
        "username": "medic@demo.prana",
        "password": "wrong-password-999"
    })
    assert res.status_code == 401
    assert "Invalid credentials" in res.json()["detail"]

# 3. Inactive user login blocked
def test_inactive_user_login(client):
    db = SessionLocal()
    try:
        # Create an inactive user
        u = db.query(UserModel).filter(UserModel.username == "inactive_test").first()
        if not u:
            from app.core.security import hash_password
            u = UserModel(
                id="usr-inactive-99",
                username="inactive_test",
                email="inactive@demo.prana",
                password_hash=hash_password("prana-demo-2026"),
                display_name="Deactivated Officer",
                role="FIELD_MEDIC",
                is_active=False
            )
            db.add(u)
            db.commit()
    finally:
        db.close()

    res = client.post("/api/v1/auth/login", json={
        "username": "inactive_test",
        "password": "prana-demo-2026"
    })
    assert res.status_code == 401
    assert "deactivated" in res.json()["detail"].lower()

# 4. Missing token on protected endpoint
def test_missing_token_access(client):
    res = client.get("/api/v1/cases/PR-8492")
    assert res.status_code == 401
    assert "Authentication required" in res.json()["detail"]

# 5. Expired token rejected
def test_expired_token(client):
    expired_token = create_access_token(
        subject="medic@demo.prana",
        role="FIELD_MEDIC",
        user_id="usr-medic-102",
        display_name="Paramedic Rajesh Kumar",
        expires_delta=timedelta(seconds=-10) # expired in the past
    )
    res = client.get(
        "/api/v1/cases/PR-8492",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert res.status_code == 401
    assert "expired" in res.json()["detail"].lower()

# 6. Valid role access: Field medic recording vitals
def test_valid_role_access_medic_vitals(client, medic_headers):
    payload = {
        "heartRate": 118,
        "spo2": 95,
        "systolicBp": 105,
        "diastolicBp": 70,
        "respiratoryRate": 18,
        "temperatureC": 37.0,
        "timestamp": "11:15:00"
    }
    res = client.post("/api/v1/cases/PR-8492/vitals", json=payload, headers=medic_headers)
    assert res.status_code == 201
    assert res.json()["currentVitals"]["heartRate"] == 118

# 7. Invalid role access: Field medic trying to confirm clinician review
def test_invalid_role_medic_cannot_confirm_clinician_plan(client, medic_headers):
    payload = {
        "action": "CONFIRMED",
        "reviewPlanTitle": "Unauthorized Medic Plan",
        "notes": "Attempting clinician confirmation as medic"
    }
    res = client.post("/api/v1/cases/PR-8492/clinician-review", json=payload, headers=medic_headers)
    assert res.status_code == 403
    assert "Action not authorized" in res.json()["detail"]
    assert "REMOTE_CLINICIAN" in res.json()["detail"]

# 8. Case access allowed: Assigned clinician accessing PR-8492
def test_case_access_allowed(client, clinician_headers):
    res = client.get("/api/v1/cases/PR-8492", headers=clinician_headers)
    assert res.status_code == 200
    assert res.json()["id"] == "PR-8492"

# 9. Case access denied: Unassigned medic trying to access PR-8492
def test_case_access_denied_for_unassigned_user(client, unassigned_headers):
    res = client.get("/api/v1/cases/PR-8492", headers=unassigned_headers)
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]
    assert "not assigned to emergency case" in res.json()["detail"]

# 10. Clinician action from medic returns 403 Forbidden
def test_clinician_action_from_medic_forbidden(client, medic_headers):
    res = client.post(
        "/api/v1/cases/PR-8492/escalation",
        json={"reason": "Medic escalation attempt"},
        headers=medic_headers
    )
    assert res.status_code == 403
    assert "REMOTE_CLINICIAN" in res.json()["detail"]

# 11. Hospital action from medic returns 403 Forbidden
def test_hospital_action_from_medic_forbidden(client, medic_headers):
    res = client.post(
        "/api/v1/cases/PR-8492/hospital/bay-ready",
        json={"assignedBay": "Trauma Bay 1 (Red Zone)"},
        headers=medic_headers
    )
    assert res.status_code == 403
    assert "HOSPITAL_COMMAND" in res.json()["detail"]

# 12. Clinician cannot confirm hospital bay ready
def test_clinician_cannot_mark_bay_ready(client, clinician_headers):
    res = client.post(
        "/api/v1/cases/PR-8492/hospital/bay-ready",
        json={"assignedBay": "Bay 2"},
        headers=clinician_headers
    )
    assert res.status_code == 403
    assert "HOSPITAL_COMMAND" in res.json()["detail"]

# 13. WebSocket unauthenticated connection closed with 4401
def test_websocket_unauthenticated_connection_rejected(client):
    with pytest.raises(Exception):
        with client.websocket_connect("/api/v1/ws/cases/PR-8492") as ws:
            # Client connects without token and doesn't send auth message
            ws.receive_json()

# 14. WebSocket valid authentication connects and receives CONNECTED
def test_websocket_valid_authentication(client, clinician_token):
    with client.websocket_connect(f"/api/v1/ws/cases/PR-8492?token={clinician_token}") as ws:
        data = ws.receive_json()
        assert data["type"] == "CONNECTED"
        assert data["caseId"] == "PR-8492"
        assert data["role"] == "REMOTE_CLINICIAN"

# 15. WebSocket initial AUTH frame handshake works
def test_websocket_initial_auth_frame(client, medic_token):
    with client.websocket_connect("/api/v1/ws/cases/PR-8492") as ws:
        # Send initial auth frame
        ws.send_json({"type": "AUTH", "token": medic_token})
        data = ws.receive_json()
        assert data["type"] == "CONNECTED"
        assert data["caseId"] == "PR-8492"
        assert data["role"] == "FIELD_MEDIC"

# 16. WebSocket wrong case access denied (unassigned user)
def test_websocket_case_access_denied_for_unassigned_user(client, unassigned_token):
    with pytest.raises(Exception):
        with client.websocket_connect(f"/api/v1/ws/cases/PR-8492?token={unassigned_token}") as ws:
            ws.receive_json()

# 17. Actor identity authoritatively comes from JWT, not client request body
def test_actor_identity_authoritatively_derived_from_jwt(client, clinician_headers):
    # Try to spoof clinician name as "Dr. Evil Hacker"
    spoofed_payload = {
        "action": "CONFIRMED",
        "clinicianId": "FAKE-ID-999",
        "clinicianName": "Dr. Evil Hacker",
        "reviewPlanTitle": "Authoritative Trauma Plan",
        "notes": "Verified specialist plan"
    }
    res = client.post("/api/v1/cases/PR-8492/clinician-review", json=spoofed_payload, headers=clinician_headers)
    assert res.status_code == 200
    data = res.json()
    latest_action = data["clinicianEndorsement"]
    
    # Must be stamped with real JWT identity (Dr. Sunita Rao, MD / usr-clinician-482)
    assert latest_action["clinicianName"] == "Dr. Sunita Rao, MD"
    assert latest_action["clinicianId"] == "usr-clinician-482"
    assert latest_action["clinicianName"] != "Dr. Evil Hacker"
    assert data["timeline"][0]["actor"] == "Dr. Sunita Rao, MD"

# 18. Authentication and security events are recorded in security_events audit table
def test_security_audit_events_recorded(client, medic_headers, unassigned_headers):
    # Trigger an unauthorized clinician action attempt as medic
    client.post(
        "/api/v1/cases/PR-8492/clinician-review",
        json={"action": "CONFIRMED"},
        headers=medic_headers
    )
    # Trigger a case access denial as unassigned
    client.get("/api/v1/cases/PR-8492", headers=unassigned_headers)

    db = SessionLocal()
    try:
        events = db.query(SecurityEventModel).order_by(SecurityEventModel.created_at.desc()).limit(10).all()
        event_types = [e.event_type for e in events]
        assert "UNAUTHORIZED_ACTION_BLOCKED" in event_types or "CASE_ACCESS_DENIED" in event_types
    finally:
        db.close()

# 19. /auth/me returns authenticated principal details
def test_auth_me_endpoint(client, hospital_headers):
    res = client.get("/api/v1/auth/me", headers=hospital_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["displayName"] == "Sister Philomina, RN"
    assert data["role"] == "HOSPITAL_COMMAND"

# 20. Token reconnect / re-authentication over WebSocket
def test_websocket_reconnect_reauthenticates(client, medic_token):
    # First connection
    with client.websocket_connect(f"/api/v1/ws/cases/PR-8492?token={medic_token}") as ws1:
        assert ws1.receive_json()["type"] == "CONNECTED"
    
    # Reconnect with valid token works cleanly
    with client.websocket_connect(f"/api/v1/ws/cases/PR-8492?token={medic_token}") as ws2:
        assert ws2.receive_json()["type"] == "CONNECTED"

    # Reconnect with expired token fails
    expired_token = create_access_token(
        subject="medic@demo.prana",
        role="FIELD_MEDIC",
        user_id="usr-medic-102",
        display_name="Paramedic",
        expires_delta=timedelta(seconds=-5)
    )
    with pytest.raises(Exception):
        with client.websocket_connect(f"/api/v1/ws/cases/PR-8492?token={expired_token}") as ws3:
            ws3.receive_json()
