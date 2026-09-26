import pytest
from app.ai.demo_provider import DemoDecisionSupportProvider
from app.ai.schemas import AIContextInput, DecisionSupportSignal
from app.ai.safety import ClinicalSafetyValidator, SafetyPolicyViolationError
from app.ai.service import evaluate_case_decision_support, get_ai_provider
from app.domain.models import EmergencyCaseModel, DecisionSupportSignalModel, TimelineEventModel
from app.services.case_service import get_case_or_404
from app.services.clinical_service import record_vital, handle_clinician_acknowledgement
from app.domain.schemas import VitalSnapshotCreate, ClinicianAcknowledgeCreate

def make_test_context(domain="TRAUMA", hr=124, spo2=91, sbp=88, dbp=58):
    return AIContextInput(
        caseId="PR-8492",
        domain=domain,
        patientAge=34,
        patientSex="Male",
        chiefComplaint="Suspected pelvic disruption",
        consciousState="Alert",
        gcsScore=14,
        reportedBloodLoss="Minimal",
        conduitStep=2,
        latestVitals={
            "heart_rate": hr,
            "spo2": spo2,
            "systolic_bp": sbp,
            "diastolic_bp": dbp,
            "respiratory_rate": 24,
            "temperature_c": 36.6,
            "timestamp": "09:44:00"
        },
        recentVitalsTrend=[{"heart_rate": hr, "systolic_bp": sbp}],
        recentInterventions=[{"action_label": "Pelvic Binder", "timestamp": "09:40:00"}],
        recentEventIds=["evt-1", "evt-2"],
        assignedHospital="Manipal Hospital",
        etaMinutes=12
    )

# 1 & 2. Demo provider deterministic output: Same input -> same output
def test_demo_provider_deterministic_output():
    provider = DemoDecisionSupportProvider()
    ctx1 = make_test_context()
    ctx2 = make_test_context()

    sig1 = provider.analyze_case_context(ctx1)
    sig2 = provider.analyze_case_context(ctx2)

    assert sig1.signal_id == sig2.signal_id
    assert sig1.title == sig2.title
    assert sig1.observed_data == sig2.observed_data
    assert sig1.explanation == sig2.explanation
    assert sig1.provider == "DemoDecisionSupportProvider"
    assert sig1.safety_label == "SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS"
    assert sig1.requires_clinician_review is True

# 3 & 4. Unsafe AI output rejected by Clinical Safety Validator
def test_unsafe_ai_output_rejected_prescriptions():
    provider = DemoDecisionSupportProvider()
    valid_sig = provider.analyze_case_context(make_test_context())

    # Create an unsafe mutation attempting to administer drug
    unsafe_sig = valid_sig.model_copy(update={
        "explanation": "Administer 100mcg fentanyl IV immediately for severe pain."
    })
    result = ClinicalSafetyValidator.validate_signal(unsafe_sig)
    assert result.is_safe is False
    assert any("prescription/administration" in v for v in result.violations)

def test_unsafe_ai_output_rejected_autonomous_diagnosis():
    provider = DemoDecisionSupportProvider()
    valid_sig = provider.analyze_case_context(make_test_context())

    unsafe_sig = valid_sig.model_copy(update={
        "explanation": "Patient has hemorrhagic shock from arterial laceration."
    })
    result = ClinicalSafetyValidator.validate_signal(unsafe_sig)
    assert result.is_safe is False
    assert any("diagnostic assertion" in v for v in result.violations)

def test_unsafe_ai_output_rejected_missing_safety_label():
    provider = DemoDecisionSupportProvider()
    valid_sig = provider.analyze_case_context(make_test_context())

    unsafe_sig = valid_sig.model_copy(update={
        "safety_label": "VALIDATED MEDICAL ADVICE"
    })
    result = ClinicalSafetyValidator.validate_signal(unsafe_sig)
    assert result.is_safe is False
    assert any("safety label" in v for v in result.violations)

def test_unsafe_ai_output_rejected_override():
    provider = DemoDecisionSupportProvider()
    valid_sig = provider.analyze_case_context(make_test_context())

    unsafe_sig = valid_sig.model_copy(update={
        "explanation": "Bypass clinician and divert ambulance immediately to Bay 2."
    })
    result = ClinicalSafetyValidator.validate_signal(unsafe_sig)
    assert result.is_safe is False
    assert any("override" in v for v in result.violations)

# 5. AI endpoint cannot access unauthorized case
def test_ai_endpoint_case_access_denied(client, unassigned_headers):
    # unassigned user cannot access PR-8492 decision support
    resp = client.get("/api/v1/cases/PR-8492/decision-support", headers=unassigned_headers)
    assert resp.status_code == 403

