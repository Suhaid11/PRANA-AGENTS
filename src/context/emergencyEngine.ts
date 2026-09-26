import type {
  EmergencyCase,
  EmergencyDomain,
  VitalSnapshot,
  PatientProfile,
  HospitalCandidate,
  AiDecisionSupport,
  TimelineEvent,
  AmbulanceUnit,
  CdsDataPackage,
  PrehospitalHandoverPackage,
  AgentTask,
  AgentTraceItem,
  MissingDataItem
} from '../types/emergency';
import { allScenarios, initialTraumaCase } from '../data/seedData';

/**
 * 1. Single Shared Derived ETA Source of Truth
 * Formula: derivedEta = baseEtaMinutes + trafficDelayMinutes
 */
export const calculateDerivedEta = (ambulance: AmbulanceUnit): number => {
  const base = Math.max(1, ambulance.baseEtaMinutes || 1);
  const delay = Math.max(0, ambulance.trafficDelayMinutes || 0);
  return base + delay;
};

/**
 * Helper to record timeline milestone ensuring direct single-array log
 */
export const appendTimelineEvent = (
  timeline: TimelineEvent[],
  eventData: Omit<TimelineEvent, 'id' | 'timestamp'>,
  timestampOverride?: string
): TimelineEvent[] => {
  const timeStr = timestampOverride || new Date().toTimeString().split(' ')[0];
  const newEvent: TimelineEvent = {
    ...eventData,
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: timeStr,
  };
  return [newEvent, ...timeline];
};

/**
 * 2. Simulation Decision Engine
 * Evaluates observable physiological patterns dynamically from vitals.
 * Disclaimer: All clinical thresholds are demonstration logic, not validated clinical decision rules.
 */
export const evaluateSimulationDecisionEngine = (
  domain: EmergencyDomain,
  vitals: VitalSnapshot
): AiDecisionSupport => {
  const shockIndex = vitals.systolicBp > 0 ? Number((vitals.heartRate / vitals.systolicBp).toFixed(2)) : 0;
  const pulsePressure = vitals.systolicBp - vitals.diastolicBp;
  const signals: string[] = [];
  let riskScore = 40;
  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  let clinicalSignificance = 'Physiological indicators within baseline transit variance.';
  let nextStepRecommendation = 'Maintain continuous telemetry streaming and serial vital monitoring.';

  if (domain === 'TRAUMA') {
    if (vitals.heartRate > 100) signals.push(`Tachycardia (${vitals.heartRate} bpm)`);
    if (shockIndex > 0.9) signals.push(`Elevated Shock Index (${shockIndex})`);
    if (pulsePressure < 35) signals.push(`Narrowed Pulse Pressure (${pulsePressure} mmHg)`);
    if (vitals.spo2 < 92) signals.push(`Hypoxia (${vitals.spo2}% SpO2)`);

    if (shockIndex > 1.2 || (vitals.heartRate > 120 && vitals.systolicBp < 90)) {
      riskLevel = 'CRITICAL';
      riskScore = Math.min(98, 85 + Math.round(shockIndex * 8));
      clinicalSignificance = 'Observed: Persistent tachycardia + low systolic pressure + narrowing pulse pressure. Why it matters: Requires clinician review.';
      nextStepRecommendation = 'Next step: Review current prehospital assessment and receiving-facility readiness.';
    } else if (shockIndex > 0.9 || vitals.heartRate > 105) {
      riskLevel = 'HIGH';
      riskScore = 78;
      clinicalSignificance = 'Observed: Compensated hemodynamic drift with persistent tachycardia and narrow pulse pressure.';
      nextStepRecommendation = 'Next step: Remote trauma specialist review requested; confirm large-bore IV access.';
    } else {
      riskLevel = 'MODERATE';
      riskScore = 55;
    }
  } else if (domain === 'POISONING') {
    if (vitals.heartRate < 55) signals.push(`Severe Bradycardia (${vitals.heartRate} bpm)`);
    if (vitals.spo2 < 92) signals.push(`Hypoxemia (${vitals.spo2}% SpO2)`);
    if (vitals.respiratoryRate > 24) signals.push(`Tachypnea / Bronchorrhea (${vitals.respiratoryRate}/min)`);
    signals.push('SLUDGE cholinergic toxindrome presentation');

    if (vitals.heartRate < 48 || vitals.spo2 < 88) {
      riskLevel = 'CRITICAL';
      riskScore = 96;
      clinicalSignificance = 'Severe organophosphate cholinergic crisis with profound vagal overstimulation & respiratory compromise.';
      nextStepRecommendation = 'Urgent clinician endorsement: authorize high-dose Atropine titration and continuous airway suctioning.';
    } else {
      riskLevel = 'HIGH';
      riskScore = 82;
      clinicalSignificance = 'Observable cholinergic toxicity pattern requiring airway vigilance and toxicologist review.';
      nextStepRecommendation = 'Remote critical care consultation for atropinization endpoints.';
    }
  } else if (domain === 'SNAKEBITE') {
    if (vitals.heartRate > 100) signals.push(`Stress Tachycardia (${vitals.heartRate} bpm)`);
    signals.push('Ascending local edema margin progression > 10cm');
    signals.push('Coagulopathy risk: 20WBCT whole blood clotting failure watch');

    if (vitals.heartRate > 115 || vitals.systolicBp < 95) {
      riskLevel = 'CRITICAL';
      riskScore = 90;
      clinicalSignificance = 'Suspected systemic envenomation with progressive hemotoxicity and hemodynamic compromise.';
      nextStepRecommendation = 'Immediate specialist endorsement: alert receiving facility antivenom bank for immediate reconstitution.';
    } else {
      riskLevel = 'HIGH';
      riskScore = 80;
      clinicalSignificance = 'Significant hemotoxic viperid envenomation pattern with advancing local tissue involvement.';
      nextStepRecommendation = 'Remote toxicology review: confirm pressure immobilization and 20WBCT sampling.';
    }
  } else if (domain === 'RESPIRATORY_DISTRESS') {
    if (vitals.spo2 < 90) signals.push(`Severe Hypoxemia (${vitals.spo2}% SpO2)`);
    if (vitals.respiratoryRate > 28) signals.push(`Tachypnea / Respiratory Fatigue (${vitals.respiratoryRate}/min)`);
    if (vitals.heartRate > 105) signals.push(`Compensatory Tachycardia (${vitals.heartRate} bpm)`);
    signals.push('Acute respiratory compromise with elevated work of breathing');

    if (vitals.spo2 < 86 || vitals.respiratoryRate > 32) {
      riskLevel = 'CRITICAL';
      riskScore = 94;
      clinicalSignificance = 'Severe respiratory distress with impending respiratory failure and marked hypoxemia.';
      nextStepRecommendation = 'Urgent clinician endorsement: high-flow O2 / non-invasive positive pressure ventilation and prepare for advanced airway.';
    } else {
      riskLevel = 'HIGH';
      riskScore = 80;
      clinicalSignificance = 'Observable acute respiratory compromise requiring rapid stabilization and destination readiness.';
      nextStepRecommendation = 'Continuous SpO2 / EtCO2 monitoring and respiratory specialist telemetry review.';
    }
  } else {
    // Dynamic fallback for any arbitrary ingested emergency domain
    if (vitals.spo2 < 92) signals.push(`Hypoxia (${vitals.spo2}% SpO2)`);
    if (vitals.heartRate > 110) signals.push(`Tachycardia (${vitals.heartRate} bpm)`);
    if (vitals.heartRate < 50) signals.push(`Bradycardia (${vitals.heartRate} bpm)`);
    if (shockIndex > 1.0) signals.push(`Elevated Shock Index (${shockIndex})`);
    if (signals.length > 0) {
      riskLevel = 'HIGH';
      riskScore = 75;
      clinicalSignificance = `Observable physiological deviation: ${signals.join(', ')}.`;
      nextStepRecommendation = 'Maintain serial vitals and remote clinician monitoring.';
    }
  }

  const signalType = domain === 'TRAUMA'
    ? 'HEMODYNAMIC_DECOMPENSATION_RISK'
    : domain === 'SNAKEBITE'
    ? 'SYSTEMIC_ENVENOMATION_PROGRESSION'
    : domain === 'POISONING'
    ? 'CHOLINERGIC_CRISIS_SIGNAL'
    : 'RESPIRATORY_COMPROMISE_SIGNAL';

  const title = domain === 'TRAUMA'
    ? 'Hemodynamic Change Signal'
    : domain === 'SNAKEBITE'
    ? 'Ascending Edema & Coagulation Signal'
    : domain === 'POISONING'
    ? 'Vagal Bradycardia & Bronchorrhea Signal'
    : 'Acute Respiratory Compromise Signal';

  const observedData = domain === 'TRAUMA'
    ? `Heart rate ${vitals.heartRate} bpm, NIBP ${vitals.systolicBp}/${vitals.diastolicBp} mmHg (Shock Index ${shockIndex}).`
    : domain === 'SNAKEBITE'
    ? `Fang puncture right leg with ascending tissue edema > 10cm, HR ${vitals.heartRate} bpm.`
    : domain === 'POISONING'
    ? `Severe vagal bradycardia ${vitals.heartRate} bpm with SpO2 ${vitals.spo2}% and copious secretions.`
    : `SpO2 ${vitals.spo2}%, RR ${vitals.respiratoryRate}/min, HR ${vitals.heartRate} bpm with increased work of breathing.`;

  return {
    riskLevel,
    riskScore,
    detectedSignals: signals,
    clinicalSignificance,
    nextStepRecommendation,
    isReviewed: false,
    signalId: `sig-${domain.toLowerCase()}-${vitals.heartRate}-${vitals.systolicBp}`,
    provider: 'DemoDecisionSupportProvider',
    providerVersion: '1.0.0',
    signalType,
    title,
    observedData,
    explanation: `${clinicalSignificance} Demonstration logic — not clinically validated.`,
    relevantTimelineEventIds: ['evt-initial-telemetry'],
    requiresClinicianReview: true,
    status: 'NEW',
    safetyLabel: 'SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS',
    providerAvailable: true,
    statusMessage: 'Deterministic Demo AI Decision Support Active'
  };
};

