import React, { useState } from 'react';
import { useEmergency } from '../../context/useEmergency';
import { Boxes, Check, ShieldCheck, Clock, ShieldAlert } from 'lucide-react';

export const MedicalReadiness: React.FC = () => {
  const { medicalReadiness, activeCase } = useEmergency();
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  const filteredItems = selectedFilter === 'ALL'
    ? medicalReadiness
    : medicalReadiness.filter(item => item.status === selectedFilter);

  const readyCount = medicalReadiness.filter(i => i.status === 'READY').length;
  const limitedCount = medicalReadiness.filter(i => i.status === 'LIMITED' || i.status === 'AVAILABLE').length;
  const unavailableCount = medicalReadiness.filter(i => i.status === 'UNAVAILABLE').length;

  return (
    <div className="flex flex-col gap-6 py-2">
      {/* 1. Top Editorial Headline */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-black text-[#0E62FE] uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Prehospital Logistics · Equipment & Cold-Chain Inventory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-[0.95]">
            Medical <br />
            <span className="text-slate-400 font-normal">Asset Readiness.</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-4 py-2 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ALS VERIFIED · UNIT {activeCase.ambulance.callSign.toUpperCase()}</span>
          </span>
        </div>
      </div>

      {/* 2. Readiness Stats & Category Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          {['ALL', 'READY', 'AVAILABLE', 'LIMITED'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedFilter === status
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{readyCount} Ready</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{limitedCount} In Reserve</span>
          </div>
          {unavailableCount > 0 && (
            <div className="flex items-center gap-1.5 text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{unavailableCount} Depleted</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Grid of Elevated Readiness Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const isReady = item.status === 'READY';
          const isAvailable = item.status === 'AVAILABLE';

          return (
            <div 
              key={item.id} 
              className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md transition-all hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200">
                    <Boxes className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {item.category}
                  </span>
                </div>

                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  isReady 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : isAvailable 
                    ? 'bg-blue-50 text-[#0E62FE] border-blue-200' 
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {item.status}
                </span>
              </div>

              <div>
                <h3 className="font-black text-slate-950 text-sm leading-snug">
                  {item.resourceName}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                  {item.operationalDetail}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Verified 09:30</span>
                </span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Sealed & Calibrated
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Safety & Clinical Disclosure Notice */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            <strong>Operational Demonstration Disclosure:</strong> Prehospital ALS inventory verification. All resources represent simulated readiness assets and are not connected to physical hospital inventory databases.
          </span>
        </div>
        <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          ALS Kit Check · Unit Echo-4
        </span>
      </div>
    </div>
  );
};
