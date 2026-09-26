from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.domain.models import UserModel, DecisionSupportSignalModel
from app.domain.schemas import UserRoleEnum
from app.services.case_service import get_case_or_404
from app.api.deps import get_current_user, check_case_access
from app.ai.schemas import (
    DecisionSupportSignal,
    DecisionSupportListResponse,
    DecisionSupportEvaluateRequest,
    AgentTaskSchema,
    ProviderStatusResponse
)
from app.ai.service import evaluate_case_decision_support, get_ai_provider

router = APIRouter(prefix="/cases", tags=["AI Clinical Decision Support"])

@router.get("/{case_id}/decision-support", response_model=DecisionSupportListResponse)
def get_case_decision_support(
    case_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve active and historical observable decision-support signals for an authorized case.
    RBAC: Enforces case-level authorization. Users can only access signals for their assigned case.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)

    provider = get_ai_provider()
    is_healthy = provider.health_check()

    # Query active (NEW) signal
    active_model = (
        db.query(DecisionSupportSignalModel)
        .filter(
            DecisionSupportSignalModel.case_id == case_id,
            DecisionSupportSignalModel.status.in_(["NEW", "ACKNOWLEDGED"])
        )
        .order_by(DecisionSupportSignalModel.created_at.desc())
        .first()
    )

    active_signal = None
    if active_model:
        active_signal = DecisionSupportSignal(
            signalId=active_model.id,
            caseId=active_model.case_id,
            generatedAt=active_model.created_at.strftime("%H:%M:%S"),
            provider=active_model.provider,
            providerVersion=active_model.provider_version,
            signalType=active_model.signal_type,
            title=active_model.title,
            observedData=active_model.observed_data,
            explanation=active_model.explanation,
            relevantTimelineEventIds=active_model.relevant_event_ids,
            requiresClinicianReview=active_model.requires_clinician_review,
            status=active_model.status,
            safetyLabel=active_model.safety_label
        )

    # Query past signals
    all_models = (
        db.query(DecisionSupportSignalModel)
        .filter(DecisionSupportSignalModel.case_id == case_id)
        .order_by(DecisionSupportSignalModel.created_at.desc())
        .limit(20)
        .all()
    )

    historical = [
        DecisionSupportSignal(
            signalId=m.id,
            caseId=m.case_id,
            generatedAt=m.created_at.strftime("%H:%M:%S"),
            provider=m.provider,
            providerVersion=m.provider_version,
            signalType=m.signal_type,
            title=m.title,
            observedData=m.observed_data,
            explanation=m.explanation,
            relevantTimelineEventIds=m.relevant_event_ids,
            requiresClinicianReview=m.requires_clinician_review,
            status=m.status,
            safetyLabel=m.safety_label
        )
        for m in all_models
    ]

    return DecisionSupportListResponse(
        caseId=case_id,
        provider=provider.provider_name,
        providerAvailable=is_healthy,
        statusMessage="AI decision support active and observing telemetry stream." if is_healthy else "AI provider degraded or offline.",
        activeSignal=active_signal,
        historicalSignals=historical,
        totalSignals=len(all_models)
    )


@router.get("/{case_id}/decision-support/view")
def get_role_projected_decision_support(
    case_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Phase 21: Returns a role-appropriate projection of the SINGLE authoritative case signal.
    - FIELD_MEDIC receives AmbulanceDecisionSupportView (operational awareness, what changed, missing data attention, zero tool traces, cannot approve)
    - REMOTE_CLINICIAN receives ClinicianDecisionSupportView (full clinical evidence, gaps, provenance, review gates, can approve)
    - HOSPITAL_COMMAND receives HospitalDecisionSupportView (receiving triage summary, ETA, bay status, specialist review state)
    - READINESS receives ReadinessDecisionSupportView (resource readiness implications)
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)

    # Fetch active signal
    active_model = (
        db.query(DecisionSupportSignalModel)
        .filter(
            DecisionSupportSignalModel.case_id == case_id,
            DecisionSupportSignalModel.status.in_(["NEW", "ACKNOWLEDGED"])
        )
        .order_by(DecisionSupportSignalModel.created_at.desc())
        .first()
    )

    if not active_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active decision support signal found for case '{case_id}'"
        )

    # Fetch latest agent task for reasoning and missing data
    from app.ai.service import get_latest_agent_task
    task = get_latest_agent_task(db, case_id)

    user_role = current_user.role

    if user_role == UserRoleEnum.FIELD_MEDIC:
        from app.ai.schemas import AmbulanceDecisionSupportView
        attention_fields = [m["field"] for m in (task.missing_data if task else [])]
        clinician_name = None
        clinician_status = "AWAITING_REVIEW"
        if case.clinician_actions:
            latest_action = case.clinician_actions[0]
            clinician_status = latest_action.action
            clinician_name = latest_action.clinician_name

        return AmbulanceDecisionSupportView(
            signalId=active_model.id,
            caseId=case.id,
            title=active_model.title,
            riskLevel="CRITICAL" if ("CRITICAL" in active_model.signal_type or "HEMODYNAMIC" in active_model.signal_type) else "HIGH",
            whatChanged=active_model.observed_data.split(".")[0] if "." in active_model.observed_data else active_model.observed_data,
            operationalSummary=active_model.explanation,
            attentionFields=attention_fields,
            clinicianReviewStatus=clinician_status,
            clinicianName=clinician_name,
            safetyLabel=active_model.safety_label,
            canApprove=False
        )

    elif user_role == UserRoleEnum.HOSPITAL_COMMAND:
        from app.ai.schemas import HospitalDecisionSupportView
        specialist_name = case.clinician_actions[0].clinician_name if case.clinician_actions else "Dr. Sunita Rao, MD"
        specialist_status = case.clinician_actions[0].action if case.clinician_actions else "REVIEW_PENDING"
        assigned_bay = case.readiness.assigned_bay if case.readiness else "Resuscitation Bay 1"
        handover_st = case.handovers[0].status if case.handovers else "READY"
        eta = (case.ambulance.base_eta_minutes + case.ambulance.traffic_delay_minutes) if case.ambulance else 12

        return HospitalDecisionSupportView(
            signalId=active_model.id,
            caseId=case.id,
            activeConcern=active_model.title,
            latestContext=active_model.observed_data,
            specialistReviewStatus=specialist_status,
            specialistName=specialist_name,
            etaMinutes=eta,
            assignedBay=assigned_bay,
            handoverStatus=handover_st,
            operationalAction="Prepare resuscitation bay team & verify specialist protocol" if "CRITICAL" in active_model.signal_type else "Standby for inbound handover",
            safetyLabel=active_model.safety_label,
            canApprove=False
        )

    # Default to Full Clinician View (for REMOTE_CLINICIAN, PORTAL_ADMIN)
    from app.ai.schemas import ClinicianDecisionSupportView
    return ClinicianDecisionSupportView(
        signalId=active_model.id,
        caseId=case.id,
        title=active_model.title,
        signalType=active_model.signal_type,
        observedData=active_model.observed_data,
        explanation=active_model.explanation,
        reasoningSummary=task.reasoning_summary if task else None,
        evidenceSourceIds=active_model.relevant_event_ids,
        missingData=task.missing_data if task else [],
        recommendedDataRequest=task.recommended_data_request if task else None,
        provider=active_model.provider,
        providerVersion=active_model.provider_version,
        status=active_model.status,
        requiresClinicianReview=active_model.requires_clinician_review,
        safetyLabel=active_model.safety_label,
        canApprove=True
    )


