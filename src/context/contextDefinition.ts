import { createContext } from 'react';
import type { 
  EmergencyCase, 
  UserRole, 
  TimelineEvent, 
  MedicalReadinessItem, 
  VitalSnapshot, 
  PatientProfile, 
  HospitalCandidate 
} from '../types/emergency';

export type AppMode = 'PRODUCT' | 'DEMO';

export interface EmergencyContextType {
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  toggleAppMode: () => void;
  activeCase: EmergencyCase;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  isStreaming: boolean;
  toggleStreaming: () => void;
  derivedEta: number; // Non-negotiable single source of truth for ETA
  medicalReadiness: MedicalReadinessItem[];
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
  recordVitalSnapshot: (snapshot: Omit<VitalSnapshot, 'timestamp'>) => void;
  registerPatient: (patient: PatientProfile) => void;
  triggerVitalDeterioration: (newVitals: Omit<VitalSnapshot, 'timestamp'>) => void;
  sendCaseDataToCDS: () => void;
  computeAiSignal: () => void;
  alertClinician: () => void;
  endorseProtocol: (
    action: 'CONFIRMED' | 'DATA_REQUESTED' | 'ESCALATED' | 'ACKNOWLEDGED',
    notes?: string,
    clinicianId?: string,
    clinicianName?: string,
    authorizedProtocol?: string
  ) => void;
  recalculateFacilityMatching: (candidatesOverride?: HospitalCandidate[]) => void;
  dispatchHospitalPreAlert: () => void;
  acknowledgeHospitalPreAlert: (acknowledgedBy?: string) => void;
  confirmHospitalBay: (bayName?: string, confirmedBy?: string) => void;
  setTrafficDelay: (additionalMinutes?: number) => void;
  continueCare: (detail?: string) => void;
  selectScenario: (scenarioId: string) => void;
  loadCaseData: (caseData: EmergencyCase) => void;
  resetMission: () => void;
  // Phase 23.2 Clinician-to-Field Data Request Handshake
  requestFieldData: (field: string, reason?: string, priority?: 'CRITICAL' | 'HIGH' | 'MODERATE') => void;
  submitFieldResponse: (requestId: string, responseText: string) => void;
  dismissFieldDataRequest: (requestId: string) => void;
  isBackendConnected: boolean;
  backendStatus: 'CONNECTED' | 'OFFLINE_FALLBACK' | 'CONNECTING';
  realtimeStatus: 'LIVE' | 'RECONNECTING' | 'OFFLINE';
  // Phase 18 Prehospital Handover Package
  handoverPackage: import('../types/emergency').PrehospitalHandoverPackage | null;
  isHandoverModalOpen: boolean;
  setIsHandoverModalOpen: (open: boolean) => void;
  generateHandoverSnapshot: () => Promise<void>;
  acknowledgeHandoverPackage: (notes?: string) => Promise<void>;
  // Phase 24 Authoritative Lifecycle Handshake: Arrival -> Handover -> Completion
  markPatientArrived: (facility?: string, notes?: string) => void;
  initiateHandover: (notes?: string) => void;
  acceptHandover: (notes?: string) => void;
  acknowledgeHospitalEscalation: (notes?: string) => void;
}

export const EmergencyContext = createContext<EmergencyContextType | null>(null);
