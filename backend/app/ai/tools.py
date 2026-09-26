"""
PRANA — Agent Tool Registry (Phase 19)
Controlled, strictly read-only tools providing authorized case evidence
to the Agent Orchestrator. The model cannot execute mutations or query unauthorized cases.
"""

import time
import logging
from typing import Any, Callable
from sqlalchemy.orm import Session

from app.domain.models import (
    EmergencyCaseModel,
    VitalSnapshotModel,
    InterventionModel,
    TimelineEventModel,
    FacilityReadinessModel,
    DecisionSupportSignalModel,
    ClinicianActionModel,
    HandoverPackageModel,
)
from app.ai.schemas import AgentToolResult

logger = logging.getLogger("prana.ai.tools")


class ToolAuthorizationError(Exception):
    """Raised when an agent attempts to access an unauthorized case or call a forbidden tool."""
    pass


class ReadOnlyToolRegistry:
    """
    Registry of strictly read-only clinical coordination tools.
    Enforces case authorization boundaries and returns structured summaries with event provenance.
    """

    def __init__(self, db: Session, authorized_case_id: str):
        self.db = db
        self.authorized_case_id = authorized_case_id
        self._tools: dict[str, Callable[[dict], AgentToolResult]] = {
            "get_case_summary": self.get_case_summary,
            "get_latest_vitals": self.get_latest_vitals,
            "get_vital_trend": self.get_vital_trend,
            "get_recent_observations": self.get_recent_observations,
            "get_recorded_interventions": self.get_recorded_interventions,
            "get_timeline_events": self.get_timeline_events,
            "get_current_route_status": self.get_current_route_status,
            "get_destination_readiness": self.get_destination_readiness,
            "get_active_decision_signals": self.get_active_decision_signals,
            "get_clinician_review_status": self.get_clinician_review_status,
            "get_handover_status": self.get_handover_status,
        }

    def get_authorized_tool_names(self) -> list[str]:
        """Returns the list of authorized read-only tool names."""
        return list(self._tools.keys())

    def list_tools(self) -> dict[str, Callable[[dict], AgentToolResult]]:
        """Returns the dictionary of authorized read-only tools."""
        return self._tools

    def _validate_case_id(self, requested_case_id: str | None) -> str:
        """Enforces that the tool call can only operate on the authorized case."""
        if not requested_case_id:
            return self.authorized_case_id
        if requested_case_id != self.authorized_case_id:
            raise ToolAuthorizationError(
                f"Unauthorized case access attempt: requested '{requested_case_id}', but task is authorized only for '{self.authorized_case_id}'"
            )
        return self.authorized_case_id

    def get_tool_definitions(self) -> list[dict]:
        """Returns JSON schema definitions of authorized tools for LLM tool-calling."""
        return [
            {
                "type": "function",
                "function": {
                    "name": "get_case_summary",
                    "description": "Retrieves demographic, clinical domain, and chief complaint summary for the authorized case.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "case_id": {"type": "string", "description": "Authorized emergency case ID"}
                        },
                        "required": ["case_id"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_latest_vitals",
                    "description": "Retrieves the most recent vital signs (HR, SpO2, BP, RR, Temp) and abnormal flags.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "case_id": {"type": "string", "description": "Authorized emergency case ID"}
                        },
                        "required": ["case_id"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_vital_trend",
                    "description": "Retrieves chronological series of past vital measurements to evaluate trajectory and hemodynamic changes.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "case_id": {"type": "string", "description": "Authorized emergency case ID"},
                            "limit": {"type": "integer", "description": "Max snapshots to return (default 5)"}
                        },
                        "required": ["case_id"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_recent_observations",
                    "description": "Retrieves recent paramedic field clinical observations (pupils, bleeding, edema margin, breathing sounds).",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "case_id": {"type": "string", "description": "Authorized emergency case ID"}
                        },
                        "required": ["case_id"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_recorded_interventions",
                    "description": "Retrieves medications, splints, tourniquets/binders, and procedures administered so far.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "case_id": {"type": "string", "description": "Authorized emergency case ID"}
                        },
                        "required": ["case_id"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_timeline_events",
                    "description": "Retrieves chronological immutable mission events with actor and category context.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "case_id": {"type": "string", "description": "Authorized emergency case ID"},
                            "limit": {"type": "integer", "description": "Max events to return (default 10)"}
                        },
                        "required": ["case_id"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_current_route_status",
                    "description": "Retrieves ambulance speed, traffic delay, destination hospital, and derived ETA.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "case_id": {"type": "string", "description": "Authorized emergency case ID"}
                        },
                        "required": ["case_id"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_destination_readiness",
                    "description": "Retrieves receiving emergency department bay readiness, pre-alert status, and confirmed resources.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "case_id": {"type": "string", "description": "Authorized emergency case ID"}
                        },
                        "required": ["case_id"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_active_decision_signals",
                    "description": "Retrieves existing active or superseded decision support signals for this case.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "case_id": {"type": "string", "description": "Authorized emergency case ID"}
                        },
                        "required": ["case_id"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_clinician_review_status",
                    "description": "Retrieves on-call clinician review status, protocol endorsements, or data requests.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "case_id": {"type": "string", "description": "Authorized emergency case ID"}
                        },
                        "required": ["case_id"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_handover_status",
                    "description": "Retrieves prehospital handover package generation and ED acknowledgement status.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "case_id": {"type": "string", "description": "Authorized emergency case ID"}
                        },
                        "required": ["case_id"],
                    },
                },
            },
        ]

    def execute_tool(self, tool_name: str, arguments: dict) -> AgentToolResult:
        """Executes the named read-only tool with strict authorization validation."""
        start_time = time.time()
        if tool_name not in self._tools:
            return AgentToolResult(
                tool_name=tool_name,
                arguments=arguments,
                result_summary=f"Forbidden or unknown tool: '{tool_name}'",
                duration_ms=int((time.time() - start_time) * 1000),
                success=False,
                source_event_ids=[],
                data={"error": f"Tool '{tool_name}' is not in authorized read-only registry."},
            )

        try:
            handler = self._tools[tool_name]
            result = handler(arguments)
            result.duration_ms = int((time.time() - start_time) * 1000)
            return result
        except ToolAuthorizationError as auth_err:
            logger.warning("Tool authorization rejection: %s", auth_err)
            return AgentToolResult(
                tool_name=tool_name,
                arguments=arguments,
                result_summary=f"Security violation: {str(auth_err)}",
                duration_ms=int((time.time() - start_time) * 1000),
                success=False,
                source_event_ids=[],
                data={"error": str(auth_err), "code": "CASE_AUTHORIZATION_DENIED"},
            )
        except Exception as exc:
            logger.exception("Tool execution failure for %s: %s", tool_name, exc)
            return AgentToolResult(
                tool_name=tool_name,
                arguments=arguments,
                result_summary=f"Execution error: {str(exc)}",
                duration_ms=int((time.time() - start_time) * 1000),
                success=False,
                source_event_ids=[],
                data={"error": str(exc)},
            )

    # ---------------- Tool Implementations ----------------

    def get_case_summary(self, args: dict) -> AgentToolResult:
        case_id = self._validate_case_id(args.get("case_id"))
        case = self.db.query(EmergencyCaseModel).filter(EmergencyCaseModel.id == case_id).first()
        if not case:
            return AgentToolResult(
                tool_name="get_case_summary",
                arguments=args,
                result_summary="Case not found",
                success=False,
                data={"error": "Case not found"},
            )

        patient = case.patient
        data = {
            "caseId": case.id,
            "domain": case.domain,
            "scenarioTitle": case.scenario_title,
            "status": case.status,
            "patient": {
                "name": patient.name if patient else "Unknown",
                "age": patient.age if patient else 0,
                "sex": patient.sex if patient else "Unknown",
                "chiefComplaint": patient.chief_complaint if patient else "",
                "incidentType": patient.incident_type if patient else "",
                "consciousState": patient.conscious_state if patient else "Alert",
                "gcsScore": patient.gcs_score if patient else 15,
                "reportedBloodLoss": patient.reported_blood_loss if patient else "None",
            },
        }
        return AgentToolResult(
            tool_name="get_case_summary",
            arguments=args,
            result_summary=f"Case {case.id} ({case.domain}): {patient.name if patient else 'Patient'}, {patient.age if patient else 0}y, {patient.incident_type if patient else ''}",
            success=True,
            source_event_ids=["ev-001"],
            data=data,
        )

    def get_latest_vitals(self, args: dict) -> AgentToolResult:
        case_id = self._validate_case_id(args.get("case_id"))
        vital = (
            self.db.query(VitalSnapshotModel)
            .filter(VitalSnapshotModel.case_id == case_id)
            .order_by(VitalSnapshotModel.created_at.desc())
            .first()
        )
        if not vital:
            return AgentToolResult(
                tool_name="get_latest_vitals",
                arguments=args,
                result_summary="No vital readings recorded yet",
                success=True,
                source_event_ids=[],
                data={"vitals": None},
            )

        data = {
            "timestamp": vital.timestamp,
            "heartRate": vital.heart_rate,
            "spo2": vital.spo2,
            "systolicBp": vital.systolic_bp,
            "diastolicBp": vital.diastolic_bp,
            "respiratoryRate": vital.respiratory_rate,
            "temperatureC": vital.temperature_c,
            "isAbnormal": vital.is_abnormal,
        }
        summary = f"HR {vital.heart_rate} bpm, BP {vital.systolic_bp}/{vital.diastolic_bp} mmHg, SpO2 {vital.spo2}%, RR {vital.respiratory_rate}/min"
        return AgentToolResult(
            tool_name="get_latest_vitals",
            arguments=args,
            result_summary=summary,
            success=True,
            source_event_ids=[f"ev-vital-{vital.id}"],
            data=data,
        )

    def get_vital_trend(self, args: dict) -> AgentToolResult:
        case_id = self._validate_case_id(args.get("case_id"))
        limit = min(int(args.get("limit", 5)), 10)
        vitals = (
            self.db.query(VitalSnapshotModel)
            .filter(VitalSnapshotModel.case_id == case_id)
            .order_by(VitalSnapshotModel.created_at.asc())
            .all()
        )
        recent_vitals = vitals[-limit:] if len(vitals) > limit else vitals
        data_list = [
            {
                "timestamp": v.timestamp,
                "heartRate": v.heart_rate,
                "spo2": v.spo2,
                "systolicBp": v.systolic_bp,
                "diastolicBp": v.diastolic_bp,
                "respiratoryRate": v.respiratory_rate,
            }
            for v in recent_vitals
        ]

        if len(recent_vitals) >= 2:
            first = recent_vitals[0]
            last = recent_vitals[-1]
            hr_delta = last.heart_rate - first.heart_rate
            sbp_delta = last.systolic_bp - first.systolic_bp
            summary = f"Trend ({len(recent_vitals)} points): HR Δ {hr_delta:+d} bpm ({first.heart_rate}→{last.heart_rate}), SBP Δ {sbp_delta:+d} mmHg ({first.systolic_bp}→{last.systolic_bp})"
        elif recent_vitals:
            summary = f"Single vital measurement: HR {recent_vitals[0].heart_rate}, BP {recent_vitals[0].systolic_bp}/{recent_vitals[0].diastolic_bp}"
        else:
            summary = "No vitals recorded in trend"

        return AgentToolResult(
            tool_name="get_vital_trend",
            arguments=args,
            result_summary=summary,
            success=True,
            source_event_ids=[f"ev-vital-{v.id}" for v in recent_vitals],
            data={"trend": data_list, "count": len(data_list)},
        )

    def get_recent_observations(self, args: dict) -> AgentToolResult:
        case_id = self._validate_case_id(args.get("case_id"))
        events = (
            self.db.query(TimelineEventModel)
            .filter(
                TimelineEventModel.case_id == case_id,
                TimelineEventModel.title.like("%Observation%"),
            )
            .order_by(TimelineEventModel.created_at.desc())
            .limit(5)
            .all()
        )
        obs_list = [{"eventId": e.event_id, "timestamp": e.timestamp, "detail": e.detail} for e in events]
        summary = f"{len(events)} observations found: " + ("; ".join([e.detail[:50] for e in events]) if events else "None")
        return AgentToolResult(
            tool_name="get_recent_observations",
            arguments=args,
            result_summary=summary,
            success=True,
            source_event_ids=[e.event_id for e in events],
            data={"observations": obs_list},
        )

    def get_recorded_interventions(self, args: dict) -> AgentToolResult:
        case_id = self._validate_case_id(args.get("case_id"))
        interventions = (
            self.db.query(InterventionModel)
            .filter(InterventionModel.case_id == case_id)
            .order_by(InterventionModel.created_at.asc())
            .all()
        )
        int_list = [
            {
                "id": i.id,
                "name": getattr(i, "action_label", getattr(i, "name", "Intervention")),
                "timestamp": i.timestamp,
                "performer": getattr(i, "actor", getattr(i, "performer", "FIELD MEDIC")),
                "status": i.status,
            }
            for i in interventions
        ]
        int_names = [getattr(i, "action_label", getattr(i, "name", "Intervention")) for i in interventions]
        summary = f"{len(interventions)} interventions: " + (", ".join(int_names) if interventions else "None documented")
        return AgentToolResult(
            tool_name="get_recorded_interventions",
            arguments=args,
            result_summary=summary,
            success=True,
            source_event_ids=[f"ev-int-{i.id}" for i in interventions],
            data={"interventions": int_list},
        )

    def get_timeline_events(self, args: dict) -> AgentToolResult:
        case_id = self._validate_case_id(args.get("case_id"))
        limit = min(int(args.get("limit", 10)), 20)
        events = (
            self.db.query(TimelineEventModel)
            .filter(TimelineEventModel.case_id == case_id)
            .order_by(TimelineEventModel.created_at.desc())
            .limit(limit)
            .all()
        )
        evt_list = [
            {
                "eventId": e.event_id,
                "version": e.version,
                "timestamp": e.timestamp,
                "actor": e.actor,
                "category": e.category,
                "title": e.title,
                "status": e.status,
            }
            for e in reversed(events)
        ]
        return AgentToolResult(
            tool_name="get_timeline_events",
            arguments=args,
            result_summary=f"Retrieved {len(evt_list)} recent timeline events",
            success=True,
            source_event_ids=[e.event_id for e in events],
            data={"events": evt_list},
        )

    def get_current_route_status(self, args: dict) -> AgentToolResult:
        case_id = self._validate_case_id(args.get("case_id"))
        case = self.db.query(EmergencyCaseModel).filter(EmergencyCaseModel.id == case_id).first()
        if not case or not case.ambulance:
            return AgentToolResult(
                tool_name="get_current_route_status",
                arguments=args,
                result_summary="Ambulance route not available",
                success=False,
                data={"error": "Ambulance record missing"},
            )

        amb = case.ambulance
        derived_eta = amb.base_eta_minutes + amb.traffic_delay_minutes
        data = {
            "callSign": amb.call_sign,
            "crewLead": amb.crew_lead,
            "speedKmh": amb.current_speed_kmh,
            "baseEtaMinutes": amb.base_eta_minutes,
            "trafficDelayMinutes": amb.traffic_delay_minutes,
            "derivedEtaMinutes": derived_eta,
            "assignedHospital": amb.assigned_hospital,
        }
        summary = f"Ambulance {amb.call_sign} en route to {amb.assigned_hospital}, ETA {derived_eta} min (delay: +{amb.traffic_delay_minutes} min)"
        return AgentToolResult(
            tool_name="get_current_route_status",
            arguments=args,
            result_summary=summary,
            success=True,
            source_event_ids=["ev-route-01"],
            data=data,
        )

    def get_destination_readiness(self, args: dict) -> AgentToolResult:
        case_id = self._validate_case_id(args.get("case_id"))
        readiness = (
            self.db.query(FacilityReadinessModel)
            .filter(FacilityReadinessModel.case_id == case_id)
            .first()
        )
        if not readiness:
            return AgentToolResult(
                tool_name="get_destination_readiness",
                arguments=args,
                result_summary="Readiness status not yet initiated",
                success=True,
                data={"readiness": None},
            )

        data = {
            "status": readiness.status,
            "assignedBay": readiness.assigned_bay,
            "bedNumber": readiness.bed_number,
            "isPreAlertDispatched": readiness.is_pre_alert_dispatched,
            "isPreAlertAcknowledged": readiness.is_pre_alert_acknowledged,
            "confirmedBy": readiness.confirmed_by,
            "resourcesReady": readiness.resources_ready,
        }
        summary = f"Bay {readiness.assigned_bay}: status {readiness.status} ({len(readiness.resources_ready)} resources prepped)"
        return AgentToolResult(
            tool_name="get_destination_readiness",
            arguments=args,
            result_summary=summary,
            success=True,
            source_event_ids=["ev-hosp-ready"],
            data=data,
        )

    def get_active_decision_signals(self, args: dict) -> AgentToolResult:
        case_id = self._validate_case_id(args.get("case_id"))
        signals = (
            self.db.query(DecisionSupportSignalModel)
            .filter(DecisionSupportSignalModel.case_id == case_id)
            .order_by(DecisionSupportSignalModel.created_at.desc())
            .all()
        )
        sig_list = [
            {
                "signalId": s.id,
                "title": s.title,
                "signalType": s.signal_type,
                "status": s.status,
                "observedData": s.observed_data,
                "explanation": s.explanation,
                "provider": s.provider,
                "safetyLabel": s.safety_label,
            }
            for s in signals
        ]
        summary = f"{len(signals)} signals on record (active: {[s.title for s in signals if s.status == 'NEW']})"
        return AgentToolResult(
            tool_name="get_active_decision_signals",
            arguments=args,
            result_summary=summary,
            success=True,
            source_event_ids=[s.id for s in signals],
            data={"signals": sig_list},
        )

    def get_clinician_review_status(self, args: dict) -> AgentToolResult:
        case_id = self._validate_case_id(args.get("case_id"))
        actions = (
            self.db.query(ClinicianActionModel)
            .filter(ClinicianActionModel.case_id == case_id)
            .order_by(ClinicianActionModel.created_at.desc())
            .all()
        )
        act_list = [
            {
                "id": a.id,
                "action": a.action,
                "clinicianName": a.clinician_name,
                "timestamp": a.timestamp,
                "notes": a.notes,
                "reviewPlanTitle": a.review_plan_title,
                "requestedDataType": a.requested_data_type,
            }
            for a in actions
        ]
        summary = f"{len(actions)} clinician actions logged (latest: {actions[0].action if actions else 'None'})"
        return AgentToolResult(
            tool_name="get_clinician_review_status",
            arguments=args,
            result_summary=summary,
            success=True,
            source_event_ids=[f"ev-cln-{a.id}" for a in actions],
            data={"actions": act_list},
        )

    def get_handover_status(self, args: dict) -> AgentToolResult:
        case_id = self._validate_case_id(args.get("case_id"))
        pkg = (
            self.db.query(HandoverPackageModel)
            .filter(HandoverPackageModel.case_id == case_id)
            .order_by(HandoverPackageModel.created_at.desc())
            .first()
        )
        if not pkg:
            return AgentToolResult(
                tool_name="get_handover_status",
                arguments=args,
                result_summary="Handover package not yet generated",
                success=True,
                data={"handover": None},
            )

        data = {
            "packageId": pkg.id,
            "version": pkg.case_version,
            "status": pkg.status,
            "integrityHash": pkg.integrity_hash[:16] + "...",
            "completeness": pkg.completeness_status,
            "acknowledgedBy": pkg.acknowledged_by_name,
        }
        summary = f"Handover {pkg.id}: {pkg.status} (Hash: {pkg.integrity_hash[:12]}...)"
        return AgentToolResult(
            tool_name="get_handover_status",
            arguments=args,
            result_summary=summary,
            success=True,
            source_event_ids=[pkg.id],
            data=data,
        )
