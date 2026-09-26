import React from 'react';
import type { PatientProfile } from '../../types/emergency';
import { User, AlertCircle, Shield, Check } from 'lucide-react';

interface PatientCardProps {
  patient: PatientProfile;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  return (
    <div className="flex flex-col gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm relative overflow-hidden">
      {/* Subtle top indicator accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0E62FE] via-cyan-400 to-emerald-400" />

      {/* Patient Header: High-Confidence & Human */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-[#0E62FE] font-black border border-blue-200/70 shadow-xs shrink-0">
            <User className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-xl text-slate-950 tracking-tight leading-none">
                {patient.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wider">
                RED TRIAGE
              </span>
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-2">
              <span>{patient.age}y {patient.sex}</span>
              <span className="text-slate-300">·</span>
              <span className="font-mono text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">{patient.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Emergency Complaint & Mechanism */}
      <div className="text-xs text-slate-800 leading-relaxed bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70">
        <span className="text-[10px] font-black text-[#0E62FE] uppercase tracking-wider block mb-1">
          Mechanism of Injury & Chief Complaint
        </span>
        <strong className="text-slate-900 font-bold">{patient.incidentType}</strong> — <span className="text-slate-600 font-medium">{patient.chiefComplaint}</span>
      </div>

      {/* Neurological & Consciousness Metric Chips */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
            CONSCIOUS STATUS
          </span>
          <span className="font-black text-slate-900 text-sm mt-0.5 block">
            {patient.consciousState} (AVPU)
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
            GLASGOW COMA SCORE
          </span>
          <span className="font-black text-[#0E62FE] text-sm font-mono mt-0.5 block">
            {patient.gcsScore} / 15 {patient.gcsScore === 15 ? '(E4V5M6)' : patient.gcsScore === 14 ? '(E4V4M6)' : patient.gcsScore === 11 ? '(E3V3M5)' : `(GCS ${patient.gcsScore})`}
          </span>
        </div>
      </div>

      {/* Clinical Assessment Status Badges */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-1.5 shadow-2xs">
          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
          <span>Airway Clear</span>
        </span>
        
        {/* Dynamic Bleeding Status Badge */}
        {patient.reportedBloodLoss === 'Significant' ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300 flex items-center gap-1.5 shadow-2xs">
            <AlertCircle className="w-3 h-3 text-rose-600 stroke-[2.5]" />
            <span>Active Bleeding (Significant)</span>
          </span>
        ) : patient.reportedBloodLoss === 'Moderate' ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
            <AlertCircle className="w-3 h-3 text-amber-600 stroke-[2.5]" />
            <span>Active Bleeding (Moderate)</span>
          </span>
        ) : patient.reportedBloodLoss === 'Minimal' ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 shadow-2xs">
            <Check className="w-3 h-3 text-amber-600 stroke-[2.5]" />
            <span>Minimal Bleeding</span>
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
            <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
            <span>No Active Bleeding</span>
          </span>
        )}

        {patient.incidentType?.toLowerCase().includes('trauma') || patient.incidentType?.toLowerCase().includes('collision') || patient.incidentType?.toLowerCase().includes('accident') ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5 shadow-2xs">
            <Shield className="w-3 h-3 text-[#0E62FE] stroke-[2.5]" />
            <span>Spine Collared</span>
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1.5 shadow-2xs">
            <Shield className="w-3 h-3 text-slate-600 stroke-[2.5]" />
            <span>Spine Neutral</span>
          </span>
        )}
      </div>
    </div>
  );
};
