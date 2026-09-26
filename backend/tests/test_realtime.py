import pytest

def test_websocket_connection_and_handshake(client, medic_token):
    """Verify WebSocket connection and initial handshake envelope for an authorized case."""
    with client.websocket_connect(f"/api/v1/ws/cases/PR-8492?token={medic_token}") as websocket:
        data = websocket.receive_json()
        assert data["type"] == "CONNECTED"
        assert data["caseId"] == "PR-8492"
        assert "currentVersion" in data
        assert data["role"] == "FIELD_MEDIC"

def test_websocket_ping_pong(client, medic_token):
    """Verify heartbeat ping-pong over the authenticated WebSocket connection."""
    with client.websocket_connect(f"/api/v1/ws/cases/PR-8492?token={medic_token}") as websocket:
        # Read handshake
        handshake = websocket.receive_json()
        assert handshake["type"] == "CONNECTED"

        # Send PING
        websocket.send_json({"type": "PING"})
        pong = websocket.receive_json()
        assert pong["type"] == "PONG"
        assert pong["caseId"] == "PR-8492"

def test_websocket_rejects_nonexistent_case(client, medic_token):
    """Verify connection closes cleanly when subscribing to a nonexistent case."""
    with pytest.raises(Exception):
        with client.websocket_connect(f"/api/v1/ws/cases/PR-INVALID-CASE?token={medic_token}") as websocket:
            websocket.receive_json()

def test_case_isolation_and_broadcast_on_vital(client, clinician_token, medic_headers, medic_token):
    """
    Verify multi-case isolation:
    Subscribers to PR-8492 receive vital broadcast;
    Subscribers to PR-7104 do NOT receive PR-8492 events.
    """
    with client.websocket_connect(f"/api/v1/ws/cases/PR-8492?token={clinician_token}") as ws_trauma:
        # Read handshake
        hs_trauma = ws_trauma.receive_json()
        assert hs_trauma["caseId"] == "PR-8492"

        with client.websocket_connect(f"/api/v1/ws/cases/PR-7104?token={clinician_token}") as ws_snake:
            hs_snake = ws_snake.receive_json()
            assert hs_snake["caseId"] == "PR-7104"

            # Post vital to PR-8492
            vital_payload = {
                "heartRate": 128,
                "spo2": 93,
                "systolicBp": 86,
                "diastolicBp": 56,
                "respiratoryRate": 24,
                "temperatureC": 36.8,
                "timestamp": "10:45:00"
            }
            res = client.post("/api/v1/cases/PR-8492/vitals", json=vital_payload, headers=medic_headers)
            assert res.status_code == 201

            # Trauma subscriber must receive real-time VITAL_RECORDED event
            event = ws_trauma.receive_json()
            assert event["eventType"] == "VITAL_RECORDED"
            assert event["caseId"] == "PR-8492"
            assert event["actor"]["role"] == "FIELD_MEDIC"

def test_websocket_reconnection_and_catchup(client, medic_headers, medic_token):
    """
    Verify event catch-up after simulated WebSocket disconnection.
    """
    # 1. Capture initial version
    res = client.get("/api/v1/cases/PR-8492", headers=medic_headers)
    initial_version = res.json()["currentVersion"]

    # 2. Simulate client offline: post 2 vitals
    client.post("/api/v1/cases/PR-8492/vitals", json={
        "heartRate": 122, "spo2": 94, "systolicBp": 92, "diastolicBp": 62, "respiratoryRate": 20, "temperatureC": 37.0, "timestamp": "11:00:00"
    }, headers=medic_headers)
    client.post("/api/v1/cases/PR-8492/vitals", json={
        "heartRate": 126, "spo2": 92, "systolicBp": 88, "diastolicBp": 58, "respiratoryRate": 22, "temperatureC": 37.0, "timestamp": "11:05:00"
    }, headers=medic_headers)

    # 3. Client reconnects and queries ?after_version={initial_version}
    catchup_res = client.get(f"/api/v1/cases/PR-8492/events?after_version={initial_version}", headers=medic_headers)
    assert catchup_res.status_code == 200
    missed_events = catchup_res.json()
    assert len(missed_events) >= 2
    for evt in missed_events:
        assert evt["version"] > initial_version