/**
 * 2b. Deterministic Agent Task Generator (Offline Fallback Engine)
 * Synthesizes agent reasoning trace, tool calls, and missing data detection
 * matching the backend AgentOrchestrator for 100% offline demonstration resilience.
 */
export const generateLocalAgentTask = (
  domain: EmergencyDomain,
  caseId: string,
  vitals: VitalSnapshot,
  triggerEventId?: string
): AgentTask => {
  const missingData: MissingDataItem[] = domain === 'TRAUMA'
    ? [
        { field: 'Serial Blood Pressure (Repeat BP)', reason: 'Single BP reading limits shock index trajectory evaluation.', clinicalImportance: 'CRITICAL' },
        { field: 'Pelvic Circumferential Compression Verification', reason: 'High-speed collision warrants pelvic binder confirmation.', clinicalImportance: 'HIGH' },
      ]
    : domain === 'SNAKEBITE'
    ? [
        { field: '20-Minute Whole Blood Clotting Test (20WBCT)', reason: 'Bedside evaluation for Russell\'s viper coagulopathy.', clinicalImportance: 'CRITICAL' },
        { field: 'Serial Proximal Swelling Margin Demarcation', reason: 'Assesses bite edema progression velocity.', clinicalImportance: 'HIGH' },
      ]
    : domain === 'POISONING'
    ? [
        { field: 'Pupillary Constriction (Miosis) Assessment', reason: 'Differentiates vagal cholinergic overdrive from other toxindromes.', clinicalImportance: 'CRITICAL' },
        { field: 'Pulmonary Auscultation (Secretions / Crackles)', reason: 'Bronchorrhea is primary hypoxia driver in organophosphate crisis.', clinicalImportance: 'HIGH' },
      ]
    : [
        { field: 'Continuous Pulse Oximetry & Supplemental FiO2 Tracking', reason: 'Assesses response to oxygen therapy and risk of rapid desaturation.', clinicalImportance: 'CRITICAL' },
        { field: 'Bilateral Lung Auscultation (Wheeze / Crepitations)', reason: 'Differentiates bronchospastic vs cardiogenic / infectious etiology.', clinicalImportance: 'HIGH' },
      ];

  const traces: AgentTraceItem[] = [
    {
      id: `trc-${caseId}-1`,
      taskId: `agt-local-${caseId}`,
      stepIndex: 1,
      toolName: 'get_case_summary',
      arguments: { case_id: caseId },
      resultSummary: `Retrieved case ${caseId} (${domain}) baseline demographics`,
      durationMs: 4,
      success: true,
      sourceEventIds: ['ev-001'],
      timestamp: vitals.timestamp,
    },
    {
      id: `trc-${caseId}-2`,
      taskId: `agt-local-${caseId}`,
      stepIndex: 2,
      toolName: 'get_latest_vitals',
      arguments: { case_id: caseId },
      resultSummary: `HR ${vitals.heartRate} bpm, BP ${vitals.systolicBp}/${vitals.diastolicBp} mmHg, SpO2 ${vitals.spo2}%`,
      durationMs: 3,
      success: true,
      sourceEventIds: ['evt-initial-telemetry'],
      timestamp: vitals.timestamp,
    },
    {
      id: `trc-${caseId}-3`,
      taskId: `agt-local-${caseId}`,
      stepIndex: 3,
      toolName: 'get_vital_trend',
      arguments: { case_id: caseId, limit: 5 },
      resultSummary: `Trend evaluated against previous records`,
      durationMs: 5,
      success: true,
      sourceEventIds: ['evt-vital-change'],
      timestamp: vitals.timestamp,
    },
    {
      id: `trc-${caseId}-4`,
      taskId: `agt-local-${caseId}`,
      stepIndex: 4,
      toolName: 'get_recent_observations',
      arguments: { case_id: caseId },
      resultSummary: `Analyzed field observations and identified clinical gaps`,
      durationMs: 4,
      success: true,
      sourceEventIds: ['evt-obs-01'],
      timestamp: vitals.timestamp,
    },
  ];

  return {
    taskId: `agt-local-${caseId}`,
    caseId,
    triggerEventId: triggerEventId || 'evt-initial-telemetry',
    status: 'REQUIRES_HUMAN_REVIEW',
    provider: 'DemoDecisionSupportProvider',
    model: 'deterministic-v2',
    promptVersion: 'PRANA_AGENT_SYSTEM_V1',
    startedAt: vitals.timestamp,
    completedAt: vitals.timestamp,
    iterationCount: 1,
    toolCallCount: traces.length,
    finalSignalId: `sig-${domain.toLowerCase()}-${vitals.heartRate}-${vitals.systolicBp}`,
    safetyStatus: 'PASSED',
    reasoningSummary: `Evaluated vitals and observations. Detected ${missingData.length} data gap(s). Formed observable signal requiring clinician confirmation.`,
    missingData,
    recommendedDataRequest: `Request field medic to record: ${missingData[0].field} (${missingData[0].reason})`,
    traces,
  };
};

