import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { 
  EmergencyCase, 
  UserRole, 
  TimelineEvent, 
  MedicalReadinessItem, 
  VitalSnapshot, 
  PatientProfile, 
  HospitalCandidate,
  PrehospitalHandoverPackage
} from '../types/emergency';
import { initialMedicalReadiness } from '../data/seedData';
import { EmergencyContext, type AppMode } from './contextDefinition';
import {
  calculateDerivedEta,
  startScenarioCase,
  registerPatientState,
  triggerVitalDeteriorationState,
  sendCaseDataToCdsState,
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
  generateLocalHandoverPackage,
  markPatientArrivedState,
  initiateHandoverState,
  acceptHandoverState,
  acknowledgeHospitalEscalationState,
} from './emergencyEngine';
import {
  checkBackendHealth,
  fetchCase,
  submitVitalSnapshot,
  submitClinicianReview,
  submitDataRequest,
  submitEscalation,
  submitAcknowledgement,
  submitHospitalBayReady,
  submitRecalculateFacilities,
  submitHospitalPreAlert,
  submitHospitalAcknowledge,
  submitTrafficDelay,
  resetBackendCase,
  generateHandover,
  getLatestHandover,
  acknowledgeHandover,
  fetchLatestAgentTask,
  submitPatientArrival,
  submitHospitalEscalationAcknowledge,
  submitHandoverInitiate,
  submitHandoverAccept,
} from '../services/api';
import { 
  CaseRealtimeSubscription, 
  type RealtimeEventEnvelope, 
  type RealtimeStatus 
} from '../services/realtime';

function getEventTitleFromEnvelope(envelope: RealtimeEventEnvelope): string {
  switch (envelope.eventType) {
    case 'VITAL_RECORDED':
      return envelope.payload?.currentVitals?.isAbnormal
        ? 'Physiological Deterioration Event Detected'
        : 'Vital Snapshot Recorded';
    case 'INTERVENTION_RECORDED':
      return `Intervention Recorded: ${envelope.payload?.intervention?.actionLabel || 'Clinical Procedure'}`;
    case 'CLINICIAN_PLAN_CONFIRMED':
      return envelope.payload?.reviewPlanTitle || 'Protocol Endorsed by Specialist';
    case 'CLINICIAN_DATA_REQUESTED':
      return `Clinical Observation Requested: ${envelope.payload?.requestedDataType || 'Data'}`;
    case 'CLINICIAN_ESCALATED':
      return 'Case Escalated for Urgent Senior Review';
    case 'CLINICIAN_SIGNAL_ACKNOWLEDGED':
      return 'Hemodynamic Signal Acknowledged by Clinician';
    case 'TRAFFIC_UPDATED':
      return `Traffic Corridor Delay: +${envelope.payload?.trafficDelayMinutes} min`;
    case 'FACILITY_RECOMMENDED':
      return `Facility Match Recalculated: ${envelope.payload?.assignedHospital || 'Receiving Hospital'}`;
    case 'HOSPITAL_PREALERT_SENT':
      return 'Hospital Pre-Alert Dispatched';
    case 'HOSPITAL_ACKNOWLEDGED':
      return 'Hospital Pre-Alert Formally Acknowledged';
    case 'HOSPITAL_BAY_READY':
      return `Hospital Readiness Confirmed: ${envelope.payload?.assignedBay || 'Resuscitation Bay'}`;
    case 'AI_SIGNAL_GENERATED':
      return `Decision Support Signal: ${envelope.payload?.signal?.title || 'Observable Change Detected'}`;
    case 'HANDOVER_GENERATED':
      return 'Prehospital Handover Package Generated';
    case 'HANDOVER_ACKNOWLEDGED':
      return 'Prehospital Handover Received & Acknowledged';
    case 'PATIENT_ARRIVED':
      return 'Ambulance Arrived at Receiving Facility';
    case 'PATIENT_HANDOVER_INITIATED':
      return 'Prehospital Handover Initiated';
    case 'PATIENT_HANDOVER_ACKNOWLEDGED':
      return 'Prehospital Transfer of Care Accepted';
    case 'TRANSFER_COMPLETED':
      return 'Transfer of Care Completed';
    case 'HOSPITAL_ESCALATION_ACKNOWLEDGED':
      return 'Hospital Escalation Acknowledged';
    case 'AGENT_TASK_STARTED':
      return 'PRANA Intelligence: Clinical Reasoning Initialized';
    case 'AGENT_TOOL_CALLED':
      return `Clinical Tool Invoked: ${envelope.payload?.toolName || 'Evidence Inspection'}`;
    case 'AGENT_HUMAN_REVIEW_REQUIRED':
      return 'Clinical Decision Support: Review Required';
    default:
      return envelope.eventType.replace(/_/g, ' ');
  }
}