# 6. Clinician can read authorized signals
def test_clinician_can_read_authorized_signals(client, clinician_headers):
    resp = client.get("/api/v1/cases/PR-8492/decision-support", headers=clinician_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["caseId"] == "PR-8492"
    assert data["provider"] == "DemoDecisionSupportProvider"
    assert data["providerAvailable"] is True
    assert "activeSignal" in data

# 7. Medic cannot invoke clinician-only actions
def test_medic_cannot_confirm_clinician_plan(client, medic_headers):
    payload = {
        "action": "CONFIRMED",
        "clinicianId": "MEDIC-102",
        "clinicianName": "Paramedic Rajesh Kumar",
        "reviewPlanTitle": "Unauthorized Protocol"
    }
    resp = client.post("/api/v1/cases/PR-8492/clinician-review", json=payload, headers=medic_headers)
    assert resp.status_code == 403

# 8. AI does not mutate EmergencyCase patient or vitals directly
def test_ai_does_not_mutate_patient_or_vitals(db_session):
    case = get_case_or_404(db_session, "PR-8492")
    orig_hr = case.vitals[-1].heart_rate
    orig_name = case.patient.name

    sig = evaluate_case_decision_support(db_session, case, force=True)
    assert sig is not None

    db_session.refresh(case)
    # EmergencyCase core patient data and vitals remain untouched by AI
    assert case.vitals[-1].heart_rate == orig_hr
    assert case.patient.name == orig_name

# 9 & 10. AI signal persists as event with monotonic version
def test_ai_signal_persists_as_event_with_monotonic_version(db_session):
    case = get_case_or_404(db_session, "PR-8492")
    prev_version = case.current_version or 1

    sig = evaluate_case_decision_support(db_session, case, force=True)
    assert sig is not None

    db_session.refresh(case)
    assert case.current_version > prev_version

    latest_event = (
        db_session.query(TimelineEventModel)
        .filter(TimelineEventModel.case_id == case.id)
        .order_by(TimelineEventModel.created_at.desc())
        .first()
    )
    assert latest_event is not None
    assert "Decision Support Signal" in latest_event.title
    assert latest_event.actor == "AI SUPPORT"
    assert latest_event.version == case.current_version

# 11. AI event broadcasts via WebSocket
def test_ai_evaluate_endpoint_broadcasts(client, clinician_headers):
    resp = client.post(
        "/api/v1/cases/PR-8492/decision-support/evaluate",
        json={"force": True},
        headers=clinician_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["caseId"] == "PR-8492"
    assert data["provider"] == "DemoDecisionSupportProvider"
    assert data["safetyLabel"] == "SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS"

# 12 & 13. Provider failure handled gracefully without blocking vital recording
def test_provider_failure_does_not_break_vital_recording(client, medic_headers, monkeypatch):
    class BrokenProvider(DemoDecisionSupportProvider):
        def analyze_case_context(self, context):
            raise RuntimeError("Synthetic simulated AI provider timeout / connection failure")

    monkeypatch.setattr("app.ai.service.get_ai_provider", lambda: BrokenProvider())

    vital_payload = {
        "heartRate": 118,
        "spo2": 93,
        "systolicBp": 95,
        "diastolicBp": 65,
        "respiratoryRate": 20,
        "temperatureC": 36.8,
        "timestamp": "09:50:00"
    }

    # Vital recording must succeed even though AI crashed!
    resp = client.post("/api/v1/cases/PR-8492/vitals", json=vital_payload, headers=medic_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["currentVitals"]["heartRate"] == 118
    assert data["currentVitals"]["spo2"] == 93

# 14. Clinician acknowledgment creates separate event and updates signal status
def test_clinician_acknowledgment_creates_separate_event(client, clinician_headers, db_session):
    case = get_case_or_404(db_session, "PR-8492")
    sig = evaluate_case_decision_support(db_session, case, force=True)
    assert sig is not None

    ack_payload = {
        "action": "ACKNOWLEDGED",
        "signalId": sig.signal_id,
        "clinicianId": "usr-clinician-482",
        "clinicianName": "Dr. Sunita Rao, MD",
        "notes": "Reviewed hemodynamic trend. Monitored without immediate protocol change."
    }
    resp = client.post("/api/v1/cases/PR-8492/acknowledgement", json=ack_payload, headers=clinician_headers)
    assert resp.status_code == 200


    # Verify separate ACK event on timeline
    case_resp = client.get("/api/v1/cases/PR-8492", headers=clinician_headers)
    timeline = case_resp.json()["timeline"]
    latest_event = timeline[0]
    assert "Acknowledged by Clinician" in latest_event["title"]
    assert latest_event["actor"] == "Dr. Sunita Rao, MD"

# 15. AI actor attribution is distinct from human actor attribution
def test_actor_attribution_distinct_ai_vs_human(client, clinician_headers, medic_headers):
    # Medic records vital -> actor is Medic
    v_resp = client.post("/api/v1/cases/PR-8492/vitals", json={
        "heartRate": 115, "spo2": 95, "systolicBp": 102, "diastolicBp": 68
    }, headers=medic_headers)
    assert v_resp.status_code == 201

    case_resp = client.get("/api/v1/cases/PR-8492", headers=clinician_headers)
    timeline = case_resp.json()["timeline"]

    actors = [e["actor"] for e in timeline[:5]]
    # AI events are attributed to "AI SUPPORT", human events to "Paramedic Rajesh Kumar" or "Dr. Sunita Rao, MD"
    assert "AI SUPPORT" in actors
    assert any("Paramedic" in a or "Dr." in a for a in actors)
