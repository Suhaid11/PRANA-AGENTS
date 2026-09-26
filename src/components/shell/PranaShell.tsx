import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useEmergency } from '../../context/useEmergency';
import type { UserRole } from '../../types/emergency';
import {
  RotateCcw,
  Radio,
  Ambulance,
  Stethoscope,
  Building2,
  Boxes,
  Compass,
  ChevronDown,
  Check,
  HeartPulse,
  ShieldAlert,
  Activity,
  Clock
} from 'lucide-react';
import { AuthPersonaBadge } from '../auth/AuthPersonaBadge';
import { UnauthorizedAlert } from '../auth/UnauthorizedAlert';

interface PranaShellProps {
  children: React.ReactNode;
}

export const PranaShell: React.FC<PranaShellProps> = ({ children }) => {
  const {
    appMode,
    toggleAppMode,
    setAppMode,
    activeCase,
    activeRole,
    setActiveRole,
    resetMission,
    isStreaming,
    toggleStreaming,
    selectScenario,
    derivedEta,
    backendStatus,
    realtimeStatus
  } = useEmergency();
  const [isScenarioMenuOpen, setIsScenarioMenuOpen] = useState(false);
  const scenarioTriggerRef = useRef<HTMLButtonElement>(null);
  const scenarioMenuRef = useRef<HTMLDivElement>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Calculate anchored coordinates ensuring the menu opens DOWN and RIGHT, never under the left rail
  const updateScenarioMenuPosition = useCallback(() => {
    if (!scenarioTriggerRef.current) return;
    const rect = scenarioTriggerRef.current.getBoundingClientRect();

    // Fixed left navigation rail is 76px wide on lg+ viewports (>= 1024px)
    // On smaller screens, the fixed rail is hidden, but keep a safety margin
    const minLeft = window.innerWidth >= 1024 ? 84 : 12;
    const menuWidth = Math.min(336, window.innerWidth - 24);

    // Anchor to the trigger's left edge (expanding toward the right)
    let left = rect.left;

    // Viewport right edge collision check
    if (left + menuWidth > window.innerWidth - 16) {
      left = window.innerWidth - menuWidth - 16;
    }

    // Strictly enforce minimum left so it NEVER overlaps or goes behind the 76px left navigation
    left = Math.max(minLeft, left);

    // Vertical placement: 8px below trigger, or flip above if near bottom edge
    let top = rect.bottom + 8;
    const estimatedHeight = 320;
    if (top + estimatedHeight > window.innerHeight - 16 && rect.top - estimatedHeight - 8 > 16) {
      top = rect.top - estimatedHeight - 8;
    }

    setMenuCoords({ top, left });
  }, []);

  // Keyboard shortcut Ctrl + Shift + D to activate Demo Mode from Product Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        if (appMode === 'PRODUCT') {
          e.preventDefault();
          setAppMode('DEMO');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appMode, setAppMode]);

  // Handle outside click, escape key, and dynamic repositioning on scroll/resize
  useEffect(() => {
    if (!isScenarioMenuOpen) return;

    updateScenarioMenuPosition();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (scenarioTriggerRef.current && scenarioTriggerRef.current.contains(target)) {
        return;
      }
      if (scenarioMenuRef.current && scenarioMenuRef.current.contains(target)) {
        return;
      }
      setIsScenarioMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsScenarioMenuOpen(false);
        scenarioTriggerRef.current?.focus();
      }
    };

    const handleWindowChange = () => {
      updateScenarioMenuPosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [isScenarioMenuOpen, updateScenarioMenuPosition]);

  const navItems: { role: UserRole; label: string; shortLabel: string; icon: React.ElementType; badge?: string }[] = [
    { role: 'FIELD_MEDIC', label: 'Ambulance Field Command', shortLabel: 'Ambulance', icon: Ambulance },
    {
      role: 'REMOTE_CLINICIAN',
      label: 'Clinician Review Console',
      shortLabel: 'Clinician',
      icon: Stethoscope,
      badge: activeCase.clinicianEndorsement?.status === 'CONFIRMED' ? 'OK' : 'ACT'
    },
    {
      role: 'HOSPITAL_COMMAND',
      label: 'Hospital Command & Bay',
      shortLabel: 'Hospital',
      icon: Building2,
      badge: activeCase.hospitalReadiness?.status === 'BAY_READY' ? 'READY' : undefined
    },
    { role: 'READINESS', label: 'Medical Asset Readiness', shortLabel: 'Readiness', icon: Boxes },
    { role: 'PORTAL', label: 'Mission Overview & Scenarios', shortLabel: 'Portal', icon: Compass },
  ];

  const scenarioList = [
    {
      id: 'PR-8492',
      domain: 'TRAUMA',
      title: 'Trauma / Road Accident',
      patient: 'Rahul Verma · 34M',
      detail: 'High-speed MVC · Hemodynamic Shock Risk',
      icon: HeartPulse,
      color: '#0E62FE',
      tag: 'Critical Hemorrhage',
    },
    {
      id: 'PR-7104',
      domain: 'SNAKEBITE',
      title: 'Snakebite / Envenomation',
      patient: 'Sunita Gowda · 28F',
      detail: 'Russell\'s viper · 20WBCT Coagulopathy Watch',
      icon: ShieldAlert,
      color: '#D97706',
      tag: 'Hemotoxic Viperid',
    },
    {
      id: 'PR-9521',
      domain: 'POISONING',
      title: 'Poisoning / Toxicology',
      patient: 'Manoj Kumar · 45M',
      detail: 'Organophosphate · SLUDGE Vagal Crisis',
      icon: Activity,
      color: '#7C3AED',
      tag: 'Cholinergic Toxindrome',
    },
    {
      id: 'PR-4018',
      domain: 'RESPIRATORY_DISTRESS',
      title: 'Respiratory Distress',
      patient: 'Radha Sharma · 52F',
      detail: 'Acute COPD Exacerbation · Severe Hypoxemia',
      icon: Activity,
      color: '#0891B2',
      tag: 'Respiratory Compromise',
    },
  ];

  // Domain-aware scenario display — must NOT default to TRAUMA for non-demo cases
  const _domainColorMap: Record<string, string> = {
    TRAUMA: '#0E62FE',
    SNAKEBITE: '#D97706',
    POISONING: '#7C3AED',
    RESPIRATORY_DISTRESS: '#0891B2',
    CARDIAC: '#DC2626',
    GENERAL_EMERGENCY: '#059669',
  };
  const currentScenario = scenarioList.find((s) => s.id === activeCase.id) || {
    id: activeCase.id,
    domain: activeCase.domain,
    title: activeCase.domain.replace(/_/g, ' '),
    patient: `${activeCase.patient.name} · ${activeCase.patient.age}${activeCase.patient.sex === 'Male' ? 'M' : activeCase.patient.sex === 'Female' ? 'F' : ''}`,
    detail: activeCase.patient.chiefComplaint || '',
    icon: HeartPulse,
    color: _domainColorMap[activeCase.domain] || '#64748B',
    tag: activeCase.patient.incidentType || activeCase.domain,
  };

  const getLifecycleState = () => {
    if (activeCase.status === 'TRANSFER_COMPLETED' || activeCase.conduitStep >= 8) {
      return { label: 'TRANSFER COMPLETED', color: 'bg-emerald-50 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' };
    }
    if (activeCase.conduitStep === 7) {
      return { label: 'HANDOVER PENDING', color: 'bg-indigo-50 text-indigo-800 border-indigo-300 animate-pulse', dot: 'bg-indigo-500' };
    }
    if (activeCase.status === 'ARRIVED' || activeCase.conduitStep === 6) {
      return { label: 'PATIENT ARRIVED', color: 'bg-cyan-50 text-cyan-800 border-cyan-300', dot: 'bg-cyan-500' };
    }
    if (activeCase.hospitalReadiness?.status === 'BAY_READY' || activeCase.conduitStep === 5) {
      return { label: 'HOSPITAL READY', color: 'bg-emerald-50 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' };
    }
    if (activeCase.hospitalReadiness?.isPreAlertDispatched || activeCase.conduitStep === 4) {
      return { label: 'PRE-ALERT SENT', color: 'bg-blue-50 text-blue-800 border-blue-300', dot: 'bg-blue-500' };
    }
    if (activeCase.clinicianEndorsement?.status === 'CONFIRMED' || activeCase.clinicianEndorsement?.status === 'ESCALATED' || activeCase.conduitStep === 3) {
      return {
        label: activeCase.clinicianEndorsement?.status === 'ESCALATED' ? 'SPECIALIST ESCALATED' : 'CLINICIAN REVIEW',
        color: activeCase.clinicianEndorsement?.status === 'ESCALATED' ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-blue-50 text-blue-800 border-blue-300',
        dot: activeCase.clinicianEndorsement?.status === 'ESCALATED' ? 'bg-rose-500' : 'bg-blue-500'
      };
    }
    if (activeCase.conduitStep === 2) {
      return { label: 'IN TRANSIT', color: 'bg-amber-50 text-amber-800 border-amber-300', dot: 'bg-amber-500' };
    }
    return { label: 'ASSESSMENT ACTIVE', color: 'bg-slate-100 text-slate-800 border-slate-300', dot: 'bg-slate-400' };
  };

  const lifecycle = getLifecycleState();

  return (
    <div className="min-h-screen bg-[#EDF1F7] text-[#0C1220] selection:bg-blue-100 selection:text-blue-900">

      {/* 1. Deep Navy Technical Command Rail (Left structural spatial anchor - Fixed on desktop) */}
      <aside className="hidden lg:flex flex-col items-center justify-between w-[76px] fixed top-0 bottom-0 left-0 py-6 prana-shell-rail z-40 shrink-0">
        <div className="flex flex-col items-center gap-7">
          {/* Main PRANA Monogram Badge */}
          <button
            onClick={() => setActiveRole('PORTAL')}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0E62FE] to-[#0050E6] shadow-lg shadow-blue-500/30 flex items-center justify-center text-white hover:scale-105 transition-all cursor-pointer group relative"
            title="PRANA Mission Portal"
          >
            <span className="font-extrabold text-lg tracking-tighter">P<span className="text-cyan-300 font-bold">+</span></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse border-2 border-[#091024]" />
          </button>

          {/* Navigation Role Icon Group */}
          <nav className="flex flex-col items-center gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeRole === item.role;
              return (
                <div key={item.role} className="relative group">
                  <button
                    onClick={() => setActiveRole(item.role)}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
                      isActive
                        ? 'bg-[#0E62FE] text-white shadow-lg shadow-blue-500/35 scale-105'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5 stroke-[1.85]" />
                    {item.badge && !isActive && (
                      <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-emerald-500 text-slate-950 font-black text-[8px] rounded-full border border-slate-900">
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Left Rail Tooltip */}
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-bold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-slate-700/80">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Operational Utilities */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-px bg-white/10" />

          {/* Rapid Scenario Reset */}
          <button
            onClick={resetMission}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/40 flex items-center justify-center transition-all cursor-pointer shadow-sm group"
            title="Reset scenario to deterministic seed state"
          >
            <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>
      </aside>

      {/* 2. Main Content Canvas (Reserves 76px left margin on desktop for fixed rail) */}
      <div className="min-h-screen flex flex-col min-w-0 lg:pl-[76px]">

        {/* Sleek Clinical Header Bar */}
        <header className="px-4 sm:px-8 lg:px-10 pt-5 pb-3 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-30">

          {/* Left: PRANA Identity & Live Emergency Banner */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={() => setActiveRole('PORTAL')}
              className="text-left group cursor-pointer flex items-center gap-3 shrink-0"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-slate-950 group-hover:text-[#0E62FE] transition-colors">
                    PRANA
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-900 text-cyan-300 tracking-wider font-mono">
                    CLINICAL 2.0
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-semibold tracking-tight hidden sm:block">
                  Where the Journey Becomes Care
                </div>
              </div>
            </button>

            <div className="h-6 w-px bg-slate-200 hidden md:block" />

            {/* Active Emergency Case Snip */}
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/80 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: currentScenario.color }}
              />
              <span className="font-extrabold text-slate-900 font-mono tracking-tight">
                {activeCase.id}
              </span>
              <span className="text-slate-300">·</span>
              <span className="font-bold text-slate-700 truncate max-w-[130px]">
                {activeCase.patient.name}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                {activeCase.patient.consciousState}
              </span>
            </div>

            {/* Authoritative Lifecycle State Pill */}
            <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider shadow-2xs ${lifecycle.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${lifecycle.dot}`} />
              <span>{lifecycle.label}</span>
            </div>
          </div>

          {/* Right: Global Scenario Selector + Telemetry Status + ETA */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">

            {/* Global Scenario Selector Dropdown Anchor (Single consistent location) */}
            <div className="relative">
              <button
                ref={scenarioTriggerRef}
                onClick={() => setIsScenarioMenuOpen(!isScenarioMenuOpen)}
                aria-haspopup="true"
                aria-expanded={isScenarioMenuOpen}
                aria-label="Switch active competition emergency scenario"
                className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white border border-slate-200 hover:border-[#0E62FE] shadow-xs text-xs font-bold text-slate-800 transition-all cursor-pointer group hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0E62FE]/30"
                title="Switch active competition emergency scenario"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: currentScenario.color }}
                />
                <span className="uppercase tracking-wider font-extrabold text-[11px] text-slate-900">
                  {currentScenario.domain}
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-semibold text-slate-600 hidden sm:inline text-[11px]">
                  {activeCase.patient.name.split(' ')[0]}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${isScenarioMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Spatial Scenario Dropdown Menu rendered via Portal outside header clipping & stacking contexts */}
              {isScenarioMenuOpen && typeof document !== 'undefined' && createPortal(
                <div
                  ref={scenarioMenuRef}
                  role="menu"
                  aria-label="Emergency Scenarios"
                  style={{
                    position: 'fixed',
                    top: `${menuCoords.top}px`,
                    left: `${menuCoords.left}px`,
                  }}
                  className="w-72 sm:w-84 max-w-[calc(100vw-24px)] bg-white rounded-3xl shadow-2xl border border-slate-200/90 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 focus:outline-none"
                >
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      Active Emergency Scenario
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-[#0E62FE]">
                      GLOBAL SYNC
                    </span>
                  </div>

                  <div className="py-1">
                    {scenarioList.map((scen) => {
                      const isSelected = scen.id === activeCase.id;
                      const ScenIcon = scen.icon;

                      return (
                        <button
                          key={scen.id}
                          role="menuitem"
                          aria-selected={isSelected}
                          onClick={() => {
                            selectScenario(scen.id);
                            setIsScenarioMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-50/80 text-slate-900' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                              style={{
                                backgroundColor: isSelected ? `${scen.color}18` : '#F8FAFC',
                                borderColor: isSelected ? `${scen.color}50` : '#E2E8F0',
                                color: scen.color,
                              }}
                            >
                              <ScenIcon className="w-4.5 h-4.5" />
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-slate-900">
                                  {scen.title}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                {scen.patient} · {scen.detail}
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <Check className="w-4.5 h-4.5 text-[#0E62FE] shrink-0 ml-2 stroke-[2.5]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-4 pt-2.5 pb-1 border-t border-slate-100 text-[10px] text-slate-400 font-medium flex items-center justify-between">
                    <span>Updates state synchronously across all roles.</span>
                    <span className="font-mono text-[9px] uppercase font-bold text-slate-400">Deterministic</span>
                  </div>
                </div>,
                document.body
              )}
            </div>

            {/* Mode Switch: Product vs Demo */}
            <button
              onClick={toggleAppMode}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-xs text-[11px] font-bold transition-all cursor-pointer ${
                appMode === 'DEMO'
                  ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title={appMode === 'DEMO' ? 'Demo Mode Active — Click to switch to Product Mode' : 'Product Mode Active — Click to enable Demo Mode (Ctrl+Shift+D)'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${appMode === 'DEMO' ? 'bg-purple-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span>{appMode === 'DEMO' ? 'DEMO MODE' : 'PRODUCT MODE'}</span>
            </button>

            {/* Real-time WebSocket & Backend Persistence Status Indicator */}
            {realtimeStatus === 'LIVE' ? (
              <div
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-50 text-cyan-900 border border-cyan-200 shadow-2xs text-[10px] font-bold"
                title="Real-time WebSocket synchronization active. Instant bi-directional state updates across Ambulance, Clinician, and Hospital."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                <span className="font-mono uppercase tracking-wider">LIVE SYNC</span>
              </div>
            ) : realtimeStatus === 'RECONNECTING' ? (
              <div
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs text-[10px] font-bold"
                title="Reconnecting to real-time WebSocket channel..."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                <span className="font-mono uppercase tracking-wider">RECONNECTING</span>
              </div>
            ) : backendStatus === 'CONNECTED' ? (
              <div
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs text-[10px] font-bold"
                title="Connected to SQLite persistent backend via FastAPI REST."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="font-mono uppercase tracking-wider">PERSISTENT DB</span>
              </div>
            ) : backendStatus === 'OFFLINE_FALLBACK' ? (
              <div
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs text-[10px] font-bold"
                title="FastAPI backend offline; running in local deterministic fallback mode."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="font-mono uppercase tracking-wider">OFFLINE FALLBACK</span>
              </div>
            ) : null}

            {/* Live Sensor Telemetry Beacon */}
            <button
              onClick={toggleStreaming}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all shadow-xs cursor-pointer ${
                isStreaming
                  ? 'bg-cyan-50 text-cyan-900 border-cyan-200 hover:bg-cyan-100'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
              title={isStreaming ? 'Pause live 3.5s sensor telemetry ticker' : 'Resume live sensor telemetry ticker'}
            >
              <Radio className={`w-3 h-3 ${isStreaming ? 'animate-pulse text-cyan-600' : 'text-amber-600'}`} />
              <span className="hidden sm:inline font-mono uppercase text-[10px] tracking-wider">
                {isStreaming ? '256-BIT SYNC' : 'STREAM PAUSED'}
              </span>
            </button>

            {/* Authenticated Identity & Persona Switcher */}
            <AuthPersonaBadge />

            {/* Prominent High-Confidence ETA Capsule */}
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-white shadow-md text-xs font-bold ${
              activeCase.ambulance.isTrafficDelayed
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 shadow-amber-500/25'
                : 'bg-gradient-to-r from-[#0E62FE] to-[#0050E6] shadow-blue-500/25'
            }`}>
              <Clock className="w-3.5 h-3.5 text-white/90" />
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-white/80">ETA</span>
              <span className="font-tabular text-sm font-black text-white">
                {derivedEta} MIN
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Pills */}
        <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto no-scrollbar px-4 py-2.5 bg-white border-b border-slate-200/60">
          {navItems.map((item) => (
            <button
              key={item.role}
              onClick={() => setActiveRole(item.role)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeRole === item.role
                  ? 'bg-[#0E62FE] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{item.shortLabel}</span>
              {item.badge && activeRole !== item.role && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          ))}
        </div>

        {/* Main Operational Canvas */}
        <main className="flex-1 px-4 sm:px-8 lg:px-10 py-5 max-w-[1720px] w-full mx-auto flex flex-col gap-6">
          {children}
        </main>

        {/* High-Confidence Technical Footer */}
        <footer className="px-4 sm:px-8 lg:px-10 py-3 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/60 bg-white/50">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>PRANA Clinical Spatialism · Prehospital Emergency Coordination Layer</span>
          </div>
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            DEMONSTRATION LOGIC — QUALIFIED CLINICIAN SUPERVISION MANDATORY
          </div>
        </footer>
      </div>

      {/* Global Unauthorized Action Alert Notification */}
      <UnauthorizedAlert />
    </div>
  );
};
