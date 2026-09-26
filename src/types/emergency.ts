export type EmergencyDomain = 
  | 'TRAUMA' 
  | 'SNAKEBITE' 
  | 'POISONING' 
  | 'RESPIRATORY_DISTRESS' 
  | 'CARDIAC' 
  | 'GENERAL_EMERGENCY' 
  | string;

export type EmergencyStatus = 
  | 'REPORTED' 
  | 'DISPATCHED' 
  | 'ONBOARD' 
  | 'IN_TRANSIT' 
  | 'ARRIVED' 
  | 'HANDED_OVER';

export type UserRole = 'PORTAL' | 'FIELD_MEDIC' | 'REMOTE_CLINICIAN' | 'HOSPITAL_COMMAND' | 'READINESS';

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  approximateAge?: number;
  sex: 'Male' | 'Female' | 'Other';
  incidentType: string;
  chiefComplaint: string;
  consciousState: 'Alert' | 'Voice' | 'Pain' | 'Unresponsive';
  gcsScore: number;
  reportedBloodLoss: 'None' | 'Minimal' | 'Moderate' | 'Significant';
  location?: string;
  knownAllergies?: string[];
  currentMedications?: string[];
}

export interface AmbulanceUnit {
  callSign: string;
  crewLead: string;
  currentSpeedKmH: number;
  baseEtaMinutes: number;
  trafficDelayMinutes: number;
  isTrafficDelayed: boolean;
  effectiveEtaMinutes?: number;
  assignedHospital: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface VitalSnapshot {
  timestamp: string;
  heartRate: number;
  spo2: number;
  systolicBp: number;
  diastolicBp: number;
  respiratoryRate: number;
  temperatureC: number;
  isAbnormal?: boolean;
}

export type TimelineEventCategory = 'SYSTEM' | 'CLINICAL';

export interface TimelineEvent {
  id: string;
  version?: number;
  timestamp: string;
  category: TimelineEventCategory;
  title: string;
  detail: string;
  actor: 'SYSTEM' | 'FIELD MEDIC' | 'AI SUPPORT' | 'CLINICIAN' | 'RECEIVING ED';
  status: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  payload?: Record<string, any>;
}

export interface MedicalReadinessItem {
  id: string;
  resourceName: string;
  category: string;
  status: 'READY' | 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';
  operationalDetail: string;
}

export interface ClinicianEndorsement {
  status: 'PENDING' | 'CONFIRMED' | 'DATA_REQUESTED' | 'ESCALATED' | 'ACKNOWLEDGED';
  clinicianName: string;
  clinicianId?: string;
  timestamp?: string;
  notes?: string;
  authorizedProtocol?: string;
}

export interface HospitalReadiness {
  status: 'PRE_ALERT_TRANSMITTED' | 'ACCEPTED' | 'PREPARING' | 'BAY_READY' | 'ACKNOWLEDGED';
  assignedBay: string;
  confirmedBy?: string;
  timestamp?: string;
  isPreAlertDispatched?: boolean;
  isPreAlertAcknowledged?: boolean;
  acknowledgedAt?: string;
  bedNumber?: string;
  resourcesReady: string[];
}

export interface HospitalCandidate {
  id: string;
  name: string;
  traumaLevel: string;
  distanceKm: number;
  etaMinutes: number;
  matchScore: number; // 0-100 normalized
  clinicalFitScore?: number; // 0-100
  availabilityScore?: number; // 0-100
  etaScore?: number; // 0-100
  isPrimary: boolean;
  specialtyFit: string;
  availability: string;
  rationale: string;
}

export interface AiDecisionSupport {
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  detectedSignals: string[];
  clinicalSignificance: string;
  nextStepRecommendation: string;
  isReviewed: boolean;
  // Phase 17 Structured Decision Support Signal fields
  signalId?: string;
  provider?: string;
  providerVersion?: string;
  signalType?: string;
  title?: string;
  observedData?: string;
  explanation?: string;
  relevantTimelineEventIds?: string[];
  requiresClinicianReview?: boolean;
  status?: 'NEW' | 'ACKNOWLEDGED' | 'SUPERSEDED';
  safetyLabel?: string;
  providerAvailable?: boolean;
  statusMessage?: string;
}


export type CdsHandoffStatus = 'NOT_SENT' | 'SENT' | 'RECEIVED';

export interface CdsDataPackage {
  caseId: string;
  patient: PatientProfile;
  vitals: VitalSnapshot;
  recentInterventions: string[];
  observations: string[];
  etaMinutes: number;
  trafficDelayMinutes: number;
  sentAt: string;
  source: string;
}

export interface EmergencyCase {
  id: string;
  domain: EmergencyDomain;
  status: EmergencyStatus;
  scenarioTitle: string;
  patient: PatientProfile;
  ambulance: AmbulanceUnit;
  currentVitals: VitalSnapshot;
  vitalsHistory: VitalSnapshot[];
  timeline: TimelineEvent[];
  conduitStep: number; // 0: Incident, 1: Assessed, 2: Ambulance, 3: Clinician, 4: Facility, 5: Hospital Ready, 6: Arrival
  aiDecisionSupport?: AiDecisionSupport;
  clinicianAlertReceived?: boolean;
  clinicianEndorsement?: ClinicianEndorsement;
  hospitalReadiness?: HospitalReadiness;
  facilityMatching?: {
    recommendedHospitalId: string;
    algorithmRationale: string;
    candidates: HospitalCandidate[];
  };
  cdsDataStatus?: CdsHandoffStatus;
  cdsDataPackage?: CdsDataPackage;
  cdsDataSentAt?: string;
  // Phase 18 Prehospital Handover Package
  handoverPackage?: PrehospitalHandoverPackage;
  handoverStatus?: 'DRAFT' | 'READY' | 'GENERATED' | 'ACKNOWLEDGED';
  // Phase 19 Agentic Clinical Coordination
  agentTask?: AgentTask;
  // Phase 23.2 Clinician-to-Field Data Request Loop
  pendingDataRequest?: ClinicalDataRequest;
}

export interface ClinicalDataRequest {
  id: string;
  field: string;
  reason?: string;
  priority: 'CRITICAL' | 'HIGH' | 'MODERATE';
  requestedBy: string;
  requestedRole: string;
  targetRole: string;
  timestamp: string;
  status: 'PENDING' | 'FULFILLED' | 'DISMISSED';
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
}

// ==============================================================================
// Phase 18: Prehospital Handover Package & Audit Snapshot Interfaces
// ==============================================================================

export interface HandoverVitalItem {
  id?: string;
  timestamp: string;
  heartRate: number;
  spo2: number;
  systolicBp: number;
  diastolicBp: number;
  respiratoryRate: number;
  temperatureC: number;
  isAbnormal?: boolean;
  sourceEventId?: string;
}

export interface HandoverObservation {
  id?: string;
  timestamp: string;
  text: string;
  actor: string;
  sourceEventId?: string;
}

export interface HandoverIntervention {
  id: string;
  timestamp: string;
  actionLabel: string;
  detailText: string;
  actor: string;
  status: string;
  sourceEventId?: string;
}

export interface HandoverDecisionSupportItem {
  signalId: string;
  signalType: string;
  title: string;
  observedData: string;
  explanation: string;
  provider: string;
  providerVersion: string;
  safetyLabel: string;
  requiresClinicianReview: boolean;
  status: string;
  sourceEventIds: string[];
}

export interface HandoverClinicianReviewItem {
  id: string;
  action: string;
  clinicianId: string;
  clinicianName: string;
  timestamp: string;
  notes?: string;
  reviewPlanTitle?: string;
  requestedDataType?: string;
  sourceEventId?: string;
}

export interface HandoverProvenance {
  sourceCaseVersion: number;
  sourceEventCount: number;
  generatedTimestamp: string;
  contentDigestSha256: string;
  generatorEngine: string;
}

export interface HandoverCompleteness {
  isComplete: boolean;
  completenessPercentage: number;
  missingFields: string[];
  itemsFound: string[];
}

export interface PrehospitalHandoverPackage {
  packageId: string;
  caseId: string;
  caseVersion: number;
  generatedAt: string;
  generatedBy: {
    id: string;
    name: string;
    role: string;
  };
  status: 'DRAFT' | 'READY' | 'GENERATED' | 'ACKNOWLEDGED';
  patient: {
    id: string;
    name: string;
    age: number;
    sex: string;
    incidentType: string;
    chiefComplaint: string;
    consciousState: string;
    gcsScore: number;
    reportedBloodLoss: string;
  };
  incident: {
    domain: EmergencyDomain;
    scenarioTitle: string;
    status: EmergencyStatus;
    conduitStep: number;
  };
  transport: {
    callSign: string;
    crewLead: string;
    currentSpeedKmH: number;
    baseEtaMinutes: number;
    trafficDelayMinutes: number;
    effectiveEtaMinutes: number;
    isTrafficDelayed: boolean;
    assignedHospital: string;
    coordinates: { lat: number; lng: number };
  };
  latestVitals: HandoverVitalItem;
  vitalTimeline: HandoverVitalItem[];
  observations: HandoverObservation[];
  interventions: HandoverIntervention[];
  decisionSupport: HandoverDecisionSupportItem[];
  clinicianReviews: HandoverClinicianReviewItem[];
  destination: {
    facilityId: string;
    name: string;
    traumaLevel: string;
    distanceKm: number;
    etaMinutes: number;
    matchScore: number;
    specialtyFit: string;
  };
  readiness: {
    status: string;
    assignedBay: string;
    confirmedBy?: string;
    timestamp?: string;
    bedNumber?: string;
    resourcesReady: string[];
    isBayReady: boolean;
    sourceEventId?: string;
  };
  eventTimeline: {
    id: string;
    version: number;
    timestamp: string;
    category: string;
    title: string;
    detail: string;
    actor: string;
    status: string;
  }[];
  provenance: HandoverProvenance;
  completeness: HandoverCompleteness;
  safetyNotice: string;
  acknowledgedAt?: string;
  acknowledgedBy?: {
    id: string;
    name: string;
    role: string;
    notes?: string;
  };
  integrityHash: string;
}

// ==============================================================================
// Phase 19: Agentic Clinical Coordination Engine Interfaces
// ==============================================================================

export interface MissingDataItem {
  field: string;
  reason: string;
  clinicalImportance: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
}

export interface AgentTraceItem {
  id: string;
  taskId: string;
  caseId?: string;
  stepIndex: number;
  toolName: string;
  arguments?: Record<string, unknown>;
  argumentsJson?: string;
  resultSummary: string;
  durationMs: number;
  success: boolean;
  sourceEventIds: string[];
  timestamp: string;
}

export interface AgentTask {
  taskId: string;
  caseId: string;
  triggerEventId?: string;
  status: 'QUEUED' | 'RUNNING' | 'WAITING_FOR_DATA' | 'COMPLETED' | 'FAILED' | 'SAFETY_BLOCKED' | 'REQUIRES_HUMAN_REVIEW';
  provider: string;
  model: string;
  promptVersion: string;
  startedAt: string;
  completedAt?: string;
  iterationCount: number;
  toolCallCount: number;
  finalSignalId?: string;
  failureReason?: string;
  safetyStatus: string;
  reasoningSummary?: string;
  missingData: MissingDataItem[];
  recommendedDataRequest?: string;
  traces: AgentTraceItem[];
  layaGate?: {
    relevance: 'no_analysis' | 'routine_analysis' | 'deep_analysis';
    toolBundle: string;
    reviewPriority: string;
    dataSufficiency: string;
    confidence: number;
    reason: string;
    latencyMs?: number;
  };
}

// Phase 23 Case Intake & Candidate Draft Types
export interface DraftFieldProvenance {
  source: 'MANUAL' | 'VOICE' | 'TEXT' | 'JSON' | 'FHIR' | 'CSV' | 'PDF';
  sourceId: string;
  sourceTimestamp?: string;
  extractionMethod: 'MANUAL' | 'PARSED' | 'TRANSCRIBED' | 'LLM_EXTRACTED' | 'MANUAL_OVERRIDE';
  confidence: number;
  status: 'UNCONFIRMED' | 'CONFIRMED' | 'REJECTED' | 'UNKNOWN';
  originalValue?: string | number | boolean | null;
  isApproximate: boolean;
  isAmbiguous: boolean;
  ambiguousOptions: string[];
}

export interface DraftCandidateField<T = string | number | boolean | string[]> {
  fieldName: string;
  value: T | null;
  unit?: string;
  provenance: DraftFieldProvenance;
}

export interface CaseDraftData {
  patientName?: DraftCandidateField<string>;
  approximateAge?: DraftCandidateField<number>;
  sex?: DraftCandidateField<string>;
  incidentType?: DraftCandidateField<string>;
  incidentTime?: DraftCandidateField<string>;
  incidentLocation?: DraftCandidateField<string>;
  chiefComplaint?: DraftCandidateField<string>;
  mechanismOfInjury?: DraftCandidateField<string>;
  consciousState?: DraftCandidateField<string>;
  gcsScore?: DraftCandidateField<number>;
  reportedBloodLoss?: DraftCandidateField<string>;
  vitals: Record<string, DraftCandidateField<number>>;
  observations: DraftCandidateField<string>[];
  interventions: DraftCandidateField<string>[];
  allergies?: DraftCandidateField<string>[];
  medications?: DraftCandidateField<string>[];
  medicalHistory?: DraftCandidateField<string>[];
  etaMinutes?: DraftCandidateField<number>;
  destinationPreference?: DraftCandidateField<string>;
  domainHint?: string;
}

export interface CaseDraft {
  draftId: string;
  sourceType: string;
  sourceHash: string;
  rawContent: string;
  createdAt: string;
  importerId: string;
  importerName: string;
  status: 'DRAFT' | 'CONFIRMED' | 'DISCARDED';
  candidateData: CaseDraftData;
  needsReviewCount: number;
  confirmedCaseId?: string;
}


