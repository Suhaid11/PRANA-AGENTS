import pytest
from fastapi.testclient import TestClient

def test_arrival_handover_escalation_lifecycle(client: TestClient, medic_headers, clinician_headers, hospital_headers):
    # 1. Start with PR-8492
    case_resp = client.get("/api/v1/cases/PR-8492", headers=medic_headers)
    assert case_resp.status_code == 200
    case_data = case_resp.json()
    assert case_data["id"] == "PR-8492"

    # 2. Remote Clinician escalates for urgent review
    esc_resp = client.post(
        "/api/v1/cases/PR-8492/escalation",
        headers=clinician_headers,
        json={"reason": "Acute hemodynamic instability observed in transit."}
    )
    assert esc_resp.status_code == 200
    esc_data = esc_resp.json()
    assert esc_data["clinicianEndorsement"]["status"] == "ESCALATED"

    # 3. Hospital Command acknowledges escalation
    hosp_ack_resp = client.post(
        "/api/v1/cases/PR-8492/escalation/acknowledge",
        headers=hospital_headers,
        json={"notes": "Trauma surgery team on hot standby at Bay 1."}
    )
    assert hosp_ack_resp.status_code == 200
    hosp_data = hosp_ack_resp.json()
    # Check timeline for hospital escalation acknowledge
    timeline_titles = [e["title"] for e in hosp_data["timeline"]]
    assert any("Hospital Escalation Acknowledged" in t for t in timeline_titles)

    # 4. Field Medic marks patient arrived (explicit event, not timer 0)
    arr_resp = client.post(
        "/api/v1/cases/PR-8492/arrival",
        headers=medic_headers,
        json={"facility": "Manipal Hospital", "notes": "Ambulance arrived at ambulance bay."}
    )
    assert arr_resp.status_code == 200
    arr_data = arr_resp.json()
    assert arr_data["status"] == "ARRIVED"
    assert arr_data["conduitStep"] >= 6

    # 5. Field Medic initiates transfer-of-care handover
    handover_init_resp = client.post(
        "/api/v1/cases/PR-8492/handover/initiate",
        headers=medic_headers,
        json={"notes": "Verbal SBAR briefing given to ED charge nurse."}
    )
    assert handover_init_resp.status_code == 200
    handover_init_data = handover_init_resp.json()
    assert handover_init_data["conduitStep"] >= 7
    timeline_titles = [e["title"] for e in handover_init_data["timeline"]]
    assert any("Prehospital Handover Initiated" in t for t in timeline_titles)

    # 6. Hospital Command accepts handover and completes transfer
    handover_accept_resp = client.post(
        "/api/v1/cases/PR-8492/handover/accept",
        headers=hospital_headers,
        json={"notes": "Patient transferred to trauma resuscitation bay 1. Care transferred."}
    )
    assert handover_accept_resp.status_code == 200
    final_data = handover_accept_resp.json()
    assert final_data["status"] == "TRANSFER_COMPLETED"
    assert final_data["conduitStep"] >= 8
    timeline_titles = [e["title"] for e in final_data["timeline"]]
    assert any("Prehospital Transfer of Care Accepted" in t for t in timeline_titles)
    assert any("Transfer of Care Completed" in t for t in timeline_titles)

    # Reset back to seed for subsequent tests
    admin_headers = {"Authorization": medic_headers["Authorization"]} # reset tested elsewhere
