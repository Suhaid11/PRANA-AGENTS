import React, { useState, useEffect } from 'react';
import { useEmergency } from '../../context/useEmergency';
import type { HospitalCandidate } from '../../types/emergency';
import { 
  Play, 
  Activity, 
  Stethoscope, 
  Building2, 
  Car, 
  CheckCircle2, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown,
  Sparkles,
  Shuffle
} from 'lucide-react';

export const DemoDirector: React.FC = () => {
  const { 
    activeCase, 
    triggerVitalDeterioration, 
    computeAiSignal, 
    endorseProtocol, 
    recalculateFacilityMatching,
    dispatchHospitalPreAlert,
    confirmHospitalBay, 
    setTrafficDelay, 
    continueCare, 
    resetMission,
    setActiveRole
  } = useEmergency();

  const [isOpen, setIsOpen] = useState(false);
  const [currentAct, setCurrentAct] = useState<number>(2);

  // Keyboard shortcut Ctrl + Shift + D to toggle Demo Director
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scenario-specific deterministic deterioration values
  const getDeteriorationVitals = () => {
    switch (activeCase.domain) {
      case 'TRAUMA':
        return { heartRate: 126, spo2: 89, systolicBp: 88, diastolicBp: 54, respiratoryRate: 26, temperatureC: 36.6, isAbnormal: true };
      case 'SNAKEBITE':
        return { heartRate: 118, spo2: 95, systolicBp: 98, diastolicBp: 62, respiratoryRate: 22, temperatureC: 37.2, isAbnormal: true };
      case 'POISONING':
        return { heartRate: 44, spo2: 84, systolicBp: 86, diastolicBp: 52, respiratoryRate: 28, temperatureC: 36.4, isAbnormal: true };
    }
  };

  // Act 3: Deteriorate Vitals & Trigger Dynamic AI Signal
  const handleAct3Deteriorate = () => {
    const vitals = getDeteriorationVitals();
    triggerVitalDeterioration(vitals);
    computeAiSignal();
    setCurrentAct(3);
  };

  // Act 4: Clinician Endorsement
  const handleAct4ClinicianEndorse = () => {
    endorseProtocol('CONFIRMED');
    setCurrentAct(4);
  };

  // Act 5: Mutate Facility Match (Live Capacity Shift)
  const handleAct5MutateFacility = () => {
    const primary = activeCase.facilityMatching?.candidates.find((c) => c.isPrimary);
    const mutatedCandidates: HospitalCandidate[] = (activeCase.facilityMatching?.candidates || []).map((c) => {
      if (c.id === primary?.id) {
        return {
          ...c,
          availability: 'Bay Full · Diversion Advisory Active',
        };
      }
      return c;
    });
    recalculateFacilityMatching(mutatedCandidates);
    setCurrentAct(5);
  };

  // Act 6: Hospital Pre-Alert Dispatch
  const handleAct6PreAlert = () => {
    dispatchHospitalPreAlert();
    setCurrentAct(6);
  };

  // Act 7: Traffic Congestion (+8 Minutes)
  const handleAct7TrafficDelay = () => {
    setTrafficDelay(8);
    continueCare('Corridor congestion detected on Ring Road. Monitoring & treatment continue.');
    setCurrentAct(7);
  };

  // Act 8: Confirm Hospital Bay Sterile & Ready
  const handleAct8BayReady = () => {
    confirmHospitalBay('Trauma Resuscitation Bay 1 (Sterile)');
    setCurrentAct(8);
  };

  // Act 9: Bedside Handover
  const handleAct9Handover = () => {
    continueCare('Bedside clinical handover complete. Continuous timeline log archived.');
    setCurrentAct(9);
  };

  // Reset to Clean Scenario Seed State
  const handleReset = () => {
    resetMission();
    setCurrentAct(2);
  };

  return (
    <aside 
      aria-label="Competition Demo Director" 
      className="fixed bottom-3 right-4 sm:right-8 z-50 flex flex-col items-end gap-2 select-none"
    >
      {/* Toggle Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white border border-slate-700/80 shadow-lg backdrop-blur-md text-[11px] font-extrabold cursor-pointer transition-all hover:scale-102"
        title="Toggle Presenter Demo Controller (Ctrl+Shift+D)"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#0E62FE]" />
        <span>DEMO DIRECTOR</span>
        <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 hidden sm:inline">
          Ctrl+Shift+D
        </span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
      </button>

      {/* Expanded Presenter Controls Drawer */}
      {isOpen && (
        <div className="w-[340px] sm:w-[500px] bg-slate-950/95 border border-slate-800 rounded-3xl p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150 text-white">
          
          {/* Top Bar: Active Case & Quick Role Nav */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0E62FE] animate-pulse" />
              <span className="text-[11px] font-bold text-slate-300">
                Active: <strong className="text-white">{activeCase.patient.name}</strong> ({activeCase.domain})
              </span>
            </div>

            {/* Quick Workspace Switchers */}
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <button 
                onClick={() => setActiveRole('FIELD_MEDIC')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Ambulance
              </button>
              <button 
                onClick={() => setActiveRole('REMOTE_CLINICIAN')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Clinician
              </button>
              <button 
                onClick={() => setActiveRole('HOSPITAL_COMMAND')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Hospital
              </button>
            </div>
          </div>

          {/* 10-Act Sequence Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold">
            
            {/* Act 3: Deteriorate Vitals */}
            <button
              onClick={handleAct3Deteriorate}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                currentAct === 3
                  ? 'bg-rose-950/60 border-rose-600 text-rose-200 ring-1 ring-rose-500'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">ACT 3</span>
                <Activity className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <span className="text-[11px] font-extrabold leading-tight">Deteriorate & AI Signal</span>
            </button>

            {/* Act 4: Clinician Endorse */}
            <button
              onClick={handleAct4ClinicianEndorse}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                currentAct === 4
                  ? 'bg-blue-950/60 border-blue-600 text-blue-200 ring-1 ring-blue-500'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">ACT 4</span>
                <Stethoscope className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-[11px] font-extrabold leading-tight">Clinician Endorse</span>
            </button>

            {/* Act 5: Mutate Facility Match */}
            <button
              onClick={handleAct5MutateFacility}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                currentAct === 5
                  ? 'bg-purple-950/60 border-purple-600 text-purple-200 ring-1 ring-purple-500'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">ACT 5</span>
                <Shuffle className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span className="text-[11px] font-extrabold leading-tight">Mutate Facility Match</span>
            </button>

            {/* Act 6: Hospital Pre-Alert */}
            <button
              onClick={handleAct6PreAlert}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                currentAct === 6
                  ? 'bg-blue-950/60 border-blue-600 text-blue-200 ring-1 ring-blue-500'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">ACT 6</span>
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-[11px] font-extrabold leading-tight">Dispatch Pre-Alert</span>
            </button>

            {/* Act 7: Traffic Congestion */}
            <button
              onClick={handleAct7TrafficDelay}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                currentAct === 7
                  ? 'bg-amber-950/60 border-amber-600 text-amber-200 ring-1 ring-amber-500'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">ACT 7</span>
                <Car className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-[11px] font-extrabold leading-tight">Traffic Congestion +8m</span>
            </button>

            {/* Act 8: Bay Ready */}
            <button
              onClick={handleAct8BayReady}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                currentAct === 8
                  ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200 ring-1 ring-emerald-500'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">ACT 8</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-[11px] font-extrabold leading-tight">Confirm Bay Ready</span>
            </button>
          </div>

          {/* Bottom Bar: Quick Reset & Clean Handover */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
            <button
              onClick={handleAct9Handover}
              className="px-3 py-1 rounded-lg bg-emerald-700/80 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3 h-3" />
              <span>Act 9: Bedside Handover</span>
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-1.5 transition-colors"
              title="Reset scenario to initial seed state"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Case</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
