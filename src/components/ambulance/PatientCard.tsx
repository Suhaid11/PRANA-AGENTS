import React from 'react';
import type { PatientProfile } from '../../types/emergency';
import { User, AlertCircle, Shield, Check } from 'lucide-react';

interface PatientCardProps {
  patient: PatientProfile;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  return (
    <div className="flex flex-col gap-3.5 bg-white/70 backdrop-blur-md p-5 rounded-3xl border border-white/90 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)]">
      {/* Patient Header: Prominent & Human */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-slate-800 font-bold border border-slate-200/80 shadow-xs">
            <User className="w-5 h-5 text-[#0E62FE]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-lg text-slate-900 tracking-tight leading-none">
                {patient.name}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200/80 uppercase">
                Red Triage
              </span>
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1">
              {patient.age} yrs · {patient.sex} · <span className="font-tabular text-slate-600 font-bold">{patient.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Emergency Complaint & Mechanism */}
      <div className="text-xs text-slate-700 leading-relaxed font-medium bg-white/80 p-3 rounded-2xl border border-slate-100">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-0.5">
          Incident Mechanism
        </span>
        {patient.incidentType} — <span className="text-slate-600">{patient.chiefComplaint}</span>
      </div>

      {/* Neurological & Consciousness Metric Chips */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-2xl bg-white/90 border border-slate-200/50">
          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
            CONSCIOUS STATE
          </span>
          <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
            {patient.consciousState} (AVPU)
          </span>
        </div>
        <div className="p-2.5 rounded-2xl bg-white/90 border border-slate-200/50">
          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
            GLASGOW COMA
          </span>
          <span className="font-extrabold text-[#0E62FE] text-sm font-tabular mt-0.5 block">
            {patient.gcsScore} / 15 {patient.gcsScore === 15 ? '(E4V5M6)' : patient.gcsScore === 14 ? '(E4V4M6)' : patient.gcsScore === 11 ? '(E3V3M5)' : `(GCS ${patient.gcsScore})`}
          </span>
        </div>
      </div>

      {/* Rapid Field Status Tags (Pills) */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200/70 flex items-center gap-1 shadow-2xs">
          <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
          <span>Airway Clear</span>
        </span>
        
        {/* Dynamic Bleeding Status Pill */}
        {patient.reportedBloodLoss === 'Significant' ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60 flex items-center gap-1 shadow-2xs">
            <AlertCircle className="w-3 h-3 text-rose-600 stroke-[2.5]" />
            <span>Active Bleeding (Significant)</span>
          </span>
        ) : patient.reportedBloodLoss === 'Moderate' ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center gap-1 shadow-2xs">
            <AlertCircle className="w-3 h-3 text-amber-600 stroke-[2.5]" />
            <span>Active Bleeding (Moderate)</span>
          </span>
        ) : patient.reportedBloodLoss === 'Minimal' ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center gap-1 shadow-2xs">
            <Check className="w-3 h-3 text-amber-600 stroke-[2.5]" />
            <span>Minimal Bleeding</span>
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1 shadow-2xs">
            <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
            <span>No Active Bleeding</span>
          </span>
        )}

        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200/70 flex items-center gap-1 shadow-2xs">
          <Shield className="w-3 h-3 text-blue-600 stroke-[2.5]" />
          <span>Spine Collared</span>
        </span>
      </div>
    </div>
  );
};
