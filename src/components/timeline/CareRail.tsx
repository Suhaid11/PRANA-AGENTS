import React, { useState } from 'react';
import { useEmergency } from '../../context/useEmergency';
import type { TimelineEvent } from '../../types/emergency';
import { X, ChevronDown, ChevronUp, History, Activity, Radio, AlertTriangle, ShieldAlert } from 'lucide-react';

interface CareRailProps {
  compact?: boolean;
}

export const CareRail: React.FC<CareRailProps> = ({ compact = false }) => {
  const { activeCase } = useEmergency();
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);
  const [showAuditTable, setShowAuditTable] = useState<boolean>(false);

  // Chronological order (oldest to newest for natural left-to-right mission progression)
  const chronologicalEvents = [...activeCase.timeline].reverse();

  return (
    <section aria-label="Care Continuity Rail" className="w-full flex flex-col gap-2.5 select-none">
      
      {/* 1. Operational Rail Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#0E62FE] animate-pulse" />
          <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <span>Care Continuity Rail · Mission Chronology</span>
            <span className="text-[10px] font-bold text-slate-500 font-tabular bg-white px-2 py-0.5 rounded-full border border-slate-200/80">
              {chronologicalEvents.length} Milestones
            </span>
          </h2>
        </div>

        {/* Legend & Controls */}
        <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0E62FE]" />
              <span>Clinical</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>System</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Warning</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Critical</span>
            </span>
          </div>

          <div className="h-3 w-px bg-slate-200 hidden sm:block" />

          {/* Audit Ledger Toggle */}
          <button
            onClick={() => setShowAuditTable(!showAuditTable)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
              showAuditTable
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700'
            }`}
            title="Toggle tabular audit trail view"
          >
            <History className="w-3 h-3 text-[#0E62FE]" />
            <span>{showAuditTable ? 'Hide Ledger' : 'Audit Ledger'}</span>
          </button>

          {/* Track Collapse/Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 font-bold transition-all shadow-xs"
            title={isExpanded ? 'Collapse Care Rail track' : 'Expand full event milestones'}
          >
            <span>{isExpanded ? 'Compact' : 'Expand'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* 2. Operational Telemetry Rail Track (Open Horizontal Composition) */}
      {isExpanded ? (
        <div className="relative py-4 px-2 overflow-x-auto no-scrollbar border-t border-b border-slate-200/80 bg-white/40 backdrop-blur-xs rounded-xl">
          {/* Edge-to-edge Continuous Connecting Track Line */}
          <div className="absolute top-[34px] left-6 right-6 h-[2px] bg-gradient-to-r from-blue-300 via-slate-300 to-emerald-400" />

          {/* Chronological Event Nodes (Unclipped, Open Composition) */}
          <div className="flex items-start gap-6 min-w-max relative z-10 px-4">
            {chronologicalEvents.map((evt, idx) => {
              const isClinical = evt.category === 'CLINICAL';
              const isCritical = evt.status === 'CRITICAL';
              const isWarning = evt.status === 'WARNING';
              const isSelected = selectedEvent?.id === evt.id;

              const nodeClass = isCritical
                ? 'bg-rose-500 ring-4 ring-rose-100 shadow-sm shadow-rose-500/20 animate-pulse'
                : isWarning
                ? 'bg-amber-500 ring-4 ring-amber-100 shadow-sm shadow-amber-500/20'
                : isClinical
                ? 'bg-[#0E62FE] ring-4 ring-blue-100 shadow-sm shadow-blue-500/20'
                : 'bg-slate-400 ring-4 ring-slate-100';

              const cleanTitle = evt.title
                .replace('Field Protocol Administered: ', '')
                .replace('Hospital Readiness Confirmed: ', '');

              return (
                <button
                  key={evt.id || idx}
                  onClick={() => setSelectedEvent(isSelected ? null : evt)}
                  className={`flex flex-col items-center text-center group cursor-pointer focus:outline-hidden transition-all min-w-[130px] max-w-[180px] p-2 rounded-xl ${
                    isSelected ? 'bg-blue-50/80 ring-1 ring-blue-200' : 'hover:bg-white/60'
                  }`}
                >
                  {/* Timestamp with Tabular Numerals */}
                  <span className="text-[10px] font-bold font-tabular text-slate-500 group-hover:text-slate-800 transition-colors mb-2">
                    {evt.timestamp}
                  </span>

                  {/* Operational Milestone Node Dot */}
                  <div 
                    className={`w-3.5 h-3.5 rounded-full transition-transform group-hover:scale-125 ${nodeClass} ${
                      isSelected ? 'scale-125 ring-5 ring-blue-300' : ''
                    }`} 
                  />

                  {/* Fully Readable, Unclipped Milestone Title */}
                  <span className={`text-[11px] font-bold mt-2.5 leading-snug tracking-tight transition-colors whitespace-normal break-words text-center ${
                    isSelected 
                      ? 'text-[#0E62FE]' 
                      : isCritical 
                      ? 'text-rose-700' 
                      : isWarning
                      ? 'text-amber-800'
                      : isClinical
                      ? 'text-slate-800 group-hover:text-slate-900'
                      : 'text-slate-600 group-hover:text-slate-800'
                  }`}>
                    {cleanTitle}
                  </span>

                  {/* Actor / Source Tag */}
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/60">
                    {evt.actor}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Compact 1-Line Preview when rail is collapsed */
        <div className="px-4 py-2 bg-white/80 backdrop-blur-xs rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Latest Milestone:</span>
            <span className="font-tabular text-[10px] font-bold text-[#0E62FE]">
              {activeCase.timeline[0]?.timestamp}
            </span>
            <span className="font-bold text-slate-800 text-xs truncate max-w-[400px]">
              {activeCase.timeline[0]?.title}
            </span>
            <span className="text-slate-400 text-[11px] hidden md:inline">
              ({activeCase.timeline[0]?.actor})
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(true)}
            className="text-[11px] font-bold text-[#0E62FE] hover:underline shrink-0 ml-2"
          >
            Show full rail ({chronologicalEvents.length}) →
          </button>
        </div>
      )}

      {/* 3. Interactive Event Detail Card (When a Milestone is Clicked) */}
      {selectedEvent && (
        <div className="p-4 bg-white border border-blue-200/90 rounded-2xl shadow-sm flex items-start justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-start gap-3.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              selectedEvent.status === 'CRITICAL'
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : selectedEvent.status === 'WARNING'
                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                : selectedEvent.category === 'CLINICAL'
                ? 'bg-blue-50 text-[#0E62FE] border border-blue-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {selectedEvent.status === 'CRITICAL' ? (
                <ShieldAlert className="w-5 h-5" />
              ) : selectedEvent.status === 'WARNING' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : selectedEvent.category === 'CLINICAL' ? (
                <Activity className="w-5 h-5" />
              ) : (
                <Radio className="w-5 h-5" />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  selectedEvent.status === 'CRITICAL'
                    ? 'bg-rose-100 text-rose-800'
                    : selectedEvent.status === 'WARNING'
                    ? 'bg-amber-100 text-amber-800'
                    : selectedEvent.category === 'CLINICAL'
                    ? 'bg-blue-100 text-[#0E62FE]'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {selectedEvent.category} · {selectedEvent.status}
                </span>
                <span className="font-tabular text-xs font-bold text-slate-600">
                  {selectedEvent.timestamp}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs font-semibold text-slate-600">
                  Recorded by <strong className="text-slate-900">{selectedEvent.actor}</strong>
                </span>
              </div>

              <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                {selectedEvent.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                {selectedEvent.detail}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedEvent(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close milestone detail"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Full Audit Ledger View (When Requested by Clinician or Judge) */}
      {showAuditTable && (
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-sm max-h-[340px] overflow-y-auto space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              Immutable Mission Audit Log (Chronological Ledger)
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              Total Recorded: {chronologicalEvents.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {chronologicalEvents.map((evt, idx) => (
              <div key={evt.id || idx} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    evt.status === 'CRITICAL' ? 'bg-rose-500' : evt.status === 'WARNING' ? 'bg-amber-500' : evt.category === 'CLINICAL' ? 'bg-[#0E62FE]' : 'bg-slate-400'
                  }`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">{evt.title}</span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {evt.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{evt.detail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 shrink-0 self-end sm:self-center font-tabular">
                  <span>{evt.timestamp}</span>
                  <span className="text-slate-300">·</span>
                  <span className="font-semibold text-slate-700">{evt.actor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
