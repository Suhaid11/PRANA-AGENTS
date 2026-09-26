import json
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)


class EmergencyCaseModel(Base):
    __tablename__ = "cases"

    id = Column(String(64), primary_key=True, index=True) # e.g. PR-8492
    domain = Column(String(32), nullable=False) # TRAUMA, SNAKEBITE, POISONING
    status = Column(String(32), default="IN_TRANSIT", nullable=False) # REPORTED, DISPATCHED, ONBOARD, IN_TRANSIT, ARRIVED, HANDED_OVER
    scenario_title = Column(String(255), nullable=False)
    conduit_step = Column(Integer, default=2, nullable=False)
    current_version = Column(Integer, default=1, nullable=False)
    cds_data_status = Column(String(32), default="NOT_SENT")
    cds_data_sent_at = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    patient = relationship("PatientModel", back_populates="case", uselist=False, cascade="all, delete-orphan")
    ambulance = relationship("AmbulanceModel", back_populates="case", uselist=False, cascade="all, delete-orphan")
    vitals = relationship("VitalSnapshotModel", back_populates="case", cascade="all, delete-orphan", order_by="VitalSnapshotModel.created_at")
    interventions = relationship("InterventionModel", back_populates="case", cascade="all, delete-orphan", order_by="InterventionModel.created_at")
    clinical_signals = relationship("ClinicalSignalModel", back_populates="case", cascade="all, delete-orphan", order_by="ClinicalSignalModel.created_at.desc()")
    clinician_actions = relationship("ClinicianActionModel", back_populates="case", cascade="all, delete-orphan", order_by="ClinicianActionModel.created_at.desc()")
    facilities = relationship("FacilityCandidateModel", back_populates="case", cascade="all, delete-orphan")
    readiness = relationship("FacilityReadinessModel", back_populates="case", uselist=False, cascade="all, delete-orphan")
    events = relationship("TimelineEventModel", back_populates="case", cascade="all, delete-orphan", order_by="TimelineEventModel.created_at.asc()")
    participants = relationship("CaseParticipantModel", back_populates="case", cascade="all, delete-orphan")
    decision_signals = relationship("DecisionSupportSignalModel", back_populates="case", cascade="all, delete-orphan", order_by="DecisionSupportSignalModel.created_at.desc()")
    handovers = relationship("HandoverPackageModel", back_populates="case", cascade="all, delete-orphan", order_by="HandoverPackageModel.created_at.desc()")
    agent_tasks = relationship("AgentTaskModel", back_populates="case", cascade="all, delete-orphan", order_by="AgentTaskModel.created_at.desc()")


