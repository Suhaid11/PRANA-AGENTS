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
  resetMission: () => void;
}

export const EmergencyContext = createContext<EmergencyContextType | null>(null);