/**
 * 3. Transparent Multi-Factor Facility Matching Engine
 * Formula: FinalScore = Math.round(0.40 * ClinicalFit + 0.30 * Availability + 0.30 * EtaScore)
 * All components normalized to 0–100.
 */
export const calculateFacilityMatching = (
  domain: EmergencyDomain,
  _currentBaseEta: number,
  candidates: HospitalCandidate[]
): { recommendedHospitalId: string; algorithmRationale: string; candidates: HospitalCandidate[] } => {
  const scoredCandidates = candidates.map((candidate) => {
    // 1. Clinical Capability Fit (0-100)
    let clinicalFitScore = 70;
    if (domain === 'TRAUMA') {
      if (candidate.traumaLevel.toLowerCase().includes('level-1')) clinicalFitScore = 98;
      else if (candidate.traumaLevel.toLowerCase().includes('level-2')) clinicalFitScore = 75;
      else clinicalFitScore = 50;
    } else if (domain === 'SNAKEBITE') {
      if (candidate.specialtyFit.toLowerCase().includes('antivenom') || candidate.traumaLevel.toLowerCase().includes('envenomation')) clinicalFitScore = 98;
      else if (candidate.specialtyFit.toLowerCase().includes('toxicology')) clinicalFitScore = 85;
      else clinicalFitScore = 60;
    } else if (domain === 'POISONING') {
      if (candidate.specialtyFit.toLowerCase().includes('toxicology') || candidate.name.toLowerCase().includes('ramaiah')) clinicalFitScore = 98;
      else if (candidate.specialtyFit.toLowerCase().includes('icu')) clinicalFitScore = 80;
      else clinicalFitScore = 55;
    } else if (domain === 'RESPIRATORY_DISTRESS') {
      if (candidate.specialtyFit.toLowerCase().includes('pulmonary') || candidate.specialtyFit.toLowerCase().includes('icu')) clinicalFitScore = 98;
      else if (candidate.traumaLevel.toLowerCase().includes('tertiary')) clinicalFitScore = 85;
      else clinicalFitScore = 65;
    } else {
      clinicalFitScore = 75;
    }

    // 2. Availability Score (0-100)
    let availabilityScore = 85;
    const availLower = candidate.availability.toLowerCase();
    if (availLower.includes('diversion') || availLower.includes('busy') || availLower.includes('occupied') || availLower.includes('closed')) {
      availabilityScore = 20;
    } else if (availLower.includes('sterile') || availLower.includes('clear') || availLower.includes('open') || availLower.includes('isolated')) {
      availabilityScore = 95;
    }

    // 3. Corridor ETA Score (0-100)
    // Decays with longer ETA
    const etaScore = Math.max(0, Math.min(100, Math.round(100 - (candidate.etaMinutes * 3.5))));

    // Composite Normalized Score
    const matchScore = Math.round(
      0.40 * clinicalFitScore +
      0.30 * availabilityScore +
      0.30 * etaScore
    );

    return {
      ...candidate,
      clinicalFitScore,
      availabilityScore,
      etaScore,
      matchScore,
    };
  });

  // Sort descending by matchScore
  scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

  const topMatch = scoredCandidates[0];
  const updatedCandidates = scoredCandidates.map((c, idx) => ({
    ...c,
    isPrimary: idx === 0,
  }));

  const algorithmRationale = `${topMatch.name} ranked #1 with composite score ${topMatch.matchScore}% (Clinical Fit: ${topMatch.clinicalFitScore}%, Availability: ${topMatch.availabilityScore}%, Transit ETA: ${topMatch.etaMinutes} min). Evaluated across ${candidates.length} regional emergency receiving facilities.`;

  return {
    recommendedHospitalId: topMatch.id,
    algorithmRationale,
    candidates: updatedCandidates,
  };
};