class PatientModel(Base):
    __tablename__ = "patients"

    id = Column(String(64), primary_key=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    name = Column(String(128), nullable=False)
    age = Column(Integer, nullable=False)
    sex = Column(String(16), nullable=False)
    incident_type = Column(String(255), nullable=False)
    chief_complaint = Column(Text, nullable=False)
    conscious_state = Column(String(32), default="Alert", nullable=False)
    gcs_score = Column(Integer, default=15, nullable=False)
    reported_blood_loss = Column(String(32), default="None", nullable=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    case = relationship("EmergencyCaseModel", back_populates="patient")


class AmbulanceModel(Base):
    __tablename__ = "ambulances"

    id = Column(String(64), primary_key=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    call_sign = Column(String(64), nullable=False)
    crew_lead = Column(String(128), nullable=False)
    current_speed_kmh = Column(Float, default=45.0, nullable=False)
    base_eta_minutes = Column(Integer, default=14, nullable=False)
    traffic_delay_minutes = Column(Integer, default=0, nullable=False)
    is_traffic_delayed = Column(Boolean, default=False, nullable=False)
    assigned_hospital = Column(String(255), nullable=False)
    lat = Column(Float, default=12.9716, nullable=False)
    lng = Column(Float, default=77.5946, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    case = relationship("EmergencyCaseModel", back_populates="ambulance")


class VitalSnapshotModel(Base):
    __tablename__ = "vital_snapshots"

    id = Column(String(64), primary_key=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(String(32), nullable=False)
    heart_rate = Column(Integer, nullable=False)
    spo2 = Column(Integer, nullable=False)
    systolic_bp = Column(Integer, nullable=False)
    diastolic_bp = Column(Integer, nullable=False)
    respiratory_rate = Column(Integer, default=18, nullable=False)
    temperature_c = Column(Float, default=37.0, nullable=False)
    is_abnormal = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, index=True)

    case = relationship("EmergencyCaseModel", back_populates="vitals")


class InterventionModel(Base):
    __tablename__ = "interventions"

    id = Column(String(64), primary_key=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    action_label = Column(String(255), nullable=False)
    detail_text = Column(Text, nullable=False)
    actor = Column(String(64), default="FIELD MEDIC", nullable=False)
    status = Column(String(32), default="SUCCESS", nullable=False)
    timestamp = Column(String(32), nullable=False)
    created_at = Column(DateTime, default=utc_now)

    case = relationship("EmergencyCaseModel", back_populates="interventions")


class ClinicalSignalModel(Base):
    __tablename__ = "clinical_signals"

    id = Column(String(64), primary_key=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_level = Column(String(32), nullable=False) # LOW, MODERATE, HIGH, CRITICAL
    risk_score = Column(Integer, nullable=False) # 0-100
    detected_signals_json = Column(Text, default="[]", nullable=False)
    clinical_significance = Column(Text, nullable=False)
    next_step_recommendation = Column(Text, nullable=False)
    is_reviewed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    case = relationship("EmergencyCaseModel", back_populates="clinical_signals")

    @property
    def detected_signals(self) -> list[str]:
        try:
            return json.loads(self.detected_signals_json)
        except Exception:
            return []

    @detected_signals.setter
    def detected_signals(self, signals: list[str]):
        self.detected_signals_json = json.dumps(signals)


# Phase 17 Structured Clinical Decision Support Signal
class DecisionSupportSignalModel(Base):
    __tablename__ = "decision_support_signals"

    id = Column(String(64), primary_key=True) # e.g. sig-pr-8492-xxx
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    signal_type = Column(String(64), nullable=False)
    title = Column(String(255), nullable=False)
    observed_data = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    relevant_event_ids_json = Column(Text, default="[]", nullable=False)
    provider = Column(String(64), default="DemoDecisionSupportProvider", nullable=False)
    provider_version = Column(String(32), default="1.0.0", nullable=False)
    safety_label = Column(String(128), default="SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS", nullable=False)
    requires_clinician_review = Column(Boolean, default=True, nullable=False)
    status = Column(String(32), default="NEW", nullable=False) # NEW, ACKNOWLEDGED, SUPERSEDED
    created_at = Column(DateTime, default=utc_now, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(String(128), nullable=True)

    case = relationship("EmergencyCaseModel", back_populates="decision_signals")

    @property
    def relevant_event_ids(self) -> list[str]:
        try:
            return json.loads(self.relevant_event_ids_json)
        except Exception:
            return []

    @relevant_event_ids.setter
    def relevant_event_ids(self, val: list[str]):
        self.relevant_event_ids_json = json.dumps(val)


# Phase 18 Prehospital Handover Package & Audit Snapshot Model
class HandoverPackageModel(Base):
    __tablename__ = "handover_packages"

    id = Column(String(64), primary_key=True) # e.g. hop-PR-8492-v1
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    case_version = Column(Integer, nullable=False, index=True)
    status = Column(String(32), default="GENERATED", nullable=False) # GENERATED, ACKNOWLEDGED
    package_json = Column(Text, nullable=False) # Canonical JSON of complete PrehospitalHandoverPackage
    integrity_hash = Column(String(64), nullable=False, index=True) # SHA-256 hex digest
    completeness_status = Column(String(32), default="COMPLETE", nullable=False) # COMPLETE, PARTIAL
    generated_by_id = Column(String(64), nullable=False)
    generated_by_name = Column(String(128), nullable=False)
    generated_by_role = Column(String(32), nullable=False)
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by_id = Column(String(64), nullable=True)
    acknowledged_by_name = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)

    case = relationship("EmergencyCaseModel", back_populates="handovers")

    @property
    def package_data(self) -> dict:
        try:
            return json.loads(self.package_json)
        except Exception:
            return {}

    @package_data.setter
    def package_data(self, val: dict):
        self.package_json = json.dumps(val, sort_keys=True)


# Phase 19 Agentic Clinical Coordination Engine Models
class AgentTaskModel(Base):
    __tablename__ = "agent_tasks"

    id = Column(String(64), primary_key=True) # e.g. agt-task-PR-8492-1
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    trigger_event_id = Column(String(64), nullable=True, index=True)
    status = Column(String(32), default="QUEUED", nullable=False, index=True) # QUEUED, RUNNING, WAITING_FOR_DATA, COMPLETED, FAILED, SAFETY_BLOCKED, REQUIRES_HUMAN_REVIEW
    provider = Column(String(64), nullable=False) # "real-llm", "demo", "real-fallback-demo"
    model = Column(String(64), nullable=False) # e.g. "gpt-4o-mini", "deterministic-v1"
    prompt_version = Column(String(32), default="PRANA_AGENT_SYSTEM_V1", nullable=False)
    started_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)
    iteration_count = Column(Integer, default=0, nullable=False)
    tool_call_count = Column(Integer, default=0, nullable=False)
    final_signal_id = Column(String(64), nullable=True)
    failure_reason = Column(Text, nullable=True)
    safety_status = Column(String(32), default="PASSED", nullable=False) # PASSED, VIOLATION_BLOCKED, SANITIZED
    reasoning_summary = Column(Text, nullable=True) # Concise evidence summary, NO hidden chain-of-thought tokens!
    missing_data_json = Column(Text, default="[]", nullable=False)
    recommended_data_request = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)

    case = relationship("EmergencyCaseModel", back_populates="agent_tasks")
    traces = relationship("AgentTraceItemModel", back_populates="task", cascade="all, delete-orphan", order_by="AgentTraceItemModel.step_index.asc()")

    @property
    def missing_data(self) -> list:
        try:
            return json.loads(self.missing_data_json)
        except Exception:
            return []

    @missing_data.setter
    def missing_data(self, val: list):
        self.missing_data_json = json.dumps(val)


class AgentTraceItemModel(Base):
    __tablename__ = "agent_traces"

    id = Column(String(64), primary_key=True) # e.g. trc-...
    task_id = Column(String(64), ForeignKey("agent_tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id = Column(String(64), nullable=False, index=True)
    step_index = Column(Integer, nullable=False)
    tool_name = Column(String(64), nullable=False)
    arguments_json = Column(Text, default="{}", nullable=False)
    result_summary = Column(Text, nullable=False)
    duration_ms = Column(Integer, default=0, nullable=False)
    success = Column(Boolean, default=True, nullable=False)
    source_event_ids_json = Column(Text, default="[]", nullable=False)
    timestamp = Column(DateTime, default=utc_now)

    task = relationship("AgentTaskModel", back_populates="traces")

    @property
    def arguments(self) -> dict:
        try:
            return json.loads(self.arguments_json)
        except Exception:
            return {}

    @arguments.setter
    def arguments(self, val: dict):
        self.arguments_json = json.dumps(val)

    @property
    def source_event_ids(self) -> list[str]:
        try:
            return json.loads(self.source_event_ids_json)
        except Exception:
            return []

    @source_event_ids.setter
    def source_event_ids(self, val: list[str]):
        self.source_event_ids_json = json.dumps(val)


class ClinicianActionModel(Base):
    __tablename__ = "clinician_actions"

    id = Column(String(64), primary_key=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(64), nullable=False) # CONFIRMED, DATA_REQUESTED, ESCALATED, ACKNOWLEDGED
    clinician_id = Column(String(64), default="DOC-482", nullable=False)
    clinician_name = Column(String(128), default="Dr. Sunita Rao, MD", nullable=False)
    timestamp = Column(String(32), nullable=False)
    notes = Column(Text, nullable=True)
    review_plan_title = Column(String(255), nullable=True)
    requested_data_type = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    case = relationship("EmergencyCaseModel", back_populates="clinician_actions")


class FacilityCandidateModel(Base):
    __tablename__ = "facilities"

    id = Column(String(64), primary_key=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    facility_id = Column(String(64), nullable=False)
    name = Column(String(255), nullable=False)
    trauma_level = Column(String(128), nullable=False)
    distance_km = Column(Float, nullable=False)
    eta_minutes = Column(Integer, nullable=False)
    match_score = Column(Integer, nullable=False)
    clinical_fit_score = Column(Integer, default=70, nullable=False)
    availability_score = Column(Integer, default=85, nullable=False)
    eta_score = Column(Integer, default=80, nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    specialty_fit = Column(String(255), nullable=False)
    availability = Column(String(255), nullable=False)
    rationale = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    case = relationship("EmergencyCaseModel", back_populates="facilities")


class FacilityReadinessModel(Base):
    __tablename__ = "facility_readiness"

    id = Column(String(64), primary_key=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    status = Column(String(64), default="PRE_ALERT_TRANSMITTED", nullable=False) # PRE_ALERT_TRANSMITTED, ACCEPTED, PREPARING, BAY_READY, ACKNOWLEDGED
    assigned_bay = Column(String(128), nullable=False)
    confirmed_by = Column(String(128), nullable=True)
    timestamp = Column(String(32), nullable=True)
    is_pre_alert_dispatched = Column(Boolean, default=True, nullable=False)
    is_pre_alert_acknowledged = Column(Boolean, default=False, nullable=False)
    acknowledged_at = Column(String(32), nullable=True)
    bed_number = Column(String(64), nullable=True)
    resources_ready_json = Column(Text, default="[]", nullable=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    case = relationship("EmergencyCaseModel", back_populates="readiness")

    @property
    def resources_ready(self) -> list[str]:
        try:
            return json.loads(self.resources_ready_json)
        except Exception:
            return []

    @resources_ready.setter
    def resources_ready(self, res: list[str]):
        self.resources_ready_json = json.dumps(res)


# The Core Append-Only Event Store (Immutable Mission Ledger)
class TimelineEventModel(Base):
    __tablename__ = "timeline_events"

    id = Column(String(64), primary_key=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(String(64), nullable=False, index=True)
    version = Column(Integer, default=1, nullable=False, index=True)
    timestamp = Column(String(32), nullable=False)
    category = Column(String(32), default="SYSTEM", nullable=False) # SYSTEM, CLINICAL
    title = Column(String(255), nullable=False)
    detail = Column(Text, nullable=False)
    actor = Column(String(64), default="SYSTEM", nullable=False) # SYSTEM, FIELD MEDIC, AI SUPPORT, CLINICIAN, RECEIVING ED
    status = Column(String(32), default="INFO", nullable=False) # INFO, WARNING, CRITICAL, SUCCESS
    payload_json = Column(Text, default="{}", nullable=False)
    created_at = Column(DateTime, default=utc_now, index=True)

    case = relationship("EmergencyCaseModel", back_populates="events")

    @property
    def payload(self) -> dict:
        try:
            return json.loads(self.payload_json)
        except Exception:
            return {}

    @payload.setter
    def payload(self, data: dict):
        self.payload_json = json.dumps(data)


# Phase 16 Authentication, RBAC & Case Authorization Models
class UserModel(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True) # e.g. usr-medic-102
    username = Column(String(128), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(128), nullable=False)
    role = Column(String(32), nullable=False, index=True) # FIELD_MEDIC, REMOTE_CLINICIAN, HOSPITAL_COMMAND, READINESS, PORTAL_ADMIN
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    case_assignments = relationship("CaseParticipantModel", back_populates="user", cascade="all, delete-orphan")


class CaseParticipantModel(Base):
    __tablename__ = "case_participants"

    id = Column(String(64), primary_key=True)
    case_id = Column(String(64), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(32), nullable=False)
    assigned_at = Column(DateTime, default=utc_now)
    active = Column(Boolean, default=True, nullable=False)

    case = relationship("EmergencyCaseModel", back_populates="participants")
    user = relationship("UserModel", back_populates="case_assignments")


class SecurityEventModel(Base):
    __tablename__ = "security_events"

    id = Column(String(64), primary_key=True)
    event_type = Column(String(64), nullable=False, index=True) # USER_LOGIN_SUCCESS, USER_LOGIN_FAILED, CASE_ACCESS_DENIED, UNAUTHORIZED_ACTION_BLOCKED
    user_id = Column(String(64), nullable=True, index=True)
    case_id = Column(String(64), nullable=True, index=True)
    detail = Column(Text, nullable=False)
    timestamp = Column(String(32), nullable=False)
    created_at = Column(DateTime, default=utc_now, index=True)


# Phase 23 Case Intake & Draft Persistence Model
class CaseDraftModel(Base):
    __tablename__ = "case_drafts"

    id = Column(String(64), primary_key=True)  # e.g. dft-20260926-xxxx
    importer_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    importer_name = Column(String(128), nullable=False)
    source_type = Column(String(32), nullable=False)  # VOICE, TEXT, FILE_JSON, FILE_FHIR, FILE_CSV, FILE_TEXT
    source_hash = Column(String(64), nullable=False, index=True)  # SHA-256
    raw_content = Column(Text, nullable=False)  # Raw transcript or imported payload
    draft_status = Column(String(32), default="DRAFT", nullable=False)  # DRAFT, CONFIRMED, DISCARDED
    draft_data_json = Column(Text, default="{}", nullable=False)
    confirmed_case_id = Column(String(64), nullable=True, index=True)
    created_at = Column(DateTime, default=utc_now, index=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    importer = relationship("UserModel")

    @property
    def candidate_data(self) -> dict:
        try:
            return json.loads(self.draft_data_json)
        except Exception:
            return {}

    @candidate_data.setter
    def candidate_data(self, data: dict):
        self.draft_data_json = json.dumps(data)

