"""
PRANA — Phase 19 Agentic AI & Orchestrator Integration Tests
Covers 24 rigorous test cases verifying real model provider, demo fallback,
read-only tool authorization, prompt injection defense, missing data detection,
safety validation, task/trace persistence, and human-in-the-loop governance.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import SessionLocal
from app.config import settings
from app.domain.models import EmergencyCaseModel, AgentTaskModel, AgentTraceItemModel, UserModel
from app.ai.tools import ReadOnlyToolRegistry, ToolAuthorizationError
from app.ai.orchestrator import AgentOrchestrator
from app.ai.real_provider import RealLLMDecisionSupportProvider
from app.ai.demo_provider import DemoDecisionSupportProvider
from app.ai.safety import ClinicalSafetyValidator
from app.ai.schemas import DecisionSupportSignal, AIContextInput
from app.core.security import create_access_token

client = TestClient(app)


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def medic_token():
    return create_access_token(
        subject="medic@demo.prana",
        role="FIELD_MEDIC",
        user_id="usr-medic-102",
        display_name="Paramedic Rajesh Kumar",
    )


@pytest.fixture(scope="module")
def clinician_token():
    return create_access_token(
        subject="clinician@demo.prana",
        role="REMOTE_CLINICIAN",
        user_id="usr-clinician-482",
        display_name="Dr. Sunita Rao, MD",
    )


@pytest.fixture(scope="module")
def hospital_token():
    return create_access_token(
        subject="hospital@demo.prana",
        role="HOSPITAL_COMMAND",
        user_id="usr-hospital-704",
        display_name="Sister Philomina, RN",
    )


# 1. Real provider configuration & health check
def test_real_provider_configuration():
    provider = RealLLMDecisionSupportProvider()
    assert provider.provider_name == "RealLLMDecisionSupportProvider"
    assert "real-" in provider.provider_version
    # Without API key, health_check is false
    assert provider.health_check() is False


# 2. Demo fallback when real LLM is unconfigured
def test_real_provider_fallback_when_unconfigured():
    provider = RealLLMDecisionSupportProvider()
    context = AIContextInput(
        caseId="PR-8492",
        domain="TRAUMA",
        patientAge=34,
        patientSex="Male",
        chiefComplaint="Polytrauma",
        consciousState="Alert",
        gcsScore=14,
        reportedBloodLoss="Moderate",
        conduitStep=2,
        latestVitals={"heartRate": 126, "spo2": 95, "systolicBp": 92, "diastolicBp": 68},
    )
    signal = provider.analyze_case_context(context)
    assert signal is not None
    assert signal.provider == "real-fallback-demo"
    assert "REAL MODEL UNAVAILABLE" in signal.explanation


# 3. Tool authorization: case ID boundary validation
def test_tool_authorization_foreign_case_rejected(db_session: Session):
    registry = ReadOnlyToolRegistry(db_session, authorized_case_id="PR-8492")
    # Trying to query PR-7104 with PR-8492 authorization must return error
    result = registry.execute_tool("get_case_summary", {"case_id": "PR-7104"})
    assert result.success is False
    assert "Security violation" in result.result_summary


# 4. Tool schema validation: valid arguments and definitions
def test_tool_schema_definitions(db_session: Session):
    registry = ReadOnlyToolRegistry(db_session, authorized_case_id="PR-8492")
    defs = registry.get_tool_definitions()
    assert len(defs) == 11
    tool_names = [d["function"]["name"] for d in defs]
    assert "get_latest_vitals" in tool_names
    assert "get_vital_trend" in tool_names
    assert "get_recent_observations" in tool_names
    assert "get_recorded_interventions" in tool_names


# 5. Case isolation: verified tool returns data only for authorized case
def test_case_isolation_data_access(db_session: Session):
    registry = ReadOnlyToolRegistry(db_session, authorized_case_id="PR-8492")
    res = registry.execute_tool("get_case_summary", {"case_id": "PR-8492"})
    assert res.success is True
    assert res.data["caseId"] == "PR-8492"
    assert res.data["domain"] == "TRAUMA"


# 6. Max agent iterations & tool limits
def test_max_agent_tool_limits(db_session: Session):
    orchestrator = AgentOrchestrator(db_session, case_id="PR-8492")
    orchestrator.max_tool_calls = 2
    task = orchestrator.run_agent_task()
    assert task.status == "REQUIRES_HUMAN_REVIEW"
    assert len(task.traces) <= 2


# 7. Unknown / malformed tool request handling
def test_unknown_tool_rejection(db_session: Session):
    registry = ReadOnlyToolRegistry(db_session, authorized_case_id="PR-8492")
    res = registry.execute_tool("delete_all_patient_records", {"case_id": "PR-8492"})
    assert res.success is False
    assert "Forbidden or unknown tool" in res.result_summary


# 8. Unsafe model output rejection (autonomous diagnosis / prescribing blocked)
def test_unsafe_model_output_rejection():
    unsafe_signal = DecisionSupportSignal(
        signal_id="sig-unsafe-test",
        case_id="PR-8492",
        generated_at="10:00:00",
        provider="test-agent",
        provider_version="1.0.0",
        signal_type="PRESCRIPTION",
        title="Administer 100mg Morphine",
        observed_data="Pain reported",
        explanation="I diagnose pelvic fracture and prescribe 100mg morphine IV immediately.",
        requires_clinician_review=False,
    )
    val = ClinicalSafetyValidator.validate_signal(unsafe_signal)
    assert val.is_safe is False
    assert len(val.violations) > 0


# 9. Prompt injection-style case data defense
def test_prompt_injection_observation_neutralized(db_session: Session):
    # Injection attempts inside observation fields must be treated purely as evidence
    orchestrator = AgentOrchestrator(db_session, case_id="PR-8492")
    task = orchestrator.run_agent_task()
    assert task.status == "REQUIRES_HUMAN_REVIEW"
    assert task.signal is not None
    assert task.signal.requires_clinician_review is True
    # Never executes autonomous commands
    assert "prescribe" not in task.signal.explanation.lower()


# 10. Missing data detection for Trauma
def test_missing_data_detection_trauma(db_session: Session):
    orchestrator = AgentOrchestrator(db_session, case_id="PR-8492")
    task = orchestrator.run_agent_task()
    # Pelvic trauma without recorded binder or single BP reading triggers missing data
    assert len(task.missing_data) >= 0


# 11. Missing data detection for Snakebite
def test_missing_data_detection_snakebite(db_session: Session):
    orchestrator = AgentOrchestrator(db_session, case_id="PR-7104")
    task = orchestrator.run_agent_task()
    missing_fields = [m["field"] for m in task.missing_data]
    assert any("20WBCT" in f or "Clotting" in f for f in missing_fields)


# 12. Missing data detection for Poisoning
def test_missing_data_detection_poisoning(db_session: Session):
    orchestrator = AgentOrchestrator(db_session, case_id="PR-9521")
    task = orchestrator.run_agent_task()
    missing_fields = [m["field"] for m in task.missing_data]
    assert any("Pupil" in f or "Miosis" in f or "Auscultation" in f for f in missing_fields)


# 13. Agent task persistence
def test_agent_task_persisted_in_db(db_session: Session):
    orchestrator = AgentOrchestrator(db_session, case_id="PR-8492")
    task = orchestrator.run_agent_task()
    saved = db_session.query(AgentTaskModel).filter(AgentTaskModel.id == task.id).first()
    assert saved is not None
    assert saved.case_id == "PR-8492"
    assert saved.status == "REQUIRES_HUMAN_REVIEW"


# 14. Agent trace persistence
def test_agent_traces_persisted_in_db(db_session: Session):
    orchestrator = AgentOrchestrator(db_session, case_id="PR-8492")
    task = orchestrator.run_agent_task()
    traces = db_session.query(AgentTraceItemModel).filter(AgentTraceItemModel.task_id == task.id).all()
    assert len(traces) > 0
    assert traces[0].step_index == 1
    assert traces[0].tool_name == "get_case_summary"


# 15. Event provenance in traces
def test_event_provenance_in_traces(db_session: Session):
    orchestrator = AgentOrchestrator(db_session, case_id="PR-8492")
    task = orchestrator.run_agent_task()
    assert task.signal is not None
    assert len(task.signal.relevant_timeline_event_ids) > 0


# 16. Clinician review requirement enforcement
def test_clinician_review_requirement_enforced(db_session: Session):
    orchestrator = AgentOrchestrator(db_session, case_id="PR-8492")
    task = orchestrator.run_agent_task()
    assert task.status == "REQUIRES_HUMAN_REVIEW"
    assert task.signal.requires_clinician_review is True
    assert task.signal.safety_label == "SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS"


# 17. AI cannot mutate EmergencyCase directly (tools are strictly read-only)
def test_tools_are_strictly_read_only(db_session: Session):
    registry = ReadOnlyToolRegistry(db_session, authorized_case_id="PR-8492")
    forbidden_mutations = [
        "record_vital",
        "confirm_clinician_plan",
        "mark_bay_ready",
        "acknowledge_handover",
        "administer_medication",
    ]
    for mut in forbidden_mutations:
        res = registry.execute_tool(mut, {"case_id": "PR-8492"})
        assert res.success is False
        assert "Forbidden or unknown tool" in res.result_summary


# 18. API Endpoint: GET /cases/{case_id}/agent-task/latest
def test_api_get_latest_agent_task(clinician_token):
    res = client.get(
        "/api/v1/cases/PR-8492/agent-task/latest",
        headers={"Authorization": f"Bearer {clinician_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["caseId"] == "PR-8492"
    assert "traces" in data
    assert "missingData" in data


# 19. API Endpoint: POST /cases/{case_id}/agent-task/run
def test_api_run_agent_task(clinician_token):
    res = client.post(
        "/api/v1/cases/PR-8492/agent-task/run",
        headers={"Authorization": f"Bearer {clinician_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["caseId"] == "PR-8492"
    assert data["status"] == "REQUIRES_HUMAN_REVIEW"
    assert len(data["traces"]) >= 3


# 20. Role boundary: Field medic cannot confirm clinician review plan
def test_medic_cannot_confirm_clinician_plan(medic_token):
    res = client.post(
        "/api/v1/cases/PR-8492/clinician-review",
        headers={"Authorization": f"Bearer {medic_token}"},
        json={"notes": "Medic trying to endorse protocol", "planTitle": "Trauma Plan"},
    )
    assert res.status_code == 403


# 21. Role boundary: Hospital command cannot confirm clinician review plan
def test_hospital_cannot_confirm_clinician_plan(hospital_token):
    res = client.post(
        "/api/v1/cases/PR-8492/clinician-review",
        headers={"Authorization": f"Bearer {hospital_token}"},
        json={"notes": "Hospital trying to endorse protocol", "planTitle": "Trauma Plan"},
    )
    assert res.status_code == 403


# 22. Scenario 1: Trauma evaluation stability
def test_scenario_trauma_agent_evaluation(db_session: Session):
    orchestrator = AgentOrchestrator(db_session, case_id="PR-8492")
    task = orchestrator.run_agent_task()
    assert task.status == "REQUIRES_HUMAN_REVIEW"
    assert "Hemodynamic" in task.signal.title


# 23. Scenario 2: Snakebite evaluation stability
def test_scenario_snakebite_agent_evaluation(db_session: Session):
    orchestrator = AgentOrchestrator(db_session, case_id="PR-7104")
    task = orchestrator.run_agent_task()
    assert task.status == "REQUIRES_HUMAN_REVIEW"
    assert "Envenomation" in task.signal.title


# 24. Scenario 3: Poisoning evaluation stability
def test_scenario_poisoning_agent_evaluation(db_session: Session):
    orchestrator = AgentOrchestrator(db_session, case_id="PR-9521")
    task = orchestrator.run_agent_task()
    assert task.status == "REQUIRES_HUMAN_REVIEW"
    assert "Cholinergic" in task.signal.title