/**
 * 4. Pure Functional State Machine Transitions
 */

export const startScenarioCase = (scenarioId: string): EmergencyCase => {
  const seed = allScenarios[scenarioId] || initialTraumaCase;
  const deepCopy: EmergencyCase = JSON.parse(JSON.stringify(seed));
  deepCopy.ambulance.effectiveEtaMinutes = calculateDerivedEta(deepCopy.ambulance);
  deepCopy.aiDecisionSupport = evaluateSimulationDecisionEngine(deepCopy.domain, deepCopy.currentVitals);
  deepCopy.agentTask = generateLocalAgentTask(deepCopy.domain, deepCopy.id, deepCopy.currentVitals);
  deepCopy.cdsDataStatus = 'NOT_SENT';
  delete deepCopy.cdsDataPackage;
  delete deepCopy.cdsDataSentAt;
  return deepCopy;
};

export const registerPatientState = (
  prevCase: EmergencyCase,
  patient: PatientProfile,
  timestamp?: string
): EmergencyCase => {
  const updatedCase: EmergencyCase = {
    ...prevCase,
    patient: { ...patient },
    conduitStep: Math.max(prevCase.conduitStep, 1),
  };

  updatedCase.timeline = appendTimelineEvent(
    updatedCase.timeline,
    {
      category: 'CLINICAL',
      title: 'Patient Profile Registered',
      detail: `Patient ${patient.name}, ${patient.age}y ${patient.sex} registered. Conscious: ${patient.consciousState}, GCS: ${patient.gcsScore}/15, Bleeding: ${patient.reportedBloodLoss}.`,
      actor: 'FIELD MEDIC',
      status: 'SUCCESS',
    },
    timestamp
  );

  return updatedCase;
};

export const triggerVitalDeteriorationState = (
  prevCase: EmergencyCase,
  newVitals: Omit<VitalSnapshot, 'timestamp'>,
  timestamp?: string
): EmergencyCase => {
  const timeStr = timestamp || new Date().toTimeString().split(' ')[0];
  const snapshot: VitalSnapshot = {
    ...newVitals,
    timestamp: timeStr,
    isAbnormal: true,
  };

  const updatedCase: EmergencyCase = {
    ...prevCase,
    currentVitals: snapshot,
    vitalsHistory: [...prevCase.vitalsHistory.slice(-9), snapshot],
  };

  updatedCase.timeline = appendTimelineEvent(
    updatedCase.timeline,
    {
      category: 'CLINICAL',
      title: 'Physiological Deterioration Event Detected',
      detail: `Telemetry drift: HR ${snapshot.heartRate} bpm, SpO2 ${snapshot.spo2}%, BP ${snapshot.systolicBp}/${snapshot.diastolicBp} mmHg, RR ${snapshot.respiratoryRate}/min.`,
      actor: 'FIELD MEDIC',
      status: 'CRITICAL',
    },
    timeStr
  );

  return updatedCase;
};

export const computeAiSignalState = (
  prevCase: EmergencyCase,
  timestamp?: string
): EmergencyCase => {
  const aiSignal = evaluateSimulationDecisionEngine(prevCase.domain, prevCase.currentVitals);
  const agentTask = generateLocalAgentTask(prevCase.domain, prevCase.id, prevCase.currentVitals);

  const updatedCase: EmergencyCase = {
    ...prevCase,
    aiDecisionSupport: aiSignal,
    agentTask,
  };

  updatedCase.timeline = appendTimelineEvent(
    updatedCase.timeline,
    {
      category: 'SYSTEM',
      title: `Simulation Decision Engine: ${aiSignal.riskLevel} Risk Signal`,
      detail: `${aiSignal.clinicalSignificance} Composite risk index: ${aiSignal.riskScore}/100. Signals: ${aiSignal.detectedSignals.join(' · ')}.`,
      actor: 'AI SUPPORT',
      status: aiSignal.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
    },
    timestamp
  );

  return updatedCase;
};

export const alertClinicianState = (
  prevCase: EmergencyCase,
  timestamp?: string
): EmergencyCase => {
  const updatedCase: EmergencyCase = {
    ...prevCase,
    clinicianAlertReceived: true,
    conduitStep: Math.max(prevCase.conduitStep, 3),
  };

  updatedCase.timeline = appendTimelineEvent(
    updatedCase.timeline,
    {
      category: 'SYSTEM',
      title: 'Remote Clinician Alert Transmitted',
      detail: `Telemetry stream and ${prevCase.aiDecisionSupport?.riskLevel || 'HIGH'} risk classification paged to on-call specialist ${prevCase.clinicianEndorsement?.clinicianName || 'Dr. Sunita Rao'}.`,
      actor: 'SYSTEM',
      status: 'WARNING',
    },
    timestamp
  );

  return updatedCase;
};

