import re
from typing import Optional, Literal, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator

# Patient Schemas
class PatientSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    name: str
    age: int = Field(ge=0, le=130)
    sex: Literal["Male", "Female", "Other"]
    incident_type: str = Field(alias="incidentType")
    chief_complaint: str = Field(alias="chiefComplaint")
    conscious_state: Literal["Alert", "Voice", "Pain", "Unresponsive"] = Field(alias="consciousState")
    gcs_score: int = Field(ge=3, le=15, alias="gcsScore")
    reported_blood_loss: Literal["None", "Minimal", "Moderate", "Significant"] = Field(alias="reportedBloodLoss")


# Ambulance Schemas
class CoordinatesSchema(BaseModel):
    lat: float
    lng: float

class AmbulanceSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    call_sign: str = Field(alias="callSign")
    crew_lead: str = Field(alias="crewLead")
    current_speed_kmh: float = Field(alias="currentSpeedKmH")
    base_eta_minutes: int = Field(alias="baseEtaMinutes")
    traffic_delay_minutes: int = Field(alias="trafficDelayMinutes")
    is_traffic_delayed: bool = Field(alias="isTrafficDelayed")
    effective_eta_minutes: Optional[int] = Field(default=None, alias="effectiveEtaMinutes")
    assigned_hospital: str = Field(alias="assignedHospital")
    coordinates: CoordinatesSchema


# Vitals Schemas
class VitalSnapshotCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    heart_rate: int = Field(ge=20, le=300, alias="heartRate")
    spo2: int = Field(ge=40, le=100)
    systolic_bp: int = Field(ge=30, le=300, alias="systolicBp")
    diastolic_bp: int = Field(ge=20, le=200, alias="diastolicBp")
    respiratory_rate: int = Field(default=18, ge=4, le=80, alias="respiratoryRate")
    temperature_c: float = Field(default=37.0, ge=25.0, le=45.0, alias="temperatureC")
    timestamp: Optional[str] = None

class VitalSnapshotSchema(VitalSnapshotCreate):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: Optional[str] = None
    is_abnormal: bool = Field(default=False, alias="isAbnormal")


# Interventions / Observations
class InterventionCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    action_label: str = Field(alias="actionLabel")
    detail_text: str = Field(alias="detailText")
    actor: str = Field(default="FIELD MEDIC")
    timestamp: Optional[str] = None

class InterventionSchema(InterventionCreate):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    status: str = "SUCCESS"


# Clinical Signal / Decision Support
class ClinicalSignalSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    risk_level: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"] = Field(alias="riskLevel")
    risk_score: int = Field(ge=0, le=100, alias="riskScore")
    detected_signals: list[str] = Field(alias="detectedSignals")
    clinical_significance: str = Field(alias="clinicalSignificance")
    next_step_recommendation: str = Field(alias="nextStepRecommendation")
    is_reviewed: bool = Field(default=False, alias="isReviewed")


# Clinician Action Schemas
class ClinicianReviewCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    action: Literal["CONFIRMED"] = "CONFIRMED"
    clinician_id: str = Field(default="DOC-482", alias="clinicianId")
    clinician_name: str = Field(default="Dr. Sunita Rao, MD", alias="clinicianName")
    notes: Optional[str] = None
    review_plan_title: Optional[str] = Field(default=None, alias="reviewPlanTitle")
    timestamp: Optional[str] = None

class ClinicianDataRequestCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    action: Literal["DATA_REQUESTED"] = "DATA_REQUESTED"
    requested_data_type: str = Field(alias="requestedDataType")
    clinician_id: str = Field(default="DOC-482", alias="clinicianId")
    clinician_name: str = Field(default="Dr. Sunita Rao, MD", alias="clinicianName")
    notes: Optional[str] = None
    timestamp: Optional[str] = None

class ClinicianEscalationCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    action: Literal["ESCALATED"] = "ESCALATED"
    reason: str
    clinician_id: str = Field(default="DOC-482", alias="clinicianId")
    clinician_name: str = Field(default="Dr. Sunita Rao, MD", alias="clinicianName")
    notes: Optional[str] = None
    timestamp: Optional[str] = None

class ClinicianAcknowledgeCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    action: Literal["ACKNOWLEDGED"] = "ACKNOWLEDGED"
    signal_id: Optional[str] = Field(default=None, alias="signalId")
    clinician_id: str = Field(default="DOC-482", alias="clinicianId")
    clinician_name: str = Field(default="Dr. Sunita Rao, MD", alias="clinicianName")
    notes: Optional[str] = None
    timestamp: Optional[str] = None

class ClinicianEndorsementSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    status: Literal["PENDING", "CONFIRMED", "DATA_REQUESTED", "ESCALATED", "ACKNOWLEDGED"]
    clinician_name: str = Field(alias="clinicianName")
    clinician_id: Optional[str] = Field(default=None, alias="clinicianId")
    timestamp: Optional[str] = None
    notes: Optional[str] = None
    authorized_protocol: Optional[str] = Field(default=None, alias="authorizedProtocol")


# Facility Candidates & Matching
class HospitalCandidateSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    name: str
    trauma_level: str = Field(alias="traumaLevel")
    distance_km: float = Field(alias="distanceKm")
    eta_minutes: int = Field(alias="etaMinutes")
    match_score: int = Field(alias="matchScore")
    clinical_fit_score: int = Field(default=70, alias="clinicalFitScore")
    availability_score: int = Field(default=85, alias="availabilityScore")
    eta_score: int = Field(default=80, alias="etaScore")
    is_primary: bool = Field(default=False, alias="isPrimary")
    specialty_fit: str = Field(alias="specialtyFit")
    availability: str
    rationale: str

class FacilityMatchingSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    recommended_hospital_id: str = Field(alias="recommendedHospitalId")
    algorithm_rationale: str = Field(alias="algorithmRationale")
    candidates: list[HospitalCandidateSchema]


# Facility Readiness
class HospitalReadinessSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    status: Literal["UNKNOWN", "PENDING", "PRE_ALERT_TRANSMITTED", "ACCEPTED", "PREPARING", "BAY_READY", "ACKNOWLEDGED"]
    assigned_bay: Optional[str] = Field(default="Awaiting Assignment", alias="assignedBay")
    confirmed_by: Optional[str] = Field(default=None, alias="confirmedBy")
    timestamp: Optional[str] = None
    is_pre_alert_dispatched: bool = Field(default=True, alias="isPreAlertDispatched")
    is_pre_alert_acknowledged: bool = Field(default=False, alias="isPreAlertAcknowledged")
    acknowledged_at: Optional[str] = Field(default=None, alias="acknowledgedAt")
    bed_number: Optional[str] = Field(default=None, alias="bedNumber")
    resources_ready: list[str] = Field(alias="resourcesReady")


# Timeline Events (Event Store)
class TimelineEventSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    version: int = 1
    timestamp: str
    category: str
    title: str
    detail: str
    actor: str
    status: Literal["INFO", "WARNING", "CRITICAL", "SUCCESS"]
    payload: Optional[dict] = None

class EventCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    category: str = "CLINICAL"
    title: str
    detail: str
    actor: str = "FIELD MEDIC"
    status: Literal["INFO", "WARNING", "CRITICAL", "SUCCESS"] = "SUCCESS"
    timestamp: Optional[str] = None
    payload: Optional[dict] = None


