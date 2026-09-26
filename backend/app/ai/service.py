import json
import logging
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from app.config import settings
from app.domain.models import EmergencyCaseModel, DecisionSupportSignalModel, TimelineEventModel, AgentTaskModel
from app.ai.base import AIProvider
from app.ai.demo_provider import DemoDecisionSupportProvider
from app.ai.schemas import DecisionSupportSignal, AgentTaskSchema, AgentTraceItemSchema, ProviderStatusResponse


from app.ai.orchestrator import AgentOrchestrator
from app.services.event_service import append_event
from app.realtime.broadcaster import dispatch_event_nowait

logger = logging.getLogger("prana.ai.service")


# Provider Registry / Factory
def get_ai_provider(provider_override: Optional[str] = None) -> AIProvider:
    provider_name = (provider_override or settings.AI_PROVIDER).lower()
    if provider_name in ("hybrid", "local", "qwen3"):
        try:
            from app.ai.qwen3_provider import Qwen3LocalProvider
            return Qwen3LocalProvider()
        except Exception as e:
            logger.warning("Failed to initialize Qwen3LocalProvider (%s), falling back to Demo", e)
            return DemoDecisionSupportProvider()
    elif provider_name in ("real", "cloud"):
        try:
            from app.ai.real_provider import RealLLMDecisionSupportProvider
            return RealLLMDecisionSupportProvider()
        except Exception as e:
            logger.warning("Failed to initialize RealLLMDecisionSupportProvider (%s), falling back to Demo", e)
            return DemoDecisionSupportProvider()
    return DemoDecisionSupportProvider()


def get_active_provider_status(provider_override: Optional[str] = None) -> ProviderStatusResponse:
    """
    Probes the active AI decision support provider and returns structured operational status.
    For hybrid mode, includes detailed health checks for System 1 (Laya) and System 2 (Qwen3).
    Guarantees zero secret exposure or internal stack traces.
    """
    provider_mode = (provider_override or settings.AI_PROVIDER).lower()
    
    if provider_mode == "hybrid":
        from app.ai.laya_provider import LayaSystemOneProvider
        from app.ai.qwen3_provider import Qwen3LocalProvider
        
        laya_status = LayaSystemOneProvider().check_status()
        qwen3_status = Qwen3LocalProvider().check_status()
        
        is_available = laya_status.available or qwen3_status.available
        status_msg = (
            f"Hybrid Architecture Active: System 1 Laya ({'READY' if laya_status.available else 'OFFLINE'}), "
            f"System 2 Qwen3 ({'READY' if qwen3_status.available else 'OFFLINE — DEMO FALLBACK ACTIVE'})."
        )
        avg_latency = ((laya_status.latency_ms or 1.0) + (qwen3_status.latency_ms or 2.0)) / 2.0

        return ProviderStatusResponse(
            provider="hybrid",
            runtime=f"laya:{laya_status.runtime}+qwen3:{qwen3_status.runtime}",
            model=f"{laya_status.model}+{qwen3_status.model}",
            available=is_available,
            toolCalling=True,
            structuredOutput=True,
            statusMessage=status_msg,
            latencyMs=round(avg_latency, 2),
            systemOne={
                "name": "Laya System 1",
                "model": laya_status.model,
                "runtime": laya_status.runtime,
                "available": laya_status.available,
                "latencyMs": laya_status.latency_ms,
                "status": laya_status.status_message,
            },
            systemTwo={
                "name": "Qwen3 System 2",
                "model": qwen3_status.model,
                "runtime": qwen3_status.runtime,
                "available": qwen3_status.available,
                "latencyMs": qwen3_status.latency_ms,
                "status": qwen3_status.status_message,
            }
        )
    elif provider_mode == "local":
        from app.ai.local_provider import LocalOpenModelProvider
        return LocalOpenModelProvider().check_status()
    elif provider_mode == "laya":
        from app.ai.laya_provider import LayaSystemOneProvider
        return LayaSystemOneProvider().check_status()
    elif provider_mode == "qwen3":
        from app.ai.qwen3_provider import Qwen3LocalProvider
        return Qwen3LocalProvider().check_status()

    provider = get_ai_provider(provider_override)
    if hasattr(provider, "check_status"):
        return provider.check_status()
    
    # Demo provider status
    return ProviderStatusResponse(
        provider="demo",
        runtime="in_process",
        model="prana-deterministic-v2",
        available=True,
        toolCalling=True,
        structuredOutput=True,
        statusMessage="Deterministic Demo Simulation Engine active for 100% offline competition resilience",
        latencyMs=1.5,
    )


