import React from 'react';
import { useEmergency } from '../../context/useEmergency';
import { ShieldCheck, X, Building2, Gauge, Clock, Bed } from 'lucide-react';

interface WhyThisHospitalModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

export const WhyThisHospitalModal: React.FC<WhyThisHospitalModalProps> = ({ isOpen = true, onClose }) => {
  const { activeCase } = useEmergency();

  if (!isOpen) return null;

  const facilityMatching = activeCase.facilityMatching;
  const candidates = facilityMatching?.candidates || [];
  const primaryHospital = candidates.find((c) => c.isPrimary) || candidates[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0E62FE] flex items-center justify-center shrink-0 border border-blue-200">
              <ShieldCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-[#0E62FE] uppercase tracking-widest">
                  Facility Allocation Engine
                </span>
                <span className="text-[9px] font-black bg-blue-100 text-[#0E62FE] px-2 py-0.5 rounded-full uppercase">
                  Explainable CDS
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-950 tracking-tight mt-0.5">
                Why This Hospital? (Allocation Rationale)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Transparent multi-factor optimization for patient <strong className="text-slate-700">{activeCase.patient.name}</strong> ({activeCase.id})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Transparent Formula Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-black text-slate-800 uppercase tracking-wider">
              <span>Transparent Optimization Formula</span>
              <span className="text-[#0E62FE] font-mono text-[11px]">Score = (0.40 × Fit) + (0.30 × Avail) + (0.30 × ETA)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200/60 flex items-center gap-2.5">
                <Gauge className="w-4 h-4 text-[#0E62FE] shrink-0" />
                <div>
                  <span className="font-black text-slate-900 block text-[11px]">40% Clinical Fit</span>
                  <span className="text-[10px] text-slate-500">Trauma Level & Subspecialty</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200/60 flex items-center gap-2.5">
                <Bed className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-black text-slate-900 block text-[11px]">30% Capacity & Bay</span>
                  <span className="text-[10px] text-slate-500">Sterile Resuscitation Ready</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200/60 flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-black text-slate-900 block text-[11px]">30% Transit ETA</span>
                  <span className="text-[10px] text-slate-500">Live Corridor Travel Time</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clinician Recommendation Note */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-slate-700 leading-relaxed flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0E62FE]" />
              <span className="font-black text-[#0E62FE] uppercase tracking-wider text-[10px]">
                Recommendation for Clinician Review
              </span>
            </div>
            <p className="font-medium text-slate-800">
              {facilityMatching?.algorithmRationale || `${primaryHospital?.name} ranked as top candidate based on verified capabilities.`}
            </p>
          </div>

          {/* Hospital Candidates Comparison Grid */}
          <div className="space-y-3">
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Regional Facility Evaluated Candidates
            </div>

            <div className="space-y-2.5">
              {candidates.map((cand) => (
                <div
                  key={cand.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    cand.isPrimary
                      ? 'bg-white border-[#0E62FE] ring-2 ring-blue-100 shadow-md'
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        cand.isPrimary ? 'bg-blue-50 text-[#0E62FE] border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        <Building2 className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-950 text-sm">{cand.name}</h4>
                          {cand.isPrimary && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-[#0E62FE] border border-blue-200 uppercase">
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-semibold mt-0.5">
                          {cand.traumaLevel} · {cand.specialtyFit}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono text-sm font-black text-slate-900 block">
                          {cand.etaMinutes} min
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {cand.distanceKm} km away
                        </span>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-slate-100 font-mono text-xs font-black text-slate-800">
                        {cand.matchScore}% Fit
                      </div>
                    </div>
                  </div>

                  {/* Factor Details */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Clinical Fit</span>
                      <strong className="text-slate-800">{cand.clinicalFitScore}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Availability</span>
                      <strong className={cand.availability.toLowerCase().includes('diversion') ? 'text-rose-600' : 'text-emerald-700'}>
                        {cand.availability}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Transit ETA</span>
                      <strong className="text-slate-800">{cand.etaMinutes} min</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Rationale</span>
                      <span className="text-slate-600 truncate block">{cand.rationale}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium">Evaluated in real-time across regional receiving hospital matrix.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-colors cursor-pointer"
          >
            Close Rationale
          </button>
        </div>
      </div>
    </div>
  );
};