# Comprehensive Case Snapshot (GET /api/v1/cases/{case_id})
class EmergencyCaseDetailSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    domain: str
    status: Literal["REPORTED", "DISPATCHED", "ONBOARD", "IN_TRANSIT", "ARRIVED", "HANDED_OVER", "TRANSFER_COMPLETED"]
    scenario_title: str = Field(alias="scenarioTitle")
    conduit_step: int = Field(alias="conduitStep")
    current_version: int = Field(default=1, alias="currentVersion")
    patient: PatientSchema
    ambulance: AmbulanceSchema
    current_vitals: VitalSnapshotSchema = Field(alias="currentVitals")
    vitals_history: list[VitalSnapshotSchema] = Field(alias="vitalsHistory")
    timeline: list[TimelineEventSchema]
    ai_decision_support: Optional[ClinicalSignalSchema] = Field(default=None, alias="aiDecisionSupport")
    active_decision_signal: Optional[dict] = Field(default=None, alias="activeDecisionSignal")
    clinician_endorsement: Optional[ClinicianEndorsementSchema] = Field(default=None, alias="clinicianEndorsement")
    hospital_readiness: Optional[HospitalReadinessSchema] = Field(default=None, alias="hospitalReadiness")
    facility_matching: Optional[FacilityMatchingSchema] = Field(default=None, alias="facilityMatching")
    cds_data_status: Optional[str] = Field(default="NOT_SENT", alias="cdsDataStatus")


# Phase 16 Authentication, Role & Principal Schemas
from enum import Enum

class UserRoleEnum(str, Enum):
    FIELD_MEDIC = "FIELD_MEDIC"
    REMOTE_CLINICIAN = "REMOTE_CLINICIAN"
    HOSPITAL_COMMAND = "HOSPITAL_COMMAND"
    READINESS = "READINESS"
    PORTAL_ADMIN = "PORTAL_ADMIN"

class UserLoginRequest(BaseModel):
    username: str # Username or email
    password: str

class UserPublicSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    username: str
    email: str
    display_name: str = Field(alias="displayName")
    role: str
    is_active: bool = Field(default=True, alias="isActive")

class LoginResponseSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    access_token: str = Field(alias="accessToken")
    token_type: str = Field(default="bearer", alias="tokenType")
    user: UserPublicSchema