def evaluate_case_decision_support(
    db: Session,
    case: EmergencyCaseModel,
    trigger_event: Optional[TimelineEventModel] = None,
    force: bool = False,
    provider_override: Optional[str] = None
) -> Optional[DecisionSupportSignal]:
    """
    Evaluates decision support eligibility and runs the AgentOrchestrator.
    Gathers evidence via read-only tools, detects missing data, runs safety validation,
    persists the signal and timeline event, and broadcasts via WebSocket.
    
    RESILIENCE: If agent evaluation fails or is unavailable, this function handles the error gracefully
    and returns None, guaranteeing that primary care coordination is never blocked.
    """
    # 1. Eligibility Check
    if not case.vitals and not force:
        return None

    try:
        # 2. Run Bounded Agent Orchestration
        orchestrator = AgentOrchestrator(db, case_id=case.id, trigger_event=trigger_event, provider_override=provider_override)
        task_result = orchestrator.run_agent_task()

        signal = task_result.signal
        if not signal:
            logger.info("Agent task %s completed without generating a signal", task_result.id)
            return None

        # 3. Check if active signal with identical ID already exists (idempotency)
        existing_signal = (
            db.query(DecisionSupportSignalModel)
            .filter(
                DecisionSupportSignalModel.case_id == case.id,
                DecisionSupportSignalModel.id == signal.signal_id
            )
            .first()
        )
        if existing_signal:
            if not force and existing_signal.status == "NEW" and existing_signal.observed_data == signal.observed_data:
                return signal
            existing_signal.observed_data = signal.observed_data
            existing_signal.explanation = signal.explanation
            existing_signal.status = "NEW"
            existing_signal.created_at = datetime.now(timezone.utc)
            signal_model = existing_signal
        else:
            # 4. Supersede previous NEW signals for this case
            db.query(DecisionSupportSignalModel).filter(
                DecisionSupportSignalModel.case_id == case.id,
                DecisionSupportSignalModel.status == "NEW"
            ).update({"status": "SUPERSEDED"})

            # 5. Persist New DecisionSupportSignalModel
            signal_model = DecisionSupportSignalModel(
                id=signal.signal_id,
                case_id=case.id,
                signal_type=signal.signal_type,
                title=signal.title,
                observed_data=signal.observed_data,
                explanation=signal.explanation,
                relevant_event_ids_json=json.dumps(signal.relevant_timeline_event_ids),
                provider=signal.provider,
                provider_version=signal.provider_version,
                safety_label=signal.safety_label,
                requires_clinician_review=signal.requires_clinician_review,
                status="NEW",
                created_at=datetime.now(timezone.utc)
            )
            db.add(signal_model)

        # 6. Append Immutable Event to Care Rail Audit Log
        evt_status = "CRITICAL" if "CRITICAL" in signal.signal_type or "HEMODYNAMIC" in signal.signal_type else "WARNING"
        evt = append_event(
            db,
            case_id=case.id,
            title=f"Decision Support Signal: {signal.title}",
            detail=f"{signal.observed_data} {signal.explanation}",
            actor="AI SUPPORT",
            category="CLINICAL",
            status=evt_status,
            timestamp=signal.generated_at,
            payload={
                "signalId": signal.signal_id,
                "signalType": signal.signal_type,
                "title": signal.title,
                "observedData": signal.observed_data,
                "explanation": signal.explanation,
                "provider": signal.provider,
                "providerVersion": signal.provider_version,
                "safetyLabel": signal.safety_label,
                "relevantTimelineEventIds": signal.relevant_timeline_event_ids,
                "taskId": task_result.id,
            }
        )

        db.commit()

        # 7. Broadcast via Existing Case-Scoped WebSocket
        dispatch_event_nowait(
            case_id=case.id,
            event_type="AI_SIGNAL_GENERATED",
            version=evt.version,
            event_id=evt.event_id,
            timestamp=evt.timestamp,
            actor_type="AI",
            actor_id=signal.provider,
            user_id="prana-agent",
            role="AI",
            payload={
                "signal": signal.model_dump(by_alias=True),
                "taskId": task_result.id,
                "missingData": task_result.missing_data,
                "recommendedDataRequest": task_result.recommended_data_request,
            }
        )

        return signal

    except Exception as exc:
        logger.exception("AI evaluation failed gracefully for case %s: %s", case.id, exc)
        if not settings.AI_FAIL_OPEN:
            raise
        return None


def get_latest_agent_task(db: Session, case_id: str) -> Optional[AgentTaskSchema]:
    """Retrieves the latest agent task and its execution traces for the specified case."""
    task = (
        db.query(AgentTaskModel)
        .filter(AgentTaskModel.case_id == case_id)
        .order_by(AgentTaskModel.created_at.desc())
        .first()
    )
    if not task:
        return None

    signal_model = None
    if task.final_signal_id:
        signal_model = (
            db.query(DecisionSupportSignalModel)
            .filter(DecisionSupportSignalModel.id == task.final_signal_id)
            .first()
        )

    signal = None
    if signal_model:
        signal = DecisionSupportSignal(
            signal_id=signal_model.id,
            case_id=signal_model.case_id,
            generated_at=signal_model.created_at.strftime("%H:%M:%S") if signal_model.created_at else "00:00:00",
            provider=signal_model.provider,
            provider_version=signal_model.provider_version,
            signal_type=signal_model.signal_type,
            title=signal_model.title,
            observed_data=signal_model.observed_data,
            explanation=signal_model.explanation,
            relevant_timeline_event_ids=signal_model.relevant_event_ids,
            requires_clinician_review=signal_model.requires_clinician_review,
            status=signal_model.status,
            safety_label=signal_model.safety_label,
        )

    traces = [
        AgentTraceItemSchema(
            id=t.id,
            taskId=t.task_id,
            stepIndex=t.step_index,
            toolName=t.tool_name,
            arguments=t.arguments,
            resultSummary=t.result_summary,
            durationMs=t.duration_ms,
            success=t.success,
            sourceEventIds=t.source_event_ids,
            timestamp=t.timestamp.isoformat() if t.timestamp else "",
        )
        for t in task.traces
    ]

    return AgentTaskSchema(
        taskId=task.id,
        caseId=task.case_id,
        triggerEventId=task.trigger_event_id,
        status=task.status,
        provider=task.provider,
        model=task.model,
        promptVersion=task.prompt_version,
        startedAt=task.started_at.isoformat() if task.started_at else "",
        completedAt=task.completed_at.isoformat() if task.completed_at else None,
        iterationCount=task.iteration_count,
        toolCallCount=task.tool_call_count,
        finalSignalId=task.final_signal_id,
        failureReason=task.failure_reason,
        safetyStatus=task.safety_status,
        reasoningSummary=task.reasoning_summary,
        missingData=task.missing_data,
        recommendedDataRequest=task.recommended_data_request,
        signal=signal,
        traces=traces,
    )