export const confirmClinicianProtocolState = (
  prevCase: EmergencyCase,
  clinicianId: string,
  clinicianName: string,
  action: 'CONFIRMED' | 'DATA_REQUESTED' | 'ESCALATED' | 'ACKNOWLEDGED' = 'CONFIRMED',
  notes?: string,
  authorizedProtocol?: string,
  timestamp?: string
): EmergencyCase => {
  const timeStr = timestamp || new Date().toTimeString().split(' ')[0];

  const protocolName = authorizedProtocol ||
    (prevCase.domain === 'TRAUMA' ? 'Trauma Resuscitation Pathway A' :
     prevCase.domain === 'POISONING' ? 'High-Dose Atropine & Airway Decontamination Protocol' :
     'Polyvalent Antivenom Infusion & Coagulopathy Protocol');

  const updatedCase: EmergencyCase = {
    ...prevCase,
    clinicianEndorsement: {
      status: action,
      clinicianName,
      clinicianId,
      timestamp: timeStr,
      notes: notes || `Protocol authorized: ${protocolName}`,
      authorizedProtocol: protocolName,
    },
    conduitStep: Math.max(prevCase.conduitStep, 3),
  };

  updatedCase.timeline = appendTimelineEvent(
    updatedCase.timeline,
    {
      category: 'CLINICAL',
      title: `Clinical Protocol Assessment: ${action}`,
      detail: `${clinicianName} (ID: ${clinicianId}) recorded endorsement at ${timeStr}. Protocol: ${protocolName}.`,
      actor: 'CLINICIAN',
      status: action === 'CONFIRMED' ? 'SUCCESS' : 'WARNING',
    },
    timeStr
  );

  return updatedCase;
};

export const recalculateFacilityMatchState = (
  prevCase: EmergencyCase,
  candidatesOverride?: HospitalCandidate[],
  timestamp?: string
): EmergencyCase => {
  const currentCandidates = candidatesOverride || prevCase.facilityMatching?.candidates || [];
  const matchingResult = calculateFacilityMatching(
    prevCase.domain,
    prevCase.ambulance.baseEtaMinutes,
    currentCandidates
  );

  const updatedCase: EmergencyCase = {
    ...prevCase,
    facilityMatching: matchingResult,
    ambulance: {
      ...prevCase.ambulance,
      assignedHospital: matchingResult.candidates[0].name,
    },
    conduitStep: Math.max(prevCase.conduitStep, 4),
  };

  updatedCase.timeline = appendTimelineEvent(
    updatedCase.timeline,
    {
      category: 'SYSTEM',
      title: `Facility Allocation Recalculated: ${matchingResult.candidates[0].name}`,
      detail: matchingResult.algorithmRationale,
      actor: 'SYSTEM',
      status: 'INFO',
    },
    timestamp
  );

  return updatedCase;
};

export const dispatchHospitalPreAlertState = (
  prevCase: EmergencyCase,
  timestamp?: string
): EmergencyCase => {
  const timeStr = timestamp || new Date().toTimeString().split(' ')[0];
  const assignedBay = prevCase.hospitalReadiness?.assignedBay || 'Resuscitation Bay 1';

  const updatedCase: EmergencyCase = {
    ...prevCase,
    hospitalReadiness: {
      status: 'PRE_ALERT_TRANSMITTED',
      assignedBay,
      timestamp: timeStr,
      isPreAlertDispatched: true,
      isPreAlertAcknowledged: false,
      resourcesReady: prevCase.hospitalReadiness?.resourcesReady || [],
    },
    conduitStep: Math.max(prevCase.conduitStep, 4),
  };

  updatedCase.timeline = appendTimelineEvent(
    updatedCase.timeline,
    {
      category: 'SYSTEM',
      title: 'Hospital Pre-Alert Dispatched',
      detail: `Pre-alert transmitted to ${prevCase.ambulance.assignedHospital}. Case telemetry and specialist protocol shared in advance of arrival.`,
      actor: 'SYSTEM',
      status: 'INFO',
    },
    timeStr
  );

  return updatedCase;
};

export const acknowledgeHospitalPreAlertState = (
  prevCase: EmergencyCase,
  acknowledgedBy: string = 'Sister Philomina, RN · Charge Nurse',
  timestamp?: string
): EmergencyCase => {
  const timeStr = timestamp || new Date().toTimeString().split(' ')[0];

  const updatedCase: EmergencyCase = {
    ...prevCase,
    hospitalReadiness: {
      ...(prevCase.hospitalReadiness || { assignedBay: 'Resuscitation Bay 1', resourcesReady: [] }),
      status: 'ACCEPTED',
      isPreAlertAcknowledged: true,
      acknowledgedAt: timeStr,
      confirmedBy: acknowledgedBy,
    },
  };

  updatedCase.timeline = appendTimelineEvent(
    updatedCase.timeline,
    {
      category: 'SYSTEM',
      title: 'Hospital Pre-Alert Formally Acknowledged',
      detail: `Receiving ED coordinator (${acknowledgedBy}) acknowledged case pre-alert at ${timeStr}. Staff mobilised.`,
      actor: 'RECEIVING ED',
      status: 'SUCCESS',
    },
    timeStr
  );

  return updatedCase;
};

export const confirmHospitalBayReadyState = (
  prevCase: EmergencyCase,
  bayName?: string,
  confirmedBy: string = 'Sister Philomina, RN · Charge Nurse',
  timestamp?: string
): EmergencyCase => {
  const timeStr = timestamp || new Date().toTimeString().split(' ')[0];
  const bay = bayName || prevCase.hospitalReadiness?.assignedBay || 'Trauma Bay 1 (Red Zone)';

  const updatedCase: EmergencyCase = {
    ...prevCase,
    hospitalReadiness: {
      status: 'BAY_READY',
      assignedBay: bay,
      confirmedBy,
      timestamp: timeStr,
      isPreAlertDispatched: true,
      isPreAlertAcknowledged: true,
      acknowledgedAt: prevCase.hospitalReadiness?.acknowledgedAt || timeStr,
      bedNumber: prevCase.hospitalReadiness?.bedNumber || 'ICU-B1',
      resourcesReady: [
        ...(prevCase.hospitalReadiness?.resourcesReady || []),
        'Bay Sterile & Equipment Verified Ready',
      ],
    },
    conduitStep: Math.max(prevCase.conduitStep, 5),
  };

  updatedCase.timeline = appendTimelineEvent(
    updatedCase.timeline,
    {
      category: 'SYSTEM',
      title: `Hospital Readiness Confirmed: ${bay} Sterile & Ready`,
      detail: `${confirmedBy} confirmed bay sterile clearance and standby surgical/clinical team for patient ${prevCase.patient.name}.`,
      actor: 'RECEIVING ED',
      status: 'SUCCESS',
    },
    timeStr
  );

  return updatedCase;
};