# Real-time WebSocket Protocol Envelopes
class RealtimeActor(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    type: str # FIELD_MEDIC, REMOTE_CLINICIAN, RECEIVING_ED, SYSTEM, AI_SUPPORT
    id: Optional[str] = None
    user_id: Optional[str] = Field(default=None, alias="userId")
    name: Optional[str] = None
    role: Optional[str] = None

class RealtimeEventEnvelope(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    event_id: str = Field(alias="eventId")
    case_id: str = Field(alias="caseId")
    event_type: str = Field(alias="eventType")
    version: int
    timestamp: str
    actor: RealtimeActor
    payload: dict = Field(default_factory=dict)


# Health & Status
class HealthResponseSchema(BaseModel):
    status: str = "ok"
    version: str
    database: str
    active_cases: int
    realtime: Optional[dict] = None


# ==============================================================================
# Phase 18: Prehospital Handover Package & Audit Snapshot Schemas
# ==============================================================================

class HandoverPatientSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    name: str
    age: int
    sex: str
    incident_type: str = Field(alias="incidentType")
    chief_complaint: str = Field(alias="chiefComplaint")
    conscious_state: str = Field(alias="consciousState")
    gcs_score: int = Field(alias="gcsScore")
    reported_blood_loss: str = Field(alias="reportedBloodLoss")

class HandoverIncidentSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    domain: str
    scenario_title: str = Field(alias="scenarioTitle")
    status: str
    conduit_step: int = Field(alias="conduitStep")

class HandoverTransportSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    call_sign: str = Field(alias="callSign")
    crew_lead: str = Field(alias="crewLead")
    current_speed_kmh: float = Field(alias="currentSpeedKmH")
    base_eta_minutes: int = Field(alias="baseEtaMinutes")
    traffic_delay_minutes: int = Field(alias="trafficDelayMinutes")
    effective_eta_minutes: int = Field(alias="effectiveEtaMinutes")
    is_traffic_delayed: bool = Field(alias="isTrafficDelayed")
    assigned_hospital: str = Field(alias="assignedHospital")
    coordinates: CoordinatesSchema

class HandoverVitalItemSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[str] = None
    timestamp: str
    heart_rate: int = Field(alias="heartRate")
    spo2: int
    systolic_bp: int = Field(alias="systolicBp")
    diastolic_bp: int = Field(alias="diastolicBp")
    respiratory_rate: int = Field(alias="respiratoryRate")
    temperature_c: float = Field(alias="temperatureC")
    is_abnormal: bool = Field(default=False, alias="isAbnormal")
    source_event_id: Optional[str] = Field(default=None, alias="sourceEventId")

class HandoverObservationSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[str] = None
    timestamp: str
    text: str
    actor: str
    source_event_id: Optional[str] = Field(default=None, alias="sourceEventId")

class HandoverInterventionSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    timestamp: str
    action_label: str = Field(alias="actionLabel")
    detail_text: str = Field(alias="detailText")
    actor: str
    status: str
    source_event_id: Optional[str] = Field(default=None, alias="sourceEventId")

class HandoverDecisionSupportSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    signal_id: str = Field(alias="signalId")
    signal_type: str = Field(alias="signalType")
    title: str
    observed_data: str = Field(alias="observedData")
    explanation: str
    provider: str
    provider_version: str = Field(alias="providerVersion")
    safety_label: str = Field(default="SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS", alias="safetyLabel")
    requires_clinician_review: bool = Field(default=True, alias="requiresClinicianReview")
    status: str = "NEW"
    source_event_ids: list[str] = Field(default_factory=list, alias="sourceEventIds")

class HandoverClinicianReviewSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    action: str
    clinician_id: str = Field(alias="clinicianId")
    clinician_name: str = Field(alias="clinicianName")
    timestamp: str
    notes: Optional[str] = None
    review_plan_title: Optional[str] = Field(default=None, alias="reviewPlanTitle")
    requested_data_type: Optional[str] = Field(default=None, alias="requestedDataType")
    source_event_id: Optional[str] = Field(default=None, alias="sourceEventId")

class HandoverDestinationSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    facility_id: str = Field(alias="facilityId")
    name: str
    trauma_level: str = Field(alias="traumaLevel")
    distance_km: float = Field(alias="distanceKm")
    eta_minutes: int = Field(alias="etaMinutes")
    match_score: int = Field(alias="matchScore")
    specialty_fit: str = Field(alias="specialtyFit")

class HandoverReadinessSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    status: str
    assigned_bay: str = Field(alias="assignedBay")
    confirmed_by: Optional[str] = Field(default=None, alias="confirmedBy")
    timestamp: Optional[str] = None
    bed_number: Optional[str] = Field(default=None, alias="bedNumber")
    resources_ready: list[str] = Field(default_factory=list, alias="resourcesReady")
    is_bay_ready: bool = Field(default=False, alias="isBayReady")
    source_event_id: Optional[str] = Field(default=None, alias="sourceEventId")

class HandoverTimelineItemSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    version: int
    timestamp: str
    category: str
    title: str
    detail: str
    actor: str
    status: str

class HandoverProvenanceSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    source_case_version: int = Field(alias="sourceCaseVersion")
    source_event_count: int = Field(alias="sourceEventCount")
    generated_timestamp: str = Field(alias="generatedTimestamp")
    content_digest_sha256: str = Field(alias="contentDigestSha256")
    generator_engine: str = Field(default="PRANA-Prehospital-Handover-Engine-v1.0", alias="generatorEngine")

class HandoverCompletenessSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    is_complete: bool = Field(alias="isComplete")
    completeness_percentage: int = Field(alias="completenessPercentage")
    missing_fields: list[str] = Field(default_factory=list, alias="missingFields")
    items_found: list[str] = Field(default_factory=list, alias="itemsFound")

class PrehospitalHandoverPackageSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    package_id: str = Field(alias="packageId")
    case_id: str = Field(alias="caseId")
    case_version: int = Field(alias="caseVersion")
    generated_at: str = Field(alias="generatedAt")
    generated_by: dict = Field(alias="generatedBy")
    status: str = Field(default="GENERATED")
    patient: HandoverPatientSchema
    incident: HandoverIncidentSchema
    transport: HandoverTransportSchema
    latest_vitals: HandoverVitalItemSchema = Field(alias="latestVitals")
    vital_timeline: list[HandoverVitalItemSchema] = Field(alias="vitalTimeline")
    observations: list[HandoverObservationSchema]
    interventions: list[HandoverInterventionSchema]
    decision_support: list[HandoverDecisionSupportSchema] = Field(alias="decisionSupport")
    clinician_reviews: list[HandoverClinicianReviewSchema] = Field(alias="clinicianReviews")
    destination: HandoverDestinationSchema
    readiness: HandoverReadinessSchema
    event_timeline: list[HandoverTimelineItemSchema] = Field(alias="eventTimeline")
    provenance: HandoverProvenanceSchema
    completeness: HandoverCompletenessSchema
    safety_notice: str = Field(
        default="This prototype prehospital handover package is generated from demonstration records and does not constitute a clinically validated medical record.",
        alias="safetyNotice"
    )
    acknowledged_at: Optional[str] = Field(default=None, alias="acknowledgedAt")
    acknowledged_by: Optional[dict] = Field(default=None, alias="acknowledgedBy")
    integrity_hash: str = Field(alias="integrityHash")

class HandoverAcknowledgeRequest(BaseModel):
    notes: Optional[str] = None

class HandoverVerifyResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    match: bool
    package_id: str = Field(alias="packageId")
    stored_hash: str = Field(alias="storedHash")
    recalculated_hash: str = Field(alias="recalculatedHash")
    verified_at: str = Field(alias="verifiedAt")
    details: str

class HandoverSummarySchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    package_id: str = Field(alias="packageId")
    case_id: str = Field(alias="caseId")
    case_version: int = Field(alias="caseVersion")
    status: str
    generated_at: str = Field(alias="generatedAt")
    generated_by_name: str = Field(alias="generatedByName")
    completeness_status: str = Field(alias="completenessStatus")
    integrity_hash: str = Field(alias="integrityHash")


# =========================================================================
# Phase 23 Case Intake & Draft Schemas (Voice + Text + File Ingestion)
# =========================================================================

class DraftFieldProvenanceSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    source: Literal["MANUAL", "VOICE", "TEXT", "JSON", "FHIR", "CSV", "PDF"] = "TEXT"
    source_id: str = Field(default="", alias="sourceId")
    source_timestamp: Optional[str] = Field(default=None, alias="sourceTimestamp")
    extraction_method: Literal["MANUAL", "PARSED", "TRANSCRIBED", "LLM_EXTRACTED", "MANUAL_OVERRIDE"] = Field(
        default="PARSED", alias="extractionMethod"
    )
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    status: Literal["UNCONFIRMED", "CONFIRMED", "REJECTED", "UNKNOWN"] = "UNCONFIRMED"
    original_value: Optional[str | int | float | bool] = Field(default=None, alias="originalValue")
    is_approximate: bool = Field(default=False, alias="isApproximate")
    is_ambiguous: bool = Field(default=False, alias="isAmbiguous")
    ambiguous_options: list[str] = Field(default_factory=list, alias="ambiguousOptions")


class DraftCandidateField(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    field_name: str = Field(alias="fieldName")
    value: Optional[str | int | float | bool | list[str]] = None
    unit: Optional[str] = None
    provenance: DraftFieldProvenanceSchema


class CaseDraftDataSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    patient_name: Optional[DraftCandidateField] = Field(default=None, alias="patientName")
    approximate_age: Optional[DraftCandidateField] = Field(default=None, alias="approximateAge")
    sex: Optional[DraftCandidateField] = None
    incident_type: Optional[DraftCandidateField] = Field(default=None, alias="incidentType")
    incident_time: Optional[DraftCandidateField] = Field(default=None, alias="incidentTime")
    incident_location: Optional[DraftCandidateField] = Field(default=None, alias="incidentLocation")
    chief_complaint: Optional[DraftCandidateField] = Field(default=None, alias="chiefComplaint")
    mechanism_of_injury: Optional[DraftCandidateField] = Field(default=None, alias="mechanismOfInjury")
    conscious_state: Optional[DraftCandidateField] = Field(default=None, alias="consciousState")
    gcs_score: Optional[DraftCandidateField] = Field(default=None, alias="gcsScore")
    reported_blood_loss: Optional[DraftCandidateField] = Field(default=None, alias="reportedBloodLoss")
    vitals: dict[str, DraftCandidateField] = Field(default_factory=dict)
    observations: list[DraftCandidateField] = Field(default_factory=list)
    interventions: list[DraftCandidateField] = Field(default_factory=list)
    allergies: list[DraftCandidateField] = Field(default_factory=list)
    medications: list[DraftCandidateField] = Field(default_factory=list)
    medical_history: list[DraftCandidateField] = Field(default_factory=list, alias="medicalHistory")
    eta_minutes: Optional[DraftCandidateField] = Field(default=None, alias="etaMinutes")
    destination_preference: Optional[DraftCandidateField] = Field(default=None, alias="destinationPreference")
    domain_hint: Optional[str] = Field(default="TRAUMA", alias="domainHint")
    extraction_metadata: Optional["ExtractionMetadataSchema"] = Field(default=None, alias="extractionMetadata")


class ExtractionMetadataSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    engine: str = Field(alias="engine")  # e.g. "Qwen3" or "DETERMINISTIC FALLBACK"
    provider: str = Field(alias="provider")  # e.g. "Qwen3LocalProvider" or "DeterministicCaseExtractor"
    model: str = Field(alias="model")  # e.g. "qwen3:8b" or "deterministic-rule-v2"
    model_verified: bool = Field(default=False, alias="modelVerified")
    model_identity: str = Field(alias="modelIdentity")
    is_fallback: bool = Field(default=False, alias="isFallback")
    fallback_reason: Optional[str] = Field(default=None, alias="fallbackReason")
    transcription_engine: str = Field(default="Direct Clinical Text / File Ingestion", alias="transcriptionEngine")
    latency_ms: Optional[int] = Field(default=None, alias="latencyMs")
    validation_status: str = Field(default="Schema Valid", alias="validationStatus")
    validation_engine: str = Field(default="Pydantic V2 (BaseModel)", alias="validationEngine")
    fields_extracted_count: int = Field(default=0, alias="fieldsExtractedCount")
    source_type: str = Field(alias="sourceType")
    raw_char_count: int = Field(default=0, alias="rawCharCount")
    created_at: str = Field(alias="createdAt")


class CaseExtractionResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    patient_name: Optional[str] = Field(default=None, alias="patientName")
    approximate_age: Optional[int] = Field(default=None, alias="approximateAge")
    sex: Optional[Literal["Male", "Female", "Other"]] = None
    incident_type: Optional[str] = Field(default=None, alias="incidentType")
    chief_complaint: Optional[str] = Field(default=None, alias="chiefComplaint")
    conscious_state: Optional[Literal["Alert", "Voice", "Pain", "Unresponsive"]] = Field(default=None, alias="consciousState")
    gcs_score: Optional[int] = Field(default=None, alias="gcsScore")
    reported_blood_loss: Optional[Literal["None", "Minimal", "Moderate", "Significant"]] = Field(default=None, alias="reportedBloodLoss")
    heart_rate: Optional[int] = Field(default=None, alias="heartRate")
    systolic_bp: Optional[int] = Field(default=None, alias="systolicBp")
    diastolic_bp: Optional[int] = Field(default=None, alias="diastolicBp")
    spo2: Optional[int] = None
    respiratory_rate: Optional[int] = Field(default=None, alias="respiratoryRate")
    temperature_c: Optional[float] = Field(default=None, alias="temperatureC")
    eta_minutes: Optional[int] = Field(default=None, alias="etaMinutes")
    domain_hint: Optional[str] = Field(default=None, alias="domainHint")
    observations: list[str] = Field(default_factory=list)
    interventions: list[str] = Field(default_factory=list)
    medical_history: list[str] = Field(default_factory=list, alias="medicalHistory")
    ambiguities: list[str] = Field(default_factory=list)
    approximations: list[str] = Field(default_factory=list)
    missing_fields: list[str] = Field(default_factory=list, alias="missingFields")

    @field_validator("heart_rate", "systolic_bp", "diastolic_bp", "spo2", "respiratory_rate", "approximate_age", "eta_minutes", "gcs_score", mode="before")
    @classmethod
    def parse_int_field(cls, v: Any) -> Optional[int]:
        if v is None:
            return None
        if isinstance(v, (int, float)):
            return int(v)
        if isinstance(v, str):
            clean = re.sub(r"[^\d]", "", v)
            return int(clean) if clean else None
        return None

    @field_validator("temperature_c", mode="before")
    @classmethod
    def parse_float_field(cls, v: Any) -> Optional[float]:
        if v is None:
            return None
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str):
            m = re.search(r"(\d+(?:\.\d+)?)", v)
            return float(m.group(1)) if m else None
        return None

    @field_validator("observations", "interventions", "medical_history", "ambiguities", "approximations", "missing_fields", mode="before")
    @classmethod
    def parse_list_field(cls, v: Any) -> list[str]:
        if v is None:
            return []
        if isinstance(v, list):
            return [str(x).strip() for x in v if str(x).strip() and str(x).strip().lower() != "none"]
        if isinstance(v, str):
            clean = v.strip()
            if not clean or clean.lower() == "none":
                return []
            return [clean]
        return []


class CaseDraftSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    draft_id: str = Field(alias="draftId")
    source_type: str = Field(alias="sourceType")
    source_hash: str = Field(alias="sourceHash")
    raw_content: str = Field(alias="rawContent")
    created_at: str = Field(alias="createdAt")
    importer_id: str = Field(alias="importerId")
    importer_name: str = Field(alias="importerName")
    status: Literal["DRAFT", "CONFIRMED", "DISCARDED"] = "DRAFT"
    candidate_data: CaseDraftDataSchema = Field(alias="candidateData")
    needs_review_count: int = Field(default=0, alias="needsReviewCount")
    confirmed_case_id: Optional[str] = Field(default=None, alias="confirmedCaseId")
    extraction_metadata: Optional[ExtractionMetadataSchema] = Field(default=None, alias="extractionMetadata")


class CaseDraftUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    field_name: str = Field(alias="fieldName")
    new_value: str | int | float | bool | list[str] = Field(alias="newValue")
    unit: Optional[str] = None
    resolve_ambiguity: bool = Field(default=False, alias="resolveAmbiguity")


class CaseDraftConfirmRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    assigned_hospital: Optional[str] = Field(default=None, alias="assignedHospital")
    ambulance_call_sign: Optional[str] = Field(default=None, alias="ambulanceCallSign")
    crew_lead: Optional[str] = Field(default=None, alias="crewLead")
    domain: Optional[str] = None


class TextIntakeRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    text: str = Field(min_length=3, max_length=20000)
    source_name: Optional[str] = Field(default="Field Medic Notes", alias="sourceName")

