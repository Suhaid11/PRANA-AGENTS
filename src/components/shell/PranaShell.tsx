import React, { useState, useRef, useEffect } from 'react';
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
  Activity 
} from 'lucide-react';

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
    derivedEta 
  } = useEmergency();
  const [isScenarioMenuOpen, setIsScenarioMenuOpen] = useState(false);
  const scenarioMenuRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (scenarioMenuRef.current && !scenarioMenuRef.current.contains(event.target as Node)) {
        setIsScenarioMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { role: UserRole; label: string; icon: React.ElementType }[] = [
    { role: 'FIELD_MEDIC', label: 'Ambulance Field', icon: Ambulance },
    { role: 'REMOTE_CLINICIAN', label: 'Clinician Review', icon: Stethoscope },
    { role: 'HOSPITAL_COMMAND', label: 'Hospital Command', icon: Building2 },
    { role: 'READINESS', label: 'Medical Readiness', icon: Boxes },
    { role: 'PORTAL', label: 'All Scenarios', icon: Compass },
  ];

  const scenarioList = [
    {
      id: 'PR-8492',
      domain: 'TRAUMA',
      title: 'Trauma / Road Accident',
      patient: 'Rahul Verma · 34M',
      detail: 'High-speed MVC · Hemodynamic deterioration',
      icon: HeartPulse,
      color: '#0E62FE',
    },
    {
      id: 'PR-7104',
      domain: 'SNAKEBITE',
      title: 'Snakebite / Envenomation',
      patient: 'Sunita Gowda · 28F',
      detail: 'Russell\'s viper · 20WBCT coagulopathy',
      icon: ShieldAlert,
      color: '#D97706',
    },
    {
      id: 'PR-9521',
      domain: 'POISONING',
      title: 'Poisoning / Toxicology',
      patient: 'Manoj Kumar · 45M',
      detail: 'Organophosphate · SLUDGE syndrome',
      icon: Activity,
      color: '#7C3AED',
    },
  ];

  const currentScenario = scenarioList.find((s) => s.id === activeCase.id) || scenarioList[0];

  return (
    <div className="min-h-[100dvh] flex bg-[#EEF1F6] text-[#0C1220] selection:bg-blue-100 selection:text-blue-900">
      
      {/* Left Sleek Spatial Icon Rail */}
      <aside className="hidden lg:flex flex-col items-center justify-between w-20 py-8 border-r border-slate-200/50 bg-[#EEF1F6] z-40">
        <div className="flex flex-col items-center gap-8">
          {/* Main Logo Badge */}
          <button 
            onClick={() => setActiveRole('PORTAL')}
            className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200/80 flex items-center justify-center text-[#0E62FE] hover:scale-105 transition-transform"
            title="PRANA Mission Portal"
          >
            <span className="font-extrabold text-lg tracking-tighter text-slate-900">P<span className="text-[#0E62FE]">+</span></span>
          </button>

          {/* Navigation Icon Group */}
          <div className="flex flex-col items-center gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeRole === item.role;
              return (
                <button
                  key={item.role}
                  onClick={() => setActiveRole(item.role)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-[#0E62FE] text-white shadow-md shadow-blue-500/25 scale-105'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-white/80'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5 stroke-[1.75]" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Quick-Reset Button */}
        <button
          onClick={resetMission}
          className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 border border-slate-200/80 flex items-center justify-center transition-all shadow-sm"
          title="Reset simulation to scenario seed state"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Minimalist Floating Top Bar */}
        <header className="px-6 lg:px-12 pt-6 pb-2 flex flex-wrap items-center justify-between gap-4">
          
          {/* Left: PRANA Identity & Active State */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveRole('PORTAL')}
              className="text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-[#0E62FE] transition-colors">
                  PRANA
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#0E62FE] border border-slate-200/80 shadow-xs uppercase tracking-wider">
                  Field 1.0
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                Where the Journey Becomes Care
              </div>
            </button>

            <div className="h-6 w-px bg-slate-200/80 hidden sm:block" />

            {/* Mobile Navigation Pills */}
            <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {navItems.map((item) => (
                <button
                  key={item.role}
                  onClick={() => setActiveRole(item.role)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    activeRole === item.role
                      ? 'bg-[#0E62FE] text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200/80'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Persistent Scenario Switcher + System State */}
          <div className="flex items-center gap-2.5">
            
            {/* GLOBAL SCENARIO SWITCHER (Single source of truth) */}
            <div className="relative" ref={scenarioMenuRef}>
              <button
                onClick={() => setIsScenarioMenuOpen(!isScenarioMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 hover:border-[#0E62FE] shadow-xs text-xs font-bold text-slate-800 transition-all cursor-pointer group"
                title="Switch active competition scenario"
              >
                <span 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: currentScenario.color }}
                />
                <span className="uppercase tracking-wider font-extrabold text-[11px] text-slate-900">
                  {currentScenario.domain}
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-medium text-slate-500 hidden sm:inline text-[11px]">
                  {activeCase.patient.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform" />
              </button>

              {/* Spatial Scenario Dropdown Menu */}
              {isScenarioMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-3xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      Select Active Emergency
                    </span>
                    <span className="text-[10px] font-bold text-[#0E62FE]">
                      Global Switch
                    </span>
                  </div>

                  <div className="py-1">
                    {scenarioList.map((scen) => {
                      const isSelected = scen.id === activeCase.id;
                      const ScenIcon = scen.icon;

                      return (
                        <button
                          key={scen.id}
                          onClick={() => {
                            selectScenario(scen.id);
                            setIsScenarioMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors ${
                            isSelected ? 'bg-blue-50/70 text-slate-900' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                              style={{ 
                                backgroundColor: isSelected ? `${scen.color}15` : '#F8FAFC',
                                borderColor: isSelected ? `${scen.color}40` : '#E2E8F0',
                                color: scen.color,
                              }}
                            >
                              <ScenIcon className="w-4 h-4" />
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-extrabold text-slate-900">
                                  {scen.title}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {scen.patient} · {scen.detail}
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <Check className="w-4 h-4 text-[#0E62FE] shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-4 pt-2 pb-1 border-t border-slate-100 text-[10px] text-slate-400 italic">
                    Simulation state updates across all views immediately.
                  </div>
                </div>
              )}
            </div>

            {/* Mode Switch: Product vs Demo */}
            <button
              onClick={toggleAppMode}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-xs text-[11px] font-bold transition-all cursor-pointer ${
                appMode === 'DEMO'
                  ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                  : 'bg-white text-slate-600 border-slate-200/70 hover:bg-slate-50'
              }`}
              title={appMode === 'DEMO' ? 'Demo Mode Active — Click to switch to Product Mode' : 'Product Mode Active — Click to enable Demo Mode (Ctrl+Shift+D)'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${appMode === 'DEMO' ? 'bg-purple-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span>{appMode === 'DEMO' ? 'DEMO MODE' : 'PRODUCT MODE'}</span>
            </button>

            {/* Live Telemetry Ticker */}
            <button
              onClick={toggleStreaming}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all shadow-xs ${
                isStreaming
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
              title={isStreaming ? 'Pause live stream ticker' : 'Resume live stream ticker'}
            >
              <Radio className={`w-3 h-3 ${isStreaming ? 'animate-pulse text-emerald-600' : 'text-amber-600'}`} />
              <span className="hidden sm:inline">{isStreaming ? 'LIVE' : 'PAUSED'}</span>
            </button>

            {/* Prominent ETA Pill */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0E62FE] text-white shadow-sm shadow-blue-500/20 text-xs font-bold">
              <span>ETA</span>
              <span className="font-tabular text-sm font-extrabold">
                {derivedEta} MIN
              </span>
            </div>
          </div>
        </header>

        {/* Main Canvas with Generous Whitespace */}
        <main className="flex-1 px-6 lg:px-12 py-4 max-w-[1680px] w-full mx-auto flex flex-col justify-between">
          {children}
        </main>

        {/* Minimal Editorial Footer */}
        <footer className="px-6 lg:px-12 py-3 text-xs text-slate-400 flex items-center justify-between border-t border-slate-200/40">
          <div className="text-[11px]">
            PRANA Clinical Spatialism · Prehospital Emergency Coordination
          </div>
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            SIMULATED SCENARIO — NOT CLINICAL DIAGNOSIS
          </div>
        </footer>
      </div>
    </div>
  );
};
