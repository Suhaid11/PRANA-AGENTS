import React, { useState } from 'react';
import { useEmergency } from '../../context/useEmergency';
import { CareConduit } from '../conduit/CareConduit';
import { PatientCard } from './PatientCard';
import { VitalCard } from './VitalCard';
import { CareRail } from '../timeline/CareRail';
import { WhyThisHospitalModal } from '../facility/WhyThisHospitalModal';
import { 
  Wind, 
  Syringe, 
  Shield, 
  ChevronRight, 
  ArrowUpRight, 
  Radio, 
  Sparkles,
  Building2,
  CheckCircle2
} from 'lucide-react';

export const AmbulanceWorkspace: React.FC = () => {
  const { activeCase, addTimelineEvent, setActiveRole, submitFieldResponse, dismissFieldDataRequest } = useEmergency();
  const { currentVitals, vitalsHistory, patient, domain, clinicianEndorsement } = activeCase;
  const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [customResponseText, setCustomResponseText] = useState('');

  // Sparkline rolling histories (last 10 snapshots)
  const hrSparkline = vitalsHistory.map((v) => v.heartRate);
  const spo2Sparkline = vitalsHistory.map((v) => v.spo2);
  const sbpSparkline = vitalsHistory.map((v) => v.systolicBp);

  const shockIndex = (currentVitals.heartRate / (currentVitals.systolicBp || 1)).toFixed(2);
  const isShockElevated = Number(shockIndex) > 0.9;
  const pulsePressure = currentVitals.systolicBp - currentVitals.diastolicBp;

  const isClinicianEndorsed = clinicianEndorsement?.status === 'CONFIRMED';

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
                      Receiving Medical Destination
                    </span>
                    <h3 className="font-black text-sm text-slate-900 leading-tight">
                      {activeCase.ambulance.assignedHospital}
                    </h3>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider flex items-center gap-1.5 ${
                  activeCase.hospitalReadiness?.status === 'BAY_READY'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-blue-50 text-[#0E62FE] border-blue-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    activeCase.hospitalReadiness?.status === 'BAY_READY' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
                  }`} />
                  <span>{activeCase.hospitalReadiness?.status === 'BAY_READY' ? 'Bay 1 Sterile Ready' : 'Pre-Alert Transmitted'}</span>
                </span>
              </div>

              {/* Destination Metrics & Arrival Vector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col justify-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Touchdown Corridor</span>
                  <span className="font-tabular font-black text-slate-950 text-base sm:text-lg mt-0.5">
                    {activeCase.ambulance.effectiveEtaMinutes || 14} MINS
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold truncate">
                    {activeCase.ambulance.isTrafficDelayed ? 'Traffic Delay Applied' : 'Transit Corridor Clear'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col justify-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Assigned Bay</span>
                  <span className="font-black text-slate-900 text-xs sm:text-sm mt-0.5 truncate">
                    {activeCase.hospitalReadiness?.assignedBay || 'Resuscitation Bay 1'}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold truncate">
                    {activeCase.hospitalReadiness?.status === 'BAY_READY' ? 'Sterile Prep Complete' : 'Hot Standby'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 flex flex-col justify-center">
                  <span className="text-[9px] font-black text-[#0E62FE] uppercase tracking-wider">Catchment Match</span>
                  <span className="font-tabular font-black text-[#0E62FE] text-base sm:text-lg mt-0.5">
                    94% Fit
                  </span>
                  <span className="text-[10px] text-slate-600 font-semibold truncate">
                    Top Tier Capability
                  </span>
                </div>
              </div>

              {/* Transparent Suitability Rationale + Modal Trigger */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3 text-xs">
                <p className="text-[11px] text-slate-600 leading-snug font-medium truncate">
                  <strong className="text-slate-800">Why Selected: </strong>
                  {domain === 'TRAUMA' 
                    ? 'Level-1 angio-embolization and available red resuscitation bay.' 
                    : domain === 'SNAKEBITE' 
                    ? 'Regional toxicology unit with dedicated antivenom cold-chain stocks.' 
                    : 'Dedicated toxicology ICU with mechanical ventilation and atropine infusion protocols.'}
                </p>
                <button
                  onClick={() => setIsWhyModalOpen(true)}
                  className="text-[11px] font-black text-[#0E62FE] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>Formula</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bi-directional Coordination Handshake Vector */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Ambulance ({activeCase.ambulance.callSign}) ↔ Specialist Link ↔ Hospital Command Synchronized</span>
                </div>
                <span className="font-mono text-slate-500 uppercase font-bold hidden sm:inline">Unbroken Care Chain</span>
              </div>
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
    </>
  );
};