function getEventDetailFromEnvelope(envelope: RealtimeEventEnvelope): string {
  if (envelope.eventType === 'PATIENT_ARRIVED') {
    return `Transport unit arrived at ${envelope.payload?.facility || 'receiving facility'}. Staged for clinical handover.`;
  }
  if (envelope.eventType === 'PATIENT_HANDOVER_INITIATED') {
    return `Field paramedic initiated formal clinical handover to receiving emergency team.`;
  }
  if (envelope.eventType === 'PATIENT_HANDOVER_ACKNOWLEDGED') {
    return `Receiving emergency team acknowledged and accepted patient care handover.`;
  }
  if (envelope.eventType === 'TRANSFER_COMPLETED') {
    return `Transfer of care completed at ${envelope.payload?.facility || 'receiving facility'}. Prehospital transport mission concluded.`;
  }
  if (envelope.eventType === 'HOSPITAL_ESCALATION_ACKNOWLEDGED') {
    return `Receiving Emergency Department (${envelope.payload?.acknowledgedBy || 'ED Charge'}) acknowledged urgent clinician escalation.`;
  }
  if (envelope.eventType === 'HANDOVER_GENERATED') {
    return `Handover package ${envelope.payload?.packageId || ''} created with SHA-256 digest ${envelope.payload?.integrityHash?.slice(0, 12) || ''}...`;
  }
  if (envelope.eventType === 'HANDOVER_ACKNOWLEDGED') {
    return `Receiving Emergency Department (${envelope.payload?.acknowledgedBy || 'Charge Nurse'}) acknowledged prehospital handover.`;
  }
  if (envelope.eventType === 'AI_SIGNAL_GENERATED' && envelope.payload?.signal) {
    const s = envelope.payload.signal;
    return `${s.observedData || ''} ${s.explanation || ''}`.trim();
  }
  if (envelope.eventType === 'VITAL_RECORDED' && envelope.payload?.currentVitals) {
    const v = envelope.payload.currentVitals;
    return `Telemetry: HR ${v.heartRate} bpm, SpO2 ${v.spo2}%, NIBP ${v.systolicBp}/${v.diastolicBp} mmHg.`;
  }
  if (envelope.eventType === 'TRAFFIC_UPDATED') {
    return `Inbound transit delay: +${envelope.payload?.trafficDelayMinutes} min. Synchronized Arrival ETA: ${envelope.payload?.derivedEta} min.`;
  }
  if (envelope.eventType === 'CLINICIAN_PLAN_CONFIRMED') {
    return `Plan confirmed by ${envelope.payload?.clinicianName} (${envelope.payload?.clinicianId}).`;
  }
  if (envelope.eventType === 'HOSPITAL_BAY_READY') {
    return `Sterile resuscitation bay confirmed ready by ${envelope.payload?.confirmedBy || 'Receiving ED'}.`;
  }
  if (envelope.eventType === 'AGENT_TASK_STARTED') {
    return `Autonomous agent (${envelope.payload?.taskId || ''}) initiated clinical observation loop.`;
  }
  if (envelope.eventType === 'AGENT_TOOL_CALLED') {
    return `Tool ${envelope.payload?.toolName || ''} executed (${envelope.payload?.durationMs || 0}ms): ${envelope.payload?.resultSummary || ''}`;
  }
  if (envelope.eventType === 'AGENT_HUMAN_REVIEW_REQUIRED') {
    return `Signal synthesized (${envelope.payload?.signal?.title || ''}). Doctor-in-the-loop review mandatory.`;
  }
  return `Synchronized event broadcast at ${envelope.timestamp}.`;
}

function getEventStatusFromEnvelope(envelope: RealtimeEventEnvelope): 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS' {
  if (envelope.eventType === 'CLINICIAN_ESCALATED') return 'CRITICAL';
  if (envelope.eventType === 'CLINICIAN_PLAN_CONFIRMED' || envelope.eventType === 'HOSPITAL_BAY_READY') return 'SUCCESS';
  if (envelope.eventType === 'CLINICIAN_DATA_REQUESTED' || envelope.eventType === 'TRAFFIC_UPDATED' || envelope.eventType === 'AGENT_HUMAN_REVIEW_REQUIRED') return 'WARNING';
  if (envelope.eventType === 'VITAL_RECORDED' && envelope.payload?.currentVitals?.isAbnormal) return 'WARNING';
  if (envelope.eventType === 'AI_SIGNAL_GENERATED') {
    const sigType = envelope.payload?.signal?.signalType || '';
    return sigType.includes('CRITICAL') || sigType.includes('HEMODYNAMIC') ? 'WARNING' : 'INFO';
  }
  if (envelope.eventType === 'HANDOVER_GENERATED' || envelope.eventType === 'HANDOVER_ACKNOWLEDGED') {
    return 'SUCCESS';
  }
  return 'INFO';
}

function normalizeBackendCase(backendCase: any): EmergencyCase {
  if (!backendCase) return backendCase;
  if (backendCase.activeDecisionSignal) {
    const sig = backendCase.activeDecisionSignal;
    backendCase.aiDecisionSupport = {
      ...(backendCase.aiDecisionSupport || {}),
      riskLevel: sig.signalType?.includes('CRITICAL') || sig.signalType?.includes('HEMODYNAMIC') ? 'CRITICAL' : (backendCase.aiDecisionSupport?.riskLevel || 'HIGH'),
      riskScore: backendCase.aiDecisionSupport?.riskScore || 85,
      detectedSignals: backendCase.aiDecisionSupport?.detectedSignals || [sig.title],
      clinicalSignificance: sig.explanation || backendCase.aiDecisionSupport?.clinicalSignificance || '',
      nextStepRecommendation: sig.requiresClinicianReview ? 'Requires specialist review before inbound arrival.' : '',
      isReviewed: sig.status === 'ACKNOWLEDGED',
      signalId: sig.signalId,
      provider: sig.provider,
      providerVersion: sig.providerVersion,
      signalType: sig.signalType,
      title: sig.title,
      observedData: sig.observedData,
      explanation: sig.explanation,
      relevantTimelineEventIds: sig.relevantTimelineEventIds,
      requiresClinicianReview: sig.requiresClinicianReview,
      status: sig.status,
      safetyLabel: sig.safetyLabel,
      providerAvailable: true
    };
  }
  return backendCase as EmergencyCase;
}


