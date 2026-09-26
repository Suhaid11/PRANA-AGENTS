import React, { useState } from 'react';
import { useEmergency } from '../../context/useEmergency';
import { 
  ShieldAlert, 
  ArrowRight, 
  HeartPulse, 
  Activity, 
  Check, 
  Building2,
  Ambulance,
  Plus,
  Mic,
  Wind,
  FileText
} from 'lucide-react';
import { CaseIntakeModal } from './CaseIntakeModal';

export const MissionPortal: React.FC = () => {
  const { activeCase, setActiveRole, selectScenario, derivedEta } = useEmergency();
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);

  const handleLaunchScenario = (scenarioId: string, role: 'FIELD_MEDIC' | 'REMOTE_CLINICIAN' | 'HOSPITAL_COMMAND' = 'FIELD_MEDIC') => {
    selectScenario(scenarioId);
    setActiveRole(role);
  };

  const scenarios = [
    {
      id: 'PR-8492',
      domain: 'TRAUMA',
      title: 'Trauma / Road Accident',
      pattern: 'Simulated acute hemorrhagic hypovolemia pattern',
      patient: 'Rahul Verma · 34 · Male',
      incident: 'High-velocity motor vehicle collision at Ring Road Junction 4',
      vitalsPill: 'HR 112+ bpm · BP 98/64 · Shock Index 1.14',
      hospital: 'Manipal Hospital (Level-1 Trauma Suite · Bay 1)',
      ambulance: 'Echo-4 (ALS Paramedic A. Kumar)',
      eta: '14 MINS ETA',
      color: '#0E62FE',
      accentBg: 'rgba(14, 98, 254, 0.08)',
      icon: HeartPulse,
      imageSrc: '/assets/scenario_trauma.jpg',
      tags: ['Blunt Polytrauma', 'Narrowing Pulse Pressure', 'Level-1 Transfusion'],
      metaBadge: 'GCS 14 · HR 109 · ETA 14m',
    },
    {
      id: 'PR-7104',
      domain: 'SNAKEBITE',
      title: 'Snakebite / Envenomation',
      pattern: 'Simulated hemotoxic coagulopathy-risk pattern',
      patient: 'Sunita Gowda · 28 · Female',
      incident: 'Suspected Russell\'s viper bite on right lower limb in peri-urban nursery',
      vitalsPill: 'HR 106 bpm · 20WBCT Clot Watch · SpO2 96%',
      hospital: 'Victoria Hospital (Toxicology & Antivenom Center)',
      ambulance: 'Sierra-9 (ALS Paramedic R. Dev)',
      eta: '18 MINS ETA',
      color: '#D97706',
      accentBg: 'rgba(217, 119, 6, 0.08)',
      icon: ShieldAlert,
      imageSrc: '/assets/scenario_snakebite.jpg',
      tags: ['Ascending Edema > 10cm', 'Cold-Chain ASV Bank', 'Tourniquet Contraindicated'],
      metaBadge: '20WBCT WATCH · ETA 18m',
    },
    {
      id: 'PR-9521',
      domain: 'POISONING',
      title: 'Poisoning / Toxicology',
      pattern: 'Simulated cholinergic crisis (SLUDGE syndrome) pattern',
      patient: 'Manoj Kumar · 45 · Male',
      incident: 'Agricultural organophosphate pesticide inhalation in greenhouse',
      vitalsPill: 'Severe Bradycardia 54 bpm · SpO2 90% · Bronchorrhea',
      hospital: 'MS Ramaiah Medical Center (Toxicology ICU · Bay 4)',
      ambulance: 'Tango-2 (Hazmat Paramedic K. Swamy)',
      eta: '16 MINS ETA',
      color: '#7C3AED',
      accentBg: 'rgba(124, 58, 237, 0.08)',
      icon: Activity,
      imageSrc: '/assets/scenario_poisoning.jpg',
      tags: ['SLUDGE Toxindrome', 'Continuous Airway Suction', 'Atropine Titration'],
      metaBadge: 'SpO₂ 90% · ATROPINE TITRATION',
    },
    {
      id: 'PR-4018',
      domain: 'RESPIRATORY_DISTRESS',
      title: 'Acute Respiratory Distress',
      pattern: 'Simulated progressive hypoxemia & bronchospasm pattern',
      patient: 'Radha Sharma · 52 · Female',
      incident: 'Severe dyspnea and wheezing in chronic airway patient at Indiranagar',
      vitalsPill: 'SpO2 86% · RR 32/min · HR 108 bpm',
      hospital: 'Manipal Hospital (Tertiary Pulmonary ICU · Bay 2)',
      ambulance: 'Bravo-7 (ALS Paramedic P. Nair)',
      eta: '9 MINS ETA',
      color: '#0284C7',
      accentBg: 'rgba(2, 132, 199, 0.08)',
      icon: Wind,
      imageSrc: '/assets/scenario_trauma.jpg',
      tags: ['Impending Respiratory Failure', 'High-Flow O2 Active', 'EtCO2 Monitoring'],
      metaBadge: 'SpO₂ 86% · HIGH-FLOW O2 · ETA 9m',
    },
  ];

  const isCustomOrIngestedCase = !scenarios.some(s => s.id === activeCase.id);

  return (
    <div className="flex flex-col gap-10 py-3 max-w-[1620px] mx-auto w-full select-none">
      
      {/* 1. Gallery-Grade Editorial Hero Banner: ~45% Copy / ~55% Emergency in Motion Visual */}
      <div className="p-6 sm:p-10 lg:p-12 bg-white rounded-3xl relative overflow-hidden border border-slate-200/90 shadow-md">
        {/* Soft Background Radial Auras */}
        <div 
          className="absolute -right-20 -bottom-20 w-[500px] h-[500px] rounded-full bg-blue-100/50 pointer-events-none blur-3xl" 
        />
        <div 
          className="absolute -left-20 -top-20 w-[360px] h-[360px] rounded-full bg-cyan-100/40 pointer-events-none blur-3xl" 
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-center relative z-10">
          
          {/* LEFT COLUMN: Editorial PRANA Thesis & Architectural Proof (45% on xl) */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-50 text-[#0E62FE] border border-blue-200 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                <span>PRANA MISSION PORTAL</span>
              </span>
              <span className="text-xs text-slate-400 font-bold hidden sm:inline">
                Clinician-Supervised Tele-Specialist Platform
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl xl:text-6xl font-black text-slate-950 tracking-tight leading-[0.92]">
              Where the Journey <br />
              <span className="text-[#0E62FE]">Becomes Care.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
              If the ambulance cannot beat the traffic, the treatment should not have to wait for it. 
              PRANA converts transit dead time into active stabilization through bi-directional sensor streams, explainable CDS, and hospital readiness handshakes.
            </p>

            {/* Primary Action Buttons */}
            <div className="pt-1 flex flex-wrap items-center gap-3">
              {/* PRIMARY NEW ACTION: CREATE CASE (VOICE / TEXT / FILE) */}
              <button
                onClick={() => setIsIntakeModalOpen(true)}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#0E62FE] hover:bg-[#0050E6] text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all hover:gap-3 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <Mic className="w-3.5 h-3.5 text-cyan-300" />
                <span>CREATE CASE (VOICE / TEXT / FILE)</span>
              </button>

              <button
                onClick={() => setActiveRole('FIELD_MEDIC')}
                className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <span>Active Case ({activeCase.patient.name ? activeCase.patient.name.split(' ')[0] : 'Patient'} · #{activeCase.id})</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                onClick={() => setActiveRole('READINESS')}
                className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-colors border border-slate-200 cursor-pointer"
              >
                <span>Medical Readiness</span>
              </button>
            </div>

            {/* Compact Proof & System Status Strip */}
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 pt-2 text-[11px] font-bold text-slate-500 border-t border-slate-100">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-mono font-black text-slate-900">45/45</span> State Transitions Verified
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-700">
                <strong className="text-slate-900 font-extrabold">4+</strong> Tele-Specialist Pathways
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-700">Voice Intake Ready</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-cyan-700 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                Live Sensor Telemetry
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: Large Visual Anchor — An Emergency In Motion (55% on xl) */}
          <div className="lg:col-span-6 xl:col-span-7 relative flex items-center justify-center min-w-0">
            <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl group bg-slate-950">
              <img 
                src="/assets/hero_emergency_route.jpg" 
                alt="PRANA Emergency in Motion — Ambulance continuous telemetry route to receiving medical center" 
                className="w-full h-[280px] sm:h-[360px] xl:h-[420px] object-cover object-center transform group-hover:scale-[1.015] transition-transform duration-700 opacity-95" 
              />

              {/* Edge Vignette & Ambient Layering */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-transparent pointer-events-none hidden lg:block" />

              {/* Floating Annotation #1: Live Telemetry Stream */}
              <div className="absolute top-3.5 left-3.5 prana-float-pill px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white shadow-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                  <span className="text-slate-300 uppercase font-bold">Telemetry</span>
                  <span className="text-cyan-300 font-black font-tabular">
                    HR {activeCase.currentVitals?.heartRate ?? '--'} · SpO₂ {activeCase.currentVitals?.spo2 ?? '--'}%
                  </span>
                </div>
              </div>

              {/* Floating Annotation #2: Care Corridor & Real Derived ETA */}
              <div className="absolute bottom-3.5 left-3.5 prana-float-pill px-3.5 py-2 bg-white/95 backdrop-blur-md border border-blue-200 shadow-xl flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#0E62FE] flex items-center justify-center font-bold shrink-0">
                  <Ambulance className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Care Corridor Transit</span>
                  <span className="font-tabular font-black text-slate-900 text-xs">
                    {derivedEta} MIN ETA · {activeCase.ambulance?.currentSpeedKmH ?? 45} km/h
                  </span>
                </div>
              </div>

              {/* Floating Annotation #3: Receiving Hospital & Sterile Bay Readiness */}
              <div className="absolute top-3.5 right-3.5 prana-float-pill px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-emerald-500/60 text-white shadow-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300">
                    {activeCase.hospitalReadiness?.status === 'BAY_READY' ? 'Sterile Bay Ready' : 'Pre-Alert Active'}
                  </span>
                  <span className="font-bold text-white text-[11px] truncate max-w-[140px] sm:max-w-[180px]">
                    {activeCase.ambulance?.assignedHospital ? activeCase.ambulance.assignedHospital.split('(')[0].trim() : 'Receiving Hospital'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Active Ingested Case Highlight Banner (Shown if user imported an external case) */}
      {isCustomOrIngestedCase && (
        <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-950 rounded-3xl border border-blue-500/40 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-cyan-300 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  ACTIVE INGESTED CASE · #{activeCase.id}
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  Domain: {activeCase.domain}
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-0.5">
                {activeCase.patient.name} ({activeCase.patient.approximateAge ? `~${activeCase.patient.approximateAge}y` : `${activeCase.patient.age}y`} · {activeCase.patient.sex})
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                {activeCase.patient.incidentType} · {activeCase.ambulance.assignedHospital} · ETA {derivedEta}m
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setActiveRole('FIELD_MEDIC')}
              className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors cursor-pointer"
            >
              Field Console
            </button>
            <button
              onClick={() => setActiveRole('REMOTE_CLINICIAN')}
              className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Clinician Review
            </button>
            <button
              onClick={() => setActiveRole('HOSPITAL_COMMAND')}
              className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Hospital Bay
            </button>
          </div>
        </div>
      )}

      {/* 2. Standardized Emergency Scenarios Section (Visual Launch Surfaces) */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-base font-black text-slate-950 uppercase tracking-wider">
              Emergency Coordination Scenarios & Case Catalog
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Select any case to initialize the synchronized state machine, or click "+ CREATE CASE" to import a real patient via voice, text, or file.
            </p>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            CLINICIAN-SUPERVISED DEMONSTRATION LOGIC
          </span>
        </div>

        {/* 4 Visually Distinct Scenario Launch Surfaces */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {scenarios.map((scen) => {
            const isCurrentlyActive = activeCase.id === scen.id;
            const ScenIcon = scen.icon;

            return (
              <div
                key={scen.id}
                className={`bg-white rounded-3xl overflow-hidden flex flex-col justify-between transition-all shadow-sm ${
                  isCurrentlyActive
                    ? 'border-2 border-[#0E62FE] ring-4 ring-blue-50 shadow-md'
                    : 'border border-slate-200/90 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* 1. Clinical Illustration Anchor */}
                <div className="relative h-44 overflow-hidden bg-slate-900 border-b border-slate-100">
                  <img 
                    src={scen.imageSrc} 
                    alt={scen.title}
                    className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-500 opacity-90" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30 pointer-events-none" />

                  {/* Overlaid Scenario Domain Badge */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black bg-slate-950/80 backdrop-blur-md text-white border border-white/20 shadow-md">
                    <ScenIcon className="w-3 h-3" style={{ color: scen.color }} />
                    <span className="uppercase tracking-wider font-mono">#{scen.id} · {scen.domain}</span>
                  </div>

                  {/* Active Simulation Marker */}
                  {isCurrentlyActive && (
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black bg-[#0E62FE] text-white shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>ACTIVE</span>
                    </div>
                  )}

                  {/* Contextual Real Data Metadata Pill Over Image */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] font-mono font-bold text-white bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10">
                    <span className="text-cyan-300 tracking-tight truncate">{scen.metaBadge}</span>
                    <span className="text-slate-400 font-sans text-[9px] uppercase font-bold shrink-0 ml-1">{scen.domain}</span>
                  </div>
                </div>

                {/* 2. Structured Information Body */}
                <div className="p-5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-base font-black text-slate-950 tracking-tight leading-snug">
                      {scen.title}
                    </h3>

                    <p className="text-[11px] font-bold text-[#0E62FE] mt-1 leading-snug">
                      {scen.pattern}
                    </p>

                    {/* Patient Profile Snapshot */}
                    <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="truncate">{scen.patient}</span>
                        <span className="font-mono text-[9px] text-slate-600 font-bold shrink-0">{scen.eta}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug font-medium line-clamp-2">
                        {scen.incident}
                      </p>
                      <div className="text-[10px] font-black text-slate-800 pt-1 border-t border-slate-200/60 font-mono truncate">
                        {scen.vitalsPill}
                      </div>
                    </div>

                    {/* Clinical Tags */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {scen.tags.slice(0, 2).map((tag, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 rounded-full text-[8.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Facility Destination */}
                    <div className="mt-2.5 text-xs text-slate-500 font-medium flex items-start gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span className="leading-snug text-[10.5px] truncate">{scen.hospital}</span>
                    </div>
                  </div>

                  {/* 3. Scenario Action Footer */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-col gap-2">
                    <button
                      onClick={() => handleLaunchScenario(scen.id, 'FIELD_MEDIC')}
                      className={`w-full py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                        isCurrentlyActive
                          ? 'bg-[#0E62FE] hover:bg-[#0050E6] text-white shadow-blue-500/25'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span>{isCurrentlyActive ? 'Enter Console' : `Launch Case`}</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>

                    {/* Quick Jump to Specific Roles */}
                    <div className="flex items-center justify-between text-[10.5px] text-slate-500 font-semibold pt-0.5">
                      <span>Jump:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleLaunchScenario(scen.id, 'REMOTE_CLINICIAN')}
                          className="text-[#0E62FE] hover:underline font-bold cursor-pointer"
                        >
                          Clinician
                        </button>
                        <span>·</span>
                        <button
                          onClick={() => handleLaunchScenario(scen.id, 'HOSPITAL_COMMAND')}
                          className="text-[#0E62FE] hover:underline font-bold cursor-pointer"
                        >
                          Hospital
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Case Intake Modal */}
      <CaseIntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        onCaseConfirmed={(newCase) => {
          console.log('[PRANA Portal] Case activated:', newCase.id);
        }}
      />
    </div>
  );
};
