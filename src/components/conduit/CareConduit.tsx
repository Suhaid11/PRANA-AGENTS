import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { Ambulance, Building2, Activity, ArrowRight, ShieldCheck, CheckCircle2, Stethoscope } from 'lucide-react';
import { WhyThisHospitalModal } from '../facility/WhyThisHospitalModal';

interface CareConduitProps {
  variant?: 'journey' | 'clinical' | 'readiness';
}

export const CareConduit: React.FC<CareConduitProps> = ({ variant = 'journey' }) => {
  const { activeCase, derivedEta } = useEmergency();
  const { ambulance, currentVitals, domain, hospitalReadiness, clinicianEndorsement } = activeCase;
  const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);

  // Dynamic clinical calculation
  const shockIndex = (currentVitals.heartRate / currentVitals.systolicBp).toFixed(2);
  const isShockElevated = Number(shockIndex) > 0.9;

  // Receiving hospital readiness state
  const isBayReady = hospitalReadiness?.status === 'BAY_READY';
  const hospitalNameShort = ambulance.assignedHospital.split('(')[0].trim();

  // Clinician endorsement state
  const isEndorsed = clinicianEndorsement?.status === 'CONFIRMED';
  const clinicianLabel = isEndorsed 
    ? 'Protocol Endorsed' 
    : clinicianEndorsement?.status === 'ESCALATED' 
    ? 'Escalated to Trauma' 
    : clinicianEndorsement?.status === 'DATA_REQUESTED'
    ? 'Data Clarification'
    : 'Reviewing Telemetry';

  /* =========================================================================
     VARIANT 1: CLINICAL CONDUIT (Tailored for Clinician Workspace)
     Focus: Tele-consultation handshake, physiological waveform sync, clinical authority
     ========================================================================= */
  if (variant === 'clinical') {
    return (
      <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#0E62FE]" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-800">
              PRANA CLINICAL CONDUIT · TELE-CONSULTATION LINK
            </span>
          </div>
          <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            256-Bit Encrypted Audio & Sensor Sync
          </span>
        </div>

        {/* Bi-directional Authority Flow: Field Paramedic <---> Remote Specialist */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          {/* Paramedic Origin */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0E62FE] flex items-center justify-center shrink-0 border border-blue-100">
              <Ambulance className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Field Lead</div>
              <div className="text-xs font-extrabold text-slate-900">{ambulance.crewLead}</div>
              <div className="text-[10px] text-slate-500">{ambulance.callSign} · In Transit</div>
            </div>
          </div>

          {/* Central Telemetry Conduit Waveform */}
          <div className="flex flex-col items-center justify-center px-2 py-1">
            <div className="w-full h-8 relative flex items-center justify-center">
              <svg viewBox="0 0 160 32" className="w-full h-full">
                <path
                  d="M 0 16 L 30 16 L 40 4 L 48 28 L 56 10 L 64 22 L 72 16 L 90 16 L 100 6 L 108 26 L 116 16 L 160 16"
                  fill="none"
                  stroke="#0E62FE"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="animate-ecg-scan"
                />
              </svg>
            </div>
            <span className="text-[9px] font-extrabold text-[#0E62FE] uppercase tracking-wider">
              Continuous Telemetry Stream
            </span>
          </div>

          {/* Remote Specialist Authority */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/60 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              isEndorsed 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Tele-Specialist</div>
              <div className="text-xs font-extrabold text-slate-900">
                {clinicianEndorsement?.clinicianName || 'Dr. Sunita Rao, MD'}
              </div>
              <div className={`text-[10px] font-bold ${isEndorsed ? 'text-emerald-700' : 'text-amber-700'}`}>
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
     Focus: Inbound emergency reception, corridor traffic, bay sterile prep
     ========================================================================= */
  if (variant === 'readiness') {
    return (
      <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-800">
              PRANA RECEPTION CONDUIT · INBOUND CORRIDOR Standby
            </span>
          </div>
          <span className="flex items-center gap-1 text-emerald-700 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Facility Pre-Alert Active
          </span>
        </div>

        {/* Arrival Trajectory Vector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0E62FE] flex items-center justify-center shrink-0 border border-blue-100">
              <Ambulance className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Incoming Unit</span>
              <span className="text-xs font-extrabold text-slate-900">{ambulance.callSign}</span>
              <span className="text-[10px] text-slate-500 block">{ambulance.currentSpeedKmH} km/h on Ring Road</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/60 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0E62FE]">
              Estimated Touchdown
            </span>
            <span className="text-2xl font-extrabold font-tabular text-slate-900 leading-tight">
              {derivedEta} MINS
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Corridor clear</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/60 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              isBayReady ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Resuscitation Bay</span>
              <span className="text-xs font-extrabold text-slate-900">
                {hospitalReadiness?.assignedBay || 'Trauma Bay 1'}
              </span>
              <span className={`text-[10px] font-bold block ${isBayReady ? 'text-emerald-700' : 'text-amber-700'}`}>
                {isBayReady ? 'Sterile & Verified Ready' : 'Preparation In Progress'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     VARIANT 3: JOURNEY CONDUIT (Default for Ambulance Field)
     Focus: Spatial journey anchor, continuous ECG nexus, orbital route
     ========================================================================= */
  return (
    <>
      <div className="relative w-full flex flex-col items-center select-none py-2">
        
        {/* 1. TOP JOURNEY RELATIONSHIP DOCK */}
        <div className="w-full max-w-[540px] prana-float-pill px-5 py-2.5 bg-white/95 backdrop-blur-md flex items-center justify-between border border-slate-200/80 shadow-xs z-30 mb-2">
          {/* Ambulance Origin Side */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0E62FE] flex items-center justify-center border border-blue-200/60">
              <Ambulance className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-900">{ambulance.callSign}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                Active Transit · {ambulance.currentSpeedKmH} km/h
              </span>
            </div>
          </div>

          {/* Dynamic Care Connection Vector */}
          <div className="flex flex-col items-center px-3">
            <div className="flex items-center gap-1 text-[#0E62FE]">
              <span className="h-px w-8 sm:w-12 bg-blue-300" />
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] font-extrabold text-blue-600 font-tabular uppercase tracking-wider mt-0.5">
              Care Line Active
            </span>
          </div>

          {/* Receiving Facility Destination Side */}
          <button
            onClick={() => setIsWhyModalOpen(true)}
            className="flex items-center gap-2.5 text-right group cursor-pointer hover:opacity-90 transition-opacity"
            title="Click to view Why This Hospital? suitability rationale"
          >
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-900 group-hover:text-[#0E62FE] transition-colors">
                  {hospitalNameShort}
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold border uppercase ${
                  isBayReady
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 animate-pulse'
                    : 'bg-blue-50 text-[#0E62FE] border-blue-200'
                }`}>
                  {isBayReady ? 'Bay Ready' : 'Pre-Alert'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600">
                {hospitalReadiness?.assignedBay || 'Trauma Bay 1 Resuscitation'}
              </span>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              isBayReady 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60' 
                : 'bg-blue-50 text-[#0E62FE] border-blue-200/60'
            }`}>
              <Building2 className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* 2. PRANA-NATIVE CARE CONDUIT CENTERPIECE */}
        <div className="relative w-full h-[300px] sm:h-[340px] flex items-center justify-center overflow-visible">
          
          {/* Concentric Ambient Aura Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] rounded-full border border-slate-300/35 opacity-70 animate-pulse-aura" />
            <div className="absolute w-[240px] h-[240px] sm:w-[290px] sm:h-[290px] rounded-full border border-dashed border-blue-300/40" />
            <div className="absolute w-[170px] h-[170px] sm:w-[210px] sm:h-[210px] rounded-full bg-gradient-to-b from-blue-50/60 to-white shadow-[0_20px_50px_rgba(14,98,254,0.07)] backdrop-blur-xs border border-white" />
          </div>

          {/* Central Physiological & Route Nexus Vector */}
          <div className="relative z-10 w-[240px] h-[180px] flex items-center justify-center">
            <svg viewBox="0 0 260 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="careWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                  <stop offset="40%" stopColor="#0E62FE" stopOpacity="1" />
                  <stop offset="60%" stopColor="#2563EB" stopOpacity="1" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* Glowing Orbital Route Ellipse */}
              <ellipse
                cx="130"
                cy="100"
                rx="110"
                ry="65"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="2"
                strokeDasharray="6 6"
              />

              {/* Continuous Live Clinical ECG Pulse Conduit */}
              <path
                d="M 20 100 L 70 100 L 85 70 L 98 135 L 112 85 L 126 115 L 138 100 L 170 100 L 180 82 L 192 118 L 202 100 L 240 100"
                fill="none"
                stroke="url(#careWaveGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-ecg-scan"
              />

              {/* Core Patient Care Node */}
              <circle cx="130" cy="100" r="8" fill="#0E62FE" />
              <circle cx="130" cy="100" r="14" fill="#0E62FE" opacity="0.2" className="animate-ping" />
            </svg>

            {/* Tactical Center Labels */}
            <div className="absolute top-[128px] flex flex-col items-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0E62FE]">
                PATIENT CARE CONDUIT
              </span>
              <span className="text-[11px] font-bold text-slate-700 font-tabular mt-0.5">
                Live Telemetry Linked
              </span>
            </div>
          </div>

          {/* Floating Lateral Satellites */}
          <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 prana-float-pill px-3 py-1.5 bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs flex items-center gap-2 z-20">
            <Activity className={`w-3.5 h-3.5 ${domain === 'POISONING' ? 'text-purple-600' : isShockElevated ? 'text-amber-500' : 'text-[#0E62FE]'}`} />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-bold text-slate-400 uppercase">
                {domain === 'POISONING' ? 'TOXICOLOGY' : domain === 'SNAKEBITE' ? 'COAGULATION' : 'HEMODYNAMICS'}
              </span>
              <span className="text-xs font-bold text-slate-800">
                {domain === 'POISONING' 
                  ? `Bradycardia: ${currentVitals.heartRate} bpm` 
                  : domain === 'SNAKEBITE' 
                  ? '20WBCT Clot Watch'
                  : `Shock Idx: ${shockIndex}`}
              </span>
            </div>
          </div>

          <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 prana-float-pill px-3 py-1.5 bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs flex items-center gap-2 z-20">
            {isEndorsed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            )}
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-bold text-slate-400 uppercase">TELE-SPECIALIST</span>
              <span className={`text-xs font-bold ${isEndorsed ? 'text-emerald-700' : 'text-slate-800'}`}>
                {clinicianLabel}
              </span>
            </div>
          </div>

          {/* Traffic Delay Banner — Calm Clinical Spatialism */}
          {ambulance.isTrafficDelayed && (
            <div className="absolute bottom-2 px-4 py-2 rounded-full bg-amber-900/90 text-amber-100 font-extrabold text-xs shadow-md border border-amber-500/50 flex items-center gap-2 z-30 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>TRANSPORT DELAY (+8 MIN) · CARE CONTINUES WITHOUT INTERRUPTION</span>
            </div>
          )}
        </div>

        {/* 3. CURRENT JOURNEY & CARE CONTINUITY STATUS */}
        <div className="w-full max-w-[540px] prana-float-pill px-6 py-2 bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs flex items-center justify-between text-xs z-20 mt-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">CORRIDOR:</span>
            <span className="font-extrabold text-slate-800">
              Ring Road Arterial {ambulance.isTrafficDelayed ? '(Congested)' : ''}
            </span>
          </div>
          <span className="text-slate-300">·</span>
          <div className="flex items-center gap-1.5 font-tabular font-bold text-slate-700">
            <span>{derivedEta} MIN ETA</span>
          </div>
          <span className="text-slate-300">·</span>
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>CARE CONTINUES</span>
          </div>
        </div>
      </div>

      {/* Why This Hospital Modal */}
      <WhyThisHospitalModal 
        isOpen={isWhyModalOpen} 
        onClose={() => setIsWhyModalOpen(false)} 
      />
    </>
  );
};
