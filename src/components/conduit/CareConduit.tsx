import React, { useState } from 'react';
import { useEmergency } from '../../context/useEmergency';
import {
  Ambulance,
  Building2,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Stethoscope,
  AlertTriangle
} from 'lucide-react';
import { WhyThisHospitalModal } from '../facility/WhyThisHospitalModal';

interface CareConduitProps {
  variant?: 'journey' | 'clinical' | 'readiness';
}

export const CareConduit: React.FC<CareConduitProps> = ({ variant = 'journey' }) => {
  const { activeCase, derivedEta } = useEmergency();
  const { ambulance, currentVitals, domain, hospitalReadiness, clinicianEndorsement, conduitStep } = activeCase;
  const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);

  // Dynamic clinical indices
  const shockIndex = (currentVitals.heartRate / (currentVitals.systolicBp || 1)).toFixed(2);

  // Receiving hospital readiness state
  const isBayReady = hospitalReadiness?.status === 'BAY_READY';
  const hospitalNameShort = ambulance.assignedHospital.split('(')[0].trim();

  // Clinician endorsement state
  const isEndorsed = clinicianEndorsement?.status === 'CONFIRMED';
  const clinicianLabel = isEndorsed
    ? 'Protocol Endorsed'
    : clinicianEndorsement?.status === 'ESCALATED'
    ? 'Escalated — Review Required'
    : clinicianEndorsement?.status === 'DATA_REQUESTED'
    ? 'Data Clarification'
    : 'Reviewing Telemetry';

  // 9-Stage Continuous Care Route Definition with Responsive Labels
  const routeStages = [
    { step: 0, label: 'Incident', shortLabel: 'Incident', detail: activeCase.patient.location ? activeCase.patient.location.split(',')[0].slice(0, 12) : 'Incident Site' },
    { step: 1, label: 'Assessment', shortLabel: 'Triage', detail: 'Triage Done' },
    { step: 2, label: 'Ambulance', shortLabel: 'Ambulance', detail: `${ambulance.callSign} ALS` },
    { step: 3, label: 'Clinician', shortLabel: 'Clinician', detail: isEndorsed ? 'Endorsed' : clinicianEndorsement?.status === 'ESCALATED' ? 'Escalated' : 'Review' },
    { step: 4, label: 'Facility', shortLabel: 'Facility', detail: hospitalReadiness?.isPreAlertDispatched ? 'Pre-Alert' : 'Allocated' },
    { step: 5, label: 'Hospital Ready', shortLabel: 'Ready', detail: isBayReady ? (hospitalReadiness?.assignedBay ? `${hospitalReadiness.assignedBay}` : 'Bay Ready') : hospitalReadiness?.isPreAlertDispatched ? 'Awaiting Bay' : 'Pending' },
    { step: 6, label: 'Arrival', shortLabel: 'Arrival', detail: conduitStep >= 6 || activeCase.status === 'ARRIVED' ? 'Arrived' : `${derivedEta}m ETA` },
    { step: 7, label: 'Handover', shortLabel: 'Handover', detail: conduitStep >= 8 || activeCase.status === 'TRANSFER_COMPLETED' ? 'Done' : conduitStep >= 7 ? 'Initiated' : 'Pending' },
    { step: 8, label: 'Completed', shortLabel: 'Complete', detail: conduitStep >= 8 || activeCase.status === 'TRANSFER_COMPLETED' ? 'Transferred' : 'Standby' },
  ];

  /* =========================================================================
     VARIANT 1: CLINICAL CONDUIT (Tailored for Clinician Workspace)
     ========================================================================= */
  if (variant === 'clinical') {
    return (
      <div className="w-full bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#0E62FE]" />
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">
              PRANA CLINICAL CONDUIT · BI-DIRECTIONAL SPECIALIST LINK
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200 text-[10px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            256-BIT ENCRYPTED TELEMETRY STREAM
          </span>
        </div>

        {/* Bi-directional Authority Flow: Field Paramedic <---> Continuous Wave <---> Specialist */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          {/* Paramedic Origin */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-[#0E62FE] flex items-center justify-center shrink-0 border border-blue-200">
              <Ambulance className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Field Lead</div>
              <div className="text-xs font-black text-slate-900">{ambulance.crewLead}</div>
              <div className="text-[10px] text-slate-500 font-semibold">{ambulance.callSign} · In Transit ({ambulance.currentSpeedKmH} km/h)</div>
            </div>
          </div>

          {/* Central Telemetry Conduit Waveform */}
          <div className="flex flex-col items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-50/50 via-cyan-50/50 to-indigo-50/50 rounded-2xl border border-slate-200/60">
            <div className="w-full h-8 relative flex items-center justify-center">
              <svg viewBox="0 0 160 32" className="w-full h-full overflow-visible">
                <path
                  d="M 0 16 L 30 16 L 40 4 L 48 28 L 56 10 L 64 22 L 72 16 L 90 16 L 100 6 L 108 26 L 116 16 L 160 16"
                  fill="none"
                  stroke="#0E62FE"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="animate-ecg-scan"
                />
              </svg>
            </div>
            <span className="text-[9px] font-black text-[#0E62FE] uppercase tracking-wider mt-1">
              Continuous Sensor Streaming
            </span>
          </div>

          {/* Remote Specialist Authority */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isEndorsed
                ? 'bg-emerald-100/70 text-emerald-700 border-emerald-300'
                : 'bg-amber-100/70 text-amber-700 border-amber-300'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Tele-Specialist Authority</div>
              <div className="text-xs font-black text-slate-900">
                {clinicianEndorsement?.clinicianName || 'Dr. Sunita Rao, MD'}
              </div>
              <div className={`text-[10px] font-black uppercase tracking-wider ${isEndorsed ? 'text-emerald-700' : 'text-amber-700'}`}>
                {clinicianLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     VARIANT 2: READINESS CONDUIT (Tailored for Hospital Command)
     ========================================================================= */
  if (variant === 'readiness') {
    return (
      <div className="w-full bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">
              PRANA RECEPTION CONDUIT · INBOUND CORRIDOR STANDBY
            </span>
          </div>
          <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold ${
            hospitalReadiness?.isPreAlertDispatched
              ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
              : 'text-amber-800 bg-amber-50 border-amber-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${hospitalReadiness?.isPreAlertDispatched ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            {hospitalReadiness?.isPreAlertDispatched ? 'FACILITY PRE-ALERT CONFIRMED' : 'PRE-ALERT NOT YET SENT'}
          </span>
        </div>

        {/* Arrival Trajectory Vector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-[#0E62FE] flex items-center justify-center shrink-0 border border-blue-200">
              <Ambulance className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Incoming ALS Unit</span>
              <span className="text-xs font-black text-slate-900">{ambulance.callSign}</span>
              <span className="text-[10px] text-slate-500 font-semibold block">{ambulance.currentSpeedKmH} km/h · Transit Corridor</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#0E62FE]">
              ESTIMATED ARRIVAL WINDOW
            </span>
            <span className="text-3xl font-black font-tabular text-slate-950 leading-tight">
              {derivedEta} MINS
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">
              {ambulance.isTrafficDelayed ? 'Traffic Delay Applied' : 'Corridor Transit Normal'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isBayReady ? 'bg-emerald-100/70 text-emerald-700 border-emerald-300' : 'bg-amber-100/70 text-amber-700 border-amber-300'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Assigned Bay</span>
              <span className="text-xs font-black text-slate-900">
                {hospitalReadiness?.assignedBay || 'Awaiting Assignment'}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-wider block ${isBayReady ? 'text-emerald-700' : 'text-amber-700'}`}>
                {isBayReady ? 'Sterile & Verified Ready' : hospitalReadiness?.assignedBay ? 'Prep in Progress' : 'Not Assigned'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     VARIANT 3: JOURNEY CONDUIT (Default for Ambulance Field & Mission Canvas)
     Continuous Care Route Vector: Incident -> Assessment -> Ambulance -> Clinician -> Facility -> Ready -> Arrival
     ========================================================================= */
  const activeStep = activeCase.status === 'TRANSFER_COMPLETED' ? 8 : (conduitStep ?? 2);

  return (
    <>
      <div className="relative w-full flex flex-col items-center select-none py-2 gap-3.5">

        {/* 1. TOP RELATIONSHIP DOCK (Origin Ambulance <---> Destination Hospital) */}
        <div className="w-full max-w-[620px] prana-float-pill px-5 py-2.5 bg-white/95 backdrop-blur-md flex items-center justify-between border border-slate-200/90 shadow-sm z-30">
          {/* Origin Ambulance */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0E62FE] flex items-center justify-center border border-blue-200">
              <Ambulance className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900">{ambulance.callSign}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                Transit · {ambulance.currentSpeedKmH} km/h
              </span>
            </div>
          </div>

          {/* Dynamic Care Connection Vector */}
          <div className="flex flex-col items-center px-2">
            <div className="flex items-center gap-1 text-[#0E62FE]">
              <span className="h-0.5 w-6 sm:w-10 bg-gradient-to-r from-blue-300 to-indigo-500" />
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-[9px] font-black text-[#0E62FE] font-mono uppercase tracking-wider mt-0.5">
              CARE CORRIDOR ACTIVE
            </span>
          </div>

          {/* Receiving Facility Destination Button */}
          <button
            onClick={() => setIsWhyModalOpen(true)}
            className="flex items-center gap-2.5 text-right group cursor-pointer hover:opacity-90 transition-opacity"
            title="Click to view Why This Hospital? suitability breakdown"
          >
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 group-hover:text-[#0E62FE] transition-colors">
                  {hospitalNameShort}
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-black border uppercase ${
                  isBayReady
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 animate-pulse'
                    : 'bg-blue-50 text-[#0E62FE] border-blue-200'
                }`}>
                  {isBayReady ? 'Bay Ready' : 'Pre-Alert'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600">
                {hospitalReadiness?.assignedBay || 'Receiving Bay'}
              </span>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              isBayReady
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-blue-50 text-[#0E62FE] border-blue-200'
            }`}>
              <Building2 className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* 2. CONTINUOUS CARE ROUTE STAGE */}
        <div className="w-full bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col gap-5 relative overflow-hidden">

          {/* Header Row: Title + Live Sync Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0E62FE]" />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">
                Continuous Prehospital Care Route
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                activeCase.status === 'TRANSFER_COMPLETED'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-blue-50 text-[#0E62FE] border-blue-200'
              }`}>
                {activeCase.status === 'TRANSFER_COMPLETED'
                  ? 'ALL 9 MILESTONES COMPLETED'
                  : `STAGE ${activeStep + 1} OF 9 · ${routeStages[activeStep]?.label.toUpperCase()}`}
              </span>
              <span className="flex items-center gap-1.5 text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200 text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                Live Sensor Sync
              </span>
            </div>
          </div>

          {/* Continuous Care Route Rail (9-Node Vector with Guaranteed Spacing) */}
          <div className="relative py-2 overflow-x-auto scrollbar-thin">
            <div className="min-w-[760px] relative px-4">
              {/* The Continuous Connecting Route Line */}
              <div className="absolute top-[20px] left-10 right-10 h-1 bg-slate-200 rounded-full">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    activeCase.status === 'TRANSFER_COMPLETED'
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-cyan-400 via-[#0E62FE] to-emerald-400'
                  }`}
                  style={{ width: `${activeCase.status === 'TRANSFER_COMPLETED' ? 100 : Math.min(100, Math.max(8, (activeStep / 8) * 100))}%` }}
                />
              </div>

              {/* Stage Nodes Row */}
              <div className="flex items-start justify-between relative z-10">
                {routeStages.map((stage) => {
                  const isCompleted = activeCase.status === 'TRANSFER_COMPLETED' || activeStep > stage.step;
                  const isCurrent = activeCase.status !== 'TRANSFER_COMPLETED' && activeStep === stage.step;

                  return (
                    <div key={stage.step} className="flex flex-col items-center text-center px-1 flex-1 min-w-[76px] max-w-[100px]">
                      {/* Circle Node */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shrink-0 ${
                        isCurrent
                          ? 'bg-[#0E62FE] text-white ring-4 ring-blue-100 shadow-md shadow-blue-500/30 scale-110'
                          : isCompleted
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-white text-slate-400 border-2 border-slate-200'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        ) : isCurrent ? (
                          <span className="font-mono text-[10px] font-black">{stage.step + 1}</span>
                        ) : (
                          <span className="font-mono text-[10px] font-bold">{stage.step + 1}</span>
                        )}
                      </div>

                      {/* Primary Label */}
                      <span className={`text-[10px] sm:text-[10.5px] font-black uppercase tracking-tight mt-2 leading-tight text-center ${
                        isCurrent ? 'text-[#0E62FE]' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {stage.label}
                      </span>

                      {/* Secondary Detail Badge */}
                      <span className={`text-[9px] font-semibold mt-1 px-1.5 py-0.2 rounded-full border text-center whitespace-nowrap ${
                        isCurrent
                          ? 'bg-blue-50 text-[#0E62FE] border-blue-200 font-bold animate-pulse'
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}>
                        {isCurrent ? 'ACTIVE' : stage.detail}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Traffic Delay Banner (Rendered Spatially along Route) */}
          {ambulance.isTrafficDelayed && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-extrabold text-amber-900 truncate">
                  Corridor Congestion Active (+8 Mins Delay)
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                Care Continuous
              </span>
            </div>
          )}

          {/* Bottom Corridor Metrics & Telemetry Indicators (Collision-Proof) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-center min-w-0">
              <span className="text-slate-400 font-extrabold uppercase text-[9px] tracking-wider truncate">
                {domain === 'POISONING' ? 'TOXICOLOGY' : domain === 'SNAKEBITE' ? 'COAGULATION' : 'HEMODYNAMICS'}
              </span>
              <span className="font-black text-slate-900 text-xs sm:text-[13px] truncate mt-0.5">
                {domain === 'POISONING'
                  ? `Bradycardia: ${currentVitals.heartRate} bpm`
                  : domain === 'SNAKEBITE'
                  ? '20WBCT Watch'
                  : `Shock Idx: ${shockIndex}`}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-center min-w-0">
              <span className="text-slate-400 font-extrabold uppercase text-[9px] tracking-wider truncate">Specialist Review</span>
              <span className={`font-black text-xs sm:text-[13px] truncate mt-0.5 ${isEndorsed ? 'text-emerald-700' : 'text-[#0E62FE]'}`}>
                {clinicianLabel}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-center min-w-0">
              <span className="text-slate-400 font-extrabold uppercase text-[9px] tracking-wider truncate">Corridor Touchdown</span>
              <span className="font-black text-slate-900 font-mono text-xs sm:text-[13px] truncate mt-0.5">
                {derivedEta} MINS ETA
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Why This Hospital Explainable Modal */}
      {isWhyModalOpen && (
        <WhyThisHospitalModal onClose={() => setIsWhyModalOpen(false)} />
      )}
    </>
  );
};