export const setTrafficDelayState = (
  prevCase: EmergencyCase,
  additionalDelayMinutes: number = 8,
  timestamp?: string
): EmergencyCase => {
  const newDelay = (prevCase.ambulance.trafficDelayMinutes || 0) + additionalDelayMinutes;
  const updatedAmbulance: AmbulanceUnit = {
    ...prevCase.ambulance,
    trafficDelayMinutes: newDelay,
    isTrafficDelayed: true,
    currentSpeedKmH: Math.max(15, prevCase.ambulance.currentSpeedKmH - 20),
  };

  const newDerivedEta = calculateDerivedEta(updatedAmbulance);
  updatedAmbulance.effectiveEtaMinutes = newDerivedEta;

  const updatedCase: EmergencyCase = {
    ...prevCase,
    ambulance: updatedAmbulance,
  };

  updatedCase.timeline = appendTimelineEvent(
    updatedCase.timeline,
    {
      category: 'SYSTEM',
      title: `Transport Delay Incurred: +${additionalDelayMinutes} Mins`,
      detail: `Heavy corridor congestion on Ring Road arterial. Single derived ETA updated to ${newDerivedEta} mins across all workspaces.`,
      actor: 'SYSTEM',
      status: 'WARNING',
    },
    timestamp
  );

  return updatedCase;
};

export const continueCareInTransitState = (
  prevCase: EmergencyCase,
  actionDetail?: string,
  timestamp?: string
): EmergencyCase => {
  const detail = actionDetail ||
    (prevCase.domain === 'TRAUMA' ? 'Warm crystalloid IV titration continuing under pressure infuser; serial BP monitoring active.' :
     prevCase.domain === 'POISONING' ? 'Continuous oral/bronchial suction and 100% O2 delivery sustained without interruption.' :
     'Pressure immobilization bandage monitored; limb elevation and serial 20WBCT clot watch maintained.');

  const updatedCase: EmergencyCase = {
    ...prevCase,
  };

  updatedCase.timeline = appendTimelineEvent(
    updatedCase.timeline,
    {
      category: 'CLINICAL',
      title: 'Care Continues Without Interruption in Transit',
      detail,
      actor: 'FIELD MEDIC',
      status: 'SUCCESS',
    },
    timestamp
  );

  return updatedCase;
};

export const sendCaseDataToCdsState = (
  prevCase: EmergencyCase,
  timestamp?: string
): EmergencyCase => {
  const timeStr = timestamp || new Date().toTimeString().split(' ')[0];

  const shockIdx = prevCase.currentVitals.systolicBp > 0
    ? (prevCase.currentVitals.heartRate / prevCase.currentVitals.systolicBp).toFixed(2)
    : '0.00';

  const observations: string[] = [
    `Conscious status: ${prevCase.patient.consciousState} (GCS ${prevCase.patient.gcsScore}/15)`,
    `External bleeding assessment: ${prevCase.patient.reportedBloodLoss}`,
    `Presenting incident: ${prevCase.patient.incidentType} - ${prevCase.patient.chiefComplaint}`,
    `Calculated Shock Index: ${shockIdx}`,
  ];

  if (prevCase.domain === 'POISONING') {
    observations.push('Observable SLUDGE toxidrome markers: miosis, excessive salivation, bronchospasm');
  } else if (prevCase.domain === 'SNAKEBITE') {
    observations.push('Local hemotoxic edema spreading >10cm from bite site; 20WBCT whole blood test tube drawn');
  } else {
    observations.push('High-velocity blunt impact; suspected pelvic disruption and internal retroperitoneal hemorrhage');
  }

  const recordedInterventions = prevCase.timeline
    .filter(evt => evt.actor === 'FIELD MEDIC' && evt.title.includes('Intervention Recorded'))
    .map(evt => evt.detail);

  const finalInterventions = recordedInterventions.length > 0
    ? recordedInterventions
    : [
        prevCase.domain === 'POISONING'
          ? 'High-flow O2 via BVM, oral secretions suctioned'
          : prevCase.domain === 'SNAKEBITE'
          ? 'Limb splinted at heart level, puncture site demarcated'
          : 'Cervical collar verified, pelvic circumferential compression binder secured, 16G large-bore IV active'
      ];

  const cdsPackage: CdsDataPackage = {
    caseId: prevCase.id,
    patient: { ...prevCase.patient },
    vitals: { ...prevCase.currentVitals },
    recentInterventions: finalInterventions,
    observations,
    etaMinutes: calculateDerivedEta(prevCase.ambulance),
    trafficDelayMinutes: prevCase.ambulance.trafficDelayMinutes || 0,
    sentAt: timeStr,
    source: `Ambulance Unit (${prevCase.ambulance.callSign || 'Echo-4'})`,
  };

  const updatedCase: EmergencyCase = {
    ...prevCase,
    cdsDataStatus: 'SENT',
    cdsDataPackage: cdsPackage,
    cdsDataSentAt: timeStr,
    conduitStep: Math.max(prevCase.conduitStep, 2),
  };

  updatedCase.timeline = appendTimelineEvent(
    updatedCase.timeline,
    {
      category: 'CLINICAL',
      title: 'Data Package Sent: Ambulance → CDS',
      detail: `Telemetry & clinical assessment package transmitted for tele-specialist review. HR: ${prevCase.currentVitals.heartRate} bpm, BP: ${prevCase.currentVitals.systolicBp}/${prevCase.currentVitals.diastolicBp}, SpO2: ${prevCase.currentVitals.spo2}%.`,
      actor: 'FIELD MEDIC',
      status: 'SUCCESS',
    },
    timeStr
  );

  return updatedCase;
};

/**
 * 8. Phase 18 Prehospital Handover Package Generator (Offline Simulation Engine)
 */