@router.get("/{case_id}/decision-support/{signal_id}", response_model=DecisionSupportSignal)
def get_signal_detail(
    case_id: str,
    signal_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve specific decision-support signal with complete source evidence.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)

    signal_model = (
        db.query(DecisionSupportSignalModel)
        .filter(
            DecisionSupportSignalModel.case_id == case_id,
            DecisionSupportSignalModel.id == signal_id
        )
        .first()
    )
    if not signal_model:
        raise HTTPException(status_code=404, detail=f"Signal '{signal_id}' not found for case '{case_id}'")

    return DecisionSupportSignal(
        signalId=signal_model.id,
        caseId=signal_model.case_id,
        generatedAt=signal_model.created_at.strftime("%H:%M:%S"),
        provider=signal_model.provider,
        providerVersion=signal_model.provider_version,
        signalType=signal_model.signal_type,
        title=signal_model.title,
        observedData=signal_model.observed_data,
        explanation=signal_model.explanation,
        relevantTimelineEventIds=signal_model.relevant_event_ids,
        requiresClinicianReview=signal_model.requires_clinician_review,
        status=signal_model.status,
        safetyLabel=signal_model.safety_label
    )


@router.post("/{case_id}/decision-support/evaluate", response_model=DecisionSupportSignal)
def evaluate_decision_support(
    case_id: str,
    eval_req: DecisionSupportEvaluateRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Explicitly trigger decision support evaluation for an authorized emergency case.
    Enforces case authorization and RBAC. Controlled backend orchestration endpoint.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)

    signal = evaluate_case_decision_support(db, case, force=eval_req.force)
    if not signal:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI decision support provider unavailable or returned no eligible signals."
        )

    return signal


@router.get("/{case_id}/agent-task/latest", response_model=AgentTaskSchema)
def get_latest_task_endpoint(
    case_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve the most recent autonomous agent task, reasoning summary, missing data gaps,
    and tool execution trace for an authorized case.
    """
    check_case_access(case_id, current_user, db)
    get_case_or_404(db, case_id)

    from app.ai.service import get_latest_agent_task
    task = get_latest_agent_task(db, case_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No agent tasks recorded yet for case '{case_id}'"
        )
    return task


@router.post("/{case_id}/agent-task/run", response_model=AgentTaskSchema)
def run_agent_task_endpoint(
    case_id: str,
    provider: Optional[str] = None,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Explicitly trigger an Agent Orchestration task.
    The agent observes case telemetry, plans tool calls, gathers evidence,
    detects missing data gaps, validates safety, and generates a structured clinician review package.
    """
    check_case_access(case_id, current_user, db)
    get_case_or_404(db, case_id)

    from app.ai.orchestrator import AgentOrchestrator
    orchestrator = AgentOrchestrator(db, case_id=case_id, provider_override=provider)
    return orchestrator.run_agent_task()


# Dedicated top-level AI status router for GET /api/v1/ai/provider-status
ai_status_router = APIRouter(prefix="/ai", tags=["AI Provider Status"])

@ai_status_router.get("/provider-status", response_model=ProviderStatusResponse)
def get_provider_status_endpoint(
    provider: Optional[str] = None
):
    """
    Runtime health & capability check for AI Decision Support Providers.
    Returns structured runtime, model, tool-calling, and structured output capability info.
    Guarantees zero secret exposure or internal stack traces.
    """
    from app.ai.service import get_active_provider_status
    return get_active_provider_status(provider_override=provider)


