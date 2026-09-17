import type { 
  EmergencyCase, 
  EmergencyDomain, 
  VitalSnapshot, 
  PatientProfile, 
  HospitalCandidate, 
  AiDecisionSupport, 
  TimelineEvent,
  AmbulanceUnit,
  CdsDataPackage 
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
      clinicalSignificance = 'Pattern indicates acute decompensating hemorrhagic hypovolemic shock.';
      nextStepRecommendation = 'Immediate tele-clinician review: authorize aggressive fluid resuscitation & activate Level-1 massive transfusion protocol.';
    } else if (shockIndex > 0.9 || vitals.heartRate > 105) {
      riskLevel = 'HIGH';
      riskScore = 78;
      clinicalSignificance = 'Compensated shock pattern: persistent tachycardia and narrow pulse pressure.';
      nextStepRecommendation = 'Remote trauma specialist review requested; confirm large-bore IV access.';
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
  }

  return {
    riskLevel,
    riskScore,
    detectedSignals: signals,
    clinicalSignificance,
    nextStepRecommendation,
    isReviewed: false,
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

  const updatedCase: EmergencyCase = {
    ...prevCase,
    aiDecisionSupport: aiSignal,
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