export const generateLocalHandoverPackage = (
  c: EmergencyCase,
  actorName: string = 'Sister Philomina, RN',
  actorRole: string = 'HOSPITAL_COMMAND'
): PrehospitalHandoverPackage => {
  const timeStr = new Date().toLocaleTimeString('en-GB');
  const packageId = `hop-${c.id.toLowerCase()}-local`;

  const vitalItems = c.vitalsHistory.map((v, idx) => ({
    id: `v-${idx + 1}`,
    timestamp: v.timestamp,
    heartRate: v.heartRate,
    spo2: v.spo2,
    systolicBp: v.systolicBp,
    diastolicBp: v.diastolicBp,
    respiratoryRate: v.respiratoryRate,
    temperatureC: v.temperatureC,
    isAbnormal: v.isAbnormal,
    sourceEventId: `evt-vital-${idx + 1}`
  }));

  const latestVital = vitalItems[vitalItems.length - 1] || {
    timestamp: timeStr,
    heartRate: c.currentVitals.heartRate,
    spo2: c.currentVitals.spo2,
    systolicBp: c.currentVitals.systolicBp,
    diastolicBp: c.currentVitals.diastolicBp,
    respiratoryRate: c.currentVitals.respiratoryRate,
    temperatureC: c.currentVitals.temperatureC,
    isAbnormal: c.currentVitals.isAbnormal,
    sourceEventId: 'evt-vital-current'
  };

  const observations = c.timeline
    .filter(evt => evt.category === 'CLINICAL' && evt.title.toLowerCase().includes('observation'))
    .map(evt => ({
      id: evt.id,
      timestamp: evt.timestamp,
      text: evt.detail,
      actor: evt.actor,
      sourceEventId: evt.id
    }));

  const interventions = c.timeline
    .filter(evt => evt.title.toLowerCase().includes('intervention'))
    .map(evt => ({
      id: evt.id,
      timestamp: evt.timestamp,
      actionLabel: evt.title.replace('Intervention Recorded: ', ''),
      detailText: evt.detail,
      actor: evt.actor,
      status: 'SUCCESS',
      sourceEventId: evt.id
    }));

  const decisionSupport = c.aiDecisionSupport ? [{
    signalId: c.aiDecisionSupport.signalId || 'sig-local-1',
    signalType: c.aiDecisionSupport.signalType || 'OBSERVABLE_SIGNAL',
    title: c.aiDecisionSupport.title || 'Clinical Signal',
    observedData: c.aiDecisionSupport.observedData || '',
    explanation: c.aiDecisionSupport.explanation || c.aiDecisionSupport.clinicalSignificance || '',
    provider: c.aiDecisionSupport.provider || 'DemoDecisionSupportProvider',
    providerVersion: c.aiDecisionSupport.providerVersion || '1.0.0',
    safetyLabel: c.aiDecisionSupport.safetyLabel || 'SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS',
    requiresClinicianReview: c.aiDecisionSupport.requiresClinicianReview ?? true,
    status: c.aiDecisionSupport.status || 'NEW',
    sourceEventIds: c.aiDecisionSupport.relevantTimelineEventIds || []
  }] : [];

  const clinicianReviews = c.clinicianEndorsement ? [{
    id: 'cr-1',
    action: c.clinicianEndorsement.status,
    clinicianId: c.clinicianEndorsement.clinicianId || 'DOC-482',
    clinicianName: c.clinicianEndorsement.clinicianName || 'Dr. Sunita Rao, MD',
    timestamp: c.clinicianEndorsement.timestamp || timeStr,
    notes: c.clinicianEndorsement.notes,
    reviewPlanTitle: c.clinicianEndorsement.authorizedProtocol,
    sourceEventId: 'evt-clinician-endorsement'
  }] : [];

  const topCandidate = c.facilityMatching?.candidates.find(cand => cand.isPrimary) || c.facilityMatching?.candidates[0];

  const destination = {
    facilityId: topCandidate?.id || 'FAC-1',
    name: topCandidate?.name || c.ambulance.assignedHospital,
    traumaLevel: topCandidate?.traumaLevel || 'Level-1 Trauma Center',
    distanceKm: topCandidate?.distanceKm || 7.2,
    etaMinutes: topCandidate?.etaMinutes || calculateDerivedEta(c.ambulance),
    matchScore: topCandidate?.matchScore || 95,
    specialtyFit: topCandidate?.specialtyFit || 'Comprehensive Emergency Care'
  };

  const readiness = {
    status: c.hospitalReadiness?.status || 'BAY_READY',
    assignedBay: c.hospitalReadiness?.assignedBay || 'Trauma Bay 1 (Red Zone)',
    confirmedBy: c.hospitalReadiness?.confirmedBy || 'Sister Philomina, RN',
    timestamp: c.hospitalReadiness?.timestamp || timeStr,
    bedNumber: c.hospitalReadiness?.bedNumber,
    resourcesReady: c.hospitalReadiness?.resourcesReady || [],
    isBayReady: c.hospitalReadiness?.status === 'BAY_READY',
    sourceEventId: 'evt-bay-ready'
  };

  const eventTimeline = c.timeline.map(evt => ({
    id: evt.id,
    version: evt.version || 1,
    timestamp: evt.timestamp,
    category: evt.category,
    title: evt.title,
    detail: evt.detail,
    actor: evt.actor,
    status: evt.status
  }));

  // Deterministic digest
  const hashSeed = `${c.id}-${c.patient.name}-${c.currentVitals.heartRate}-${timeStr}`;
  let hashVal = 0;
  for (let i = 0; i < hashSeed.length; i++) {
    hashVal = ((hashVal << 5) - hashVal) + hashSeed.charCodeAt(i);
    hashVal |= 0;
  }
  const digest = Math.abs(hashVal).toString(16).padStart(64, 'a');

  return {
    packageId,
    caseId: c.id,
    caseVersion: c.timeline.length,
    generatedAt: timeStr,
    generatedBy: {
      id: 'usr-local',
      name: actorName,
      role: actorRole
    },
    status: 'GENERATED',
    patient: { ...c.patient },
    incident: {
      domain: c.domain,
      scenarioTitle: c.scenarioTitle,
      status: c.status,
      conduitStep: c.conduitStep
    },
    transport: {
      callSign: c.ambulance.callSign,
      crewLead: c.ambulance.crewLead,
      currentSpeedKmH: c.ambulance.currentSpeedKmH,
      baseEtaMinutes: c.ambulance.baseEtaMinutes,
      trafficDelayMinutes: c.ambulance.trafficDelayMinutes,
      effectiveEtaMinutes: calculateDerivedEta(c.ambulance),
      isTrafficDelayed: c.ambulance.isTrafficDelayed,
      assignedHospital: c.ambulance.assignedHospital,
      coordinates: c.ambulance.coordinates
    },
    latestVitals: latestVital,
    vitalTimeline: vitalItems,
    observations,
    interventions,
    decisionSupport,
    clinicianReviews,
    destination,
    readiness,
    eventTimeline,
    provenance: {
      sourceCaseVersion: c.timeline.length,
      sourceEventCount: c.timeline.length,
      generatedTimestamp: timeStr,
      contentDigestSha256: digest,
      generatorEngine: 'PRANA-Prehospital-Handover-Engine-v1.0 (Local Simulation)'
    },
    completeness: {
      isComplete: true,
      completenessPercentage: 100,
      missingFields: [],
      itemsFound: [
        'Patient Demographics & Chief Complaint',
        'Recorded Physiological Vitals',
        'Transit Unit & Corridor',
        'Destination Facility',
        'Hospital Bay Allocation'
      ]
    },
    safetyNotice: 'This prototype prehospital handover package is generated from demonstration records and does not constitute a clinically validated medical record.',
    integrityHash: digest
  };
};

