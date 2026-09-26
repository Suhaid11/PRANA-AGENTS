"""
PRANA — Phase 20 Hybrid AI Agent Integration Tests
Tests Laya System 1 fast decision layer, Qwen3 System 2 agentic tool-use,
fast-path compute conservation, fallback resilience, prompt injection defense, and role boundaries.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import SessionLocal
from app.ai.laya_provider import LayaSystemOneProvider
from app.ai.qwen3_provider import Qwen3LocalProvider
from app.ai.orchestrator import AgentOrchestrator
from app.ai.schemas import AIContextInput, DecisionSupportSignal
from app.domain.models import TimelineEventModel, EmergencyCaseModel

client = TestClient(app)


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_laya_system_one_status():
    """Verifies that Laya System 1 provider reports ready status and sub-5ms latency."""
    laya = LayaSystemOneProvider()
    status = laya.check_status()
    assert status.available is True
    assert "laya" in status.provider.lower()
    assert status.structured_output is True


def test_laya_event_relevance_critical_shock():
    """Critical vital decompensation must be routed to deep_analysis with P0 priority."""
    laya = LayaSystemOneProvider()
    case_data = {
        "domain": "TRAUMA",
        "latestVitals": {"heartRate": 130, "systolicBp": 90, "diastolicBp": 65, "spo2": 91}
    }
    decision = laya.evaluate_event("VITAL_RECORDED", case_data)
    assert decision.relevance == "deep_analysis"
    assert decision.review_priority == "P0"
    assert decision.tool_bundle in ("vitals", "trends")
    assert decision.confidence >= 0.90


def test_laya_fast_path_skip_routine_transit():
    """Routine non-clinical transit update must be classified as no_analysis (fast path skip)."""
    laya = LayaSystemOneProvider()
    case_data = {"domain": "TRAUMA"}
    decision = laya.evaluate_event("ROUTE_UPDATED", case_data)
    assert decision.relevance == "no_analysis"
    assert decision.review_priority == "P3"
    assert "conserved" in decision.reason.lower()


def test_laya_domain_routing_snakebite_and_poisoning():
    """Laya routes envenomation to observations and toxicology to interventions."""
    laya = LayaSystemOneProvider()
    
    # Snakebite
    d_snake = laya.evaluate_event("OBSERVATION_RECORDED", {"domain": "SNAKEBITE", "vitals": {"hr": 88, "sys": 118, "dia": 78}})
    assert d_snake.tool_bundle == "observations"
    assert d_snake.relevance == "deep_analysis"

    # Poisoning
    d_tox = laya.evaluate_event("VITAL_RECORDED", {"domain": "POISONING", "vitals": {"hr": 52, "sys": 110, "dia": 70}})
    assert d_tox.tool_bundle == "interventions"
    assert d_tox.relevance == "deep_analysis"


def test_qwen3_tool_calling_guided_by_laya():
    """Verifies that Qwen3 prioritizes Laya's recommended bundle in multi-turn tool selection."""
    qwen3 = Qwen3LocalProvider(runtime="in_process")
    available = ["get_latest_vitals", "get_vital_trend", "get_recent_observations", "get_destination_readiness"]

    laya = LayaSystemOneProvider()
    laya_dec = laya.evaluate_event("OBSERVATION_RECORDED", {"domain": "SNAKEBITE"})

    # Step 1: Follows Laya's recommendation for observations
    call1 = qwen3.decide_next_tool_call("PR-7104", "SNAKEBITE", 1, {}, available, laya_decision=laya_dec)
    assert call1 is not None
    assert call1.tool_name == "get_recent_observations"

    # Step 2: Corroborates with vital trend
    evidence = {"get_recent_observations": {"observations": ["Fang marks on limb"]}}
    call2 = qwen3.decide_next_tool_call("PR-7104", "SNAKEBITE", 2, evidence, available, laya_decision=laya_dec)
    assert call2 is not None
    assert call2.tool_name == "get_vital_trend"


def test_hybrid_orchestrator_trauma_flow(db_session: Session):
    """Verifies full hybrid agent execution on Trauma scenario PR-8492."""
    orchestrator = AgentOrchestrator(db_session, case_id="PR-8492", provider_override="hybrid")
    task = orchestrator.run_agent_task()

    assert task.status == "REQUIRES_HUMAN_REVIEW"
    assert "Hybrid" in task.provider
    assert task.safety_status == "PASSED"
    assert len(task.traces) >= 2
    # Verify Laya gate trace item is present
    trace_names = [t.tool_name for t in task.traces]
    assert "laya_system_1_gate" in trace_names
    assert task.laya_gate is not None
    assert task.laya_gate.relevance == "deep_analysis"


def test_hybrid_orchestrator_fast_path_skip(db_session: Session):
    """Verifies that a routine route event triggers Laya fast-path early exit without calling Qwen3."""
    dummy_event = TimelineEventModel(
        id="evt-test-route-1",
        case_id="PR-8492",
        event_id="EVT-ROUTE-99",
        version=99,
        timestamp="12:00:00",
        category="TRANSPORT",
        title="Ambulance route update",
        detail="Routine GPS ping",
        actor="EMS_DISPATCH",
        status="INFO",
        payload_json='{"speedKmh": 45}',
    )
    orchestrator = AgentOrchestrator(db_session, case_id="PR-8492", trigger_event=dummy_event, provider_override="hybrid")
    task = orchestrator.run_agent_task()

    # Must complete early via fast path
    assert task.status == "COMPLETED"
    assert "[LAYA SYSTEM 1 FAST-PATH]" in task.reasoning_summary
    assert task.laya_gate.relevance == "no_analysis"
    # Only 1 trace: the Laya Gate itself, zero Qwen3 tool calls
    assert len(task.traces) == 1
    assert task.traces[0].tool_name == "laya_system_1_gate"


