import React, { useState } from 'react';
import { useEmergency } from '../../context/useEmergency';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CareConduit } from '../conduit/CareConduit';
import { CareRail } from '../timeline/CareRail';
import { WhyThisHospitalModal } from '../facility/WhyThisHospitalModal';
import { PrehospitalHandoverPanel } from '../handover/PrehospitalHandoverPanel';
import {
  Building2,
  CheckCircle2,
  ShieldCheck,
  Stethoscope,
  ArrowUpRight,
  FileText,
  AlertTriangle
} from 'lucide-react';

export const HospitalCommand: React.FC = () => {
  const {
    activeCase,
    confirmHospitalBay,
    acknowledgeHospitalPreAlert,
    acknowledgeHospitalEscalation,
    acceptHandover,
    derivedEta,
    handoverPackage,
    isHandoverModalOpen,
    setIsHandoverModalOpen
  } = useEmergency();
  const { role, hasPermission, notifyUnauthorizedAction } = useAuth();
  const { showToast } = useToast();
  const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);

  const { ambulance, patient, hospitalReadiness, clinicianEndorsement, domain, facilityMatching } = activeCase;
  const isBayReady = hospitalReadiness?.status === 'BAY_READY';
  const assignedBay = hospitalReadiness?.assignedBay || 'Awaiting Assignment';
  const isClinicianEndorsed = clinicianEndorsement?.status === 'CONFIRMED';
  const clinicianName = clinicianEndorsement?.clinicianName || 'Dr. Sunita Rao, MD';

  const isEscalated = clinicianEndorsement?.status === 'ESCALATED';
  const isEscalationAcknowledged = Boolean(clinicianEndorsement?.escalationAcknowledgedBy);
  const isPreAlertSent = Boolean(hospitalReadiness?.isPreAlertDispatched);
  const isPreAlertAcked = Boolean(hospitalReadiness?.isPreAlertAcknowledged);
  const isHandoverPending = (activeCase.conduitStep >= 7 || activeCase.status === 'ARRIVED') && activeCase.status !== 'TRANSFER_COMPLETED';
  const isTransferCompleted = activeCase.status === 'TRANSFER_COMPLETED';

  const suggestedBay = assignedBay !== 'Awaiting Assignment'
    ? assignedBay
    : domain === 'RESPIRATORY_DISTRESS'
    ? 'Pulmonary Resuscitation Bay 1'
    : domain === 'SNAKEBITE'
    ? 'Toxicology Bay 3'
    : domain === 'POISONING'
    ? 'Decontamination & Tox Bay 4'
    : 'Trauma Resuscitation Bay 1';

  const topCandidate = facilityMatching?.candidates.find((c) => c.isPrimary) || facilityMatching?.candidates[0];

  const handleConfirmReady = () => {
    if (!hasPermission('BAY_READY')) {
      notifyUnauthorizedAction(
        'Confirm Sterile Bay Readiness',
        `Role '${role || 'ANONYMOUS'}' lacks hospital charge privileges. Bay readiness confirmation requires Hospital Command authority.`,
        'HOSPITAL_COMMAND'
      );
      return;
    }
    confirmHospitalBay(suggestedBay);
    showToast('Sterile Bay Confirmed', `${suggestedBay} verified and armed for inbound reception.`, 'success');
  };

  // Domain-specific ED checklists
  const checklistItems = domain === 'SNAKEBITE' ? [
    { name: 'Polyvalent Antivenom Bank', state: 'READY', detail: '10 vials reconstituted cold-chain reserve' },
    { name: '20WBCT Clotting Tubes', state: 'STANDBY', detail: 'Clean glass tubes prepared in stat lab' },
    { name: 'Toxicology On-Call Fellow', state: 'NOTIFIED', detail: 'Dr. C. Hegde paged for snakebite consult' },
    { name: 'Fresh Frozen Plasma Units', state: 'RESERVED', detail: 'Coagulation replacement units on hold' },
    { name: 'ICU Hemodialysis Suite', state: 'CLEAR', detail: 'Renal watch bed staged' },
  ] : domain === 'POISONING' ? [
    { name: 'Atropine Sulfate Ampoules', state: 'READY', detail: 'High-dose 2mg infusion packs staged' },
    { name: 'Pralidoxime (2-PAM) Stock', state: 'RESERVED', detail: 'Cholinesterase reactivator verified' },
    { name: 'Mechanical Ventilator Bay', state: 'HOT STANDBY', detail: 'Suction and ventilator checked at Bay 4' },
    { name: 'Decontamination Station', state: 'ISOLATED', detail: 'Dermal rinse area prepped' },
    { name: 'ICU Toxicology Registrar', state: 'ON-SITE', detail: 'Toxicology intensivist scrubbed in' },
  ] : domain === 'RESPIRATORY_DISTRESS' ? [
    { name: 'Pulmonary ICU Bay', state: 'HOT STANDBY', detail: 'NIV/BIPAP capable bay pre-warmed' },
    { name: 'Respiratory Physician On-Call', state: 'NOTIFIED', detail: 'Pulmonologist paged for inbound handover' },
    { name: 'High-Flow O2 Delivery System', state: 'READY', detail: 'Optiflow / venturi mask prepared' },
    { name: 'Nebulizer & Bronchodilators', state: 'STAGED', detail: 'Salbutamol and ipratropium prepared' },
    { name: 'ABG / Portable SpO2 Monitoring', state: 'STANDBY', detail: 'Point-of-care ABG kit at bay' },
  ] : [
    { name: 'Emergency Bay', state: 'STANDBY', detail: 'Bay allocated and prepared' },
    { name: 'Emergency Physician', state: 'ALERTED', detail: 'On-call emergency physician notified' },
    { name: 'Monitoring Equipment', state: 'READY', detail: 'ECG, SpO2, and IV access prepared' },
    { name: 'IV Access & Fluids', state: 'STAGED', detail: 'IV cannula and fluid lines prepared' },
  ];

  return (
    <>
      <div className="flex flex-col gap-6 py-2">
        {/* 1. Top Editorial Headline */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-black text-[#0E62FE] uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Receiving Facility Command · Emergency Readiness Console</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-[0.95]">
              Hospital <br />
              <span className="text-slate-400 font-normal">Readiness & Bay Command.</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-4 py-2 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>{ambulance.assignedHospital.toUpperCase()}</span>
            </span>
          </div>
        </div>

        {/* 2. Contextual Reception Conduit (Inbound Corridor & Bay Standby) */}
        <CareConduit variant="readiness" />

        {/* 3. Main Hospital Command Stage: Inbound Triage & Capability Verification */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT / CENTER (7 cols): Incoming Triage & Why This Hospital? */}
          <div className="lg:col-span-7 flex flex-col gap-5 min-w-0">

            {/* Phase 18 Prehospital Handover Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-blue-50/40 border border-slate-200/90 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#0E62FE]" />
                  <div>
                    <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">
                      Prehospital Handover Package
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Canonical Transit Record & Vital Timeline Snapshot
                    </span>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                  handoverPackage?.status === 'ACKNOWLEDGED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-blue-50 text-[#0E62FE] border-blue-200'
                }`}>
                  {handoverPackage?.status === 'ACKNOWLEDGED' ? 'HANDOVER FORMALLY RECEIVED' : 'READY TO REVIEW'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Provenance & Integrity Hash</span>
                  <span className="text-xs font-black text-slate-900 block mt-0.5 font-mono">
                    {handoverPackage?.integrityHash ? `${handoverPackage.integrityHash.slice(0, 12)}...` : 'SHA-256 Digest'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">100% SHA-256 Digest Match</span>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Completeness</span>
                  <span className="text-xs font-black text-slate-900 block mt-0.5">
                    {handoverPackage?.completeness.completenessPercentage || 100}% Verified
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">{handoverPackage?.vitalTimeline.length || 0} Vital Snapshots</span>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">ED Status</span>
                  <span className="text-xs font-black text-slate-900 block mt-0.5">
                    {handoverPackage?.status === 'ACKNOWLEDGED' ? 'Received' : 'Pending Review'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {handoverPackage?.acknowledgedBy?.name ? `By ${handoverPackage.acknowledgedBy.name}` : 'Awaiting sign-off'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  {handoverPackage?.status === 'ACKNOWLEDGED'
                    ? `Prehospital handover package formally acknowledged at ${handoverPackage.acknowledgedAt || 'inbound window'}.`
                    : 'Streaming telemetry, administered procedures, and tele-specialist review compiled for receiving ED briefing.'}
                </p>
                <button
                  onClick={() => setIsHandoverModalOpen(true)}
                  className="px-5 py-2.5 rounded-2xl bg-[#0E62FE] hover:bg-[#0050E6] text-white text-xs font-black shadow-md shadow-blue-500/25 transition-all cursor-pointer hover:scale-105 shrink-0 ml-3 flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>{handoverPackage?.status === 'ACKNOWLEDGED' ? 'View Handover' : 'Open Handover'}</span>
                </button>
              </div>
            </div>

            {/* Urgent Specialist Escalation Alert */}
            {isEscalated && (
              <div className={`p-5 rounded-3xl border-2 shadow-sm flex flex-col gap-3 transition-all ${
                isEscalationAcknowledged
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50/95 border-rose-400 text-rose-950 animate-in fade-in duration-300'
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-rose-200/60">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-5 h-5 shrink-0 ${isEscalationAcknowledged ? 'text-emerald-600' : 'text-rose-600 animate-pulse'}`} />
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-tight">
                        {isEscalationAcknowledged ? 'Specialist Escalation Acknowledged by ED Command' : 'Urgent Tele-Specialist Escalation Active'}
                      </h3>
                      <span className="text-[10px] opacity-80 font-bold block">
                        {isEscalationAcknowledged
                          ? `Inbound team mobilized · Acknowledged by ${clinicianEndorsement?.escalationAcknowledgedBy} at ${clinicianEndorsement?.escalationAcknowledgedAt}`
                          : `Escalated by ${clinicianName} (${clinicianEndorsement?.timestamp})`}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                    isEscalationAcknowledged ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-200 border-rose-300 text-rose-900'
                  }`}>
                    {isEscalationAcknowledged ? 'Mobilized' : 'Action Required'}
                  </span>
                </div>

                <div className="text-xs space-y-1.5">
                  <div className="p-3 rounded-2xl bg-white/80 border border-rose-200/80">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Specialist Escalation Rationale</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">
                      {clinicianEndorsement?.escalationReason || 'Physiological instability requiring immediate trauma/critical care team standby at bay.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-700 px-1 pt-1">
                    <span>HR: <strong className="text-rose-600">{activeCase.currentVitals.heartRate} bpm</strong></span>
                    <span>BP: <strong className="text-rose-600">{activeCase.currentVitals.systolicBp}/{activeCase.currentVitals.diastolicBp}</strong></span>
                    <span>SpO2: <strong className="text-rose-600">{activeCase.currentVitals.spo2}%</strong></span>
                    <span>GCS: <strong className="text-slate-900">{patient.gcsScore}/15</strong></span>
                  </div>
                </div>

                {!isEscalationAcknowledged && (
                  <div className="flex items-center justify-between pt-2 border-t border-rose-200/60">
                    <span className="text-[11px] text-rose-800 font-medium">
                      Confirm ED trauma/critical resuscitation team is staged and awaiting unit {ambulance.callSign}.
                    </span>
                    <button
                      onClick={() => {
                        acknowledgeHospitalEscalation('Dr. Ramesh Rao (ED Triage Charge)');
                        showToast('Escalation Acknowledged', 'Inbound trauma/critical resuscitation team mobilized.', 'success');
                      }}
                      className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-500/25 transition-all cursor-pointer hover:scale-105 shrink-0 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Acknowledge Escalation</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Operational Transfer of Care & Acceptance Card */}
            {(isHandoverPending || isTransferCompleted) && (
              <div className={`p-6 rounded-3xl border-2 shadow-sm flex flex-col gap-4 ${
                isTransferCompleted
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  : 'bg-indigo-50/90 border-indigo-300 text-indigo-950 animate-in fade-in duration-300'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-5 h-5 ${isTransferCompleted ? 'text-emerald-600' : 'text-indigo-600'}`} />
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-tight">
                        {isTransferCompleted ? 'Transfer of Care Completed' : 'Formal Handover of Care Pending'}
                      </h3>
                      <span className="text-[10px] opacity-80 font-bold block">
                        {isTransferCompleted
                          ? `Encounter closed · Transferred to ${assignedBay} · Received by Dr. Ramesh Rao (ED Triage Charge)`
                          : `Paramedic (${ambulance.crewLead}) has initiated WHO SBAR bedside handover.`}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                    isTransferCompleted
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : 'bg-indigo-200 border-indigo-300 text-indigo-900 animate-pulse'
                  }`}>
                    {isTransferCompleted ? 'Transfer Closed' : 'Acceptance Required'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-white border border-indigo-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Transferring Patient</span>
                    <strong className="text-xs font-black text-slate-900 block mt-0.5">{patient.name} ({patient.age}y {patient.sex})</strong>
                    <span className="text-[10px] text-slate-500 font-medium">Chief Complaint: {patient.chiefComplaint}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-indigo-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Assigned Receiving Bay</span>
                    <strong className="text-xs font-black text-slate-900 block mt-0.5">{assignedBay}</strong>
                    <span className="text-[10px] text-slate-500 font-medium">Corridor Transit: Complete</span>
                  </div>
                </div>

                {!isTransferCompleted ? (
                  <div className="flex items-center justify-between pt-2 border-t border-indigo-100 gap-3">
                    <button
                      onClick={() => setIsHandoverModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-white border border-indigo-200 text-indigo-900 text-xs font-bold hover:bg-indigo-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Review Handover Package</span>
                    </button>
                    <button
                      onClick={() => {
                        acceptHandover('Dr. Ramesh Rao (ED Triage Charge)');
                        showToast('Transfer of Care Completed', `Full clinical handover of ${patient.name} accepted.`, 'success');
                      }}
                      className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-500/25 transition-all cursor-pointer hover:scale-105 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Handover & Assume Care</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-white/80 border border-emerald-200 text-xs flex items-center justify-between">
                    <span className="text-emerald-900 font-semibold">
                      Authoritative transfer of care executed. Prehospital timeline locked and archived in receiving EHR.
                    </span>
                    <button
                      onClick={() => setIsHandoverModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Signed Record</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Incoming Triage & Bay Status Card */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#0E62FE]" />
                  <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">
                    Incoming Patient Triage & Resuscitation Bay
                  </h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                  isBayReady
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : isPreAlertSent
                    ? 'bg-blue-50 text-[#0E62FE] border-blue-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {isBayReady ? `${assignedBay.toUpperCase()} STERILE & VERIFIED` : isPreAlertSent ? 'INBOUND PRE-ALERT ACTIVE' : 'INBOUND EN ROUTE'}
                </span>
              </div>

              {/* Arrival Countdown Hero Display */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    ESTIMATED ARRIVAL WINDOW
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-4xl font-black font-tabular text-slate-950 leading-none">
                      {derivedEta}
                    </span>
                    <span className="text-base font-bold text-slate-400">MINUTES</span>
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block font-medium">
                    Corridor: Ring Road Arterial ({ambulance.currentSpeedKmH} km/h) · {ambulance.isTrafficDelayed ? 'Delay Active (+8m)' : 'Transit Nominal'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/70 shadow-2xs flex flex-col text-right">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Incoming Unit</span>
                  <span className="text-sm font-black text-slate-900">{ambulance.callSign} (ALS Unit)</span>
                  <span className="text-xs text-slate-500 font-medium">Lead: {ambulance.crewLead}</span>
                </div>
              </div>

              {/* Remote Specialist Endorsement Status */}
              <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                isClinicianEndorsed
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-300 text-amber-950'
              }`}>
                <div className="flex items-center gap-3">
                  <Stethoscope className={`w-5 h-5 shrink-0 ${isClinicianEndorsed ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <div>
                    <strong className="block font-black text-xs">
                      {isClinicianEndorsed ? 'Tele-Specialist Handshake Verified' : 'Clinical Protocol Review in Transit'}
                    </strong>
                    <span className="text-[11px] opacity-90 block mt-0.5">
                      {isClinicianEndorsed
                        ? `Protocol confirmed by ${clinicianName} (${clinicianEndorsement?.timestamp})`
                        : 'Remote emergency specialist is reviewing streaming telemetry'}
                    </span>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                  isClinicianEndorsed ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-amber-100 border-amber-300 text-amber-800'
                }`}>
                  {clinicianEndorsement?.status || 'PENDING'}
                </span>
              </div>

              {/* PRANA Decision Support (Hospital Projection: Inbound Triage Awareness) */}
              {activeCase.aiDecisionSupport && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-mono font-black text-[#0E62FE] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0E62FE]" />
                      <span>PRANA DECISION SUPPORT (HOSPITAL COMMAND)</span>
                    </span>
                    <span className="text-[9px] font-mono font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      SITUATIONAL AWARENESS ONLY
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-black text-slate-900">
                        {activeCase.aiDecisionSupport.title}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {activeCase.aiDecisionSupport.observedData}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[8.5px] font-mono uppercase text-slate-400 block font-bold">ED READINESS ACTION</span>
                      <span className="text-[10.5px] font-bold text-slate-800">
                        {isBayReady ? 'Bay 1 Prepared & Armed' : 'Allocate Resuscitation Bay'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[8.5px] font-mono text-slate-400 text-center uppercase tracking-tight pt-1 border-t border-slate-200/60">
                    {activeCase.aiDecisionSupport.safetyLabel || 'SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS'}
                  </div>
                </div>
              )}

              {/* Inbound Pre-Alert Action if pending acknowledgment */}
              {isPreAlertSent && !isPreAlertAcked && (
                <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">
                      Inbound Corridor Pre-Alert Active
                    </span>
                    <span className="text-xs text-blue-900 font-medium">
                      Paramedic unit {ambulance.callSign} transmitted advance clinical pre-alert.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      acknowledgeHospitalPreAlert('Sister Philomina, RN (ED Charge)');
                      showToast('Pre-Alert Acknowledged', 'Receiving ED ready for inbound corridor tracking.', 'info');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0E62FE] hover:bg-[#0050E6] text-white text-xs font-black shadow-sm cursor-pointer shrink-0"
                  >
                    Acknowledge Pre-Alert
                  </button>
                </div>
              )}

              {/* Bay Allocation Confirmation Action */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Resuscitation Bay Allocation
                  </span>
                  <span className="text-sm font-black text-slate-900 mt-0.5 block">
                    {assignedBay}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isBayReady ? 'Sister Philomina, RN · Verified' : 'Awaiting charge nurse sterile clearance'}
                  </span>
                </div>

                {!isBayReady ? (
                  <button
                    onClick={handleConfirmReady}
                    className="px-5 py-2.5 rounded-2xl bg-[#0E62FE] hover:bg-[#0050E6] text-white text-xs font-black shadow-md shadow-blue-500/25 transition-all cursor-pointer hover:scale-105"
                  >
                    Confirm Bay Ready
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Bay Verified Ready</span>
                  </div>
                )}
              </div>
            </div>

            {/* Why This Hospital? Section (Transparent, Explainable Rationale) */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-black text-[#0E62FE] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Why This Hospital? (Match Fit Rationale)</span>
                </div>
                <button
                  onClick={() => setIsWhyModalOpen(true)}
                  className="text-[11px] font-black text-[#0E62FE] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Compare Alternatives</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Clinical Match</span>
                  <strong className="text-xs font-black text-slate-900 block mt-0.5">{topCandidate?.traumaLevel || 'Level-1 Suite'}</strong>
                  <span className="text-[10px] text-slate-500">{topCandidate?.specialtyFit || '24/7 Surgical Care'}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Transit Corridor</span>
                  <strong className="text-xs font-black text-slate-900 block mt-0.5">{derivedEta} Mins Live ETA</strong>
                  <span className="text-[10px] text-slate-500">{topCandidate?.distanceKm || '7.2'} km arterial</span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider block">Prototype Match Score</span>
                  <strong className="text-lg font-black font-mono text-emerald-900 block leading-tight mt-0.5">{topCandidate?.matchScore || 94}% Fit</strong>
                  <span className="text-[10px] text-emerald-700 font-bold">Top ranked in catchment</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-700 leading-relaxed pt-1 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <strong className="text-[#0E62FE]">Recommendation for Clinician Review: </strong>
                {facilityMatching?.algorithmRationale || `${ambulance.assignedHospital} was recommended over closer community clinics because advanced capability is required for this clinical picture.`}
              </p>
            </div>
          </div>

          {/* RIGHT PANEL (5 cols): ED Resource Checklist & Incoming Patient Profile */}
          <div className="lg:col-span-5 flex flex-col gap-5 min-w-0">

            {/* Incoming Patient Snapshot */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                INCOMING PATIENT PROFILE
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-black text-slate-950">{patient.name}</h4>
                  <span className="text-xs text-slate-500 font-semibold">
                    {patient.age}y · {patient.sex} · Conscious: <strong className="text-slate-800">{patient.consciousState}</strong>
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200 font-mono">
                  GCS {patient.gcsScore}/15
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
                <strong className="block text-slate-900 text-[11px] mb-0.5">Reported Incident & Injury:</strong>
                {patient.incidentType} — {patient.chiefComplaint}
              </div>
            </div>

            {/* ED Capability Checklist */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  ED Capability Checklist
                </div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  5/5 Verified
                </span>
              </div>

              {checklistItems.map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0 stroke-[2.5]" />
                    <div>
                      <span className="text-xs font-black text-slate-900 block leading-tight">{item.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{item.detail}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 uppercase tracking-wider">
                    {item.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Bottom Care Rail */}
        <div className="mt-2 pt-4 border-t border-slate-200/60">
          <CareRail compact={true} />
        </div>
      </div>

      {/* Why This Hospital Modal */}
      <WhyThisHospitalModal
        isOpen={isWhyModalOpen}
        onClose={() => setIsWhyModalOpen(false)}
      />

      {/* Prehospital Handover Package Modal */}
      <PrehospitalHandoverPanel
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
      />
    </>
  );
};
