import pytest

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"
    assert data["active_cases"] >= 3

def test_list_cases(client, medic_headers):
    response = client.get("/api/v1/cases", headers=medic_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    case_ids = [c["id"] for c in data]
    assert "PR-8492" in case_ids
    assert "PR-7104" in case_ids
    assert "PR-9521" in case_ids

def test_get_trauma_case_snapshot(client, medic_headers):
    response = client.get("/api/v1/cases/PR-8492", headers=medic_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "PR-8492"
    assert data["domain"] == "TRAUMA"
    assert data["patient"]["name"] == "Rahul Verma"
    assert data["ambulance"]["callSign"] == "Echo-4"
    assert len(data["vitalsHistory"]) >= 4
    assert len(data["timeline"]) >= 5
    assert data["facilityMatching"] is not None
    assert data["facilityMatching"]["recommendedHospitalId"] == "HOSP-MANIPAL"

def test_record_vital_and_signal_generation(client, medic_headers):
    payload = {
        "heartRate": 124,
        "spo2": 91,
        "systolicBp": 88,
        "diastolicBp": 58,
        "respiratoryRate": 24,
        "temperatureC": 36.6,
        "timestamp": "09:44:00"
    }
    response = client.post("/api/v1/cases/PR-8492/vitals", json=payload, headers=medic_headers)
    assert response.status_code == 201
    data = response.json()
    
    # Verify vital is recorded as latest
    assert data["currentVitals"]["heartRate"] == 124
    assert data["currentVitals"]["spo2"] == 91
    assert data["currentVitals"]["isAbnormal"] is True

    # Verify clinical signal updated to CRITICAL (HR 124 > 120 and SBP 88 < 90)
    assert data["aiDecisionSupport"]["riskLevel"] == "CRITICAL"
    assert data["aiDecisionSupport"]["riskScore"] >= 85

    # Verify event appended to event store (both vital deterioration and AI signal events)
    recent_events = data["timeline"][:2]
    recent_titles = [e["title"] for e in recent_events]
    assert any("Deterioration" in t for t in recent_titles)
    assert any("Decision Support Signal" in t for t in recent_titles)

def test_record_intervention(client, medic_headers):
    payload = {
        "actionLabel": "16G Large-Bore IV Access",
        "detailText": "Right antecubital fossa access secured with 16G cannula; saline lock flushed.",
        "actor": "FIELD MEDIC",
        "timestamp": "09:45:00"
    }
    response = client.post("/api/v1/cases/PR-8492/interventions", json=payload, headers=medic_headers)
    assert response.status_code == 201
    data = response.json()
    
    latest_event = data["timeline"][0]
    assert "16G Large-Bore IV Access" in latest_event["title"]
    assert latest_event["actor"] == "Paramedic Rajesh Kumar"

def test_clinician_confirm_review_plan(client, clinician_headers):
    payload = {
        "action": "CONFIRMED",
        "clinicianId": "DOC-482",
        "clinicianName": "Dr. Sunita Rao, MD",
        "reviewPlanTitle": "Trauma Stabilization & Readiness Plan",
        "notes": "Endorsed Level-1 angio-embolization activation & massive transfusion prep.",
        "timestamp": "09:46:00"
    }
    response = client.post("/api/v1/cases/PR-8492/clinician-review", json=payload, headers=clinician_headers)
    assert response.status_code == 200
    data = response.json()

    assert data["clinicianEndorsement"]["status"] == "CONFIRMED"
    assert data["clinicianEndorsement"]["clinicianName"] == "Dr. Sunita Rao, MD"

    latest_event = data["timeline"][0]
    assert "Plan Confirmed" in latest_event["title"]
    assert latest_event["actor"] == "Dr. Sunita Rao, MD"

def test_clinician_request_additional_data(client, clinician_headers):
    payload = {
        "action": "DATA_REQUESTED",
        "requestedDataType": "Serial Pelvic Compression Stability & Blood Loss",
        "clinicianId": "DOC-482",
        "clinicianName": "Dr. Sunita Rao, MD",
        "notes": "Verify stability after binder application.",
        "timestamp": "09:47:00"
    }
    response = client.post("/api/v1/cases/PR-8492/data-request", json=payload, headers=clinician_headers)
    assert response.status_code == 200
    data = response.json()

    assert data["clinicianEndorsement"]["status"] == "DATA_REQUESTED"
    latest_event = data["timeline"][0]
    assert "Requested" in latest_event["title"]

def test_clinician_escalation(client, clinician_headers):
    payload = {
        "action": "ESCALATED",
        "reason": "Refractory hypotension unresponsive to crystalloid bolus.",
        "clinicianId": "DOC-482",
        "clinicianName": "Dr. Sunita Rao, MD",
        "timestamp": "09:48:00"
    }
    response = client.post("/api/v1/cases/PR-8492/escalation", json=payload, headers=clinician_headers)
    assert response.status_code == 200
    data = response.json()

    assert data["clinicianEndorsement"]["status"] == "ESCALATED"
    latest_event = data["timeline"][0]
    assert "Escalated" in latest_event["title"]
    assert latest_event["status"] == "CRITICAL"

def test_clinician_acknowledgement(client, clinician_headers):
    payload = {
        "action": "ACKNOWLEDGED",
        "signalId": "sig-test-1",
        "clinicianId": "DOC-482",
        "clinicianName": "Dr. Sunita Rao, MD",
        "notes": "Signal observed and noted.",
        "timestamp": "09:49:00"
    }
    response = client.post("/api/v1/cases/PR-8492/acknowledgement", json=payload, headers=clinician_headers)
    assert response.status_code == 200
    data = response.json()

    assert data["clinicianEndorsement"]["status"] == "ACKNOWLEDGED"

def test_hospital_prealert_and_bay_ready(client, hospital_headers):
    # 1. Pre-alert
    resp1 = client.post("/api/v1/cases/PR-8492/hospital/pre-alert", headers=hospital_headers)
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["hospitalReadiness"]["isPreAlertDispatched"] is True

    # 2. Acknowledge
    resp2 = client.post("/api/v1/cases/PR-8492/hospital/acknowledge", headers=hospital_headers)
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["hospitalReadiness"]["isPreAlertAcknowledged"] is True

    # 3. Bay Ready
    resp3 = client.post("/api/v1/cases/PR-8492/hospital/bay-ready?assigned_bay=Trauma%20Bay%201%20(Red%20Zone)", headers=hospital_headers)
    assert resp3.status_code == 200
    data3 = resp3.json()
    assert data3["hospitalReadiness"]["status"] == "BAY_READY"

def test_event_store_retrieval(client, medic_headers):
    response = client.get("/api/v1/cases/PR-8492/events", headers=medic_headers)
    assert response.status_code == 200
    events = response.json()
    assert len(events) >= 5
    # Ensure events have all required fields
    for evt in events:
        assert "id" in evt
        assert "timestamp" in evt
        assert "category" in evt
        assert "title" in evt
        assert "actor" in evt
        assert "status" in evt

def test_case_reset_to_seed(client, admin_headers):
    response = client.post("/api/v1/cases/PR-8492/reset", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "PR-8492"
    assert data["currentVitals"]["heartRate"] == 112
    assert data["clinicianEndorsement"]["status"] == "PENDING"
    assert len(data["timeline"]) in [5, 7]
