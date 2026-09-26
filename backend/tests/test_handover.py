import pytest
import json
import hashlib
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.domain.schemas import UserRoleEnum

client = TestClient(app)

def get_auth_header(user_id: str, role: str, username: str = "test@prana.health", display_name: str = "Test User"):
    token = create_access_token(
        subject=username,
        role=role,
        user_id=user_id,
        display_name=display_name
    )
    return {"Authorization": f"Bearer {token}"}

# Test 1: Authorized Field Medic or Clinician can generate a handover package
def test_authorized_user_can_generate_handover():
    headers = get_auth_header("usr-medic-102", UserRoleEnum.FIELD_MEDIC.value)
    resp = client.post("/api/v1/cases/PR-8492/handover/generate", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["caseId"] == "PR-8492"
    assert data["status"] in ["GENERATED", "ACKNOWLEDGED"]
    assert "packageId" in data
    assert "integrityHash" in data
    assert len(data["integrityHash"]) == 64 # SHA-256 hex string
    assert data["patient"]["name"] == "Rahul Verma"

# Test 2: Unauthenticated user receives 401
def test_unauthenticated_handover_rejected():
    resp = client.post("/api/v1/cases/PR-8492/handover/generate")
    assert resp.status_code == 401

# Test 3: Unassigned user cannot generate or access handover
def test_unassigned_user_handover_denied():
    headers = get_auth_header("usr-medic-999", UserRoleEnum.FIELD_MEDIC.value)
    resp = client.get("/api/v1/cases/PR-8492/handover", headers=headers)
    assert resp.status_code == 403
    assert "not assigned" in resp.json()["detail"]

# Test 4: Handover package contains only current case data and preserves provenance
def test_handover_provenance_and_data_isolation():
    headers = get_auth_header("usr-clinician-482", UserRoleEnum.REMOTE_CLINICIAN.value)
    resp = client.get("/api/v1/cases/PR-8492/handover", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    # Provenance fields
    assert "provenance" in data
    assert data["provenance"]["sourceCaseVersion"] >= 1
    assert data["provenance"]["sourceEventCount"] > 0
    assert len(data["provenance"]["contentDigestSha256"]) == 64

    # Latest vitals have source event ID
    assert "latestVitals" in data
    assert "sourceEventId" in data["latestVitals"]
    assert data["latestVitals"]["heartRate"] > 0

    # Patient isolation
    assert data["patient"]["id"] == "PT-391"
    assert "Sunita Gowda" not in json.dumps(data) # No leakage from PR-7104

# Test 5: AI signals in handover are strictly non-autonomous and labeled
def test_ai_decision_support_in_handover_is_safe_and_labeled():
    headers = get_auth_header("usr-clinician-482", UserRoleEnum.REMOTE_CLINICIAN.value)
    resp = client.get("/api/v1/cases/PR-8492/handover", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "decisionSupport" in data
    for sig in data["decisionSupport"]:
        # Must have simulated decision support safety label
        assert "SIMULATED DECISION SUPPORT" in sig["safetyLabel"]
        assert "NOT A DIAGNOSIS" in sig["safetyLabel"]
        # Must show observed data and explanation
        assert len(sig["observedData"]) > 0
        assert len(sig["explanation"]) > 0
        # Must have provider metadata
        assert "DemoDecisionSupportProvider" in sig["provider"]

# Test 6: Hospital Command can acknowledge handover and appends Care Rail event
def test_hospital_command_can_acknowledge_handover():
    # 1. Generate package
    gen_headers = get_auth_header("usr-hospital-704", UserRoleEnum.HOSPITAL_COMMAND.value)
    gen_resp = client.post("/api/v1/cases/PR-8492/handover/generate", headers=gen_headers)
    assert gen_resp.status_code == 200
    package_id = gen_resp.json()["packageId"]

    # 2. Acknowledge receipt
    ack_headers = get_auth_header("usr-hospital-704", UserRoleEnum.HOSPITAL_COMMAND.value)
    ack_resp = client.post(
        f"/api/v1/cases/PR-8492/handover/{package_id}/acknowledge",
        headers=ack_headers,
        json={"notes": "Trauma Bay 1 ready. Resuscitation team standby."}
    )
    assert ack_resp.status_code == 200
    ack_data = ack_resp.json()
    assert ack_data["status"] == "ACKNOWLEDGED"
    assert ack_data["acknowledgedBy"]["name"] == "Sister Philomina, RN"

    # 3. Verify event is appended to Care Rail / Timeline
    case_resp = client.get("/api/v1/cases/PR-8492", headers=ack_headers)
    timeline = case_resp.json()["timeline"]
    handover_events = [e for e in timeline if "Prehospital Handover" in e["title"]]
    assert len(handover_events) >= 1
    latest_evt = timeline[0]
    assert "Handover Received" in latest_evt["title"] or "Prehospital Handover" in latest_evt["title"]

# Test 7: Field Medic cannot acknowledge hospital handover (RBAC enforcement)
def test_medic_cannot_acknowledge_hospital_handover():
    gen_headers = get_auth_header("usr-hospital-704", UserRoleEnum.HOSPITAL_COMMAND.value)
    gen_resp = client.post("/api/v1/cases/PR-8492/handover/generate", headers=gen_headers)
    package_id = gen_resp.json()["packageId"]

    medic_headers = get_auth_header("usr-medic-102", UserRoleEnum.FIELD_MEDIC.value)
    ack_resp = client.post(
        f"/api/v1/cases/PR-8492/handover/{package_id}/acknowledge",
        headers=medic_headers,
        json={"notes": "Medic attempting ED acknowledgement"}
    )
    assert ack_resp.status_code == 403
    assert "lacks permission" in ack_resp.json()["detail"] or "HOSPITAL_COMMAND" in ack_resp.json()["detail"]

# Test 8: Independent SHA-256 cryptographic integrity verification
def test_cryptographic_integrity_verification():
    headers = get_auth_header("usr-hospital-704", UserRoleEnum.HOSPITAL_COMMAND.value)
    gen_resp = client.post("/api/v1/cases/PR-8492/handover/generate", headers=headers)
    package_id = gen_resp.json()["packageId"]

    verify_resp = client.get(f"/api/v1/cases/PR-8492/handover/{package_id}/verify", headers=headers)
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["match"] is True
    assert verify_data["storedHash"] == verify_data["recalculatedHash"]
    assert len(verify_data["storedHash"]) == 64

# Test 9: Structured JSON Export endpoint
def test_structured_json_export():
    headers = get_auth_header("usr-hospital-704", UserRoleEnum.HOSPITAL_COMMAND.value)
    gen_resp = client.post("/api/v1/cases/PR-8492/handover/generate", headers=headers)
    package_id = gen_resp.json()["packageId"]

    export_resp = client.get(f"/api/v1/cases/PR-8492/handover/{package_id}/export?format=json", headers=headers)
    assert export_resp.status_code == 200
    assert "application/json" in export_resp.headers["content-type"]
    assert "attachment" in export_resp.headers["content-disposition"]
    export_json = export_resp.json()
    assert export_json["packageId"] == package_id
    assert export_json["patient"]["name"] == "Rahul Verma"

# Test 10: Structured FHIR R4 Bundle Export endpoint
def test_fhir_r4_bundle_export():
    headers = get_auth_header("usr-hospital-704", UserRoleEnum.HOSPITAL_COMMAND.value)
    gen_resp = client.post("/api/v1/cases/PR-8492/handover/generate", headers=headers)
    package_id = gen_resp.json()["packageId"]

    export_resp = client.get(f"/api/v1/cases/PR-8492/handover/{package_id}/export?format=fhir", headers=headers)
    assert export_resp.status_code == 200
    assert "application/fhir+json" in export_resp.headers["content-type"]
    assert "attachment" in export_resp.headers["content-disposition"]

    fhir_doc = export_resp.json()
    assert fhir_doc["resourceType"] == "Bundle"
    assert fhir_doc["type"] == "document"
    assert len(fhir_doc["entry"]) >= 4

    resource_types = [e["resource"]["resourceType"] for e in fhir_doc["entry"]]
    assert "Composition" in resource_types
    assert "Patient" in resource_types
    assert "Encounter" in resource_types
    assert "Observation" in resource_types

# Test 11: Invalid format parameter is rejected with 422
def test_invalid_export_format_rejected():
    headers = get_auth_header("usr-hospital-704", UserRoleEnum.HOSPITAL_COMMAND.value)
    gen_resp = client.post("/api/v1/cases/PR-8492/handover/generate", headers=headers)
    package_id = gen_resp.json()["packageId"]

    export_resp = client.get(f"/api/v1/cases/PR-8492/handover/{package_id}/export?format=xml", headers=headers)
    assert export_resp.status_code == 422

# Test 12: Handover generation works deterministically for all 3 scenarios
def test_handover_generation_all_three_scenarios():
    scenarios = [
        ("PR-8492", "Rahul Verma", "TRAUMA"),
        ("PR-7104", "Sunita Gowda", "SNAKEBITE"),
        ("PR-9521", "Manoj Kumar", "POISONING")
    ]
    headers = get_auth_header("usr-admin-001", UserRoleEnum.PORTAL_ADMIN.value)

    for case_id, expected_name, expected_domain in scenarios:
        resp = client.post(f"/api/v1/cases/{case_id}/handover/generate", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["caseId"] == case_id
        assert data["patient"]["name"] == expected_name
        assert data["incident"]["domain"] == expected_domain
        assert data["completeness"]["isComplete"] is True
        assert data["completeness"]["completenessPercentage"] == 100
        assert len(data["integrityHash"]) == 64
