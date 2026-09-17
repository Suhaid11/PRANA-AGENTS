import React from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { Boxes, Check } from 'lucide-react';

export const MedicalReadiness: React.FC = () => {
  const { medicalReadiness } = useEmergency();

  return (
    <div className="flex flex-col gap-6 py-2">
      {/* Editorial Top Headline */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-extrabold text-[#0E62FE] uppercase tracking-widest mb-1">
            Ambulance Life Support Verification · Logistics
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[0.95]">
            Medical <br />
            <span className="text-slate-400 font-normal">Readiness Assets.</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
            ALS VERIFIED · AMBULANCE ECHO-4
          </span>
        </div>
      </div>

      {/* Grid of Elevated Readiness Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {medicalReadiness.map((item) => {
          const isReady = item.status === 'READY';
          const isAvailable = item.status === 'AVAILABLE';

          return (
            <div 
              key={item.id} 
              className="prana-float-card p-5 bg-white/95 backdrop-blur-md flex flex-col justify-between gap-4 hover:translate-y-[-2px] transition-transform"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#EEF1F6] flex items-center justify-center text-slate-700">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>

                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  isReady 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : isAvailable 
                    ? 'bg-blue-50 text-[#0E62FE] border-blue-200' 
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {item.status}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                  {item.resourceName}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {item.operationalDetail}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>Verified 09:30</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Sealed
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong>Operational Notice:</strong> Digital verification of prehospital assets. No automated dispensing or autonomous medication selection is performed.
        </span>
        <span className="font-bold text-slate-700 text-[11px] uppercase">
          Standard Prehospital ALS Inventory
        </span>
      </div>
    </div>
  );
};
