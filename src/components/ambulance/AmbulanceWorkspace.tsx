import React, { useState } from 'react';
import { useEmergency } from '../../context/useEmergency';
import { useToast } from '../../context/ToastContext';
import { CareConduit } from '../conduit/CareConduit';
import { PatientCard } from './PatientCard';
import { VitalCard } from './VitalCard';
import { CareRail } from '../timeline/CareRail';
import { WhyThisHospitalModal } from '../facility/WhyThisHospitalModal';
import { PrehospitalHandoverPanel } from '../handover/PrehospitalHandoverPanel';
import {
  Wind,
  Syringe,
  Shield,
  ChevronRight,
  ArrowUpRight,
  Radio,
  Sparkles,
  Building2,
  CheckCircle2,
  FileText
} from 'lucide-react';

export const AmbulanceWorkspace: React.FC = () => {
  const {
    activeCase,
    addTimelineEvent,
    setActiveRole,
    submitFieldResponse,
    dismissFieldDataRequest,
    markPatientArrived,
    initiateHandover,
    isHandoverModalOpen,
    setIsHandoverModalOpen
  } = useEmergency();
  const { showToast } = useToast();
  const { currentVitals, vitalsHistory, patient, domain, clinicianEndorsement } = activeCase;
  const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [isHandoverConfirmModalOpen, setIsHandoverConfirmModalOpen] = useState(false);
  const [customResponseText, setCustomResponseText] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('Verbal SBAR handover given to ED resuscitation team. Vital signs and interventions verified.');

  // Sparkline rolling histories (last 10 snapshots)
  const hrSparkline = vitalsHistory.map((v) => v.heartRate);
  const spo2Sparkline = vitalsHistory.map((v) => v.spo2);
  const sbpSparkline = vitalsHistory.map((v) => v.systolicBp);

  const shockIndex = (currentVitals.heartRate / (currentVitals.systolicBp || 1)).toFixed(2);
  const isShockElevated = Number(shockIndex) > 0.9;
  const pulsePressure = currentVitals.systolicBp - currentVitals.diastolicBp;

  const isClinicianEndorsed = clinicianEndorsement?.status === 'CONFIRMED';
  const isFacilityConfirmed = activeCase.conduitStep >= 4 || Boolean(activeCase.hospitalReadiness?.isPreAlertDispatched);
  const primaryCandidate = activeCase.facilityMatching?.candidates?.find(c => c.isPrimary) || activeCase.facilityMatching?.candidates?.[0];
  const displayFacilityName = isFacilityConfirmed
    ? activeCase.ambulance.assignedHospital
    : (activeCase.ambulance.assignedHospital && activeCase.ambulance.assignedHospital !== 'Awaiting Facility Selection'
      ? activeCase.ambulance.assignedHospital
      : (primaryCandidate ? primaryCandidate.name : 'Awaiting Facility Selection'));

  // Paramedic logs prehospital intervention — immediately updates shared state and timeline
  const handleLogIntervention = (actionLabel: string, detailText: string) => {
    addTimelineEvent({
      category: 'CLINICAL',
      title: `Intervention Recorded: ${actionLabel}`,
      detail: detailText,
      actor: 'FIELD MEDIC',
      status: 'SUCCESS',
    });
  };

  return (
    <>
      <div className="flex flex-col gap-6 py-2">

        {/* CLINICAL DATA REQUEST ALERT BANNER FROM REMOTE SPECIALIST */}
        {activeCase.pendingDataRequest && activeCase.pendingDataRequest.status === 'PENDING' && (
          <div className="p-4 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 shadow-lg shadow-amber-500/5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Specialist Request · {activeCase.pendingDataRequest.priority}
                  </span>
                  <span className="text-[11px] text-amber-800 font-bold">
                    From {activeCase.pendingDataRequest.requestedBy}
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {activeCase.pendingDataRequest.field}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {activeCase.pendingDataRequest.reason || 'Verification required for clinical review plan.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => {
                  setCustomResponseText(
                    domain === 'RESPIRATORY_DISTRESS'
                      ? 'Bilateral expiratory wheezing heard, good air entry, no silent chest.'
                      : domain === 'SNAKEBITE'
                      ? '20WBCT whole blood clotting test unclotted at 20 min mark, edema margin stable.'
                      : domain === 'POISONING'
                      ? 'Pupils 2mm non-reactive, moderate bronchorrhea, no stridor.'
                      : 'Pelvic binder secured, no step-off deformity or active peritoneal rigidity.'
                  );
                  setIsResponseModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-full text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>RECORD RESPONSE</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => dismissFieldDataRequest(activeCase.pendingDataRequest!.id)}
                className="px-3 py-2 rounded-full text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-amber-100/50 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* 1. Main Spatial Canvas: Fluid Asymmetric Command Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-7 items-start">

          {/* LEFT COLUMN: Editorial Headline + Human Patient Profile (5 cols on compact, 4 on xl) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5 min-w-0">
            {/* Display Headline */}
            <div>
              <div className="text-[10px] font-black text-[#0E62FE] uppercase tracking-widest mb-1 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  <span>Field Medic Console · Active Locus</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Handover:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    activeCase.handoverPackage?.status === 'ACKNOWLEDGED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-blue-50 text-[#0E62FE] border-blue-200'
                  }`}>
                    {activeCase.handoverPackage?.status === 'ACKNOWLEDGED' ? 'Received by ED' : 'Synchronized'}
                  </span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-[0.95]">
                Ambulance <br />
                <span className="text-slate-400 font-normal">Command Surface.</span>
              </h1>
            </div>

            {/* Patient Card Anchor */}
            <PatientCard patient={patient} />

            {/* Prehospital Clinical Action & Intervention Log */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Field Intervention Logging
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Auto-Propagates to Specialist
                </span>
              </div>

              {/* Dynamic interventions tailored to scenario domain */}
              <div className="flex flex-col gap-2">
                {domain === 'SNAKEBITE' ? (
                  <>
                    <button
                      onClick={() => handleLogIntervention('Limb Splint Immobilization', 'Pressure immobilization bandage applied at heart level without tourniquet.')}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold border border-slate-200/70 hover:border-emerald-300 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">Record limb immobilization</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>

                    <button
                      onClick={() => handleLogIntervention('Puncture Site Demarcation', 'Bite site boundary and progressive edema margin marked with indelible marker.')}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#0E62FE] text-xs font-bold border border-slate-200/70 hover:border-blue-300 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Syringe className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate">Record bite margin marked</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0E62FE] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>

                    <button
                      onClick={() => handleLogIntervention('20WBCT Sample Drawn', 'Clean glass tube whole blood sample collected; timer started for 20-min clot check.')}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 text-xs font-bold border border-slate-200/70 hover:border-amber-300 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Wind className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="truncate">Record 20WBCT sample drawn</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  </>
                ) : domain === 'POISONING' ? (
                  <>
                    <button
                      onClick={() => handleLogIntervention('Airway Suctioning', 'Continuous suction applied to clear copious oral and bronchial secretions.')}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-800 text-xs font-bold border border-slate-200/70 hover:border-purple-300 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Wind className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="truncate">Record airway suctioning</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>

                    <button
                      onClick={() => handleLogIntervention('Dermal Decontamination', 'Contaminated clothing safely excised; dermal areas cleansed with saline wash.')}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#0E62FE] text-xs font-bold border border-slate-200/70 hover:border-blue-300 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate">Record dermal decontamination</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0E62FE] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>

                    <button
                      onClick={() => handleLogIntervention('High-Flow Oxygen Support', '100% FiO2 delivered via bag-valve mask with PEEP for severe pulmonary secretions.')}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold border border-slate-200/70 hover:border-emerald-300 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Syringe className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">Record high-flow O2 delivery</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  </>
                ) : domain === 'RESPIRATORY_DISTRESS' ? (
                  <>
                    <button
                      onClick={() => handleLogIntervention('High-Flow Oxygen & CPAP', 'Non-invasive positive pressure CPAP 8 cmH2O with 100% FiO2 initiated.')}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-800 text-xs font-bold border border-slate-200/70 hover:border-sky-300 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Wind className="w-4 h-4 text-sky-600 shrink-0" />
                        <span className="truncate">Record CPAP / High-Flow O2</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>

                    <button
                      onClick={() => handleLogIntervention('Nebulized Bronchodilator', 'Salbutamol 5mg + Ipratropium 0.5mg nebulization administered via oxygen mask.')}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#0E62FE] text-xs font-bold border border-slate-200/70 hover:border-blue-300 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Syringe className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate">Record bronchodilator nebulization</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0E62FE] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>

                    <button
                      onClick={() => handleLogIntervention('IV Access & Hydrocortisone', '18G cannula secured; IV Hydrocortisone 100mg administered.')}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold border border-slate-200/70 hover:border-emerald-300 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">Record IV access & steroid</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleLogIntervention('Oxygen Support', 'High-flow O2 via non-rebreather mask titrated to maintain SpO2 > 92%.')}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#0E62FE] text-xs font-bold border border-slate-200/70 hover:border-blue-300 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Wind className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate">Record high-flow oxygen support</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0E62FE] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>

                    <button
                      onClick={() => handleLogIntervention('IV Access Verified', '16-gauge large-bore peripheral cannula secured with warm crystalloid line.')}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#0E62FE] text-xs font-bold border border-slate-200/70 hover:border-blue-300 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Syringe className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate">Record 16G large-bore IV access</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0E62FE] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>

                    <button
                      onClick={() => handleLogIntervention('Circumferential Immobilization', 'Cervical collar and pelvic circumferential compression binder verified.')}
                      className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold border border-slate-200/70 hover:border-emerald-300 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">Record pelvic binder / collar secured</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Signature Continuous Care Conduit Centerpiece + Destination Readiness Dock (7 cols on compact, 5 on xl) */}
          <div className="lg:col-span-7 xl:col-span-5 flex flex-col gap-4 min-w-0">
            {/* 1. Care Conduit Journey Vector */}
            <CareConduit variant="journey" />

            {/* 2. Destination Facility Readiness & Inbound Corridor Dock (Bridges journey to receiving team) */}
            <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0E62FE] flex items-center justify-center border border-blue-200 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                      {isFacilityConfirmed ? 'Receiving Medical Destination' : 'Recommended Destination (Provisional)'}
                    </span>
                    <h3 className="font-black text-sm text-slate-900 leading-tight">
                      {displayFacilityName}
                    </h3>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider flex items-center gap-1.5 ${
                  activeCase.hospitalReadiness?.status === 'BAY_READY'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : activeCase.hospitalReadiness?.isPreAlertDispatched
                    ? 'bg-blue-50 text-[#0E62FE] border-blue-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    activeCase.hospitalReadiness?.status === 'BAY_READY'
                      ? 'bg-emerald-500 animate-pulse'
                      : activeCase.hospitalReadiness?.isPreAlertDispatched
                      ? 'bg-blue-500'
                      : 'bg-slate-400'
                  }`} />
                  <span>
                    {activeCase.hospitalReadiness?.status === 'BAY_READY'
                      ? 'Bay Ready & Sterile'
                      : activeCase.hospitalReadiness?.isPreAlertDispatched
                      ? 'Pre-Alert Transmitted'
                      : isFacilityConfirmed
                      ? 'Pre-Alert Pending'
                      : 'Recommendation · Unconfirmed'}
                  </span>
                </span>
              </div>

              {/* Destination Metrics & Arrival Vector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col justify-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Touchdown Corridor</span>
                  <span className="font-tabular font-black text-slate-950 text-base sm:text-lg mt-0.5">
                    {activeCase.status === 'ARRIVED' || activeCase.conduitStep >= 6 ? 'ARRIVED' : `${activeCase.ambulance.effectiveEtaMinutes || 14} MINS`}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold truncate">
                    {activeCase.status === 'ARRIVED' || activeCase.conduitStep >= 6 ? 'At Facility Bay' : activeCase.ambulance.isTrafficDelayed ? 'Traffic Delay Applied' : 'Transit Corridor Clear'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col justify-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Assigned Bay</span>
                  <span className="font-black text-slate-900 text-xs sm:text-sm mt-0.5 truncate">
                    {activeCase.hospitalReadiness?.assignedBay || 'Awaiting Assignment'}
                  </span>
                  <span className={`text-[10px] font-bold truncate ${activeCase.hospitalReadiness?.status === 'BAY_READY' ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {activeCase.hospitalReadiness?.status === 'BAY_READY' ? 'Sterile Prep Complete' : activeCase.hospitalReadiness?.assignedBay ? 'Bay Assigned' : 'Awaiting Hospital'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 flex flex-col justify-center">
                  <span className="text-[9px] font-black text-[#0E62FE] uppercase tracking-wider">Catchment Match</span>
                  <span className="font-tabular font-black text-[#0E62FE] text-base sm:text-lg mt-0.5">
                    {activeCase.facilityMatching?.candidates?.find(c => c.isPrimary)?.matchScore || 94}% Fit
                  </span>
                  <span className="text-[10px] text-slate-600 font-semibold truncate">
                    Prototype Algorithm Match
                  </span>
                </div>
              </div>

              {/* Transparent Suitability Rationale + Modal Trigger */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3 text-xs">
                <p className="text-[11px] text-slate-600 leading-snug font-medium truncate">
                  <strong className="text-slate-800">Why Selected: </strong>
                  {activeCase.facilityMatching?.algorithmRationale || (
                    domain === 'TRAUMA'
                      ? 'Level-1 angio-embolization and available red resuscitation bay.'
                      : domain === 'SNAKEBITE'
                      ? 'Regional toxicology unit with dedicated antivenom cold-chain stocks.'
                      : domain === 'RESPIRATORY_DISTRESS'
                      ? 'Pulmonary intensive care unit with non-invasive ventilation & high-flow oxygen.'
                      : domain === 'POISONING'
                      ? 'Dedicated toxicology ICU with mechanical ventilation and atropine infusion protocols.'
                      : 'Emergency critical care facility with rapid stabilization and monitoring.'
                  )}
                </p>
                <button
                  onClick={() => setIsWhyModalOpen(true)}
                  className="text-[11px] font-black text-[#0E62FE] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>Compare</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              {/* Explicit Arrival Action for In-Transit Phase */}
              {activeCase.status !== 'ARRIVED' && activeCase.status !== 'TRANSFER_COMPLETED' && activeCase.conduitStep < 6 && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500 font-medium">
                    When vehicle reaches hospital bay, confirm arrival to initiate transfer of care.
                  </span>
                  <button
                    onClick={() => {
                      markPatientArrived();
                      showToast('Patient Marked Arrived', `Vehicle reached ${displayFacilityName}. Bedside handover ready.`, 'success');
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-[#0E62FE] hover:bg-[#0050E6] text-white text-xs font-black shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 hover:scale-105"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>MARK PATIENT ARRIVED</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. FOCUSED ARRIVAL & TRANSFER-OF-CARE CARD (Sections 7 & 8) */}
            {(activeCase.status === 'ARRIVED' || activeCase.status === 'TRANSFER_COMPLETED' || activeCase.conduitStep >= 6) && (
              <div className="p-5 sm:p-6 bg-gradient-to-br from-white via-blue-50/20 to-emerald-50/30 rounded-3xl border-2 border-emerald-300 shadow-sm flex flex-col gap-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                        PATIENT ARRIVED · RECEIVING FACILITY
                      </span>
                      <h3 className="font-black text-sm text-slate-900 leading-tight">
                        {activeCase.ambulance.assignedHospital}
                      </h3>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                    {activeCase.status === 'TRANSFER_COMPLETED' ? 'TRANSFER COMPLETED' : activeCase.conduitStep >= 7 ? 'HANDOVER IN PROGRESS' : 'READY FOR HANDOVER'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Patient</span>
                    <strong className="text-xs font-black text-slate-900 block truncate">{patient.name}</strong>
                    <span className="text-[10px] text-slate-500 font-semibold">{patient.age}y · {patient.sex}</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Latest Vitals</span>
                    <strong className="text-xs font-black text-slate-900 block">HR {currentVitals.heartRate} · SpO2 {currentVitals.spo2}%</strong>
                    <span className="text-[10px] text-slate-500 font-semibold">BP {currentVitals.systolicBp}/{currentVitals.diastolicBp}</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Assigned Bay</span>
                    <strong className="text-xs font-black text-slate-900 block truncate">{activeCase.hospitalReadiness?.assignedBay || 'Awaiting Assignment'}</strong>
                    <span className="text-[10px] text-emerald-700 font-bold">{activeCase.hospitalReadiness?.status === 'BAY_READY' ? 'Sterile Ready' : 'Prep in Progress'}</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Clinician Review</span>
                    <strong className="text-xs font-black text-slate-900 block truncate">{isClinicianEndorsed ? 'Confirmed' : clinicianEndorsement?.status || 'Reviewed'}</strong>
                    <span className="text-[10px] text-slate-500 font-semibold truncate">{clinicianEndorsement?.clinicianName || 'Dr. Sunita Rao'}</span>
                  </div>
                </div>

                {activeCase.status !== 'TRANSFER_COMPLETED' ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-slate-600 font-medium">
                      {activeCase.conduitStep >= 7
                        ? 'Handover initiated. Awaiting receiving emergency team confirmation.'
                        : 'Ambulance is at emergency reception. Initiate formal transfer-of-care protocol with receiving clinical team.'}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsHandoverModalOpen(true)}
                        className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <FileText className="w-4 h-4" />
                        <span>VIEW HANDOVER PACKAGE</span>
                      </button>
                      {activeCase.conduitStep < 7 && (
                        <button
                          onClick={() => setIsHandoverConfirmModalOpen(true)}
                          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/25 transition-all cursor-pointer hover:scale-105 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>HANDOVER PATIENT</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-100/70 border border-emerald-300 text-emerald-950 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold">
                      Prehospital transfer completed. Patient care transitioned to {activeCase.ambulance.assignedHospital}.
                    </span>
                    <button
                      onClick={() => setIsHandoverModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-white text-emerald-900 font-black border border-emerald-300 shadow-2xs hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>OPEN HANDOVER PACKAGE</span>
                    </button>
                  </div>
                )}
              </div>
            )}

              {/* Bi-directional Coordination Handshake Vector */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Ambulance ({activeCase.ambulance.callSign}) ↔ Specialist Link ↔ Hospital Command Synchronized</span>
                </div>
                <span className="font-mono text-slate-500 uppercase font-bold hidden sm:inline">Unbroken Care Chain</span>
              </div>
            </div>

          {/* RIGHT COLUMN: Streaming Telemetry + Automated Clinical Propagation Status (Full width on compact, 3 cols on xl) */}
          <div className="lg:col-span-12 xl:col-span-3 flex flex-col gap-3.5 min-w-0">

            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Sensor Telemetry Stream
              </span>
              <span className="text-[10px] font-mono font-bold text-cyan-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                Live Sensor Sync
              </span>
            </div>

            {/* Vitals Blocks Grid: 3-col on lg, 1-col on xl */}
            <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3.5">
              {/* Heart Rate Block */}
              <VitalCard
                label="Heart Rate"
                value={currentVitals.heartRate}
                unit="bpm"
                trend={domain === 'POISONING' ? (currentVitals.heartRate < 60 ? 'DOWN' : 'STABLE') : (currentVitals.heartRate > 105 ? 'UP' : 'STABLE')}
                status={domain === 'POISONING' ? (currentVitals.heartRate < 55 ? 'CRITICAL' : 'WARNING') : (currentVitals.heartRate > 115 ? 'CRITICAL' : currentVitals.heartRate > 100 ? 'WARNING' : 'NORMAL')}
                sparkline={hrSparkline}
                referenceRange={domain === 'POISONING' ? 'Severe Bradycardia' : '60 - 100 bpm'}
              />

              {/* SpO2 Saturation Block */}
              <VitalCard
                label="SpO2 Saturation"
                value={`${currentVitals.spo2}%`}
                unit="O2"
                trend={currentVitals.spo2 < 94 ? 'DOWN' : 'STABLE'}
                status={currentVitals.spo2 < 92 ? 'CRITICAL' : currentVitals.spo2 < 95 ? 'WARNING' : 'NORMAL'}
                sparkline={spo2Sparkline}
                referenceRange="95 - 100 %"
              />

              {/* Blood Pressure & Shock Index Block */}
              <VitalCard
                label={`Blood Pressure (${isShockElevated ? `Shock Idx ${shockIndex}` : `PP ${pulsePressure}`})`}
                value={`${currentVitals.systolicBp}/${currentVitals.diastolicBp}`}
                unit="mmHg"
                trend={currentVitals.systolicBp < 100 ? 'DOWN' : 'STABLE'}
                status={currentVitals.systolicBp < 95 ? 'CRITICAL' : currentVitals.systolicBp < 105 ? 'WARNING' : 'NORMAL'}
                sparkline={sbpSparkline}
                referenceRange="110-130 / 70-85"
              />
            </div>

            {/* Secondary Operational Blocks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3.5">
              {/* AUTOMATED CLINICAL TELEMETRY STREAM LINK */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-white to-blue-50/40 border border-blue-200/80 shadow-xs flex flex-col gap-3 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#0E62FE] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-900">
                    Clinical Link Active
                  </span>
                </div>
                <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 uppercase tracking-wider">
                  Auto-Propagating
                </span>
              </div>

              <div className="text-xs text-slate-600 flex flex-col gap-1.5">
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Telemetry, patient assessment, and prehospital interventions propagate continuously into the remote clinician's console in real-time.
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                  <span className="text-slate-400 font-medium">Specialist on call:</span>
                  <span className="font-bold text-slate-800">
                    {clinicianEndorsement?.clinicianName || 'Dr. Sunita Rao, MD'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-medium">Specialist Status:</span>
                  <span className={`font-black uppercase ${isClinicianEndorsed ? 'text-emerald-700' : 'text-[#0E62FE]'}`}>
                    {isClinicianEndorsed ? 'PROTOCOL CONFIRMED' : 'MONITORING STREAM'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveRole('REMOTE_CLINICIAN')}
                className="w-full py-2 px-3 rounded-2xl bg-white hover:bg-blue-50 text-[#0E62FE] text-xs font-black border border-blue-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs group"
              >
                <span>View Specialist Review Console</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>

            {/* PRANA Intelligence Observable Pattern Signal Card (Role Projection: Operational Awareness) */}
            {activeCase.aiDecisionSupport && (
              <div className={`p-4 rounded-3xl border shadow-xs flex flex-col gap-2.5 ${
                activeCase.aiDecisionSupport.riskLevel === 'CRITICAL'
                  ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                  : 'bg-amber-50/60 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className={`w-3.5 h-3.5 ${
                      activeCase.aiDecisionSupport.riskLevel === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'
                    }`} />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      PRANA DECISION SUPPORT (AMBULANCE)
                    </span>
                  </div>
                  <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    activeCase.aiDecisionSupport.riskLevel === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {activeCase.aiDecisionSupport.riskLevel} RISK
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-900 leading-snug">
                    {activeCase.aiDecisionSupport.title || 'Hemodynamic Change Identified'}
                  </h4>
                  <p className="text-[11px] text-slate-700 font-medium mt-1 leading-relaxed">
                    {activeCase.aiDecisionSupport.clinicalSignificance}
                  </p>
                </div>

                {/* What Changed Highlight */}
                {activeCase.aiDecisionSupport.observedData && (
                  <div className="p-2 rounded-xl bg-white/80 border border-slate-200/80 text-[10.5px]">
                    <span className="text-[8.5px] font-mono font-black text-slate-400 uppercase block">OBSERVED TELEMETRY SHIFT</span>
                    <span className="font-semibold text-slate-800">{activeCase.aiDecisionSupport.observedData}</span>
                  </div>
                )}

                {/* Attention Gaps if any */}
                {activeCase.agentTask?.missingData && activeCase.agentTask.missingData.length > 0 && (
                  <div className="text-[10px] text-amber-900 font-medium bg-amber-100/60 p-2 rounded-xl border border-amber-200/60">
                    <strong className="block text-[8.5px] font-mono uppercase text-amber-800">FIELD ASSESSMENT ATTENTION:</strong>
                    <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                      {activeCase.agentTask.missingData.slice(0, 2).map((m, idx) => (
                        <li key={idx} className="truncate">{m.field}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Specialist Review Status & Governance */}
                <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[9.5px] font-mono">
                  <span className="text-slate-500 font-bold">SPECIALIST REVIEW:</span>
                  <span className={`font-black uppercase ${
                    activeCase.clinicianEndorsement?.status === 'CONFIRMED'
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}>
                    {activeCase.clinicianEndorsement?.status === 'CONFIRMED'
                      ? `CONFIRMED (${activeCase.clinicianEndorsement.clinicianName || 'Specialist'})`
                      : 'AWAITING SPECIALIST CONFIRMATION'}
                  </span>
                </div>

                <div className="text-[8.5px] font-mono text-slate-400 text-center uppercase tracking-tight">
                  {activeCase.aiDecisionSupport.safetyLabel || 'SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS'}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* 2. Care Rail Bottom Chronology Track */}
        <CareRail />
      </div>

      {/* Why This Hospital Modal */}
      {isWhyModalOpen && (
        <WhyThisHospitalModal onClose={() => setIsWhyModalOpen(false)} />
      )}

      {/* Field Medic Response Modal */}
      {isResponseModalOpen && activeCase.pendingDataRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-base text-slate-900">
                  Submit Field Clinical Assessment
                </h3>
              </div>
              <button
                onClick={() => setIsResponseModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
              <span className="text-[10px] font-black text-amber-700 uppercase block mb-1">
                Requested by Remote Specialist ({activeCase.pendingDataRequest.requestedBy}):
              </span>
              <p className="font-bold text-slate-900">{activeCase.pendingDataRequest.field}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">{activeCase.pendingDataRequest.reason}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-700">
                Field Observations / Findings:
              </label>
              <textarea
                value={customResponseText}
                onChange={(e) => setCustomResponseText(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder="Record your verified observation..."
              />
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[
                'Bilateral expiratory wheezing heard, good air entry, no silent chest.',
                'Pelvic binder taut, no step-off deformity or active peritoneal rigidity.',
                '20WBCT whole blood clotting test unclotted at 20 min mark, edema margin stable.',
                'Pupils 2mm non-reactive, moderate bronchorrhea, no stridor.',
                'Repeat NIBP 118/74 mmHg, radial pulse strong and regular.'
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setCustomResponseText(preset)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-800 transition-colors cursor-pointer text-left truncate max-w-full"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setIsResponseModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (customResponseText.trim()) {
                    submitFieldResponse(activeCase.pendingDataRequest!.id, customResponseText.trim());
                    showToast('Clinical Assessment Sent', 'Field observation delivered to Remote Specialist.', 'success');
                    setIsResponseModalOpen(false);
                  }
                }}
                className="px-5 py-2.5 rounded-full text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>TRANSMIT RESPONSE TO SPECIALIST</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Handover Confirmation Surface (Section 8) */}
      {isHandoverConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    COMPLETE TRANSFER OF CARE
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Formal Clinical Handover to Receiving Emergency Facility
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsHandoverConfirmModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Identity</span>
                  <strong className="text-slate-900 font-black text-sm block">{patient.name}</strong>
                  <span className="text-slate-500">{patient.age}y · {patient.sex} · Conscious: {patient.consciousState}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Receiving Facility</span>
                  <strong className="text-slate-900 font-black text-sm block">{activeCase.ambulance.assignedHospital}</strong>
                  <span className="text-slate-500">Bay: {activeCase.hospitalReadiness?.assignedBay || 'Awaiting Assignment'}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Latest Confirmed Vitals</span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-1.5 rounded-xl bg-white border border-slate-200/60">
                    <span className="text-[9px] text-slate-400 font-bold block">HR</span>
                    <strong className="text-xs font-black text-slate-900">{currentVitals.heartRate} bpm</strong>
                  </div>
                  <div className="p-1.5 rounded-xl bg-white border border-slate-200/60">
                    <span className="text-[9px] text-slate-400 font-bold block">SpO2</span>
                    <strong className="text-xs font-black text-slate-900">{currentVitals.spo2}%</strong>
                  </div>
                  <div className="p-1.5 rounded-xl bg-white border border-slate-200/60">
                    <span className="text-[9px] text-slate-400 font-bold block">BP</span>
                    <strong className="text-xs font-black text-slate-900">{currentVitals.systolicBp}/{currentVitals.diastolicBp}</strong>
                  </div>
                  <div className="p-1.5 rounded-xl bg-white border border-slate-200/60">
                    <span className="text-[9px] text-slate-400 font-bold block">RR</span>
                    <strong className="text-xs font-black text-slate-900">{currentVitals.respiratoryRate}/min</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Handover Package Summary</span>
                <p className="text-[11px] text-slate-600">
                  <strong className="text-slate-800">Condition: </strong>{patient.incidentType} — {patient.chiefComplaint}
                </p>
                <p className="text-[11px] text-slate-600">
                  <strong className="text-slate-800">Clinician Review: </strong>{isClinicianEndorsed ? 'Confirmed by Dr. Sunita Rao' : clinicianEndorsement?.status || 'In Transit Review'}
                </p>
                <p className="text-[11px] text-slate-600">
                  <strong className="text-slate-800">Timeline Events: </strong>{activeCase.timeline.length} immutable events recorded
                </p>
                <p className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200/60">
                  SHA-256 Provenance Digest verified · WHO-aligned SBAR structured transfer
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Handover Notes / Direct Verbal Exchange
                </label>
                <textarea
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  className="w-full h-16 p-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Record receiving nurse/physician notes..."
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setIsHandoverConfirmModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  initiateHandover(handoverNotes);
                  showToast('Transfer of Care Initiated', 'WHO SBAR briefing transmitted to receiving ED charge.', 'info');
                  setIsHandoverConfirmModalOpen(false);
                }}
                className="px-6 py-2.5 rounded-full text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5 hover:scale-105 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>CONFIRM HANDOVER</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prehospital Handover Package Viewer Modal */}
      <PrehospitalHandoverPanel
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
      />
    </>
  );
};
