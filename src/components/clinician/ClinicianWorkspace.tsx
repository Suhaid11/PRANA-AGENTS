import React, { useState } from 'react';
import { useEmergency } from '../../context/useEmergency';
import { useAuth } from '../../auth/AuthContext';
import { CareConduit } from '../conduit/CareConduit';
import { CareRail } from '../timeline/CareRail';
import { 
  CheckCircle2, 
  FileQuestion, 
  ArrowUpRight, 
  Check, 
  Activity, 
  ShieldCheck, 
  Radio, 
  AlertTriangle,
  Sparkles,
  Info,
  AlertCircle,
  FileText
} from 'lucide-react';
import { PrehospitalHandoverPanel } from '../handover/PrehospitalHandoverPanel';
import { AgentActivityPanel } from './AgentActivityPanel';


export const ClinicianWorkspace: React.FC = () => {
  const { activeCase, endorseProtocol, derivedEta, setActiveRole, requestFieldData } = useEmergency();
  const { user, role, hasPermission, notifyUnauthorizedAction } = useAuth();
  const { currentVitals, patient, ambulance, domain, clinicianEndorsement, hospitalReadiness } = activeCase;

  const [clinicianNotes, setClinicianNotes] = useState<string>('');
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);

  const currentStatus = clinicianEndorsement?.status || 'PENDING';
  const clinicianName = user?.displayName || clinicianEndorsement?.clinicianName || 'Dr. Sunita Rao, MD';
  const clinicianId = user?.id || clinicianEndorsement?.clinicianId || 'DOC-482';

  const defaultProtocol = 
    domain === 'TRAUMA' ? 'Trauma Resuscitation Pathway A' :
    domain === 'POISONING' ? 'High-Dose Atropine & Airway Decontamination Protocol' :
    domain === 'SNAKEBITE' ? 'Polyvalent Antivenom Infusion & Coagulopathy Protocol' :
    domain === 'RESPIRATORY_DISTRESS' ? 'High-Flow Oxygen & Bronchospasm Protocol' :
    'Standard Emergency Stabilization & Tele-Specialist Protocol';

  const shockIndex = (currentVitals.heartRate / (currentVitals.systolicBp || 1)).toFixed(2);
  const recentInterventions = activeCase.timeline.filter((e) => e.actor === 'FIELD MEDIC');

  const canEndorse = hasPermission('CLINICIAN_REVIEW');

  const handleExecuteProtocol = (action: 'CONFIRMED' | 'DATA_REQUESTED' | 'ESCALATED' | 'ACKNOWLEDGED') => {
    if (!canEndorse) {
      notifyUnauthorizedAction(
        action === 'CONFIRMED' ? 'Confirm Review Plan' : action,
        `Role '${role || 'ANONYMOUS'}' lacks clinical endorsement privileges. Clinical protocol actions require qualified Remote Tele-Specialist authority.`,
        'REMOTE_CLINICIAN'
      );
      return;
    }
    endorseProtocol(
      action,
      clinicianNotes || undefined,
      clinicianId,
      clinicianName,
      defaultProtocol
    );
    setClinicianNotes('');
  };

  // Scenario-specific Demonstration Clinical Review Plan
  const getReviewPlan = () => {
    if (domain === 'TRAUMA') {
      return {
        title: 'TRAUMA STABILIZATION & RECEIVING-FACILITY READINESS REVIEW',
        surfacedReason: 'Persistent tachycardia (109+ bpm) with narrowing pulse pressure (PP < 35 mmHg) and elevated Shock Index (1.14).',
        observations: [
          'Vital Trend: HR 109 bpm, BP 98/64, SpO2 89% drift',
          'Hemodynamics: Shock Index 1.14 (elevated risk of retroperitoneal hemorrhage)',
          'Neurological: Alert (AVPU), GCS 14/15 (E4V4M6)',
          'Injury Findings: Suspected pelvic ring disruption, blunt abdominal impact',
          'Field Measures: 16G large-bore IV, warm crystalloid line, pelvic circumferential binder secured',
          'Receiving Suite: Manipal Hospital Level-1 Trauma Suite · 24/7 Angio-embolization',
        ],
        coordinationFocus: 'Structured hemodynamic monitoring + trauma surgical team pre-alert + Red Zone Bay 1 preparation.',
        recommendedAction: 'Confirm review plan to authorize trauma bay staging and angio-embolization readiness without delay.',
      };
    } else if (domain === 'SNAKEBITE') {
      return {
        title: 'ENVENOMATION MONITORING & TRANSFER READINESS REVIEW',
        surfacedReason: 'Russell\'s viper envenomation pattern with ascending local tissue edema (>10 cm margin) and 20WBCT whole blood clotting vulnerability.',
        observations: [
          'Envenomation Context: Viperid fang puncture right lower limb, ascending edema > 10cm',
          'Vital Trend: HR 104 bpm, BP 104/68, SpO2 96% stable',
          'Coagulation Watch: 20WBCT glass tube sample drawn; timer active for clot failure detection',
          'Field Measures: Pressure immobilization bandage at heart level; tourniquets strictly avoided',
          'Receiving Suite: Victoria Hospital Regional Toxicology & Antivenom Center',
        ],
        coordinationFocus: 'Serial edema margin tracking + continuous 20WBCT watch + 10 vials polyvalent ASV cold-chain reserve staging.',
        recommendedAction: 'Confirm review plan to endorse non-tourniquet immobilization and stage antivenom units.',
      };
    } else if (domain === 'POISONING') {
      return {
        title: 'TOXICOLOGY STABILIZATION & RESPIRATORY MONITORING REVIEW',
        surfacedReason: 'Organophosphate pesticide inhalation triggering severe vagal bradycardia (HR 54 bpm) and copious bronchorrhea.',
        observations: [
          'Exposure Context: Agricultural organophosphate vapor inhalation in enclosed greenhouse',
          'Vital Trend: Severe bradycardia 54 bpm, SpO2 90% (pulmonary secretional compromise)',
          'Clinical Picture: SLUDGE syndrome (salivation, lacrimation, urination, defecation, GI upset, emesis)',
          'Field Measures: Continuous airway suctioning, dermal decontamination wash, bag-valve mask O2 with PEEP',
          'Receiving Suite: MS Ramaiah Medical Center Dedicated Toxicology ICU · Bay 4',
        ],
        coordinationFocus: 'Continuous mechanical airway suctioning + ICU preparation for high-dose atropine infusion & pralidoxime staging.',
        recommendedAction: 'Confirm review plan to stage mechanical ventilator and atropine reserve at receiving ICU.',
      };
    } else if (domain === 'RESPIRATORY_DISTRESS') {
      return {
        title: 'ACUTE RESPIRATORY STABILIZATION & ICU CORRIDOR REVIEW',
        surfacedReason: `Severe hypoxemia (SpO2 ${currentVitals.spo2}%) and tachypnea (RR ${currentVitals.respiratoryRate}/min) indicating impending respiratory fatigue.`,
        observations: [
          `Telemetry Stream: SpO2 ${currentVitals.spo2}%, RR ${currentVitals.respiratoryRate}/min, HR ${currentVitals.heartRate} bpm`,
          'Airway Assessment: Bilateral bronchospasm, increased work of breathing, accessory muscle use',
          'Field Stabilization: High-flow O2, nebulized bronchodilators, large-bore IV access',
          `Destination Fit: ${ambulance.assignedHospital}`,
        ],
        coordinationFocus: 'High-flow oxygenation endpoints + non-invasive ventilation standby + respiratory isolation bay staging.',
        recommendedAction: 'Confirm clinical review plan to endorse non-invasive ventilation and stage respiratory ICU team.',
      };
    } else {
      return {
        title: 'TELE-SPECIALIST EMERGENCY CARE & INBOUND CORRIDOR REVIEW',
        surfacedReason: `Active clinical telemetry evaluation: HR ${currentVitals.heartRate} bpm, SpO2 ${currentVitals.spo2}%, NIBP ${currentVitals.systolicBp}/${currentVitals.diastolicBp} mmHg.`,
        observations: [
          `Patient: ${patient.name} (${patient.age}y ${patient.sex})`,
          `Incident: ${patient.incidentType} — ${patient.chiefComplaint}`,
          `Vitals: HR ${currentVitals.heartRate} bpm, SpO2 ${currentVitals.spo2}%, RR ${currentVitals.respiratoryRate}/min`,
          `Receiving Facility: ${ambulance.assignedHospital} (ETA ${derivedEta} min)`,
        ],
        coordinationFocus: 'Continuous vital monitoring + receiving emergency facility pre-alert coordination.',
        recommendedAction: 'Confirm review plan to endorse active field stabilization protocol.',
      };
    }
  };

  const reviewPlan = getReviewPlan();
  const [isDataRequestModalOpen, setIsDataRequestModalOpen] = useState(false);
  const [pendingReqField, setPendingReqField] = useState<string>('');
  const [pendingReqReason, setPendingReqReason] = useState<string>('');
  const [pendingReqPriority, setPendingReqPriority] = useState<'CRITICAL' | 'HIGH' | 'MODERATE'>('CRITICAL');

  const handleConfirmTransmitRequest = () => {
    if (!pendingReqField.trim()) return;
    requestFieldData(pendingReqField.trim(), pendingReqReason.trim() || undefined, pendingReqPriority);
    setIsDataRequestModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 py-2">
      
      {/* 1. Top Editorial Headline & Live Authority Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-black text-[#0E62FE] uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>Tele-Specialist Authority · Clinical Review Console</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-[0.95]">
            Clinical <br />
            <span className="text-slate-400 font-normal">Decision Support.</span>
          </h1>
        </div>

        {/* Prominent High-Contrast Status Badge */}
        <div className="flex items-center gap-2">
          {currentStatus === 'CONFIRMED' ? (
            <span className="px-4 py-2 rounded-full text-xs font-black border shadow-xs bg-emerald-50 text-emerald-800 border-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>PROTOCOL ENDORSED · {clinicianName.toUpperCase()} ({clinicianId})</span>
            </span>
          ) : currentStatus === 'ESCALATED' ? (
            <span className="px-4 py-2 rounded-full text-xs font-black border shadow-xs bg-rose-50 text-rose-800 border-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>ESCALATED TO SURGICAL TRAUMA SUITE</span>
            </span>
          ) : currentStatus === 'DATA_REQUESTED' ? (
            <span className="px-4 py-2 rounded-full text-xs font-black border shadow-xs bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-amber-600" />
              <span>DATA CLARIFICATION REQUESTED</span>
            </span>
          ) : (
            <span className="px-4 py-2 rounded-full text-xs font-black border shadow-xs bg-gradient-to-r from-blue-50 to-cyan-50 text-[#0E62FE] border-blue-300 flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#0E62FE] animate-pulse" />
              <span>REVIEW REQUIRED · LIVE STREAM SYNCHRONIZED</span>
            </span>
          )}

          <button
            onClick={() => setIsHandoverOpen(true)}
            className="px-3.5 py-2 rounded-full text-xs font-black border shadow-xs bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#0E62FE]" />
            <span>Handover Package</span>
          </button>
        </div>
      </div>

      {/* 2. Clinical Care Conduit (Paramedic <---> Tele-Specialist Waveform Link) */}
      <CareConduit variant="clinical" />

      {/* Active Clinical Data Request Banner */}
      {activeCase.pendingDataRequest && (
        activeCase.pendingDataRequest.status === 'PENDING' ? (
          <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                <FileQuestion className="w-5 h-5 text-amber-700 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    REQUEST SENT TO FIELD MEDIC · AWAITING FIELD RESPONSE
                  </span>
                  <span className="text-[10px] font-mono font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    {activeCase.pendingDataRequest.priority} PRIORITY
                  </span>
                </div>
                <p className="text-xs text-amber-900 font-medium mt-0.5">
                  Requested: <strong className="text-amber-950 font-bold">{activeCase.pendingDataRequest.field}</strong> — {activeCase.pendingDataRequest.reason}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono text-amber-800 font-bold block">Target: Field Medic ({ambulance.callSign})</span>
              <span className="text-[10px] font-mono text-amber-600 block">Sent at {activeCase.pendingDataRequest.timestamp}</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50/90 border-2 border-emerald-300 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-200 text-emerald-900 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                    FIELD MEDIC OBSERVATION RECEIVED
                  </span>
                  <span className="text-[10px] font-mono font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                    FULFILLED
                  </span>
                </div>
                <p className="text-xs text-emerald-900 font-medium mt-0.5">
                  <strong>{activeCase.pendingDataRequest.field}:</strong> &ldquo;{activeCase.pendingDataRequest.response}&rdquo;
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono text-emerald-800 font-bold block">From: {activeCase.pendingDataRequest.respondedBy || 'Field Medic'}</span>
              <span className="text-[10px] font-mono text-emerald-600 block">At {activeCase.pendingDataRequest.respondedAt}</span>
            </div>
          </div>
        )
      )}

      {/* 3. Main Clinical Review Canvas: What Changed? / Why It Matters / Specialist Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT / CENTER COLUMN (7 cols): Signals Synthesis & Authoritative Protocol Console */}
        <div className="lg:col-span-7 flex flex-col gap-5 min-w-0">
          
          {/* WHAT CHANGED? Real-Time Sensor Telemetry Drift Banner */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0E62FE]" />
                <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider">
                  Live Ambulance Telemetry · Read-Only Stream
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                Read-Only · Inbound Telemetry
              </span>
            </div>


            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Heart Rate</span>
                <span className="text-xl sm:text-2xl font-black font-tabular text-slate-950 mt-0.5 block">
                  {currentVitals.heartRate} <span className="text-xs text-slate-500 font-bold">bpm</span>
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {domain === 'POISONING' ? 'Bradycardic' : currentVitals.heartRate > 105 ? 'Tachycardic' : 'Nominal'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">SpO2 Oxygen</span>
                <span className="text-xl sm:text-2xl font-black font-tabular text-slate-950 mt-0.5 block">
                  {currentVitals.spo2} <span className="text-xs text-slate-500 font-bold">%</span>
                </span>
                <span className={`text-[10px] font-bold ${currentVitals.spo2 < 92 ? 'text-rose-600' : 'text-slate-500'}`}>
                  {currentVitals.spo2 < 92 ? 'Hypoxemic Drift' : 'Acceptable'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Blood Pressure</span>
                <span className="text-xl sm:text-2xl font-black font-tabular text-slate-950 mt-0.5 block">
                  {currentVitals.systolicBp}/{currentVitals.diastolicBp}
                </span>
                <span className={`text-[10px] font-bold ${Number(shockIndex) > 0.9 ? 'text-amber-600' : 'text-slate-500'}`}>
                  Shock Idx: {shockIndex}
                </span>
              </div>
            </div>
          </div>

          {/* Phase 19 Autonomous Agent Tool Activity & Missing Data Panel */}
          <AgentActivityPanel 
            agentTask={activeCase.agentTask} 
            pendingRequest={activeCase.pendingDataRequest}
            onRequestData={(field, reason) => {
              setPendingReqField(field);
              setPendingReqReason(reason || 'Data required for specialist clinical protocol review.');
              setPendingReqPriority('CRITICAL');
              setIsDataRequestModalOpen(true);
            }} 
          />

          {/* DECISION SUPPORT REGION (Phase 17 Editorial Spatial Hierarchy) */}
          {activeCase.aiDecisionSupport?.providerAvailable === false ? (
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-slate-700 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                <AlertCircle className="w-4 h-4 text-slate-400" />
                <span>Decision Support Provider Offline</span>
              </div>
              <p className="text-xs font-semibold text-slate-600">
                AI decision support provider unavailable. Live care coordination and telemetry streaming continue without interruption.
              </p>
            </div>
          ) : activeCase.aiDecisionSupport ? (
            <div className={`p-6 sm:p-7 rounded-3xl border shadow-sm flex flex-col gap-5 ${
              activeCase.aiDecisionSupport.riskLevel === 'CRITICAL'
                ? 'bg-gradient-to-b from-rose-50/50 via-white to-white border-rose-200/90'
                : 'bg-gradient-to-b from-blue-50/40 via-white to-white border-slate-200/90'
            }`}>
              {/* Header: Hierarchy Step 1 - What is happening? */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    activeCase.aiDecisionSupport.riskLevel === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-blue-100 text-[#0E62FE]'
                  }`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block leading-none">
                      Observable Decision Support Signal
                    </span>
                    <h3 className="font-black text-sm sm:text-base text-slate-950 tracking-tight mt-0.5">
                      {activeCase.aiDecisionSupport.title || 'Hemodynamic Change Signal'}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    activeCase.aiDecisionSupport.status === 'ACKNOWLEDGED' || activeCase.aiDecisionSupport.isReviewed
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-blue-100 text-[#0E62FE] border border-blue-200'
                  }`}>
                    {activeCase.aiDecisionSupport.status === 'ACKNOWLEDGED' || activeCase.aiDecisionSupport.isReviewed
                      ? 'SIGNAL ACKNOWLEDGED' 
                      : 'NEW SIGNAL'}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    {activeCase.aiDecisionSupport.provider || 'DemoDecisionSupportProvider'}
                  </span>
                </div>
              </div>

              {/* Hierarchy Step 2: What did PRANA observe? */}
              <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#0E62FE]" />
                  <span>Observed Telemetry Findings:</span>
                </span>
                <p className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                  {activeCase.aiDecisionSupport.observedData || activeCase.aiDecisionSupport.clinicalSignificance}
                </p>
                {/* Detected Signals Tag List */}
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {activeCase.aiDecisionSupport.detectedSignals.map((sig, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 shadow-2xs flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0E62FE]" />
                      <span>{sig}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Hierarchy Step 3 & 4: Why did this signal appear? What data supports it? */}
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-slate-700 leading-relaxed font-medium">
                    <strong className="text-slate-900 font-bold">Clinical Reasoning: </strong>
                    {activeCase.aiDecisionSupport.explanation || activeCase.aiDecisionSupport.clinicalSignificance}
                  </div>
                </div>
                {activeCase.aiDecisionSupport.relevantTimelineEventIds && activeCase.aiDecisionSupport.relevantTimelineEventIds.length > 0 && (
                  <div className="text-[10px] font-mono text-slate-400 pl-6">
                    Source Evidence: {activeCase.aiDecisionSupport.relevantTimelineEventIds.join(', ')}
                  </div>
                )}
              </div>

              {/* Hierarchy Step 5: What requires human review? */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="text-xs font-bold text-amber-900">
                    Status: Requires Qualified Clinician Review
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  HUMAN-IN-THE-LOOP MANDATED
                </span>
              </div>

              {/* Mandatory Clinical Safety Notice */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                <span className="font-semibold text-slate-500 uppercase tracking-wider">
                  {activeCase.aiDecisionSupport.safetyLabel || 'SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS'}
                </span>
                <span>AI never autonomously diagnoses, prescribes, or administers treatment.</span>
              </div>
            </div>
          ) : null}


          {/* 3. CURRENT CLINICAL REVIEW PLAN (What PRANA is suggesting for specialist review) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0E62FE]" />
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">
                  Current Clinical Review Plan
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                Simulated Review Plan
              </span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Plan Designation:
              </span>
              <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                {reviewPlan.title}
              </h4>
              <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                <strong className="text-slate-800">Why Surfaced: </strong>
                {reviewPlan.surfacedReason}
              </p>
            </div>

            {/* Supporting Observations */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Supporting Observable Clinical Findings:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {reviewPlan.observations.map((obs, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0E62FE] mt-1.5 shrink-0" />
                    <span className="text-[11px] leading-tight font-medium">{obs}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coordination Focus */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs">
              <span className="text-[10px] font-black text-[#0E62FE] uppercase tracking-wider block mb-0.5">
                Prehospital Coordination Focus:
              </span>
              <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                {reviewPlan.coordinationFocus}
              </p>
            </div>

            <div className="text-[10px] text-slate-400 italic">
              Demonstration review plan for coordination only. Confirmation does not authorize autonomous treatment by PRANA.
            </div>
          </div>

          {/* 4. WHAT YOUR ACTION MEANS & SPECIALIST ACTION CONSOLE */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">
                  Authoritative Clinician Endorsement
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                Clinician ID: <strong className="text-slate-700 font-mono">{clinicianId}</strong>
              </span>
            </div>

            {/* Explicit resulting state display when an action has occurred */}
            {currentStatus !== 'PENDING' && (
              <div className={`p-4 rounded-2xl border flex flex-col gap-1.5 ${
                currentStatus === 'CONFIRMED'
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : currentStatus === 'ESCALATED'
                  ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                  : currentStatus === 'DATA_REQUESTED'
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : 'bg-blue-50/80 border-blue-300 text-blue-950'
              }`}>
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="uppercase tracking-wider">
                    {currentStatus === 'CONFIRMED' && '✓ CLINICIAN-ENDORSED: Plan Confirmed'}
                    {currentStatus === 'ESCALATED' && '⚠ URGENT SENIOR REVIEW ACTIVE'}
                    {currentStatus === 'DATA_REQUESTED' && '❓ ADDITIONAL DATA REQUESTED'}
                    {currentStatus === 'ACKNOWLEDGED' && 'ℹ SIGNAL REVIEWED & ACKNOWLEDGED'}
                  </span>
                  <span className="font-mono text-[10px]">
                    {clinicianEndorsement?.timestamp || 'Synchronized'}
                  </span>
                </div>
                <p className="text-[11px] font-medium leading-relaxed">
                  {currentStatus === 'CONFIRMED' && `Endorsed by ${clinicianName} (${clinicianId}). Coordination state transmitted to Ambulance ${ambulance.callSign} and ${ambulance.assignedHospital.split('(')[0].trim()}.`}
                  {currentStatus === 'ESCALATED' && `Raised priority to Tier-1 Urgent. Case routed to Senior Trauma/Critical Care Consult. Prehospital teams notified.`}
                  {currentStatus === 'DATA_REQUESTED' && `Requested field observation: "${activeCase.pendingDataRequest?.field || 'Repeat vitals & reassessment'}" sent to Ambulance ${ambulance.callSign}.`}
                  {currentStatus === 'ACKNOWLEDGED' && `Telemetry pattern reviewed by ${clinicianName}. Continuous monitoring active without protocol modification.`}
                </p>
              </div>
            )}

            {/* Action Buttons Grid with Explicit Explanations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* 1. CONFIRM REVIEW PLAN */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => handleExecuteProtocol('CONFIRMED')}
                  className={`py-3 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                    currentStatus === 'CONFIRMED'
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                      : 'bg-[#0E62FE] hover:bg-[#0050E6] text-white shadow-blue-500/25 hover:scale-[1.01]'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>CONFIRM REVIEW PLAN</span>
                </button>
                <span className="text-[10px] text-slate-500 leading-tight px-1 font-medium">
                  Endorse this coordination plan for the current case. Updates ambulance & hospital views.
                </span>
              </div>

              {/* 2. REQUEST ADDITIONAL DATA */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setIsDataRequestModalOpen(true)}
                  className={`py-3 px-4 rounded-2xl font-black text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
                    currentStatus === 'DATA_REQUESTED'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-200'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  <FileQuestion className="w-4 h-4 stroke-[2]" />
                  <span>REQUEST ADDITIONAL DATA</span>
                </button>
                <span className="text-[10px] text-slate-500 leading-tight px-1 font-medium">
                  Ask field medic for a specific observation needed for clinical review.
                </span>
              </div>

              {/* 3. ESCALATE FOR URGENT REVIEW */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => handleExecuteProtocol('ESCALATED')}
                  className={`py-3 px-4 rounded-2xl font-black text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
                    currentStatus === 'ESCALATED'
                      ? 'bg-rose-100 text-rose-900 border-rose-300 ring-2 ring-rose-200'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 stroke-[2]" />
                  <span>ESCALATE FOR URGENT REVIEW</span>
                </button>
                <span className="text-[10px] text-slate-500 leading-tight px-1 font-medium">
                  Raise case priority and route for senior clinical review. Does not administer drugs.
                </span>
              </div>

              {/* 4. ACKNOWLEDGE SIGNAL */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => handleExecuteProtocol('ACKNOWLEDGED')}
                  className={`py-3 px-4 rounded-2xl font-black text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
                    currentStatus === 'ACKNOWLEDGED'
                      ? 'bg-slate-200 text-slate-900 border-slate-300 ring-2 ring-slate-200'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2]" />
                  <span>ACKNOWLEDGE SIGNAL</span>
                </button>
                <span className="text-[10px] text-slate-500 leading-tight px-1 font-medium">
                  Record that specialist reviewed the current signal without changing the endorsed plan.
                </span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>All reviews are authenticated with clinician ID and recorded in the Care Rail.</span>
              <span className="font-mono text-slate-500">ISO-8601 Stamp</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Patient Case Summary & Prehospital Interventions */}
        <div className="lg:col-span-5 flex flex-col gap-5 min-w-0">
          
          {/* Patient Context Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                INCOMING PATIENT PROFILE
              </span>
              <span className="font-mono text-[10px] font-bold text-slate-500">
                Case {activeCase.id}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-950">
                  {patient.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 uppercase">
                  RED TRIAGE
                </span>
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-1">
                {patient.age}y · {patient.sex} · Conscious: <strong className="text-slate-800">{patient.consciousState}</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
              <span className="text-[10px] font-black text-[#0E62FE] uppercase tracking-wider block mb-1">
                Mechanism & Presentation
              </span>
              <strong className="text-slate-900 font-bold">{patient.incidentType}</strong> — <span className="text-slate-600">{patient.chiefComplaint}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">GCS Score</span>
                <span className="text-lg font-black font-mono text-[#0E62FE] mt-0.5 block">{patient.gcsScore} / 15</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Bleeding Status</span>
                <span className="text-sm font-bold text-slate-800 mt-1 block">{patient.reportedBloodLoss}</span>
              </div>
            </div>
          </div>

          {/* Prehospital Interventions Log (Field Paramedic Documentation) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                PREHOSPITAL INTERVENTIONS LOGGED
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {recentInterventions.length} Documented
              </span>
            </div>

            {recentInterventions.length > 0 ? (
              <div className="flex flex-col gap-2">
                {recentInterventions.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 font-extrabold">{item.title}</strong>
                      <span className="text-[10px] font-mono text-slate-400">{item.timestamp}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-snug">{item.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs text-slate-500 text-center">
                Primary field stabilization in progress.
              </div>
            )}
          </div>

          {/* Destination Hospital Summary Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-50/70 to-indigo-50/50 border border-blue-200 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-[#0E62FE] uppercase tracking-wider">
                Destination Facility
              </span>
              <span className="font-mono text-xs font-black text-[#0E62FE]">
                {derivedEta} MIN ETA
              </span>
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-sm">
                {ambulance.assignedHospital}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Assigned Bay: <strong className="text-slate-800">{hospitalReadiness?.assignedBay || 'Resuscitation Bay 1'}</strong>
              </p>
            </div>
            <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between">
              <button
                onClick={() => setActiveRole('HOSPITAL_COMMAND')}
                className="text-[#0E62FE] hover:underline text-xs font-black flex items-center gap-1 cursor-pointer"
              >
                <span>Open Hospital Command Console</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Care Rail Mission Chronology */}
      <CareRail />

      {/* Prehospital Handover Review Modal */}
      <PrehospitalHandoverPanel
        isOpen={isHandoverOpen}
        onClose={() => setIsHandoverOpen(false)}
      />

      {/* Clinical Data Request Modal (Clinician -> Field Medic Operational Handshake) */}
      {isDataRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <FileQuestion className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block leading-none">
                    Operational Protocol Handshake
                  </span>
                  <h3 className="font-black text-base text-slate-900 mt-0.5">
                    Request Field Data
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsDataRequestModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Operational Participants Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Requested By</span>
                <span className="font-bold text-slate-900 block mt-0.5">{clinicianName}</span>
                <span className="text-[10px] font-mono text-slate-500">Remote Clinician ({clinicianId})</span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200">
                <span className="text-[9px] font-black text-[#0E62FE] uppercase tracking-wider block">Target Recipient</span>
                <span className="font-bold text-slate-900 block mt-0.5">Field Medic</span>
                <span className="text-[10px] font-mono text-slate-500">Ambulance Unit {ambulance.callSign}</span>
              </div>
            </div>

            {/* Request Field Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                Requested Clinical Observation
              </label>
              <input
                type="text"
                value={pendingReqField}
                onChange={(e) => setPendingReqField(e.target.value)}
                placeholder="e.g. Serial bilateral breath sounds auscultation"
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-[#0E62FE] focus:ring-2 focus:ring-[#0E62FE]/20"
              />
            </div>

            {/* Priority Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                Clinical Urgency Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['CRITICAL', 'HIGH', 'MODERATE'] as const).map((pri) => (
                  <button
                    key={pri}
                    type="button"
                    onClick={() => setPendingReqPriority(pri)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      pendingReqPriority === pri
                        ? pri === 'CRITICAL'
                          ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs'
                          : pri === 'HIGH'
                          ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-xs'
                          : 'bg-blue-50 border-blue-400 text-blue-800 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pri}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                Clinical Justification / Context
              </label>
              <textarea
                value={pendingReqReason}
                onChange={(e) => setPendingReqReason(e.target.value)}
                rows={2}
                placeholder="Why is this assessment required by tele-specialist?"
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-[#0E62FE] focus:ring-2 focus:ring-[#0E62FE]/20"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDataRequestModalOpen(false)}
                className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTransmitRequest}
                className="px-5 py-2.5 rounded-full text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <FileQuestion className="w-3.5 h-3.5" />
                <span>Confirm & Transmit Request</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
