from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

class AIContextInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    case_id: str = Field(alias="caseId")
    domain: str # TRAUMA, SNAKEBITE, POISONING
    patient_age: int = Field(alias="patientAge")
    patient_sex: str = Field(alias="patientSex")
    chief_complaint: str = Field(alias="chiefComplaint")
    conscious_state: str = Field(alias="consciousState")
    gcs_score: int = Field(alias="gcsScore")
    reported_blood_loss: str = Field(alias="reportedBloodLoss")
    conduit_step: int = Field(alias="conduitStep")
    latest_vitals: dict = Field(default_factory=dict, alias="latestVitals")
    recent_vitals_trend: list[dict] = Field(default_factory=list, alias="recentVitalsTrend")
    recent_interventions: list[dict] = Field(default_factory=list, alias="recentInterventions")
    recent_event_ids: list[str] = Field(default_factory=list, alias="recentEventIds")
    assigned_hospital: str = Field(default="", alias="assignedHospital")
    eta_minutes: int = Field(default=0, alias="etaMinutes")


class DecisionSupportSignal(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    signal_id: str = Field(alias="signalId")
    case_id: str = Field(alias="caseId")
    generated_at: str = Field(alias="generatedAt")
    provider: str = Field(default="DemoDecisionSupportProvider")
    provider_version: str = Field(default="1.0.0", alias="providerVersion")
    signal_type: str = Field(alias="signalType")
    title: str
    observed_data: str = Field(alias="observedData")
    explanation: str
    relevant_timeline_event_ids: list[str] = Field(default_factory=list, alias="relevantTimelineEventIds")
    requires_clinician_review: bool = Field(default=True, alias="requiresClinicianReview")
    status: Literal["NEW", "ACKNOWLEDGED", "SUPERSEDED"] = "NEW"
    safety_label: str = Field(
        default="SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS",
        alias="safetyLabel"
    )


class SafetyValidationResult(BaseModel):
    is_safe: bool
    violations: list[str] = Field(default_factory=list)
    sanitized_signal: Optional[DecisionSupportSignal] = None


class DecisionSupportListResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    case_id: str = Field(alias="caseId")
    provider: str
    provider_available: bool = Field(alias="providerAvailable")
    status_message: str = Field(alias="statusMessage")
    active_signal: Optional[DecisionSupportSignal] = Field(default=None, alias="activeSignal")
    historical_signals: list[DecisionSupportSignal] = Field(default_factory=list, alias="historicalSignals")
    total_signals: int = Field(default=0, alias="totalSignals")


# Phase 21 Role-Specific Projections of the Single Shared Case Signal
class AmbulanceDecisionSupportView(BaseModel):
    """
    Field Medic projection: Operational awareness only.
    Contains short summary, what changed, missing data requiring field attention,
    and specialist review status. Zero raw tool traces, zero approval authority.
    """
    model_config = ConfigDict(populate_by_name=True)

    signal_id: str = Field(alias="signalId")
    case_id: str = Field(alias="caseId")
    title: str
    risk_level: str = Field(alias="riskLevel")
    what_changed: str = Field(alias="whatChanged")
    operational_summary: str = Field(alias="operationalSummary")
    attention_fields: list[str] = Field(default_factory=list, alias="attentionFields")
    clinician_review_status: str = Field(alias="clinicianReviewStatus")
    clinician_name: Optional[str] = Field(default=None, alias="clinicianName")
    safety_label: str = Field(
        default="SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS",
        alias="safetyLabel"
    )
    can_approve: bool = Field(default=False, alias="canApprove")


class ClinicianDecisionSupportView(BaseModel):
    """
    Remote Clinician projection: Complete authoritative clinical view.
    Includes full signal, evidence provenance, missing data items,
    reasoning summary, tool execution trace summary, and review action gates.
    """
    model_config = ConfigDict(populate_by_name=True)

    signal_id: str = Field(alias="signalId")
    case_id: str = Field(alias="caseId")
    title: str
    signal_type: str = Field(alias="signalType")
    observed_data: str = Field(alias="observedData")
    explanation: str
    reasoning_summary: Optional[str] = Field(default=None, alias="reasoningSummary")
    evidence_source_ids: list[str] = Field(default_factory=list, alias="evidenceSourceIds")
    missing_data: list["MissingDataItem"] = Field(default_factory=list, alias="missingData")
    recommended_data_request: Optional[str] = Field(default=None, alias="recommendedDataRequest")
    provider: str
    provider_version: str = Field(alias="providerVersion")
    status: str
    requires_clinician_review: bool = Field(default=True, alias="requiresClinicianReview")
    safety_label: str = Field(
        default="SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS",
        alias="safetyLabel"
    )
    can_approve: bool = Field(default=True, alias="canApprove")


class HospitalDecisionSupportView(BaseModel):
    """
    Hospital Command projection: Receiving facility triage awareness.
    Provides current concern, vital trend context, arrival corridor,
    readiness implications, and tele-specialist review state.
    """
    model_config = ConfigDict(populate_by_name=True)

    signal_id: str = Field(alias="signalId")
    case_id: str = Field(alias="caseId")
    active_concern: str = Field(alias="activeConcern")
    latest_context: str = Field(alias="latestContext")
    specialist_review_status: str = Field(alias="specialistReviewStatus")
    specialist_name: Optional[str] = Field(default=None, alias="specialistName")
    eta_minutes: int = Field(alias="etaMinutes")
    assigned_bay: str = Field(alias="assignedBay")
    handover_status: str = Field(alias="handoverStatus")
    operational_action: str = Field(alias="operationalAction")
    safety_label: str = Field(
        default="SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS",
        alias="safetyLabel"
    )
    can_approve: bool = Field(default=False, alias="canApprove")


class ReadinessDecisionSupportView(BaseModel):
    """
    Facility Readiness projection: Resource allocation and bay prep summary.
    """
    model_config = ConfigDict(populate_by_name=True)

    signal_id: str = Field(alias="signalId")
    case_id: str = Field(alias="caseId")
    priority_level: str = Field(alias="priorityLevel")
    resuscitation_suite_alert: str = Field(alias="resuscitationSuiteAlert")
    specialist_review_active: bool = Field(alias="specialistReviewActive")
    eta_minutes: int = Field(alias="etaMinutes")


class DecisionSupportEvaluateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    force: bool = False
    reason: Optional[str] = None


# Phase 19 Agentic Clinical Coordination Schemas
class MissingDataItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    field: str
    reason: str
    clinical_importance: Literal["CRITICAL", "HIGH", "MODERATE", "LOW"] = Field(default="HIGH", alias="clinicalImportance")


class AgentToolCall(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    tool_name: str = Field(alias="toolName")
    arguments: dict = Field(default_factory=dict)


class AgentToolResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    tool_name: str = Field(alias="toolName")
    arguments: dict = Field(default_factory=dict)
    result_summary: str = Field(alias="resultSummary")
    duration_ms: int = Field(default=0, alias="durationMs")
    success: bool = True
    source_event_ids: list[str] = Field(default_factory=list, alias="sourceEventIds")
    data: dict = Field(default_factory=dict)


class AgentStructuredOutput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    task_status: Literal["COMPLETED", "WAITING_FOR_DATA", "FAILED"] = Field(alias="taskStatus")
    signal: Optional[DecisionSupportSignal] = None
    missing_data: list[MissingDataItem] = Field(default_factory=list, alias="missingData")
    recommended_data_request: Optional[str] = Field(default=None, alias="recommendedDataRequest")
    reasoning_summary: str = Field(alias="reasoningSummary") # Concise summary, NO private chain-of-thought tokens!
    provenance: list[dict] = Field(default_factory=list)


class AgentTraceItemSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    task_id: str = Field(alias="taskId")
    step_index: int = Field(alias="stepIndex")
    tool_name: str = Field(alias="toolName")
    arguments: dict = Field(default_factory=dict)
    result_summary: str = Field(alias="resultSummary")
    duration_ms: int = Field(default=0, alias="durationMs")
    success: bool = True
    source_event_ids: list[str] = Field(default_factory=list, alias="sourceEventIds")
    timestamp: str


class LayaDecision(BaseModel):
    """
    Phase 20 Laya System 1 Fast Typed Decision Output.
    Non-autoregressive, non-generative, strictly typed orchestration routing.
    """
    model_config = ConfigDict(populate_by_name=True)

    relevance: Literal["no_analysis", "routine_analysis", "deep_analysis"] = "deep_analysis"
    tool_bundle: Literal["vitals", "trends", "observations", "interventions", "transport", "readiness", "handover"] = "vitals"
    review_priority: Literal["P0", "P1", "P2", "P3"] = "P1"
    data_sufficiency: Literal["yes", "no"] = "yes"
    confidence: float = 0.95
    reason: str = "Telemetry update warrants bounded evidence inspection"
    latency_ms: float = Field(default=1.2, alias="latencyMs")


class AgentTaskSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str = Field(alias="taskId")
    case_id: str = Field(alias="caseId")
    trigger_event_id: Optional[str] = Field(default=None, alias="triggerEventId")
    status: str # QUEUED, RUNNING, WAITING_FOR_DATA, COMPLETED, FAILED, SAFETY_BLOCKED, REQUIRES_HUMAN_REVIEW
    provider: str
    model: str
    prompt_version: str = Field(alias="promptVersion")
    started_at: str = Field(alias="startedAt")
    completed_at: Optional[str] = Field(default=None, alias="completedAt")
    iteration_count: int = Field(default=0, alias="iterationCount")
    tool_call_count: int = Field(default=0, alias="toolCallCount")
    final_signal_id: Optional[str] = Field(default=None, alias="finalSignalId")
    failure_reason: Optional[str] = Field(default=None, alias="failureReason")
    safety_status: str = Field(default="PASSED", alias="safetyStatus")
    reasoning_summary: Optional[str] = Field(default=None, alias="reasoningSummary")
    missing_data: list[dict] = Field(default_factory=list, alias="missingData")
    recommended_data_request: Optional[str] = Field(default=None, alias="recommendedDataRequest")
    signal: Optional[DecisionSupportSignal] = None
    laya_gate: Optional[LayaDecision] = Field(default=None, alias="layaGate")
    traces: list[AgentTraceItemSchema] = Field(default_factory=list)


class ProviderStatusResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    provider: str # "hybrid", "local", "demo", "cloud"
    runtime: str # "ollama", "vllm", "mock", "in_process"
    model: str
    available: bool
    tool_calling: bool = Field(alias="toolCalling")
    structured_output: bool = Field(alias="structuredOutput")
    status_message: str = Field(alias="statusMessage")
    latency_ms: Optional[float] = Field(default=None, alias="latencyMs")
    system_one: Optional[dict] = Field(default=None, alias="systemOne")
    system_two: Optional[dict] = Field(default=None, alias="systemTwo")


class AgentEvaluationResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    provider: str = "local"
    runtime: str = "ollama"
    model: str = "qwen2.5:3b"
    total_cases: int = Field(alias="totalCases")
    valid_tool_calls: int = Field(alias="validToolCalls")
    invalid_tool_calls: int = Field(default=0, alias="invalidToolCalls")
    unnecessary_tool_calls: int = Field(default=0, alias="unnecessaryToolCalls")
    unauthorized_tool_calls: int = Field(default=0, alias="unauthorizedToolCalls")
    schema_valid_count: int = Field(alias="schemaValidCount")
    grounded_provenance_count: int = Field(alias="groundedProvenanceCount")
    missing_data_detected_count: int = Field(alias="missingDataDetectedCount")
    safety_violations_count: int = Field(alias="safetyViolationsCount")
    unsafe_output_rate: float = Field(default=0.0, alias="unsafeOutputRate")
    human_review_enforced_count: int = Field(alias="humanReviewEnforcedCount")
    human_review_compliance: float = Field(default=100.0, alias="humanReviewCompliance")
    fallback_count: int = Field(alias="fallbackCount")
    real_inference_count: int = Field(default=0, alias="realInferenceCount")
    execution_mode: str = Field(default="REAL", alias="executionMode") # REAL, FALLBACK, or MIXED
    average_duration_ms: float = Field(alias="averageDurationMs")
    p50_duration_ms: float = Field(default=0.0, alias="p50DurationMs")
    p95_duration_ms: float = Field(default=0.0, alias="p95DurationMs")
    passed: bool


