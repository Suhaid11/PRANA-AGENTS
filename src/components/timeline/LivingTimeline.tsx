import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import type { TimelineEventCategory } from '../../types/emergency';
import { ChevronDown, ChevronUp, Radio, Activity } from 'lucide-react';

export const LivingTimeline: React.FC = () => {
  const { activeCase } = useEmergency();
  const [filter, setFilter] = useState<'ALL' | TimelineEventCategory>('ALL');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const filteredEvents = activeCase.timeline.filter((evt) => {
    if (filter === 'ALL') return true;
    return evt.category === filter;
  });

  return (
    <div className="w-full flex flex-col gap-2">
      {/* 1. Sleek Continuous Horizontal Conduit Bar (Matching Reference 1 Bottom Bar) */}
      <div className="prana-float-pill px-4 sm:px-6 py-2.5 bg-white/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 border border-slate-200/80">
        
        {/* Left: Controls & Track Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="w-8 h-8 rounded-full bg-[#EEF1F6] hover:bg-slate-200/80 text-slate-700 flex items-center justify-center transition-colors shadow-xs"
            title={isDrawerOpen ? 'Collapse audit details' : 'Expand full event audit log'}
          >
            {isDrawerOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">
              EVENT TIMELINE
            </span>
            <span className="text-xs font-bold text-slate-800 leading-tight mt-0.5">
              Dual-Track Chronology ({activeCase.timeline.length} Milestones)
            </span>
          </div>
        </div>

        {/* Center: Interactive Node Ticker */}
        <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {activeCase.timeline.slice(0, 5).map((evt, idx) => (
            <div key={evt.id || idx} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8FAFC] border border-slate-200/70 text-[11px] font-semibold text-slate-700">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  evt.status === 'CRITICAL' ? 'bg-rose-500' : evt.status === 'WARNING' ? 'bg-amber-500' : 'bg-[#0E62FE]'
                }`} />
                <span className="font-tabular text-slate-400 text-[10px]">{evt.timestamp}</span>
                <span className="max-w-[140px] truncate">{evt.title}</span>
              </div>
              {idx < 4 && <div className="w-2 h-px bg-slate-200" />}
            </div>
          ))}
        </div>

        {/* Right: Track Switcher Pills */}
        <div className="flex items-center gap-1 text-[11px]">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-full font-bold transition-all ${
              filter === 'ALL'
                ? 'bg-[#0C1220] text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('CLINICAL')}
            className={`px-2.5 py-1 rounded-full font-bold transition-all flex items-center gap-1 ${
              filter === 'CLINICAL'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-rose-600'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Clinical</span>
          </button>
          <button
            onClick={() => setFilter('SYSTEM')}
            className={`px-2.5 py-1 rounded-full font-bold transition-all flex items-center gap-1 ${
              filter === 'SYSTEM'
                ? 'bg-[#0E62FE] text-white shadow-xs'
                : 'text-slate-500 hover:text-blue-600'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* 2. Expanding Full Audit Drawer (When User Expands) */}
      {isDrawerOpen && (
        <div className="prana-float-card p-6 bg-white/95 backdrop-blur-md max-h-[320px] overflow-y-auto space-y-3">
          <div className="relative pl-6 space-y-3">
            <div className="absolute top-2 bottom-2 left-2.5 w-0.5 bg-slate-200" />

            {filteredEvents.map((evt, idx) => (
              <div key={evt.id || idx} className="relative flex items-start gap-3">
                <div className={`absolute -left-[20px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-xs ${
                  evt.status === 'CRITICAL' ? 'bg-rose-500' : evt.status === 'WARNING' ? 'bg-amber-500' : 'bg-[#0E62FE]'
                }`} />

                <div className="flex-1 bg-[#F8FAFC] rounded-2xl p-3 border border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${
                        evt.category === 'CLINICAL' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-[#0E62FE]'
                      }`}>
                        {evt.category}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{evt.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">{evt.detail}</p>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                    <span className="font-tabular font-bold text-slate-700">{evt.timestamp}</span>
                    <span>·</span>
                    <span>{evt.actor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
