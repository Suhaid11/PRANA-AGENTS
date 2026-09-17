import React from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { CareConduit } from '../conduit/CareConduit';
import { CareRail } from '../timeline/CareRail';
import { Stethoscope, CheckCircle2, FileQuestion, ArrowUpRight, Check, Activity, ShieldCheck } from 'lucide-react';

export const ClinicianWorkspace: React.FC = () => {
  const { activeCase, endorseProtocol, derivedEta } = useEmergency();
  const { currentVitals, vitalsHistory, patient, ambulance, domain, clinicianEndorsement } = activeCase;

  const currentStatus = clinicianEndorsement?.status || 'PENDING';
  const clinicianName = clinicianEndorsement?.clinicianName || 'Dr. Sunita Rao, MD';

  const handleProtocolAction = (action: 'CONFIRMED' | 'DATA_REQUESTED' | 'ESCALATED' | 'ACKNOWLEDGED') => {
    endorseProtocol(action);
  };

  // Dynamic calculations
  const shockIndex = (currentVitals.heartRate / currentVitals.systolicBp).toFixed(2);
  const pulsePressure = currentVitals.systolicBp - currentVitals.diastolicBp;

  // Recent clinical interventions from timeline
  const recentInterventions = activeCase.timeline.filter(e => e.actor === 'FIELD MEDIC');

  return (
    <div className="flex flex-col gap-6 py-2">
      
      {/* 1. Editorial Top Headline */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-extrabold text-[#0E62FE] uppercase tracking-widest mb-1">
            Tele-Specialist Authority · Clinical Review Console
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[0.95]">
            Clinical <br />
            <span className="text-slate-400 font-normal">Decision Support.</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-xs ${
            currentStatus === 'CONFIRMED'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : currentStatus === 'ESCALATED'
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {currentStatus === 'CONFIRMED' 
              ? `PROTOCOL ENDORSED · ${clinicianName.toUpperCase()}` 
              : currentStatus === 'ESCALATED'
              ? 'ESCALATED TO SURGICAL TEAM'
              : 'REMOTE CLINICIAN REVIEW REQUESTED'}
          </span>
        </div>
      </div>

      {/* 2. Contextual Clinical Conduit (Paramedic <---> Specialist Link) */}
      <CareConduit variant="clinical" />

      {/* 3. Main Clinical Analysis Stage: Focal Review Experience */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT / CENTER (7 cols): Observable Signals Synthesis & Action Console */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Observable Signals Card */}
          <div className="prana-float-card p-6 bg-white/90 backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#0E62FE]" />
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">
                  Observable Signals Synthesis
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Simulation Decision Engine
              </span>
            </div>

            {/* Dynamic Observable Signals depending on domain */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {domain === 'POISONING' ? (
                <>
                  <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold text-purple-700 uppercase">Severe Bradycardia</span>
                    <span className="text-xl font-extrabold font-tabular text-purple-900">{currentVitals.heartRate} bpm</span>
                    <span className="text-[11px] text-slate-600">Cholinergic vagal overstimulation</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold text-rose-700 uppercase">Bronchorrhea & Hypoxia</span>
                    <span className="text-xl font-extrabold font-tabular text-rose-900">{currentVitals.spo2}% SpO2</span>
                    <span className="text-[11px] text-slate-600">Copious secretions requiring continuous suction</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 sm:col-span-2 flex items-center gap-3">
                    <Activity className="w-5 h-5 text-purple-600 shrink-0" />
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">SLUDGE Toxindrome Pattern</strong>
                      <span className="text-[11px] text-slate-600">Pupillary miosis, excessive salivation, and muscle fasciculations observed.</span>
                    </div>
                  </div>
                </>
              ) : domain === 'SNAKEBITE' ? (
                <>
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold text-amber-700 uppercase">Ascending Local Edema</span>
                    <span className="text-sm font-extrabold text-amber-900 mt-1">&gt; 10 cm Margin Spread</span>
                    <span className="text-[11px] text-slate-600">Progressive swelling from bite puncture</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold text-[#0E62FE] uppercase">Hemotoxic Risk Watch</span>
                    <span className="text-xl font-extrabold font-tabular text-blue-900">20WBCT</span>
                    <span className="text-[11px] text-slate-600">Clean tube whole blood clotting watch</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 sm:col-span-2 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">Envenomation Protocol Active</strong>
                      <span className="text-[11px] text-slate-600">Limb splinted at heart level; arterial tourniquets strictly contraindicated.</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold text-rose-700 uppercase">Tachycardia Trend</span>
                    <span className="text-xl font-extrabold font-tabular text-rose-900">{currentVitals.heartRate} bpm</span>
                    <span className="text-[11px] text-slate-600">Compensatory cardiac acceleration</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold text-amber-700 uppercase">Pulse Pressure</span>
                    <span className="text-xl font-extrabold font-tabular text-amber-900">{pulsePressure} mmHg</span>
                    <span className="text-[11px] text-slate-600">Narrowing ({currentVitals.systolicBp}/{currentVitals.diastolicBp} mmHg)</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 sm:col-span-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Calculated Shock Index</span>
                      <span className="text-base font-extrabold font-tabular text-slate-900">{shockIndex} (Normal: 0.5–0.7)</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                      ELEVATED · SUSPECTED HEMORRHAGE
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Vital Trends Multi-Stream Summary */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 flex flex-col gap-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                10-Minute Telemetry Trend Analysis
              </span>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0E62FE]" />
                  HR: {vitalsHistory[0]?.heartRate} → {currentVitals.heartRate} bpm
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  SpO2: {vitalsHistory[0]?.spo2}% → {currentVitals.spo2}%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  BP: {vitalsHistory[0]?.systolicBp}/{vitalsHistory[0]?.diastolicBp} → {currentVitals.systolicBp}/{currentVitals.diastolicBp}
                </span>
              </div>
            </div>

            {/* Protocol Action Console */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Authoritative Protocol Decisions
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Authority: {clinicianName}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleProtocolAction('CONFIRMED')}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl text-xs font-bold transition-all shadow-sm ${
                    currentStatus === 'CONFIRMED'
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20 ring-2 ring-emerald-300'
                      : 'bg-[#0E62FE] hover:bg-blue-700 text-white shadow-blue-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 mb-1" />
                  <span>CONFIRM</span>
                  <span className="text-[9px] font-normal opacity-80 mt-0.5">Endorse Care</span>
                </button>

                <button
                  onClick={() => handleProtocolAction('DATA_REQUESTED')}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 transition-all shadow-xs"
                >
                  <FileQuestion className="w-4 h-4 text-slate-400 mb-1" />
                  <span>REQUEST DATA</span>
                  <span className="text-[9px] font-normal text-slate-400 mt-0.5">Clarify Signal</span>
                </button>

                <button
                  onClick={() => handleProtocolAction('ESCALATED')}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition-all"
                >
                  <ArrowUpRight className="w-4 h-4 text-amber-600 mb-1" />
                  <span>ESCALATE</span>
                  <span className="text-[9px] font-normal text-amber-700 mt-0.5">Alert Surgical</span>
                </button>

                <button
                  onClick={() => handleProtocolAction('ACKNOWLEDGED')}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 transition-all shadow-xs"
                >
                  <Check className="w-4 h-4 text-slate-400 mb-1" />
                  <span>ACKNOWLEDGE</span>
                  <span className="text-[9px] font-normal text-slate-400 mt-0.5">Log Stream</span>
                </button>
              </div>

              {currentStatus !== 'PENDING' && (
                <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                  currentStatus === 'CONFIRMED'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : currentStatus === 'ESCALATED'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Decision Recorded: {currentStatus} · {clinicianName} {clinicianEndorsement?.timestamp && `at ${clinicianEndorsement.timestamp}`}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (5 cols): Patient Profile & Prehospital Interventions History */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* Incoming Patient Profile Snapshot */}
          <div className="prana-float-card p-6 bg-white/90 backdrop-blur-md flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Incoming Patient Profile
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                Case #{activeCase.id}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {patient.name}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {patient.age}y · {patient.sex} · Conscious: {patient.consciousState}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">GCS SCORE</span>
                <span className="text-xl font-extrabold font-tabular text-[#0E62FE]">{patient.gcsScore}/15</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/60 text-xs text-slate-700 leading-relaxed">
              <strong className="block text-slate-900 text-[11px] mb-0.5">Chief Complaint:</strong>
              {patient.chiefComplaint}
            </div>

            <div className="text-xs text-slate-500 pt-1 flex items-center justify-between">
              <span>Unit: <strong className="text-slate-800">{ambulance.callSign}</strong></span>
              <span>Lead: <strong className="text-slate-800">{ambulance.crewLead}</strong></span>
            </div>
          </div>

          {/* Prehospital Interventions Logged by Paramedic */}
          <div className="prana-float-card p-6 bg-white/90 backdrop-blur-md flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Field Interventions Logged ({recentInterventions.length})
              </span>
              <span className="text-[10px] font-bold text-emerald-600">
                Field Verified
              </span>
            </div>

            {recentInterventions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No interventions logged yet by paramedic.</p>
            ) : (
              <div className="space-y-2">
                {recentInterventions.slice(0, 3).map((evt) => (
                  <div key={evt.id} className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/60 text-xs flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0E62FE] mt-1.5 shrink-0" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">{evt.title}</span>
                        <span className="font-tabular text-[10px] text-slate-400">{evt.timestamp}</span>
                      </div>
                      <span className="text-[11px] text-slate-600 mt-0.5">{evt.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Receiving Facility Destination Card */}
          <div className="p-4 rounded-3xl bg-blue-50/50 border border-blue-100/80 text-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-[#0E62FE] uppercase tracking-wider block">
                Target Facility
              </span>
              <span className="font-bold text-slate-900">{ambulance.assignedHospital}</span>
              <span className="text-[11px] text-slate-500 block">ETA: {derivedEta} mins</span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-[#0E62FE]">
              MATCH FIT {activeCase.facilityMatching?.candidates[0]?.matchScore || 94}%
            </span>
          </div>
        </div>
      </div>

      {/* 4. Bottom: Compact Persistent Care Rail */}
      <div className="mt-2 pt-4 border-t border-slate-200/50">
        <CareRail compact={true} />
      </div>
    </div>
  );
};
