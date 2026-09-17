import React from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { ShieldCheck, X, Building2, CheckCircle2, Gauge, Clock, Bed } from 'lucide-react';

interface WhyThisHospitalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhyThisHospitalModal: React.FC<WhyThisHospitalModalProps> = ({ isOpen, onClose }) => {
  const { activeCase } = useEmergency();

  if (!isOpen) return null;

  const facilityMatching = activeCase.facilityMatching;
  const candidates = facilityMatching?.candidates || [];
  const primaryHospital = candidates.find((c) => c.isPrimary) || candidates[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0E62FE] flex items-center justify-center shrink-0 border border-blue-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-[#0E62FE] uppercase tracking-widest">
                PRANA Facility Matching Engine
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Why This Hospital? (Allocation Rationale)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Transparent multi-factor optimization for patient {activeCase.patient.name} (#{activeCase.id})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Formula Breakdown Banner */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              <span>PRANA Suitability Formula</span>
              <span className="text-[#0E62FE] font-mono">Score = (C × 0.40) + (E × 0.30) + (A × 0.30)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-white border border-slate-200/50 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block text-[11px]">40% Clinical Fit</span>
                  <span className="text-[10px] text-slate-500">Trauma Level & Surgery</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-200/50 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block text-[11px]">30% Transit ETA</span>
                  <span className="text-[10px] text-slate-500">Live Traffic Corridor</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-200/50 flex items-center gap-2">
                <Bed className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block text-[11px]">30% Live Capacity</span>
                  <span className="text-[10px] text-slate-500">Bay & ICU Availability</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clinically Sound Rationale Summary */}
          {facilityMatching?.algorithmRationale && (
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 text-xs text-slate-700 leading-relaxed">
              <span className="font-extrabold text-[#0E62FE] uppercase tracking-wider block mb-1">
                Clinical Recommendation Summary:
              </span>
              {facilityMatching.algorithmRationale}
            </div>
          )}

          {/* Hospital Candidates Comparison Grid */}
          <div className="space-y-3">
            <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
              Catchment Area Hospital Candidates ({candidates.length} Evaluated)
            </div>

            <div className="space-y-3">
              {candidates.map((cand) => (
                <div
                  key={cand.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    cand.isPrimary
                      ? 'bg-white border-blue-500/80 shadow-md ring-2 ring-blue-100'
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        cand.isPrimary 
                          ? 'bg-blue-50 text-[#0E62FE]' 
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        <Building2 className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-slate-900">
                            {cand.name}
                          </h3>
                          {cand.isPrimary && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0E62FE] text-white">
                              SELECTED DESTINATION
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span className="font-medium text-slate-700">{cand.traumaLevel}</span>
                          <span>·</span>
                          <span>{cand.distanceKm} km</span>
                          <span>·</span>
                          <span className="font-bold text-slate-800 font-tabular">{cand.etaMinutes} mins ETA</span>
                        </div>
                      </div>
                    </div>

                    {/* Score Chip */}
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        SUITABILITY FIT
                      </span>
                      <span className={`text-xl font-extrabold font-tabular ${
                        cand.matchScore >= 90 
                          ? 'text-[#0E62FE]' 
                          : cand.matchScore >= 75 
                          ? 'text-amber-600' 
                          : 'text-slate-500'
                      }`}>
                        {cand.matchScore}%
                      </span>
                    </div>
                  </div>

                  {/* Details and Rationale */}
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-slate-700"><strong>Specialty Fit:</strong> {cand.specialtyFit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${cand.isPrimary ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-slate-700"><strong>Availability:</strong> {cand.availability}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 italic mt-0.5">
                      {cand.rationale}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Assigned: <strong className="text-slate-800">{primaryHospital?.name}</strong> via Ring Road Arterial
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0E62FE] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            Acknowledge Facility Route
          </button>
        </div>
      </div>
    </div>
  );
};
