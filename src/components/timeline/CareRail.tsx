import React, { useState, useRef } from 'react';
import { useEmergency } from '../../context/useEmergency';
import type { TimelineEvent } from '../../types/emergency';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  ChevronRight,
  History, 
  Clock,
  Sparkles
} from 'lucide-react';

interface CareRailProps {
  compact?: boolean;
}

type EventFilter = 'KEY' | 'ALL' | 'AI_CLINICIAN' | 'CLINICAL' | 'CRITICAL';
type EventPriority = 'P0' | 'P1' | 'P2' | 'P3';

export const CareRail: React.FC<CareRailProps> = ({ compact = false }) => {
  const { activeCase } = useEmergency();
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);
  const [showAuditTable, setShowAuditTable] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<EventFilter>('KEY');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Chronological order: oldest first (left) to newest (right)
  const chronologicalEvents = [...activeCase.timeline].reverse();

  // Helper to determine event priority
  const getEventPriority = (evt: TimelineEvent): EventPriority => {
    const t = evt.title.toLowerCase();
    const act = evt.actor.toLowerCase();

    // P0: Major Milestones & Life-Critical Steps
    if (
      evt.status === 'CRITICAL' ||
      t.includes('incident created') ||
      t.includes('deterioration') ||
      t.includes('decision support signal') ||
      act.includes('ai') ||
      t.includes('review plan confirmed') ||
      t.includes('clinical protocol assessment: confirmed') ||
      t.includes('escalated') ||
      t.includes('bay ready') ||
      t.includes('hospital readiness confirmed') ||
      t.includes('handover') ||
      t.includes('arrived') ||
      t.includes('transfer completed') ||
      t.includes('escalation acknowledged')
    ) {
      return 'P0';
    }

    // P1: Clinically Meaningful Events
    if (
      evt.category === 'CLINICAL' ||
      t.includes('vital') ||
      t.includes('intervention') ||
      t.includes('observation') ||
      t.includes('acknowledged')
    ) {
      return 'P1';
    }

    // P2: Routine Field Events
    if (
      t.includes('patient') ||
      t.includes('dispatched') ||
      t.includes('traffic') ||
      t.includes('route') ||
      t.includes('pre-alert')
    ) {
      return 'P2';
    }

    // P3: Technical & Synchronization Events
    return 'P3';
  };

  // Helper to format clinically informative titles (WHAT, WHO, WHEN)
  const formatEventInfo = (evt: TimelineEvent) => {
    let title = evt.title;
    let semanticColor: 'blue' | 'slate' | 'amber' | 'rose' | 'cyan' = 'slate';
    const priority = getEventPriority(evt);

    if (evt.status === 'CRITICAL') {
      semanticColor = 'rose';
    } else if (evt.status === 'WARNING') {
      semanticColor = 'amber';
    } else if (evt.actor === 'AI SUPPORT' || evt.actor === 'PRANA INTELLIGENCE' || title.toLowerCase().includes('decision support') || title.toLowerCase().includes('agent') || title.toLowerCase().includes('reassessment')) {
      semanticColor = 'cyan';
    } else if (evt.category === 'CLINICAL') {
      semanticColor = 'blue';
    }

    if (title.includes('Clinical Protocol Assessment: CONFIRMED') || title.includes('Clinical Endorsement')) {
      title = activeCase.domain === 'TRAUMA'
        ? 'Trauma Review Plan Confirmed'
        : activeCase.domain === 'SNAKEBITE'
        ? 'Envenomation Review Plan Confirmed'
        : activeCase.domain === 'POISONING'
        ? 'Toxicology Review Plan Confirmed'
        : activeCase.domain === 'RESPIRATORY_DISTRESS'
        ? 'Respiratory Care Plan Confirmed'
        : `${activeCase.domain.replace(/_/g, ' ')} Plan Confirmed`;
      semanticColor = 'blue';
    } else if (title.includes('Clinical Protocol Assessment: ACKNOWLEDGED')) {
      title = 'Hemodynamic Signal Acknowledged by Clinician';
      semanticColor = 'blue';
    } else if (title.includes('Clinical Protocol Assessment: ESCALATED')) {
      title = 'Case Escalated for Urgent Senior Review';
      semanticColor = 'rose';
    } else if (title.startsWith('Intervention Recorded:')) {
      title = `${title.replace('Intervention Recorded:', '').trim()}`;
      if (!title.toLowerCase().includes('recorded')) {
        title = `${title} Recorded`;
      }
      semanticColor = 'blue';
    } else if (title.startsWith('Hospital Readiness Confirmed:')) {
      const bay = title.replace('Hospital Readiness Confirmed:', '').trim();
      title = `Hospital Bay Ready (${bay})`;
      semanticColor = 'blue';
    } else if (title.includes('Hospital Pre-Alert Formally Acknowledged')) {
      title = 'Hospital Pre-Alert Acknowledged';
      semanticColor = 'blue';
    } else if (title.includes('Hospital Pre-Alert Dispatched')) {
      title = 'Hospital Pre-Alert Transmitted';
      semanticColor = 'blue';
    } else if (title.includes('Observation Recorded')) {
      title = evt.detail ? evt.detail.split('.')[0] : 'Field Observation Recorded';
      semanticColor = 'blue';
    } else if (title.includes('Deterioration Event Detected')) {
      title = 'Telemetry Deterioration Detected';
      semanticColor = 'rose';
    } else if (title.includes('Patient Profile Registered') || title.includes('Patient Secured Onboard')) {
      title = 'Patient Secured Onboard';
      semanticColor = 'blue';
    } else if (title.includes('Initial Telemetry Stream Active')) {
      title = 'Sensor Telemetry Stream Active';
      semanticColor = 'slate';
    } else if (title.includes('Emergency Incident Created')) {
      title = 'Emergency Incident Created';
      semanticColor = 'slate';
    } else if (title.includes('Ambulance Echo-4 Dispatched') || title.includes('Dispatched')) {
      title = 'Ambulance Dispatched';
      semanticColor = 'slate';
    } else if (title.startsWith('Decision Support Signal:') || title.includes('Decision Support Signal') || evt.actor === 'AI SUPPORT') {
      title = title.replace('Decision Support Signal:', '').trim();
      semanticColor = 'cyan';
    } else if (title.includes('Prehospital Handover Package Generated') || title.includes('Handover Package Generated')) {
      title = 'Prehospital Handover Generated';
      semanticColor = 'blue';
    } else if (title.includes('Transfer of Care Completed') || title.includes('TRANSFER COMPLETED') || title.includes('Handover Accepted')) {
      title = 'Transfer of Care Completed';
      semanticColor = 'blue';
    } else if (title.includes('Handover Initiated') || title.includes('HANDOVER INITIATED')) {
      title = 'Paramedic Handover Initiated';
      semanticColor = 'blue';
    } else if (title.includes('Patient Arrived') || title.includes('PATIENT ARRIVED')) {
      title = 'Patient Arrived at Receiving Facility';
      semanticColor = 'blue';
    } else if (title.includes('Escalation Acknowledged') || title.includes('ESCALATION ACKNOWLEDGED')) {
      title = 'Hospital Acknowledged Escalation';
      semanticColor = 'blue';
    } else if (title.includes('Prehospital Handover Received') || title.includes('Handover Received') || title.includes('Handover Acknowledged')) {
      title = 'Prehospital Handover Acknowledged';
      semanticColor = 'blue';
    }

    return { title, semanticColor, priority };
  };

  // Filter events based on selected filter
  const filteredEvents = chronologicalEvents.filter((evt) => {
    if (activeFilter === 'KEY') {
      const p = getEventPriority(evt);
      return p === 'P0' || p === 'P1';
    }
    if (activeFilter === 'AI_CLINICIAN') {
      const t = evt.title.toLowerCase();
      const a = evt.actor.toLowerCase();
      return a.includes('ai') || a.includes('clinician') || t.includes('signal') || t.includes('review') || t.includes('confirm');
    }
    if (activeFilter === 'CLINICAL') return evt.category === 'CLINICAL';
    if (activeFilter === 'CRITICAL') return evt.status === 'CRITICAL' || evt.status === 'WARNING';
    return true; // 'ALL'
  });

  const latestIndex = chronologicalEvents.length - 1;
  const startTime = chronologicalEvents[0]?.timestamp || '00:00:00';
  const latestTime = chronologicalEvents[latestIndex]?.timestamp || '00:00:00';

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section 
      aria-label="Care Rail Mission History" 
      className="w-full flex flex-col gap-3 select-none pt-2 pb-4"
    >
      {/* 1. Header with Controls & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 border-b border-slate-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest uppercase text-[#0E62FE]">
              CARE RAIL
            </span>
            <span className="text-slate-300">·</span>
            <h2 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>MISSION HISTORY</span>
              <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                {filteredEvents.length} OF {chronologicalEvents.length} MILESTONES
              </span>
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Immutable chronological progression from dispatch through hospital arrival.
          </p>
        </div>

        {/* Lightweight Controls & Filters */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/80">
            <button
              onClick={() => setActiveFilter('KEY')}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                activeFilter === 'KEY'
                  ? 'bg-white text-[#0E62FE] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Show high-priority milestones (P0 + P1)"
            >
              Key Milestones
            </button>
            <button
              onClick={() => setActiveFilter('AI_CLINICIAN')}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'AI_CLINICIAN'
                  ? 'bg-white text-cyan-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Show AI Intelligence and Clinician endorsement chain"
            >
              <Sparkles className="w-2.5 h-2.5 text-cyan-600" />
              <span>AI → Clinician</span>
            </button>
            <button
              onClick={() => setActiveFilter('CLINICAL')}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                activeFilter === 'CLINICAL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Clinical
            </button>
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({chronologicalEvents.length})
            </button>
          </div>

          {/* Scroll Navigation Chevrons */}
          <div className="hidden md:flex items-center gap-1 bg-white border border-slate-200 rounded-full p-0.5 shadow-2xs">
            <button
              onClick={scrollLeft}
              className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={scrollRight}
              className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Audit Ledger Trigger */}
          <button
            onClick={() => setShowAuditTable(!showAuditTable)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
              showAuditTable
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs'
            }`}
            title="Toggle tabular chronological audit log"
          >
            <History className="w-3 h-3 text-[#0E62FE]" />
            <span>{showAuditTable ? 'Hide Ledger' : 'Audit Ledger'}</span>
          </button>

          {/* Expand / Compact Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
            title={isExpanded ? 'Collapse Care Rail' : 'Expand full Care Rail'}
          >
            <span>{isExpanded ? 'Compact' : 'Expand'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* 2. Main Horizontal Scrollable Decompressed Rail (Desktop & Tablet) */}
      {isExpanded ? (
        <div className="relative w-full py-4 px-3 bg-white/70 backdrop-blur-xs rounded-2xl border border-slate-200/90 shadow-2xs">
          
          {/* Desktop & Tablet: Continuous horizontal scroll corridor with comfortable cards */}
          <div className="hidden md:block w-full">
            
            {/* Top Timeline Bar */}
            <div className="flex items-center justify-between mb-4 px-2 text-[10px] font-mono font-bold text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>DEPARTURE {startTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400">
                  CHRONOLOGICAL TIMELINE (SCROLL TO EXPLORE)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#0E62FE]">
                <span className="w-2 h-2 rounded-full bg-[#0E62FE] animate-pulse" />
                <span>LATEST {latestTime}</span>
              </div>
            </div>

            {/* Scrollable Container with Comfortable Min-Width Cards */}
            <div 
              ref={scrollContainerRef}
              className="flex items-stretch gap-3 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth"
              style={{ scrollbarWidth: 'thin' }}
            >
              {filteredEvents.map((evt, idx) => {
                const isLatest = idx === filteredEvents.length - 1;
                const isSelected = selectedEvent?.id === evt.id;
                const { title, priority } = formatEventInfo(evt);

                const isAiEvent = evt.actor === 'AI SUPPORT' || title.toLowerCase().includes('decision support');
                const isClinicianEvent = evt.actor === 'CLINICIAN' || title.toLowerCase().includes('confirmed');

                const borderClass = isLatest
                  ? 'border-[#0E62FE] ring-2 ring-blue-500/20 shadow-md bg-blue-50/20'
                  : isSelected
                  ? 'border-cyan-400 ring-2 ring-cyan-200 bg-cyan-50/20'
                  : isAiEvent
                  ? 'border-cyan-200 bg-cyan-50/10 hover:border-cyan-400'
                  : isClinicianEvent
                  ? 'border-blue-200 bg-blue-50/10 hover:border-blue-400'
                  : 'border-slate-200 bg-white hover:border-slate-300';

                return (
                  <div
                    key={evt.id || idx}
                    onClick={() => setSelectedEvent(isSelected ? null : evt)}
                    className={`min-w-[210px] max-w-[240px] shrink-0 p-3 rounded-xl border flex flex-col justify-between transition-all duration-150 cursor-pointer ${borderClass}`}
                  >
                    {/* Card Top: Priority Badge & Timestamp */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1">
                        <span className={`text-[8.5px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                          priority === 'P0' 
                            ? 'bg-rose-100 text-rose-700 font-extrabold'
                            : priority === 'P1'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {priority}
                        </span>
                        {isLatest && (
                          <span className="text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-blue-600 text-white">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {evt.timestamp}
                      </span>
                    </div>

                    {/* Card Middle: Event Title */}
                    <div className="my-1.5">
                      <h4 
                        className={`text-xs font-bold leading-snug line-clamp-2 ${
                          isLatest ? 'text-slate-950 font-black' : 'text-slate-800'
                        }`}
                        title={evt.title}
                      >
                        {title}
                      </h4>
                      {evt.detail && (
                        <p className="text-[10.5px] text-slate-500 font-medium line-clamp-2 mt-1 leading-tight">
                          {evt.detail}
                        </p>
                      )}
                    </div>

                    {/* Card Bottom: Actor & Category Pill */}
                    <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between">
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                        isAiEvent ? 'text-cyan-700' : isClinicianEvent ? 'text-[#0E62FE]' : 'text-slate-500'
                      }`}>
                        {isAiEvent && <Sparkles className="w-2.5 h-2.5 text-cyan-600" />}
                        <span>{evt.actor}</span>
                      </span>
                      <span className="text-[8.5px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                        {evt.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile View (< 768px): Clean Vertical Ledger */}
          <div className="block md:hidden relative pl-6 space-y-4">
            <div className="absolute left-2.5 top-2 bottom-2 w-[2px] bg-slate-200" />

            {filteredEvents.map((evt, idx) => {
              const isLatest = idx === filteredEvents.length - 1;
              const isSelected = selectedEvent?.id === evt.id;
              const { title, priority } = formatEventInfo(evt);

              return (
                <div
                  key={evt.id || idx}
                  onClick={() => setSelectedEvent(isSelected ? null : evt)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isLatest 
                      ? 'border-[#0E62FE] bg-blue-50/30'
                      : isSelected
                      ? 'border-cyan-400 bg-cyan-50/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 mb-1">
                    <span className="text-[9px] font-black uppercase text-blue-600">{priority} · {evt.actor}</span>
                    <span>{evt.timestamp}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{title}</h4>
                  {evt.detail && (
                    <p className="text-[11px] text-slate-500 font-medium mt-1">{evt.detail}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* 3. Event Detail Modal / Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-sm bg-blue-100 text-blue-700">
                  {selectedEvent.category} · {selectedEvent.actor}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {selectedEvent.timestamp}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900 mb-2">
                {selectedEvent.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {selectedEvent.detail}
              </p>
            </div>

            {selectedEvent.payload && Object.keys(selectedEvent.payload).length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[9px] font-mono font-black uppercase text-slate-400 block mb-1">
                  EVENT PAYLOAD
                </span>
                <pre className="text-[10px] font-mono text-slate-700 overflow-x-auto">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tabular Audit Table (when toggled) */}
      {showAuditTable && (
        <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs mt-2">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-black text-slate-800">
              COMPLETE IMMUTABLE AUDIT LOG ({chronologicalEvents.length} EVENTS)
            </span>
            <button
              onClick={() => setShowAuditTable(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 text-[10px] font-mono font-bold text-slate-600 uppercase border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Priority</th>
                  <th className="py-2 px-3">Actor</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Milestone Title</th>
                  <th className="py-2 px-3">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {chronologicalEvents.map((evt, i) => {
                  const p = getEventPriority(evt);
                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-slate-500">{evt.timestamp}</td>
                      <td className="py-2 px-3">
                        <span className={`text-[8.5px] font-mono font-black uppercase px-1.5 py-0.5 rounded-sm ${
                          p === 'P0' ? 'bg-rose-100 text-rose-700' : p === 'P1' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-700">{evt.actor}</td>
                      <td className="py-2 px-3 text-slate-500 text-[10px]">{evt.category}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{evt.title}</td>
                      <td className="py-2 px-3 text-slate-600 text-[11px] truncate max-w-xs">{evt.detail}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