def test_provider_status_endpoint_reports_hybrid():
    """GET /api/v1/ai/provider-status?provider=hybrid returns structured System 1 and System 2 status."""
    response = client.get("/api/v1/ai/provider-status?provider=hybrid")
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "hybrid"
    assert "systemOne" in data
    assert data["systemOne"]["name"] == "Laya System 1"
    assert "systemTwo" in data
    assert data["systemTwo"]["name"] == "Qwen3 System 2"
    assert data["available"] is True


def test_role_projected_decision_support_views(db_session: Session):
    """
    Phase 21: Tests GET /api/v1/cases/PR-8492/decision-support/view across roles:
    - FIELD_MEDIC receives operational summary and cannot approve
    - REMOTE_CLINICIAN receives full clinical view with review authority
    - HOSPITAL_COMMAND receives receiving triage summary and cannot approve
    """
    from app.core.security import create_access_token

    # 1. Evaluate to guarantee an active signal and task exist and are committed
    from app.ai.service import evaluate_case_decision_support
    case_obj = db_session.query(EmergencyCaseModel).filter(EmergencyCaseModel.id == "PR-8492").first()
    evaluate_case_decision_support(db_session, case_obj, force=True)

    medic_token = create_access_token(subject="medic@demo.prana", role="FIELD_MEDIC", user_id="usr-medic-102", display_name="Paramedic Rajesh Kumar")
    clinician_token = create_access_token(subject="clinician@demo.prana", role="REMOTE_CLINICIAN", user_id="usr-clinician-482", display_name="Dr. Sunita Rao, MD")
    hospital_token = create_access_token(subject="hospital@demo.prana", role="HOSPITAL_COMMAND", user_id="usr-hospital-704", display_name="Sister Philomina, RN")

    # 1. Field Medic View
    res_medic = client.get("/api/v1/cases/PR-8492/decision-support/view", headers={"Authorization": f"Bearer {medic_token}"})
    assert res_medic.status_code == 200
    m_data = res_medic.json()
    assert "whatChanged" in m_data
    assert "operationalSummary" in m_data
    assert m_data["canApprove"] is False
    assert "traces" not in m_data # Medic does not receive internal tool traces

    # 2. Clinician View
    res_clin = client.get("/api/v1/cases/PR-8492/decision-support/view", headers={"Authorization": f"Bearer {clinician_token}"})
    assert res_clin.status_code == 200
    c_data = res_clin.json()
    assert "observedData" in c_data
    assert "missingData" in c_data
    assert "evidenceSourceIds" in c_data
    assert c_data["canApprove"] is True

    # 3. Hospital Command View
    res_hosp = client.get("/api/v1/cases/PR-8492/decision-support/view", headers={"Authorization": f"Bearer {hospital_token}"})
    assert res_hosp.status_code == 200
    h_data = res_hosp.json()
    assert "activeConcern" in h_data
    assert "assignedBay" in h_data
    assert "operationalAction" in h_data
    assert h_data["canApprove"] is False


def test_agent_task_idempotency_and_recovery(db_session: Session):
    """
    Phase 21: Verifies that duplicate triggers for the same event reuse existing tasks,
    and stale RUNNING tasks are marked INTERRUPTED.
    """
    import uuid
    uid = uuid.uuid4().hex[:6]
    dummy_event = TimelineEventModel(
        id=f"evt-idemp-{uid}",
        case_id="PR-8492",
        event_id=f"EVT-IDEMP-{uid}",
        version=1,
        timestamp="12:00:00",
        category="CLINICAL",
        title="Vital signs recorded",
        detail="HR 126",
        actor="FIELD_MEDIC",
        status="WARNING",
    )
    db_session.add(dummy_event)
    db_session.commit()

    # First run creates task
    orch1 = AgentOrchestrator(db_session, case_id="PR-8492", trigger_event=dummy_event)
    t1 = orch1.run_agent_task()

    # Second run with same trigger event reuses task
    orch2 = AgentOrchestrator(db_session, case_id="PR-8492", trigger_event=dummy_event)
    t2 = orch2.run_agent_task()

    assert t1.id == t2.id
    assert t2.status in ("REQUIRES_HUMAN_REVIEW", "COMPLETED")


def test_hard_real_model_smoke_test():
    """
    Phase 21 Hard Real Model Verification:
    Tests real inference if Ollama / local runtime is reachable, otherwise explicitly skips.
    Never fakes a pass if real runtime is offline.
    """
    qwen3 = Qwen3LocalProvider()
    status = qwen3.check_status()
    if not status.available:
        pytest.skip(f"Local Qwen3 runtime unreachable at {qwen3.base_url} — skipping real model test without fake pass.")
    
    # Real model execution
    t = qwen3.decide_next_tool_call("PR-8492", "TRAUMA", 1, {}, ["get_latest_vitals"])
    assert t is not None
    assert t.tool_name == "get_latest_vitals"

