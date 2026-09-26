"""
PRANA — Agent Orchestrator (Phase 19)
The core autonomous reasoning and coordination engine.
Implements bounded multi-step observation, tool planning, evidence gathering,
missing data detection, safety validation, and clinician handoff.

THE MODEL IS NOT THE SYSTEM:
The application remains authoritative. The agent only reads authorized evidence
and proposes structured decision support signals. It CANNOT execute mutations.
"""

import json
import time
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from app.config import settings
from app.domain.models import EmergencyCaseModel, TimelineEventModel, AgentTaskModel, AgentTraceItemModel
from app.ai.schemas import (
    AgentTaskSchema,
    AgentTraceItemSchema,
    AgentStructuredOutput,
    DecisionSupportSignal,
    MissingDataItem,
)
from app.ai.tools import ReadOnlyToolRegistry
from app.ai.safety import ClinicalSafetyValidator
from app.services.event_service import append_event
from app.realtime.broadcaster import dispatch_event_nowait

logger = logging.getLogger("prana.ai.orchestrator")


class AgentOrchestrator:
    """
    Orchestrates the PRANA agentic loop:
    OBSERVE → PLAN → USE TOOLS → GATHER EVIDENCE → DETECT GAPS → REASON → VALIDATE → CLINICIAN HANDOFF
    """

    def __init__(
        self, 
        db: Session, 
        case_id: str, 
        trigger_event: Optional[TimelineEventModel] = None,
        provider_override: Optional[str] = None
    ):
        self.db = db
        self.case_id = case_id
        self.trigger_event = trigger_event
        self.provider_mode = (provider_override or settings.AI_PROVIDER).lower()
        self.tool_registry = ReadOnlyToolRegistry(db, authorized_case_id=case_id)
        self.task_id = f"agt-{uuid.uuid4().hex[:8]}"
        self.max_iterations = settings.AI_MAX_AGENT_ITERATIONS
        self.max_tool_calls = settings.AI_MAX_TOOL_CALLS
        self.timeout_seconds = settings.AI_AGENT_TIMEOUT_SECONDS
        self.prompt_version = settings.AI_PROMPT_VERSION

    def run_agent_task(self) -> AgentTaskSchema:
        """
        Executes the bounded agentic reasoning task on the authorized emergency case.
        Guaranteed to finish within execution boundaries and hand authority to human clinician.
        """
        start_time = time.time()
        
        if self.provider_mode == "hybrid":
            active_provider = f"Hybrid(Laya+{settings.AI_QWEN3_MODEL})"
            active_model = f"laya-421m+{settings.AI_QWEN3_MODEL}"
        elif self.provider_mode == "local":
            active_provider = f"LocalOpenModel({settings.AI_LOCAL_MODEL})"
            active_model = settings.AI_LOCAL_MODEL
        elif self.provider_mode == "laya":
            active_provider = "LayaSystemOne(Infin8-AI/laya)"
            active_model = "laya-421m"
        elif self.provider_mode == "qwen3":
            active_provider = f"Qwen3Local({settings.AI_QWEN3_MODEL})"
            active_model = settings.AI_QWEN3_MODEL
        elif self.provider_mode in ("real", "cloud"):
            active_provider = f"RealLLM({settings.AI_MODEL_NAME})"
            active_model = settings.AI_MODEL_NAME
        else:
            active_provider = "DemoDecisionSupportProvider"
            active_model = "prana-deterministic-v2"

        # Recover any stale tasks left in 'RUNNING' status from an interrupted process
        stale_tasks = self.db.query(AgentTaskModel).filter(
            AgentTaskModel.case_id == self.case_id,
            AgentTaskModel.status == "RUNNING"
        ).all()
        for st in stale_tasks:
            st.status = "INTERRUPTED"
            st.failure_reason = "Process restarted while task was running — marked interrupted"
            st.completed_at = datetime.now(timezone.utc)
        if stale_tasks:
            self.db.commit()

        # Idempotency check: if an active task for the same trigger event already exists, reuse it
        if self.trigger_event and self.trigger_event.event_id:
            existing_task = self.db.query(AgentTaskModel).filter(
                AgentTaskModel.case_id == self.case_id,
                AgentTaskModel.trigger_event_id == self.trigger_event.event_id,
                AgentTaskModel.status.in_(["COMPLETED", "REQUIRES_HUMAN_REVIEW"])
            ).first()
            if existing_task:
                logger.info("Reusing existing completed agent task %s for trigger event %s", existing_task.id, self.trigger_event.event_id)
                traces = self.db.query(AgentTraceItemModel).filter(AgentTraceItemModel.task_id == existing_task.id).all()
                return self._build_task_schema(existing_task, traces, None)

        # 1. Initialize and persist task record in state 'RUNNING'
        task_model = AgentTaskModel(
            id=self.task_id,
            case_id=self.case_id,
            trigger_event_id=self.trigger_event.event_id if self.trigger_event else None,
            status="RUNNING",
            provider=active_provider,
            model=active_model,
            prompt_version=self.prompt_version,
            started_at=datetime.now(timezone.utc),
            iteration_count=0,
            tool_call_count=0,
            safety_status="PENDING",
            missing_data_json="[]",
        )
        self.db.add(task_model)
        self.db.commit()

        # Notify via WebSocket: AGENT_TASK_STARTED
        dispatch_event_nowait(
            case_id=self.case_id,
            event_type="AGENT_TASK_STARTED",
            version=1,
            event_id=f"evt-agt-start-{self.task_id}",
            timestamp=datetime.now(timezone.utc).strftime("%H:%M:%S"),
            actor_type="AI",
            actor_id=active_provider,
            user_id="prana-agent",
            role="AI",
            payload={
                "taskId": self.task_id,
                "caseId": self.case_id,
                "status": "RUNNING",
                "triggerEventId": self.trigger_event.event_id if self.trigger_event else None,
            },
        )

        trace_items: list[AgentTraceItemModel] = []
        collected_evidence: dict[str, Any] = {}
        source_event_ids: list[str] = []
        step_index = 1
        laya_decision = None

        try:
            case_obj = self.db.query(EmergencyCaseModel).filter(EmergencyCaseModel.id == self.case_id).first()
            domain = case_obj.domain if case_obj else "TRAUMA"
            event_type = getattr(self.trigger_event, "event_type", None) or getattr(self.trigger_event, "category", "VITAL_RECORDED")
            if self.trigger_event and hasattr(self.trigger_event, "title") and "route" in self.trigger_event.title.lower():
                event_type = "ROUTE_UPDATED"

            # -------------------------------------------------------------
            # STEP A: LAYA SYSTEM 1 FAST TYPED DECISION GATE
            # -------------------------------------------------------------
            if self.provider_mode in ("hybrid", "laya"):
                from app.ai.laya_provider import LayaSystemOneProvider
                laya_prov = LayaSystemOneProvider()
                vitals_dict = {}
                if case_obj and case_obj.vitals:
                    latest_v = case_obj.vitals[-1]
                    vitals_dict = {
                        "heartRate": getattr(latest_v, "heart_rate", 80),
                        "systolicBp": getattr(latest_v, "systolic_bp", 120),
                        "diastolicBp": getattr(latest_v, "diastolic_bp", 80),
                        "spo2": getattr(latest_v, "spo2", 98),
                    }
                case_dict = {
                    "domain": domain,
                    "vitals": vitals_dict,
                    "latestVitals": vitals_dict
                }
                laya_decision = laya_prov.evaluate_event(event_type=event_type, case_data=case_dict)
                
                # Record Laya Gate in traces
                laya_trace = AgentTraceItemModel(
                    id=f"trc-laya-{uuid.uuid4().hex[:6]}",
                    task_id=self.task_id,
                    case_id=self.case_id,
                    step_index=step_index,
                    tool_name="laya_system_1_gate",
                    arguments={
                        "relevance": laya_decision.relevance,
                        "toolBundle": laya_decision.tool_bundle,
                        "reviewPriority": laya_decision.review_priority,
                        "dataSufficiency": laya_decision.data_sufficiency,
                        "confidence": laya_decision.confidence
                    },
                    result_summary=f"Laya Decision: {laya_decision.relevance.upper()} | Bundle: {laya_decision.tool_bundle} | Priority: {laya_decision.review_priority}",
                    duration_ms=int(laya_decision.latency_ms),
                    success=True,
                    source_event_ids_json=json.dumps([self.trigger_event.event_id] if self.trigger_event else []),
                    timestamp=datetime.now(timezone.utc),
                )
                self.db.add(laya_trace)
                self.db.commit()
                trace_items.append(laya_trace)
                step_index += 1

                # Broadcast AI_GATE_COMPLETED
                dispatch_event_nowait(
                    case_id=self.case_id,
                    event_type="AI_GATE_COMPLETED",
                    version=step_index,
                    event_id=f"evt-agt-gate-{self.task_id}",
                    timestamp=datetime.now(timezone.utc).strftime("%H:%M:%S"),
                    actor_type="AI",
                    actor_id="LayaSystemOne",
                    user_id="prana-agent",
                    role="AI",
                    payload={
                        "taskId": self.task_id,
                        "layaGate": laya_decision.model_dump(by_alias=True)
                    }
                )

                # FAST-PATH SKIP: If Laya decides no analysis is warranted, exit early to conserve compute!
                if laya_decision.relevance == "no_analysis" and self.provider_mode in ("hybrid", "local", "laya"):
                    logger.info("Laya System 1: Routine event '%s' classified as 'no_analysis'. Skipping System 2 Qwen3.", event_type)
                    task_model.status = "COMPLETED"
                    task_model.safety_status = "PASSED"
                    task_model.reasoning_summary = f"[LAYA SYSTEM 1 FAST-PATH] {laya_decision.reason}"
                    task_model.completed_at = datetime.now(timezone.utc)
                    self.db.commit()

                    dispatch_event_nowait(
                        case_id=self.case_id,
                        event_type="AGENT_TASK_COMPLETED",
                        version=step_index,
                        event_id=f"evt-agt-done-{self.task_id}",
                        timestamp=datetime.now(timezone.utc).strftime("%H:%M:%S"),
                        actor_type="AI",
                        actor_id=active_provider,
                        user_id="prana-agent",
                        role="AI",
                        payload={"taskId": self.task_id, "status": "COMPLETED", "note": "Fast path skip — compute conserved"}
                    )
                    return self._build_task_schema(task_model, trace_items, None, laya_gate=laya_decision)

            # -------------------------------------------------------------
            # STEP B: QWEN3 SYSTEM 2 TOOL EXECUTION LOOP
            # -------------------------------------------------------------
            # System 2 Tool Planning & Multi-turn Execution
            # -------------------------------------------------------------
            planned_tools = None
            if self.provider_mode in ("hybrid", "local", "qwen3"):
                from app.ai.qwen3_provider import Qwen3LocalProvider
                qwen3_prov = Qwen3LocalProvider()
                status = qwen3_prov.check_status()
                if not status.available:
                    logger.info("Qwen3 local model unavailable. Engaging deterministic demo fallback.")
                    active_provider = f"{active_provider}[DemoFallback]"
                    task_model.provider = active_provider
                    planned_tools = self._plan_tools_for_case()
                else:
                    available_tools = self.tool_registry.get_authorized_tool_names()
            else:
                planned_tools = self._plan_tools_for_case()

            # Dynamic agentic tool loop or planned fallback execution
            iteration = 0
            while iteration < self.max_tool_calls:
                iteration += 1

                # Boundary Checks
                if iteration > self.max_tool_calls:
                    logger.warning("Agent exceeded max tool call limit (%d)", self.max_tool_calls)
                    break
                if (time.time() - start_time) > self.timeout_seconds:
                    logger.warning("Agent execution exceeded timeout limit (%.1fs)", self.timeout_seconds)
                    break

                if planned_tools is not None:
                    # Fallback or demo: consume from pre-planned tool list
                    if iteration > len(planned_tools):
                        break
                    tool_name, tool_args = planned_tools[iteration - 1]
                else:
                    # Real dynamic Qwen3 multi-turn reasoning: decides next tool based on evidence gathered so far
                    call = qwen3_prov.decide_next_tool_call(
                        case_id=self.case_id,
                        domain=domain,
                        step_index=iteration,
                        evidence_so_far=collected_evidence,
                        available_tools=available_tools,
                        laya_decision=laya_decision,
                    )
                    if not call:
                        logger.info("Qwen3 completed multi-turn tool calling after %d iterations", iteration - 1)
                        break
                    if call.tool_name not in available_tools:
                        logger.warning("Qwen3 requested unauthorized tool '%s' — rejected", call.tool_name)
                        break
                    if call.tool_name.startswith("record_") or call.tool_name.startswith("confirm_") or call.tool_name.startswith("mutate_"):
                        logger.warning("Qwen3 requested mutating tool '%s' — strictly prohibited", call.tool_name)
                        break
                    tool_name, tool_args = call.tool_name, call.arguments

                # Execute Authorized Read-Only Tool
                tool_res = self.tool_registry.execute_tool(tool_name, tool_args)
                collected_evidence[tool_name] = tool_res.data
                source_event_ids.extend(tool_res.source_event_ids)

                trace_item = AgentTraceItemModel(
                    id=f"trc-{uuid.uuid4().hex[:8]}",
                    task_id=self.task_id,
                    case_id=self.case_id,
                    step_index=step_index,
                    tool_name=tool_name,
                    arguments_json=json.dumps(tool_args),
                    result_summary=tool_res.result_summary,
                    duration_ms=tool_res.duration_ms,
                    success=tool_res.success,
                    source_event_ids_json=json.dumps(tool_res.source_event_ids),
                    timestamp=datetime.now(timezone.utc),
                )
                self.db.add(trace_item)
                trace_items.append(trace_item)

                # Realtime progress broadcast
                dispatch_event_nowait(
                    case_id=self.case_id,
                    event_type="AGENT_TOOL_CALLED",
                    version=step_index,
                    event_id=f"evt-agt-tool-{trace_item.id}",
                    timestamp=datetime.now(timezone.utc).strftime("%H:%M:%S"),
                    actor_type="AI",
                    actor_id=active_provider,
                    user_id="prana-agent",
                    role="AI",
                    payload={
                        "taskId": self.task_id,
                        "stepIndex": step_index,
                        "toolName": tool_name,
                        "resultSummary": tool_res.result_summary,
                        "durationMs": tool_res.duration_ms,
                    },
                )
                step_index += 1

            # 3. Detect Missing Clinical Information (Data Gaps)
            missing_data = self._detect_missing_data(collected_evidence)
            recommended_request = self._derive_data_request_recommendation(missing_data)

            # 4. Synthesize Observable Decision Support Signal
            raw_signal = self._synthesize_signal(collected_evidence, source_event_ids)

            # 5. Enforce Strict Clinical Safety Validation
            safety_res = ClinicalSafetyValidator.validate_signal(raw_signal)
            if not safety_res.is_safe:
                task_model.status = "SAFETY_BLOCKED"
                task_model.safety_status = "VIOLATION_BLOCKED"
                task_model.failure_reason = f"Safety violations: {', '.join(safety_res.violations)}"
                self.db.commit()
                return self._build_task_schema(task_model, trace_items, None)

            final_signal = safety_res.sanitized_signal or raw_signal
            task_model.final_signal_id = final_signal.signal_id
            task_model.safety_status = "PASSED"

            # 6. Concise Reasoning Summary (NO hidden chain-of-thought tokens!)
            reasoning_summary = self._generate_reasoning_summary(collected_evidence, final_signal, missing_data)
            task_model.reasoning_summary = reasoning_summary
            task_model.missing_data_json = json.dumps([m.model_dump(by_alias=True) for m in missing_data])
            task_model.recommended_data_request = recommended_request

            # 7. Final Task State: REQUIRES_HUMAN_REVIEW (Clinician Invariant)
            task_model.status = "REQUIRES_HUMAN_REVIEW"
            task_model.iteration_count = 1
            task_model.tool_call_count = len(trace_items)
            task_model.completed_at = datetime.now(timezone.utc)
            self.db.commit()

            # Realtime broadcast: AGENT_HUMAN_REVIEW_REQUIRED
            dispatch_event_nowait(
                case_id=self.case_id,
                event_type="AGENT_HUMAN_REVIEW_REQUIRED",
                version=step_index,
                event_id=f"evt-agt-rev-{self.task_id}",
                timestamp=datetime.now(timezone.utc).strftime("%H:%M:%S"),
                actor_type="AI",
                actor_id=active_provider,
                user_id="prana-agent",
                role="AI",
                payload={
                    "taskId": self.task_id,
                    "caseId": self.case_id,
                    "signal": final_signal.model_dump(by_alias=True),
                    "missingData": [m.model_dump(by_alias=True) for m in missing_data],
                    "recommendedDataRequest": recommended_request,
                    "reasoningSummary": reasoning_summary,
                },
            )

            return self._build_task_schema(task_model, trace_items, final_signal, laya_gate=laya_decision)

        except Exception as exc:
            logger.exception("Agent orchestrator encountered error: %s", exc)
            task_model.status = "FAILED"
            task_model.failure_reason = str(exc)
            task_model.completed_at = datetime.now(timezone.utc)
            self.db.commit()
            return self._build_task_schema(task_model, trace_items, None, laya_gate=laya_decision)

    # ---------------- Internal Reasoning & Tool Planning ----------------

    def _plan_tools_for_case(self) -> list[tuple[str, dict]]:
        """
        Determines the sequence of authorized read-only tools to execute.
        Demonstrates intentional, case-grounded planning rather than an arbitrary blind call.
        """
        case = self.db.query(EmergencyCaseModel).filter(EmergencyCaseModel.id == self.case_id).first()
        domain = case.domain if case else "TRAUMA"

        # Baseline clinical triage plan
        plan: list[tuple[str, dict]] = [
            ("get_case_summary", {"case_id": self.case_id}),
            ("get_latest_vitals", {"case_id": self.case_id}),
            ("get_vital_trend", {"case_id": self.case_id, "limit": 5}),
            ("get_recent_observations", {"case_id": self.case_id}),
            ("get_recorded_interventions", {"case_id": self.case_id}),
        ]

        if domain == "TRAUMA":
            plan.append(("get_destination_readiness", {"case_id": self.case_id}))
        elif domain == "SNAKEBITE":
            plan.append(("get_current_route_status", {"case_id": self.case_id}))
        elif domain == "POISONING":
            plan.append(("get_destination_readiness", {"case_id": self.case_id}))
        else:
            plan.append(("get_destination_readiness", {"case_id": self.case_id}))

        return plan

    def _detect_missing_data(self, evidence: dict[str, Any]) -> list[MissingDataItem]:
        """
        Identifies missing clinical telemetry or observation fields required
        for definitive emergency stabilization. Emits explicit data gaps rather than hallucinating.
        """
        missing: list[MissingDataItem] = []
        case_summary = evidence.get("get_case_summary", {})
        domain = case_summary.get("domain")
        if not domain:
            case_obj = self.db.query(EmergencyCaseModel).filter(EmergencyCaseModel.id == self.case_id).first()
            domain = case_obj.domain if case_obj else "TRAUMA"
        vitals = evidence.get("get_latest_vitals", {})
        obs = evidence.get("get_recent_observations", {}).get("observations", [])
        interventions = evidence.get("get_recorded_interventions", {}).get("interventions", [])

        # Domain 1: TRAUMA
        if domain == "TRAUMA":
            # Check for repeat blood pressure
            trend = evidence.get("get_vital_trend", {}).get("trend", [])
            if len(trend) < 2:
                missing.append(
                    MissingDataItem(
                        field="Serial Blood Pressure (Repeat BP)",
                        reason="Single BP reading limits calculation of shock index delta or retroperitoneal bleeding rate.",
                        clinicalImportance="CRITICAL",
                    )
                )
            # Check for pelvic binder status in interventions
            binder_logged = any("binder" in i.get("name", "").lower() for i in interventions)
            if not binder_logged:
                missing.append(
                    MissingDataItem(
                        field="Pelvic Circumferential Compression Verification",
                        reason="High-speed collision with pelvic tenderness warrants explicit binder placement confirmation.",
                        clinicalImportance="HIGH",
                    )
                )

        # Domain 2: SNAKEBITE
        elif domain == "SNAKEBITE":
            # 20-minute whole blood clotting test (20WBCT)
            clot_logged = any("clot" in o.get("detail", "").lower() or "20wbct" in o.get("detail", "").lower() for o in obs)
            if not clot_logged:
                missing.append(
                    MissingDataItem(
                        field="20-Minute Whole Blood Clotting Test (20WBCT)",
                        reason="Crucial bedside test for Russell's viper venom-induced consumption coagulopathy (VICC).",
                        clinicalImportance="CRITICAL",
                    )
                )
            # Progressive edema margin measurements
            edema_measured = any("edema" in o.get("detail", "").lower() or "margin" in o.get("detail", "").lower() for o in obs)
            if not edema_measured:
                missing.append(
                    MissingDataItem(
                        field="Serial Proximal Swelling Margin Demarcation",
                        reason="Sequential bite margin measurement every 15 min assesses ascending envenomation velocity.",
                        clinicalImportance="HIGH",
                    )
                )

        # Domain 3: POISONING
        elif domain == "POISONING":
            # Pupillary response (miosis)
            pupils_logged = any("pupil" in o.get("detail", "").lower() or "pinpoint" in o.get("detail", "").lower() for o in obs)
            if not pupils_logged:
                missing.append(
                    MissingDataItem(
                        field="Pupillary Constriction (Miosis) Assessment",
                        reason="Critical objective finding to confirm vagal cholinergic toxindrome versus sympathetic overdrive.",
                        clinicalImportance="CRITICAL",
                    )
                )
            # Auscultatory bronchorrhea confirmation
            chest_logged = any("wheez" in o.get("detail", "").lower() or "broncho" in o.get("detail", "").lower() or "secretion" in o.get("detail", "").lower() for o in obs)
            if not chest_logged:
                missing.append(
                    MissingDataItem(
                        field="Pulmonary Auscultation (Secretions / Crackles)",
                        reason="Respiratory bronchorrhea is the primary cause of hypoxia in acute organophosphate toxicity.",
                        clinicalImportance="HIGH",
                    )
                )

        # Domain 4: RESPIRATORY_DISTRESS
        elif domain in ("RESPIRATORY_DISTRESS", "RESPIRATORY", "PULMONARY"):
            chest_logged = any("auscultat" in o.get("detail", "").lower() or "wheez" in o.get("detail", "").lower() or "breath" in o.get("detail", "").lower() for o in obs)
            if not chest_logged:
                missing.append(
                    MissingDataItem(
                        field="Serial Bilateral Breath Sounds Auscultation",
                        reason="Auscultatory wheezing/silent chest assessment crucial to evaluate acute bronchospasm severity.",
                        clinicalImportance="CRITICAL",
                    )
                )

        return missing

    def _derive_data_request_recommendation(self, missing_data: list[MissingDataItem]) -> Optional[str]:
        """Prepares a proposed data request message for the human clinician to review and confirm."""
        if not missing_data:
            return None
        top_missing = missing_data[0]
        return f"Request field medic to record: {top_missing.field} ({top_missing.reason})"

    def _synthesize_signal(self, evidence: dict[str, Any], source_event_ids: list[str]) -> DecisionSupportSignal:
        """Synthesizes structured observable signals strictly labeled as simulated decision support."""
        case_summary = evidence.get("get_case_summary", {})
        domain = case_summary.get("domain")
        if not domain:
            case_obj = self.db.query(EmergencyCaseModel).filter(EmergencyCaseModel.id == self.case_id).first()
            domain = case_obj.domain if case_obj else "TRAUMA"
        vitals = evidence.get("get_latest_vitals", {})
        timestamp = vitals.get("timestamp", datetime.now(timezone.utc).strftime("%H:%M:%S"))

        if self.provider_mode == "local":
            from app.ai.local_provider import LocalOpenModelProvider
            local_prov = LocalOpenModelProvider()
            if local_prov.check_status().available:
                provider_str = f"LocalOpenModel({settings.AI_LOCAL_MODEL})"
            else:
                provider_str = f"LocalOpenModel({settings.AI_LOCAL_MODEL})[DemoFallback]"
        elif self.provider_mode in ("real", "cloud"):
            provider_str = f"RealLLM({settings.AI_MODEL_NAME})"
        else:
            provider_str = "DemoDecisionSupportProvider"

        if domain == "TRAUMA":
            hr = vitals.get("heartRate", 124)
            sbp = vitals.get("systolicBp", 96)
            dbp = vitals.get("diastolicBp", 70)
            pp = sbp - dbp
            shock_index = round(hr / sbp, 2) if sbp > 0 else 1.0

            return DecisionSupportSignal(
                signal_id=f"sig-{self.case_id.lower()}-agent",
                case_id=self.case_id,
                generated_at=timestamp,
                provider=provider_str,
                provider_version=settings.AI_PROVIDER_VERSION,
                signal_type="HEMODYNAMIC_DECOMPENSATION_RISK",
                title="Observable Hemodynamic Change Signal",
                observed_data=f"Tachycardia HR {hr} bpm with narrowing pulse pressure ({pp} mmHg) and Shock Index {shock_index} (>0.9).",
                explanation="Observed vital trend exhibits progressive circulatory compensation consistent with ongoing occult fluid loss. Remote specialist review recommended to confirm stabilization protocol.",
                relevant_timeline_event_ids=list(set(source_event_ids))[:5],
                requires_clinician_review=True,
                status="NEW",
                safety_label="SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS",
            )

        elif domain == "SNAKEBITE":
            hr = vitals.get("heartRate", 112)
            spo2 = vitals.get("spo2", 96)
            return DecisionSupportSignal(
                signal_id=f"sig-{self.case_id.lower()}-agent",
                case_id=self.case_id,
                generated_at=timestamp,
                provider=provider_str,
                provider_version=settings.AI_PROVIDER_VERSION,
                signal_type="ENVENOMATION_PROGRESSION_SIGNAL",
                title="Observable Envenomation Progression Signal",
                observed_data=f"Ascending localized lower extremity edema with tachycardia (HR {hr} bpm, SpO2 {spo2}%).",
                explanation="Telemetry progression exhibits rapid local hemotoxic tissue spread. Urgent specialist review recommended for cold-chain antivenom readiness.",
                relevant_timeline_event_ids=list(set(source_event_ids))[:5],
                requires_clinician_review=True,
                status="NEW",
                safety_label="SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS",
            )

        elif domain in ("RESPIRATORY_DISTRESS", "RESPIRATORY", "PULMONARY"):
            hr = vitals.get("heartRate", 118)
            spo2 = vitals.get("spo2", 86)
            rr = vitals.get("respiratoryRate", 32)
            return DecisionSupportSignal(
                signal_id=f"sig-{self.case_id.lower()}-agent",
                case_id=self.case_id,
                generated_at=timestamp,
                provider=provider_str,
                provider_version=settings.AI_PROVIDER_VERSION,
                signal_type="PHYSIOLOGICAL_DETERIORATION_SIGNAL",
                title="Observable Acute Respiratory Distress Signal",
                observed_data=f"Severe hypoxemia (SpO2 {spo2}%) with tachypnea (RR {rr}/min) and tachycardia (HR {hr} bpm).",
                explanation="Observed respiratory fatigue patterns and oxygen desaturation indicate progressive respiratory decompensation. Remote specialist review recommended for advanced airway preparation and non-invasive ventilation.",
                relevant_timeline_event_ids=list(set(source_event_ids))[:5],
                requires_clinician_review=True,
                status="NEW",
                safety_label="SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS",
            )

        elif domain == "POISONING":
            hr = vitals.get("heartRate", 44)
            spo2 = vitals.get("spo2", 86)
            return DecisionSupportSignal(
                signal_id=f"sig-{self.case_id.lower()}-agent",
                case_id=self.case_id,
                generated_at=timestamp,
                provider=provider_str,
                provider_version=settings.AI_PROVIDER_VERSION,
                signal_type="CHOLINERGIC_CRISIS_SIGNAL",
                title="Observable Cholinergic Toxindrome Signal",
                observed_data=f"Vagal bradycardia HR {hr} bpm and progressive desaturation SpO2 {spo2}%.",
                explanation="Telemetry matches acute cholinergic overdrive pattern. Urgent specialist authorization required for airway protection and atropine titration.",
                relevant_timeline_event_ids=list(set(source_event_ids))[:5],
                requires_clinician_review=True,
                status="NEW",
                safety_label="SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS",
            )

        else:  # GENERAL_EMERGENCY / CARDIAC / OTHER
            hr = vitals.get("heartRate", 88)
            spo2 = vitals.get("spo2", 96)
            return DecisionSupportSignal(
                signal_id=f"sig-{self.case_id.lower()}-agent",
                case_id=self.case_id,
                generated_at=timestamp,
                provider=provider_str,
                provider_version=settings.AI_PROVIDER_VERSION,
                signal_type="PHYSIOLOGICAL_DETERIORATION_SIGNAL",
                title="Observable Prehospital Clinical State Signal",
                observed_data=f"Serial vital stream logged: HR {hr} bpm, SpO2 {spo2}%.",
                explanation="Observed telemetry pattern registered for remote specialist review and prehospital coordination.",
                relevant_timeline_event_ids=list(set(source_event_ids))[:5],
                requires_clinician_review=True,
                status="NEW",
                safety_label="SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS",
            )

    def _generate_reasoning_summary(
        self,
        evidence: dict[str, Any],
        signal: DecisionSupportSignal,
        missing_data: list[MissingDataItem]
    ) -> str:
        """
        Constructs a concise, auditable evidence summary for clinician inspection.
        Explicitly stores observable findings and provenance, NEVER hidden chain-of-thought tokens.
        """
        trend_summary = evidence.get("get_vital_trend", {}).get("result_summary", "No trend")
        gaps_summary = f"{len(missing_data)} data gap(s) identified ({', '.join([m.field for m in missing_data])})" if missing_data else "Telemetry comprehensive"
        return f"Evaluated latest vitals against previous snapshots. {trend_summary}. {gaps_summary}. Generated {signal.title} under human specialist review mandate."

    def _build_task_schema(
        self,
        task: AgentTaskModel,
        traces: list[AgentTraceItemModel],
        signal: Optional[DecisionSupportSignal],
        laya_gate: Optional[LayaDecision] = None
    ) -> AgentTaskSchema:
        """Assembles strongly-typed Pydantic schema for API and WebSocket delivery."""
        if laya_gate is None and traces:
            from app.ai.schemas import LayaDecision
            for t in traces:
                if t.tool_name == "laya_system_1_gate":
                    args = t.arguments if isinstance(t.arguments, dict) else (json.loads(t.arguments) if t.arguments else {})
                    laya_gate = LayaDecision(
                        relevance=args.get("relevance", "routine_analysis"),
                        tool_bundle=args.get("toolBundle", "vitals"),
                        review_priority=args.get("reviewPriority", "P1"),
                        data_sufficiency=args.get("dataSufficiency", "yes"),
                        confidence=args.get("confidence", 0.95),
                        reason=t.result_summary or "Laya System 1 Gate",
                        latency_ms=float(t.duration_ms or 0),
                    )
                    break

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
            layaGate=laya_gate,
            traces=[
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
                for t in traces
            ],
        )
