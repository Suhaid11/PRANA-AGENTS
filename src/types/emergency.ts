// PRANA Core Domain Types — Frozen Specification

export type EmergencyDomain = 'TRAUMA' | 'SNAKEBITE' | 'POISONING';

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
  sex: 'Male' | 'Female' | 'Other';
  incidentType: string;
  chiefComplaint: string;
  consciousState: 'Alert' | 'Voice' | 'Pain' | 'Unresponsive';
  gcsScore: number;
  reportedBloodLoss: 'None' | 'Minimal' | 'Moderate' | 'Significant';
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
  timestamp: string;
  category: TimelineEventCategory;
  title: string;
  detail: string;
  actor: 'SYSTEM' | 'FIELD MEDIC' | 'AI SUPPORT' | 'CLINICIAN' | 'RECEIVING ED';
  status: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
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
}