export const EmergencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appMode, setAppMode] = useState<AppMode>('PRODUCT');
  const [activeCase, setActiveCase] = useState<EmergencyCase>(() => startScenarioCase('PR-8492'));
  const [activeRole, setActiveRole] = useState<UserRole>('FIELD_MEDIC');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [medicalReadiness] = useState<MedicalReadinessItem[]>(initialMedicalReadiness);
  const [backendStatus, setBackendStatus] = useState<'CONNECTED' | 'OFFLINE_FALLBACK' | 'CONNECTING'>('CONNECTING');
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('OFFLINE');

  const isBackendConnected = backendStatus === 'CONNECTED';
  const activeCaseIdRef = useRef<string>(activeCase.id);
  activeCaseIdRef.current = activeCase.id;

  const subscriptionRef = useRef<CaseRealtimeSubscription | null>(null);

  // Initial connection probe on mount
  useEffect(() => {
    let isMounted = true;

    async function probeBackend() {
      try {
        const health = await checkBackendHealth();
        if (isMounted) {
          if (health.online) {
            setBackendStatus('CONNECTED');
            // In Product Mode, hydrate initial case directly from persistent SQLite backend
            try {
              const persistedCase = await fetchCase(activeCaseIdRef.current);
              if (isMounted && persistedCase && persistedCase.id) {
                const normalized = normalizeBackendCase(persistedCase);
                try {
                  const task = await fetchLatestAgentTask(activeCaseIdRef.current);
                  if (task && task.taskId) {
                    normalized.agentTask = task;
                  }
                } catch {
                  // Fall back gracefully to local deterministic agent task
                }
                setActiveCase(normalized);
              }
            } catch (err) {
              console.warn('[PRANA API] Failed to hydrate initial case from backend, using deterministic local:', err);
            }
          } else {
            setBackendStatus('OFFLINE_FALLBACK');
          }
        }
      } catch {
        if (isMounted) setBackendStatus('OFFLINE_FALLBACK');
      }
    }

    probeBackend();
    return () => { isMounted = false; };
  }, []);

  const toggleAppMode = useCallback(() => {
    setAppMode((prev) => (prev === 'PRODUCT' ? 'DEMO' : 'PRODUCT'));
  }, []);

  // Single derived ETA source of truth (read by Ambulance, Clinician, Hospital workspaces, and Shell)
  const derivedEta = useMemo(() => {
    return calculateDerivedEta(activeCase.ambulance);
  }, [activeCase.ambulance]);

  // Handover state
  const [handoverPackage, setHandoverPackage] = useState<PrehospitalHandoverPackage | null>(null);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);

  // Hydrate initial handover
  useEffect(() => {
    if (isBackendConnected && appMode === 'PRODUCT') {
      getLatestHandover(activeCase.id)
        .then(pkg => setHandoverPackage(pkg))
        .catch(() => setHandoverPackage(generateLocalHandoverPackage(activeCase)));
    } else {
      setHandoverPackage(generateLocalHandoverPackage(activeCase));
    }
  }, [activeCase.id, isBackendConnected, appMode]);

  // Deterministic reset
  const resetMission = useCallback(() => {
    const caseId = activeCase.id;
    // Always reset local deterministic state immediately
    const fresh = startScenarioCase(caseId);
    setActiveCase(fresh);
    setIsStreaming(true);
    setActiveRole('FIELD_MEDIC');
    setHandoverPackage(generateLocalHandoverPackage(fresh));

    // If backend connected and in Product Mode, reset backend database state too
    if (isBackendConnected && appMode === 'PRODUCT') {
      resetBackendCase(caseId)
        .then((backendFresh) => {
          setActiveCase(normalizeBackendCase(backendFresh));
          getLatestHandover(caseId).then(setHandoverPackage).catch(() => {});
        })
        .catch((err) => {
          console.warn('[PRANA API] Backend reset failed, falling back to local deterministic state:', err);
        });
    }
  }, [activeCase.id, isBackendConnected, appMode]);

  // Scenario Switcher
  const selectScenario = useCallback((scenarioId: string) => {
    // 1. Immediately switch local state
    const fresh = startScenarioCase(scenarioId);
    setActiveCase(fresh);
    setIsStreaming(true);

    // 2. If backend connected, hydrate case from backend
    if (isBackendConnected && appMode === 'PRODUCT') {
      fetchCase(scenarioId)
        .then(async (backendCase) => {
          if (backendCase && backendCase.id === scenarioId) {
            const normalized = normalizeBackendCase(backendCase);
            try {
              const task = await fetchLatestAgentTask(scenarioId);
              if (task && task.taskId) {
                normalized.agentTask = task;
              }
            } catch {
              // Fall back to local
            }
            setActiveCase(normalized);
          }
        })
        .catch((err) => {
          console.warn(`[PRANA API] Failed to load scenario ${scenarioId} from backend, using local:`, err);
        });
    }
  }, [isBackendConnected, appMode]);

  const loadCaseData = useCallback((newCase: EmergencyCase) => {
    const normalized = normalizeBackendCase(newCase);
    setActiveCase(normalized);
    setIsStreaming(true);
    setHandoverPackage(generateLocalHandoverPackage(normalized));
  }, []);

  // Real-time Event Receiver
  const handleRealtimeEvent = useCallback((envelope: RealtimeEventEnvelope) => {
    if (envelope.caseId !== activeCaseIdRef.current) return;

    setActiveCase((prev) => {
      // 1. Avoid duplicate timeline event
      const alreadyInTimeline = prev.timeline.some((e) => e.id === envelope.eventId);
      let updatedTimeline = prev.timeline;
      if (!alreadyInTimeline) {
        const newEvent: TimelineEvent = {
          id: envelope.eventId,
          version: envelope.version,
          timestamp: envelope.timestamp || new Date().toTimeString().split(' ')[0],
          category: envelope.actor?.type === 'FIELD_MEDIC' || envelope.actor?.type === 'CLINICIAN' ? 'CLINICAL' : 'SYSTEM',
          title: getEventTitleFromEnvelope(envelope),
          detail: getEventDetailFromEnvelope(envelope),
          actor: (envelope.actor?.type?.replace(/_/g, ' ') as any) || 'SYSTEM',
          status: getEventStatusFromEnvelope(envelope),
          payload: envelope.payload,
        };
        updatedTimeline = [newEvent, ...prev.timeline];
      }

      let updatedCase: EmergencyCase = { ...prev, timeline: updatedTimeline };

      // 2. Apply domain state
      switch (envelope.eventType) {
        case 'VITAL_RECORDED': {
          const cv = envelope.payload?.currentVitals;
          if (cv) {
            const nextVital: VitalSnapshot = {
              timestamp: cv.timestamp || envelope.timestamp,
              heartRate: cv.heartRate,
              spo2: cv.spo2,
              systolicBp: cv.systolicBp,
              diastolicBp: cv.diastolicBp,
              respiratoryRate: cv.respiratoryRate,
              temperatureC: cv.temperatureC,
              isAbnormal: cv.isAbnormal,
            };
            const alreadyInHistory = prev.vitalsHistory.some(
              (v) => v.timestamp === nextVital.timestamp && v.heartRate === nextVital.heartRate
            );
            const history = alreadyInHistory ? prev.vitalsHistory : [...prev.vitalsHistory.slice(-9), nextVital];
            updatedCase = {
              ...updatedCase,
              currentVitals: nextVital,
              vitalsHistory: history,
              aiDecisionSupport: envelope.payload?.aiDecisionSupport || prev.aiDecisionSupport,
            };
          }
          break;
        }

        case 'CLINICIAN_PLAN_CONFIRMED': {
          updatedCase = {
            ...updatedCase,
            conduitStep: Math.max(prev.conduitStep, envelope.payload?.conduitStep || 3),
            clinicianEndorsement: {
              status: 'CONFIRMED',
              clinicianName: envelope.payload?.clinicianName || 'Dr. Sunita Rao, MD',
              clinicianId: envelope.payload?.clinicianId || 'DOC-482',
              timestamp: envelope.timestamp,
              notes: envelope.payload?.notes,
              authorizedProtocol: envelope.payload?.reviewPlanTitle,
            },
          };
          break;
        }

        case 'ADDITIONAL_DATA_REQUESTED':
        case 'CLINICIAN_DATA_REQUESTED': {
          const reqPayload = envelope.payload?.request || {
            id: envelope.payload?.requestId || `req-${Date.now()}`,
            field: envelope.payload?.requestedDataType || envelope.payload?.field || 'Clinical Assessment',
            reason: envelope.payload?.reason || 'Required for specialist clinical review',
            priority: (envelope.payload?.priority as any) || 'CRITICAL',
            requestedBy: envelope.payload?.clinicianName || 'Dr. Sunita Rao, MD',
            requestedRole: 'REMOTE_CLINICIAN',
            targetRole: 'FIELD_MEDIC',
            timestamp: envelope.timestamp || new Date().toISOString(),
            status: 'PENDING' as const,
          };
          updatedCase = {
            ...updatedCase,
            pendingDataRequest: reqPayload,
            clinicianEndorsement: {
              status: 'DATA_REQUESTED',
              clinicianName: envelope.payload?.clinicianName || 'Dr. Sunita Rao, MD',
              clinicianId: envelope.payload?.clinicianId || 'DOC-482',
              timestamp: envelope.timestamp,
              notes: `Requested: ${reqPayload.field}`,
            },
          };
          break;
        }

        case 'FIELD_RESPONSE_SUBMITTED': {
          const respText = envelope.payload?.response || 'Field observation reported.';
          updatedCase = {
            ...updatedCase,
            pendingDataRequest: prev.pendingDataRequest ? {
              ...prev.pendingDataRequest,
              status: 'FULFILLED',
              response: respText,
              respondedAt: envelope.timestamp,
              respondedBy: envelope.payload?.respondedBy || 'Ambulance Paramedic',
            } : undefined,
          };
          break;
        }

        case 'CLINICIAN_ESCALATED': {
          updatedCase = {
            ...updatedCase,
            clinicianEndorsement: {
              status: 'ESCALATED',
              clinicianName: envelope.payload?.clinicianName || 'Dr. Sunita Rao, MD',
              clinicianId: envelope.payload?.clinicianId || 'DOC-482',
              timestamp: envelope.timestamp,
              notes: envelope.payload?.reason,
            },
          };
          break;
        }

        case 'AI_SIGNAL_GENERATED': {
          const sig = envelope.payload?.signal;
          if (sig) {
            updatedCase = {
              ...updatedCase,
              aiDecisionSupport: {
                ...prev.aiDecisionSupport,
                riskLevel: (sig.signalType?.includes('CRITICAL') || sig.signalType?.includes('HEMODYNAMIC')) ? 'CRITICAL' : (prev.aiDecisionSupport?.riskLevel || 'HIGH'),
                riskScore: prev.aiDecisionSupport?.riskScore || 85,
                detectedSignals: prev.aiDecisionSupport?.detectedSignals || [sig.title],
                clinicalSignificance: sig.explanation || prev.aiDecisionSupport?.clinicalSignificance || '',
                nextStepRecommendation: sig.requiresClinicianReview ? 'Requires specialist review before inbound arrival.' : '',
                isReviewed: sig.status === 'ACKNOWLEDGED',
                signalId: sig.signalId,
                provider: sig.provider,
                providerVersion: sig.providerVersion,
                signalType: sig.signalType,
                title: sig.title,
                observedData: sig.observedData,
                explanation: sig.explanation,
                relevantTimelineEventIds: sig.relevantTimelineEventIds,
                requiresClinicianReview: sig.requiresClinicianReview,
                status: sig.status,
                safetyLabel: sig.safetyLabel,
                providerAvailable: true
              }
            };
          }
          break;
        }

        case 'CLINICIAN_SIGNAL_ACKNOWLEDGED': {
          updatedCase = {
            ...updatedCase,
            clinicianEndorsement: {
              status: 'ACKNOWLEDGED',
              clinicianName: envelope.payload?.clinicianName || 'Dr. Sunita Rao, MD',
              clinicianId: envelope.payload?.clinicianId || 'DOC-482',
              timestamp: envelope.timestamp,
            },
            aiDecisionSupport: prev.aiDecisionSupport ? {
              ...prev.aiDecisionSupport,
              isReviewed: true,
              status: 'ACKNOWLEDGED'
            } : undefined
          };
          break;
        }

        case 'TRAFFIC_UPDATED': {
          const delay = envelope.payload?.trafficDelayMinutes ?? prev.ambulance.trafficDelayMinutes;
          updatedCase = {
            ...updatedCase,
            ambulance: {
              ...prev.ambulance,
              trafficDelayMinutes: delay,
              isTrafficDelayed: delay > 0,
            },
          };
          break;
        }

        case 'FACILITY_RECOMMENDED': {
          updatedCase = {
            ...updatedCase,
            conduitStep: Math.max(prev.conduitStep, envelope.payload?.conduitStep || 4),
            ambulance: {
              ...prev.ambulance,
              assignedHospital: envelope.payload?.assignedHospital || prev.ambulance.assignedHospital,
            },
            facilityMatching: prev.facilityMatching ? {
              ...prev.facilityMatching,
              recommendedHospitalId: envelope.payload?.recommendedHospitalId || prev.facilityMatching.recommendedHospitalId,
            } : undefined,
          };
          break;
        }

        case 'HOSPITAL_PREALERT_SENT': {
          updatedCase = {
            ...updatedCase,
            conduitStep: Math.max(prev.conduitStep, envelope.payload?.conduitStep || 4),
            hospitalReadiness: prev.hospitalReadiness ? {
              ...prev.hospitalReadiness,
              status: 'PRE_ALERT_TRANSMITTED',
              isPreAlertDispatched: true,
            } : undefined,
          };
          break;
        }

        case 'HOSPITAL_ACKNOWLEDGED': {
          updatedCase = {
            ...updatedCase,
            hospitalReadiness: prev.hospitalReadiness ? {
              ...prev.hospitalReadiness,
              isPreAlertAcknowledged: true,
              acknowledgedAt: envelope.payload?.acknowledgedAt,
              confirmedBy: envelope.payload?.confirmedBy || prev.hospitalReadiness.confirmedBy,
            } : undefined,
          };
          break;
        }

        case 'HOSPITAL_BAY_READY': {
          updatedCase = {
            ...updatedCase,
            conduitStep: Math.max(prev.conduitStep, envelope.payload?.conduitStep || 5),
            hospitalReadiness: prev.hospitalReadiness ? {
              ...prev.hospitalReadiness,
              status: 'BAY_READY',
              assignedBay: envelope.payload?.assignedBay || prev.hospitalReadiness.assignedBay,
              confirmedBy: envelope.payload?.confirmedBy || prev.hospitalReadiness.confirmedBy,
              timestamp: envelope.payload?.timestamp || envelope.timestamp,
              resourcesReady: envelope.payload?.resourcesReady || prev.hospitalReadiness.resourcesReady,
            } : undefined,
          };
          break;
        }

        case 'HANDOVER_GENERATED': {
          updatedCase = {
            ...updatedCase,
            handoverStatus: 'GENERATED',
          };
          getLatestHandover(prev.id).then(pkg => setHandoverPackage(pkg)).catch(() => {});
          break;
        }

        case 'HANDOVER_ACKNOWLEDGED': {
          updatedCase = {
            ...updatedCase,
            handoverStatus: 'ACKNOWLEDGED',
          };
          setHandoverPackage(prevPkg => prevPkg ? {
            ...prevPkg,
            status: 'ACKNOWLEDGED',
            acknowledgedAt: envelope.timestamp,
            acknowledgedBy: {
              id: envelope.actor?.id || 'usr-hospital',
              name: envelope.payload?.acknowledgedBy || 'Sister Philomina, RN',
              role: 'HOSPITAL_COMMAND',
              notes: envelope.payload?.notes
            }
          } : null);
          break;
        }

        case 'PATIENT_ARRIVED': {
          updatedCase = {
            ...updatedCase,
            status: 'ARRIVED',
            conduitStep: Math.max(prev.conduitStep, 6),
            ambulance: {
              ...prev.ambulance,
              baseEtaMinutes: 0,
              trafficDelayMinutes: 0,
              currentSpeedKmH: 0,
            },
          };
          break;
        }

        case 'PATIENT_HANDOVER_INITIATED': {
          updatedCase = {
            ...updatedCase,
            conduitStep: Math.max(prev.conduitStep, 7),
            handoverStatus: 'READY',
          };
          break;
        }

        case 'PATIENT_HANDOVER_ACKNOWLEDGED': {
          updatedCase = {
            ...updatedCase,
            conduitStep: Math.max(prev.conduitStep, 8),
            handoverStatus: 'ACKNOWLEDGED',
          };
          break;
        }

        case 'TRANSFER_COMPLETED': {
          updatedCase = {
            ...updatedCase,
            status: 'TRANSFER_COMPLETED',
            conduitStep: Math.max(prev.conduitStep, 8),
            handoverStatus: 'ACKNOWLEDGED',
          };
          break;
        }

        case 'HOSPITAL_ESCALATION_ACKNOWLEDGED': {
          updatedCase = {
            ...updatedCase,
            clinicianEndorsement: prev.clinicianEndorsement ? {
              ...prev.clinicianEndorsement,
              escalationAcknowledgedBy: envelope.payload?.acknowledgedBy || 'Receiving Emergency Team',
              escalationAcknowledgedAt: envelope.timestamp,
              escalationNotes: envelope.payload?.notes || 'Resuscitation team alerted and standing by.',
            } : undefined,
          };
          break;
        }

        case 'AGENT_TASK_STARTED': {
          const taskId: string = envelope.payload?.taskId || `agt-${Date.now()}`;
          const currentTask: import('../types/emergency').AgentTask = (prev.agentTask && prev.agentTask.taskId === taskId)
            ? { ...prev.agentTask, status: 'RUNNING' }
            : {
                taskId,
                caseId: envelope.caseId,
                triggerEventId: envelope.payload?.triggerEventId,
                status: 'RUNNING',
                safetyStatus: 'PENDING',
                provider: envelope.actor?.id || 'RealLLM',
                model: 'gpt-4o-mini',
                promptVersion: 'PRANA_AGENT_SYSTEM_V1',
                startedAt: envelope.timestamp || new Date().toISOString(),
                iterationCount: 1,
                toolCallCount: 0,
                traces: [],
                missingData: [],
              };
          updatedCase = { ...updatedCase, agentTask: currentTask };
          break;
        }

        case 'AGENT_TOOL_CALLED': {
          if (prev.agentTask) {
            const newTrace: import('../types/emergency').AgentTraceItem = {
              id: `trc-${Date.now()}-${envelope.payload?.stepIndex || 0}`,
              taskId: envelope.payload?.taskId || prev.agentTask.taskId,
              caseId: envelope.caseId,
              stepIndex: envelope.payload?.stepIndex || (prev.agentTask.traces?.length || 0) + 1,
              toolName: envelope.payload?.toolName || 'tool',
              argumentsJson: '{}',
              resultSummary: envelope.payload?.resultSummary || '',
              durationMs: envelope.payload?.durationMs || 0,
              success: true,
              sourceEventIds: [],
              timestamp: envelope.timestamp || new Date().toISOString(),
            };
            const traces = [...(prev.agentTask.traces || []), newTrace];
            updatedCase = {
              ...updatedCase,
              agentTask: {
                ...prev.agentTask,
                status: 'RUNNING',
                traces,
                toolCallCount: traces.length,
              }
            };
          }
          break;
        }

        case 'AGENT_HUMAN_REVIEW_REQUIRED': {
          const sig = envelope.payload?.signal;
          const missingData = envelope.payload?.missingData || [];
          const reasoning = envelope.payload?.reasoningSummary;
          const recRequest = envelope.payload?.recommendedDataRequest;

          if (prev.agentTask) {
            updatedCase = {
              ...updatedCase,
              agentTask: {
                ...prev.agentTask,
                status: 'REQUIRES_HUMAN_REVIEW',
                safetyStatus: 'PASSED',
                reasoningSummary: reasoning || prev.agentTask.reasoningSummary,
                missingData: missingData,
                recommendedDataRequest: recRequest || prev.agentTask.recommendedDataRequest,
                finalSignalId: sig?.signalId || prev.agentTask.finalSignalId,
                completedAt: envelope.timestamp || new Date().toISOString(),
              }
            };
          }

          if (sig) {
            updatedCase = {
              ...updatedCase,
              aiDecisionSupport: {
                ...prev.aiDecisionSupport,
                riskLevel: (sig.signalType?.includes('CRITICAL') || sig.signalType?.includes('HEMODYNAMIC')) ? 'CRITICAL' : (prev.aiDecisionSupport?.riskLevel || 'HIGH'),
                riskScore: prev.aiDecisionSupport?.riskScore || 85,
                detectedSignals: prev.aiDecisionSupport?.detectedSignals || [sig.title],
                clinicalSignificance: sig.explanation || prev.aiDecisionSupport?.clinicalSignificance || '',
                nextStepRecommendation: sig.requiresClinicianReview ? 'Requires specialist review before inbound arrival.' : '',
                isReviewed: sig.status === 'ACKNOWLEDGED',
                signalId: sig.signalId,
                provider: sig.provider,
                providerVersion: sig.providerVersion,
                signalType: sig.signalType,
                title: sig.title,
                observedData: sig.observedData,
                explanation: sig.explanation,
                relevantTimelineEventIds: sig.relevantTimelineEventIds,
                requiresClinicianReview: sig.requiresClinicianReview,
                status: sig.status,
                safetyLabel: sig.safetyLabel,
                providerAvailable: true
              }
            };
          }
          break;
        }
      }

      return updatedCase;
    });
  }, []);

  // Real-time WebSocket Subscription Hook
  useEffect(() => {
    if (!isBackendConnected || appMode !== 'PRODUCT') {
      if (subscriptionRef.current) {
        subscriptionRef.current.destroy();
        subscriptionRef.current = null;
      }
      setRealtimeStatus('OFFLINE');
      return;
    }

    const sub = new CaseRealtimeSubscription({
      caseId: activeCase.id,
      role: activeRole,
      onStatusChange: (status) => {
        setRealtimeStatus(status);
      },
      onEvent: (envelope) => {
        handleRealtimeEvent(envelope);
      },
      onCatchUp: (missingEvents) => {
        setActiveCase((prev) => {
          const existingIds = new Set(prev.timeline.map((e) => e.id));
          const toAdd = missingEvents.filter((e: any) => !existingIds.has(e.id));
          if (toAdd.length === 0) return prev;
          return {
            ...prev,
            timeline: [...toAdd, ...prev.timeline],
          };
        });
      },
    });

    subscriptionRef.current = sub;

    return () => {
      sub.destroy();
      if (subscriptionRef.current === sub) {
        subscriptionRef.current = null;
      }
    };
  }, [activeCase.id, activeRole, isBackendConnected, appMode, handleRealtimeEvent]);

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

  const sendCaseDataToCDS = useCallback(() => {
    setActiveCase((prev) => sendCaseDataToCdsState(prev));
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
    const caseId = activeCase.id;

    // 1. Update local state immediately for instant responsive UI
    setActiveCase((prev) => confirmClinicianProtocolState(prev, docId, docName, action, notes, authorizedProtocol));

    // 2. Persist to backend if connected
    if (isBackendConnected && appMode === 'PRODUCT') {
      if (action === 'CONFIRMED') {
        submitClinicianReview(caseId, {
          reviewPlanTitle: authorizedProtocol || 'Trauma Stabilization & Readiness Plan',
          clinicianId: docId,
          clinicianName: docName,
          notes,
        })
          .then((updated) => setActiveCase(updated))
          .catch((err) => console.warn('[PRANA API] Clinician confirm sync failed:', err));
      } else if (action === 'DATA_REQUESTED') {
        submitDataRequest(caseId, {
          requestedDataType: notes || '20WBCT Clot Observation',
          clinicianId: docId,
          clinicianName: docName,
          notes,
        })
          .then((updated) => setActiveCase(updated))
          .catch((err) => console.warn('[PRANA API] Data request sync failed:', err));
      } else if (action === 'ESCALATED') {
        submitEscalation(caseId, { 
          reason: notes || 'Urgent deterioration review required', 
          clinicianId: docId, 
          clinicianName: docName, 
          notes 
        })
          .then((updated) => setActiveCase(updated))
          .catch((err) => console.warn('[PRANA API] Escalation sync failed:', err));
      } else if (action === 'ACKNOWLEDGED') {
        submitAcknowledgement(caseId, { 
          signalId: 'sig-current', 
          clinicianId: docId, 
          clinicianName: docName, 
          notes 
        })
          .then((updated) => setActiveCase(updated))
          .catch((err) => console.warn('[PRANA API] Acknowledgment sync failed:', err));
      }
    }
  }, [activeCase.id, activeCase.clinicianEndorsement, isBackendConnected, appMode]);

  const recalculateFacilityMatching = useCallback((candidatesOverride?: HospitalCandidate[]) => {
    setActiveCase((prev) => recalculateFacilityMatchState(prev, candidatesOverride));
    if (isBackendConnected && appMode === 'PRODUCT') {
      submitRecalculateFacilities(activeCaseIdRef.current)
        .then((updated) => setActiveCase(updated))
        .catch((err) => console.warn('[PRANA API] Recalculate facility sync failed:', err));
    }
  }, [isBackendConnected, appMode]);

  const dispatchHospitalPreAlert = useCallback(() => {
    setActiveCase((prev) => dispatchHospitalPreAlertState(prev));
    if (isBackendConnected && appMode === 'PRODUCT') {
      submitHospitalPreAlert(activeCaseIdRef.current)
        .then((updated) => setActiveCase(updated))
        .catch((err) => console.warn('[PRANA API] Hospital pre-alert sync failed:', err));
    }
  }, [isBackendConnected, appMode]);

  const acknowledgeHospitalPreAlert = useCallback((acknowledgedBy?: string) => {
    setActiveCase((prev) => acknowledgeHospitalPreAlertState(prev, acknowledgedBy));
    if (isBackendConnected && appMode === 'PRODUCT') {
      submitHospitalAcknowledge(activeCaseIdRef.current, acknowledgedBy)
        .then((updated) => setActiveCase(updated))
        .catch((err) => console.warn('[PRANA API] Hospital acknowledge sync failed:', err));
    }
  }, [isBackendConnected, appMode]);

  // Receiving Hospital Bay Allocation & Ready Handshake
  const confirmHospitalBay = useCallback((bayName?: string, confirmedBy?: string) => {
    const caseId = activeCase.id;
    setActiveCase((prev) => confirmHospitalBayReadyState(prev, bayName, confirmedBy));

    if (isBackendConnected && appMode === 'PRODUCT') {
      submitHospitalBayReady(caseId, bayName, confirmedBy)
        .then((updated) => setActiveCase(updated))
        .catch((err) => console.warn('[PRANA API] Hospital bay ready sync failed:', err));
    }
  }, [activeCase.id, isBackendConnected, appMode]);

  const setTrafficDelay = useCallback((additionalMinutes?: number) => {
    const delay = additionalMinutes || 8;
    setActiveCase((prev) => setTrafficDelayState(prev, delay));
    if (isBackendConnected && appMode === 'PRODUCT') {
      submitTrafficDelay(activeCaseIdRef.current, delay)
        .then((updated) => setActiveCase(updated))
        .catch((err) => console.warn('[PRANA API] Traffic delay sync failed:', err));
    }
  }, [isBackendConnected, appMode]);

  const continueCare = useCallback((detail?: string) => {
    setActiveCase((prev) => continueCareInTransitState(prev, detail));
  }, []);

  const requestFieldData = useCallback((field: string, reason?: string, priority?: 'CRITICAL' | 'HIGH' | 'MODERATE') => {
    const reqId = `req-${Date.now()}`;
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newRequest: import('../types/emergency').ClinicalDataRequest = {
      id: reqId,
      field,
      reason: reason || 'Data required for specialist clinical protocol review.',
      priority: priority || 'CRITICAL',
      requestedBy: activeCase.clinicianEndorsement?.clinicianName || 'Dr. Sunita Rao, MD',
      requestedRole: 'REMOTE_CLINICIAN',
      targetRole: 'FIELD_MEDIC',
      timestamp: timeStr,
      status: 'PENDING'
    };

    setActiveCase((prev) => ({
      ...prev,
      pendingDataRequest: newRequest,
      clinicianEndorsement: {
        status: 'DATA_REQUESTED',
        clinicianName: newRequest.requestedBy,
        clinicianId: 'DOC-482',
        timestamp: timeStr,
        notes: `Requested: ${field}`,
      },
      timeline: appendTimelineEvent(prev.timeline, {
        title: `Clinical Observation Requested: ${field}`,
        detail: `Remote Specialist requested: "${field}" (${newRequest.priority}). Reason: ${newRequest.reason}. Target: Field Medic.`,
        actor: 'CLINICIAN',
        category: 'CLINICAL',
        status: 'WARNING',
        payload: { requestId: reqId, field, priority: newRequest.priority, targetRole: 'FIELD_MEDIC' }
      })
    }));

    if (isBackendConnected && appMode === 'PRODUCT') {
      endorseProtocol('DATA_REQUESTED', `Requested: ${field}`);
    }
  }, [activeCase.clinicianEndorsement, isBackendConnected, appMode, endorseProtocol]);

  const submitFieldResponse = useCallback((requestId: string, responseText: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    setActiveCase((prev) => {
      const updatedReq = prev.pendingDataRequest ? {
        ...prev.pendingDataRequest,
        status: 'FULFILLED' as const,
        response: responseText,
        respondedAt: timeStr,
        respondedBy: 'Dr. Priya Sharma (Paramedic Chief)'
      } : undefined;

      const withResponse = appendTimelineEvent(prev.timeline, {
        title: 'Field Assessment Submitted',
        detail: `Field Medic verified: "${responseText}". Recorded in clinical ledger and transmitted to remote specialist.`,
        actor: 'FIELD MEDIC',
        category: 'CLINICAL',
        status: 'SUCCESS',
        payload: { requestId, response: responseText }
      });

      const withReassessment = appendTimelineEvent(withResponse, {
        title: 'AI Reassessment Triggered',
        detail: `New field data received for "${prev.pendingDataRequest?.field ?? 'requested field'}". PRANA Intelligence re-evaluating clinical signal with updated evidence.`,
        actor: 'PRANA INTELLIGENCE',
        category: 'AI',
        status: 'INFO',
        payload: { trigger: 'FIELD_RESPONSE_RECEIVED', requestId }
      });

      return {
        ...prev,
        pendingDataRequest: updatedReq,
        timeline: withReassessment,
      };
    });

    // Automatically trigger AI reassessment to reflect newly confirmed evidence
    computeAiSignal();
  }, [computeAiSignal]);

  const dismissFieldDataRequest = useCallback((_requestId: string) => {
    setActiveCase((prev) => ({
      ...prev,
      pendingDataRequest: prev.pendingDataRequest ? {
        ...prev.pendingDataRequest,
        status: 'DISMISSED' as const
      } : undefined
    }));
  }, []);

  const markPatientArrived = useCallback((facility?: string, notes?: string) => {
    const caseId = activeCase.id;
    setActiveCase((prev) => markPatientArrivedState(prev, facility, notes));
    if (isBackendConnected && appMode === 'PRODUCT') {
      submitPatientArrival(caseId, { facility, notes })
        .then((updated) => setActiveCase(updated))
        .catch((err) => console.warn('[PRANA API] Patient arrival sync failed:', err));
    }
  }, [activeCase.id, isBackendConnected, appMode]);

  const initiateHandover = useCallback((notes?: string) => {
    const caseId = activeCase.id;
    setActiveCase((prev) => initiateHandoverState(prev, notes));
    if (isBackendConnected && appMode === 'PRODUCT') {
      submitHandoverInitiate(caseId, { notes })
        .then((updated) => setActiveCase(updated))
        .catch((err) => console.warn('[PRANA API] Handover initiate sync failed:', err));
    }
  }, [activeCase.id, isBackendConnected, appMode]);

  const acceptHandover = useCallback((notes?: string) => {
    const caseId = activeCase.id;
    setActiveCase((prev) => acceptHandoverState(prev, notes));
    if (isBackendConnected && appMode === 'PRODUCT') {
      submitHandoverAccept(caseId, { notes })
        .then((updated) => setActiveCase(updated))
        .catch((err) => console.warn('[PRANA API] Handover accept sync failed:', err));
    }
  }, [activeCase.id, isBackendConnected, appMode]);

  const acknowledgeHospitalEscalation = useCallback((notes?: string) => {
    const caseId = activeCase.id;
    setActiveCase((prev) => acknowledgeHospitalEscalationState(prev, notes));
    if (isBackendConnected && appMode === 'PRODUCT') {
      submitHospitalEscalationAcknowledge(caseId, { notes })
        .then((updated) => setActiveCase(updated))
        .catch((err) => console.warn('[PRANA API] Hospital escalation acknowledge sync failed:', err));
    }
  }, [activeCase.id, isBackendConnected, appMode]);

  const recordVitalSnapshot = useCallback((snapshotData: Omit<VitalSnapshot, 'timestamp'>) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newSnapshot: VitalSnapshot = {
      ...snapshotData,
      timestamp: timeStr,
    };

    // 1. Update local state immediately (optimistic UI)
    setActiveCase((prev) => {
      const updatedHistory = [...prev.vitalsHistory.slice(-9), newSnapshot];
      const aiDecision = evaluateSimulationDecisionEngine(prev.domain, newSnapshot);
      return {
        ...prev,
        currentVitals: newSnapshot,
        vitalsHistory: updatedHistory,
        aiDecisionSupport: aiDecision,
      };
    });

    // 2. Persist to backend if connected
    if (isBackendConnected && appMode === 'PRODUCT') {
      submitVitalSnapshot(activeCaseIdRef.current, { ...snapshotData, timestamp: timeStr })
        .then((updatedCase) => {
          setActiveCase(updatedCase);
        })
        .catch((err) => {
          console.warn('[PRANA API] Vital persistence sync failed, retained in local memory:', err);
        });
    }
  }, [isBackendConnected, appMode]);

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
        appMode,
        setAppMode,
        toggleAppMode,
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
        sendCaseDataToCDS,
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
        loadCaseData,
        resetMission,
        requestFieldData,
        submitFieldResponse,
        dismissFieldDataRequest,
        isBackendConnected,
        backendStatus,
        realtimeStatus,
        handoverPackage,
        isHandoverModalOpen,
        setIsHandoverModalOpen,
        generateHandoverSnapshot: async () => {
          if (isBackendConnected && appMode === 'PRODUCT') {
            try {
              const pkg = await generateHandover(activeCase.id);
              setHandoverPackage(pkg);
              setActiveCase(prev => ({
                ...prev,
                handoverPackage: pkg,
                handoverStatus: 'GENERATED'
              }));
              return;
            } catch (err) {
              console.warn('[PRANA API] Handover generation fallback to local engine:', err);
            }
          }
          const localPkg = generateLocalHandoverPackage(activeCase);
          setHandoverPackage(localPkg);
          setActiveCase(prev => {
            const updated = {
              ...prev,
              handoverPackage: localPkg,
              handoverStatus: 'GENERATED' as const
            };
            updated.timeline = appendTimelineEvent(
              updated.timeline,
              {
                category: 'SYSTEM',
                title: 'Prehospital Handover Package Generated',
                detail: `Handover package ${localPkg.packageId} generated locally with SHA-256 digest ${localPkg.integrityHash.slice(0, 12)}...`,
                actor: 'SYSTEM',
                status: 'SUCCESS'
              }
            );
            return updated;
          });
        },
        acknowledgeHandoverPackage: async (notes?: string) => {
          const currentPkgId = handoverPackage?.packageId;
          if (isBackendConnected && appMode === 'PRODUCT' && currentPkgId) {
            try {
              const updatedPkg = await acknowledgeHandover(activeCase.id, currentPkgId, notes);
              setHandoverPackage(updatedPkg);
              setActiveCase(prev => ({
                ...prev,
                handoverPackage: updatedPkg,
                handoverStatus: 'ACKNOWLEDGED'
              }));
              return;
            } catch (err) {
              console.warn('[PRANA API] Handover acknowledgement fallback to local state:', err);
            }
          }
          const timeStr = new Date().toLocaleTimeString('en-GB');
          setHandoverPackage(prev => prev ? {
            ...prev,
            status: 'ACKNOWLEDGED',
            acknowledgedAt: timeStr,
            acknowledgedBy: {
              id: 'usr-hospital-local',
              name: 'Sister Philomina, RN',
              role: 'HOSPITAL_COMMAND',
              notes
            }
          } : null);
          setActiveCase(prev => {
            const updated = {
              ...prev,
              handoverStatus: 'ACKNOWLEDGED' as const
            };
            updated.timeline = appendTimelineEvent(
              updated.timeline,
              {
                category: 'CLINICAL',
                title: 'Prehospital Handover Received & Acknowledged',
                detail: `Receiving Emergency Department (Sister Philomina, RN) acknowledged prehospital handover. Resuscitation team briefing underway.`,
                actor: 'RECEIVING ED',
                status: 'SUCCESS'
              },
              timeStr
            );
            return updated;
          });
        },
        markPatientArrived,
        initiateHandover,
        acceptHandover,
        acknowledgeHospitalEscalation,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};