/**
 * 9. Explicit Patient Arrival State Transition
 * Triggered explicitly by operator/field medic action when ambulance reaches destination.
 */
export const markPatientArrivedState = (
  prevCase: EmergencyCase,
  facility?: string,
  notes?: string,
  timestamp?: string
): EmergencyCase => {
  const timeStr = timestamp || new Date().toTimeString().split(' ')[0];
  const targetFacility = facility || prevCase.ambulance.assignedHospital || 'Receiving Facility';

  const updatedCase: EmergencyCase = {
    ...prevCase,
    status: 'ARRIVED',
    conduitStep: Math.max(prevCase.conduitStep, 6),
    ambulance: {
      ...prevCase.ambulance,
      baseEtaMinutes: 0,
      trafficDelayMinutes: 0,
      currentSpeedKmH: 0,
    },
  };

  updatedCase.timeline = appendTimelineEvent(
    updatedCase.timeline,
    {
      category: 'CLINICAL',
      title: 'Ambulance Arrived at Receiving Facility',
      detail: `Transport unit arrived at ${targetFacility}. Patient staged for immediate transfer of care.` + (notes ? ` (${notes})` : ''),
      actor: 'FIELD MEDIC',
      status: 'SUCCESS',
    },
    timeStr
  );

  return updatedCase;
};

/**
 * 10. Operational Prehospital Handover Initiation
 * Paramedic initiates formal transfer-of-care handover with receiving team.
 */
export const initiateHandoverState = (
  prevCase: EmergencyCase,
  notes?: string,
  timestamp?: string
): EmergencyCase => {
  const timeStr = timestamp || new Date().toTimeString().split(' ')[0];

  const updatedCase: EmergencyCase = {
    ...prevCase,
    conduitStep: Math.max(prevCase.conduitStep, 7),
    handoverStatus: 'READY',
  };

  updatedCase.timeline = appendTimelineEvent(
    updatedCase.timeline,
    {
      category: 'CLINICAL',
      title: 'Prehospital Handover Initiated',
      detail: 'Field Paramedic initiated formal transfer of care to receiving emergency team.' + (notes ? ` Notes: ${notes}` : ''),
      actor: 'FIELD MEDIC',
      status: 'INFO',
    },
    timeStr
  );

  return updatedCase;
};

/**
 * 11. Operational Transfer of Care Acceptance & Completion
 * Receiving facility accepts handover, closing the prehospital transit mission.
 */
export const acceptHandoverState = (
  prevCase: EmergencyCase,
  notes?: string,
  timestamp?: string
): EmergencyCase => {
  const timeStr = timestamp || new Date().toTimeString().split(' ')[0];
  const hospitalName = prevCase.ambulance.assignedHospital || 'Receiving Facility';

  let updatedCase: EmergencyCase = {
    ...prevCase,
    status: 'TRANSFER_COMPLETED',
    conduitStep: Math.max(prevCase.conduitStep, 8),
    handoverStatus: 'ACKNOWLEDGED',
  };

  updatedCase.timeline = appendTimelineEvent(
    updatedCase.timeline,
    {
      category: 'CLINICAL',
      title: 'Prehospital Transfer of Care Accepted',
      detail: 'Receiving Emergency Department accepted full clinical transfer of care.' + (notes ? ` Notes: ${notes}` : ''),
      actor: 'RECEIVING ED',
      status: 'SUCCESS',
    },
    timeStr
  );

  updatedCase.timeline = appendTimelineEvent(
    updatedCase.timeline,
    {
      category: 'SYSTEM',
      title: 'Transfer of Care Completed',
      detail: `Prehospital transport mission closed. Patient care successfully transitioned to ${hospitalName}.`,
      actor: 'RECEIVING ED',
      status: 'SUCCESS',
    },
    timeStr
  );

  return updatedCase;
};

/**
 * 12. Hospital Escalation Acknowledgement State
 * Hospital Command confirms receipt of clinician escalation.
 */
export const acknowledgeHospitalEscalationState = (
  prevCase: EmergencyCase,
  notes?: string,
  timestamp?: string
): EmergencyCase => {
  const timeStr = timestamp || new Date().toTimeString().split(' ')[0];

  const updatedCase: EmergencyCase = {
    ...prevCase,
    clinicianEndorsement: prevCase.clinicianEndorsement ? {
      ...prevCase.clinicianEndorsement,
      escalationAcknowledgedBy: 'Receiving Emergency Team',
      escalationAcknowledgedAt: timeStr,
      escalationNotes: notes || 'Resuscitation team alerted and standing by.',
    } : undefined,
  };

  updatedCase.timeline = appendTimelineEvent(
    updatedCase.timeline,
    {
      category: 'CLINICAL',
      title: 'Hospital Escalation Acknowledged',
      detail: 'Receiving Emergency Department formally acknowledged the urgent specialist escalation.' + (notes ? ` Notes: ${notes}` : ''),
      actor: 'RECEIVING ED',
      status: 'SUCCESS',
    },
    timeStr
  );

  return updatedCase;
};
