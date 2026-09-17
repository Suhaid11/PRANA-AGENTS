import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { 
  EmergencyCase, 
  UserRole, 
  TimelineEvent, 
  MedicalReadinessItem, 
  VitalSnapshot, 
  PatientProfile, 
  HospitalCandidate 
} from '../types/emergency';
import { initialMedicalReadiness } from '../data/seedData';
import {
  calculateDerivedEta,
  startScenarioCase,
  registerPatientState,
  triggerVitalDeteriorationState,
  computeAiSignalState,
  alertClinicianState,
  confirmClinicianProtocolState,
  recalculateFacilityMatchState,
  dispatchHospitalPreAlertState,
  acknowledgeHospitalPreAlertState,
  confirmHospitalBayReadyState,
  setTrafficDelayState,
  continueCareInTransitState,
  appendTimelineEvent,
  evaluateSimulationDecisionEngine,
} from './emergencyEngine';

interface EmergencyContextType {
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

const EmergencyContext = createContext<EmergencyContextType | null>(null);

export const EmergencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCase, setActiveCase] = useState<EmergencyCase>(() => startScenarioCase('PR-8492'));
  const [activeRole, setActiveRole] = useState<UserRole>('FIELD_MEDIC');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [medicalReadiness] = useState<MedicalReadinessItem[]>(initialMedicalReadiness);

  // Single derived ETA source of truth (read by Ambulance, Clinician, Hospital workspaces, and Shell)
  const derivedEta = useMemo(() => {
    return calculateDerivedEta(activeCase.ambulance);
  }, [activeCase.ambulance.baseEtaMinutes, activeCase.ambulance.trafficDelayMinutes]);

  // Deterministic reset without page reload
  const resetMission = useCallback(() => {
    const fresh = startScenarioCase(activeCase.id);
    setActiveCase(fresh);
    setIsStreaming(true);
    setActiveRole('FIELD_MEDIC');
  }, [activeCase.id]);

  // Scenario Switcher
  const selectScenario = useCallback((scenarioId: string) => {
    const fresh = startScenarioCase(scenarioId);
    setActiveCase(fresh);
    setIsStreaming(true);
  }, []);

  const addTimelineEvent = useCallback((eventData: Omit<TimelineEvent, 'id' | 'timestamp'>) => {
    setActiveCase((prev) => ({
      ...prev,
      timeline: appendTimelineEvent(prev.timeline, eventData),
    }));
  }, []);

  const registerPatient = useCallback((patient: PatientProfile) => {
    setActiveCase((prev) => registerPatientState(prev, patient));
  }, []);

  const triggerVitalDeterioration = useCallback((newVitals: Omit<VitalSnapshot, 'timestamp'>) => {
    setActiveCase((prev) => triggerVitalDeteriorationState(prev, newVitals));
  }, []);

  const computeAiSignal = useCallback(() => {
    setActiveCase((prev) => computeAiSignalState(prev));
  }, []);

  const alertClinician = useCallback(() => {
    setActiveCase((prev) => alertClinicianState(prev));
  }, []);

  // Remote Clinician Protocol Endorsement Handshake
  const endorseProtocol = useCallback((
    action: 'CONFIRMED' | 'DATA_REQUESTED' | 'ESCALATED' | 'ACKNOWLEDGED',
    notes?: string,
    clinicianId?: string,
    clinicianName?: string,
    authorizedProtocol?: string
  ) => {
    const docName = clinicianName || activeCase.clinicianEndorsement?.clinicianName || 'Dr. Sunita Rao, MD';
    const docId = clinicianId || activeCase.clinicianEndorsement?.clinicianId || 'DOC-482';
    setActiveCase((prev) => confirmClinicianProtocolState(prev, docId, docName, action, notes, authorizedProtocol));
  }, [activeCase.clinicianEndorsement]);

  const recalculateFacilityMatching = useCallback((candidatesOverride?: HospitalCandidate[]) => {
    setActiveCase((prev) => recalculateFacilityMatchState(prev, candidatesOverride));
  }, []);

  const dispatchHospitalPreAlert = useCallback(() => {
    setActiveCase((prev) => dispatchHospitalPreAlertState(prev));
  }, []);

  const acknowledgeHospitalPreAlert = useCallback((acknowledgedBy?: string) => {
    setActiveCase((prev) => acknowledgeHospitalPreAlertState(prev, acknowledgedBy));
  }, []);

  // Receiving Hospital Bay Allocation & Ready Handshake
  const confirmHospitalBay = useCallback((bayName?: string, confirmedBy?: string) => {
    setActiveCase((prev) => confirmHospitalBayReadyState(prev, bayName, confirmedBy));
  }, []);

  const setTrafficDelay = useCallback((additionalMinutes?: number) => {
    setActiveCase((prev) => setTrafficDelayState(prev, additionalMinutes || 8));
  }, []);

  const continueCare = useCallback((detail?: string) => {
    setActiveCase((prev) => continueCareInTransitState(prev, detail));
  }, []);

  const recordVitalSnapshot = useCallback((snapshotData: Omit<VitalSnapshot, 'timestamp'>) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newSnapshot: VitalSnapshot = {
      ...snapshotData,
      timestamp: timeStr,
    };
    setActiveCase((prev) => {
      const updatedHistory = [...prev.vitalsHistory.slice(-9), newSnapshot];
      // Keep simulation decision support synced
      const aiDecision = evaluateSimulationDecisionEngine(prev.domain, newSnapshot);
      return {
        ...prev,
        currentVitals: newSnapshot,
        vitalsHistory: updatedHistory,
        aiDecisionSupport: aiDecision,
      };
    });
  }, []);

  // Domain-specific live sensor telemetry drift ticker (every 3.5 seconds)
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setActiveCase((prev) => {
        let hrDrift = 0;
        let spo2Drift = 0;
        let minHr = 100;
        let maxHr = 125;
        let minSpo2 = 89;
        let maxSpo2 = 95;

        if (prev.domain === 'POISONING') {
          minHr = 40;
          maxHr = 58;
          minSpo2 = 84;
          maxSpo2 = 92;
          hrDrift = (Math.random() > 0.5 ? 1 : -1);
          spo2Drift = (Math.random() > 0.8 ? -1 : 0);
        } else if (prev.domain === 'SNAKEBITE') {
          minHr = 96;
          maxHr = 118;
          minSpo2 = 94;
          maxSpo2 = 98;
          hrDrift = (Math.random() > 0.5 ? 1 : -1);
        } else {
          hrDrift = (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2);
          spo2Drift = (Math.random() > 0.7 ? -1 : 0);
        }

        const nextHr = Math.min(maxHr, Math.max(minHr, prev.currentVitals.heartRate + hrDrift));
        const nextSpo2 = Math.min(maxSpo2, Math.max(minSpo2, prev.currentVitals.spo2 + spo2Drift));
        
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];

        const updatedSnapshot: VitalSnapshot = {
          timestamp: timeStr,
          heartRate: nextHr,
          spo2: nextSpo2,
          systolicBp: prev.currentVitals.systolicBp,
          diastolicBp: prev.currentVitals.diastolicBp,
          respiratoryRate: prev.currentVitals.respiratoryRate,
          temperatureC: prev.currentVitals.temperatureC,
          isAbnormal: nextSpo2 < 92 || nextHr > 115 || nextHr < 55,
        };

        const aiDecision = evaluateSimulationDecisionEngine(prev.domain, updatedSnapshot);

        return {
          ...prev,
          currentVitals: updatedSnapshot,
          vitalsHistory: [...prev.vitalsHistory.slice(-9), updatedSnapshot],
          aiDecisionSupport: aiDecision,
        };
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <EmergencyContext.Provider
      value={{
        activeCase,
        activeRole,
        setActiveRole,
        isStreaming,
        toggleStreaming: () => setIsStreaming((prev) => !prev),
        derivedEta,
        medicalReadiness,
        addTimelineEvent,
        recordVitalSnapshot,
        registerPatient,
        triggerVitalDeterioration,
        computeAiSignal,
        alertClinician,
        endorseProtocol,
        recalculateFacilityMatching,
        dispatchHospitalPreAlert,
        acknowledgeHospitalPreAlert,
        confirmHospitalBay,
        setTrafficDelay,
        continueCare,
        selectScenario,
        resetMission,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};
