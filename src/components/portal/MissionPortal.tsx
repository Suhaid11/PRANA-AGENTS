import React from 'react';
import { useEmergency } from '../../context/useEmergency';
import { ShieldAlert, ArrowRight, HeartPulse, Activity, Check, Building2 } from 'lucide-react';

export const MissionPortal: React.FC = () => {
  const { activeCase, setActiveRole, selectScenario } = useEmergency();

  const handleLaunchScenario = (scenarioId: string, role: 'FIELD_MEDIC' | 'REMOTE_CLINICIAN' | 'HOSPITAL_COMMAND' = 'FIELD_MEDIC') => {
    selectScenario(scenarioId);
    setActiveRole(role);
  };

  const scenarios = [
    {
      id: 'PR-8492',
      domain: 'TRAUMA',
      title: 'Trauma / Road Accident',
      pattern: 'Simulated hemodynamic deterioration pattern',
      patient: 'Rahul Verma · 34 · Male',
      incident: 'High-velocity motor vehicle collision at Ring Road Junction 4',
      vitalsPill: 'HR 112+ bpm · BP 98/64 · Shock Index 1.14',
      hospital: 'Manipal Hospital (Level-1 Trauma Suite · Bay 1)',
      ambulance: 'Echo-4 (ALS Paramedic A. Kumar)',
      eta: '14 MINS ETA',
      color: '#0E62FE',
      icon: HeartPulse,
      tags: ['Blunt Polytrauma', 'Narrowing Pulse Pressure', 'Transfusion Standby'],
      accentBg: 'bg-blue-50/70',
      accentBorder: 'border-blue-200/80',
    },
    {
      id: 'PR-7104',
      domain: 'SNAKEBITE',
      title: 'Snakebite / Envenomation',
      pattern: 'Simulated envenomation/coagulation-risk pattern',
      patient: 'Sunita Gowda · 28 · Female',
      incident: 'Suspected Russell\'s viper bite on right lower limb in peri-urban nursery',
      vitalsPill: 'HR 106 bpm · 20WBCT Clot Watch · SpO2 96%',
      hospital: 'Victoria Hospital (Toxicology & Antivenom Center)',
      ambulance: 'Sierra-9 (ALS Paramedic R. Dev)',
      eta: '18 MINS ETA',
      color: '#D97706',
      icon: ShieldAlert,
      tags: ['Ascending Edema > 10cm', 'Cold-Chain ASV Bank', 'Tourniquet Contraindicated'],
      accentBg: 'bg-amber-50/70',
      accentBorder: 'border-amber-200/80',
    },
    {
      id: 'PR-9521',
      domain: 'POISONING',
      title: 'Poisoning / Toxicology',
      pattern: 'Simulated cholinergic-toxicity pattern',
      patient: 'Manoj Kumar · 45 · Male',
      incident: 'Agricultural organophosphate pesticide inhalation in greenhouse',
      vitalsPill: 'Severe Bradycardia 54 bpm · SpO2 90% · Bronchorrhea',
      hospital: 'MS Ramaiah Medical Center (Toxicology ICU · Bay 4)',
      ambulance: 'Tango-2 (Hazmat Paramedic K. Swamy)',
      eta: '16 MINS ETA',
      color: '#7C3AED',
      icon: Activity,
      tags: ['SLUDGE Toxindrome', 'Continuous Airway Suction', 'Atropine Titration'],
      accentBg: 'bg-purple-50/70',
      accentBorder: 'border-purple-200/80',
    },
  ];

  return (
    <div className="flex flex-col gap-10 py-4 max-w-[1560px] mx-auto w-full select-none">
      
      {/* 1. Gallery-Grade Editorial Hero Banner */}
      <div className="prana-float-card p-8 sm:p-14 bg-white/95 backdrop-blur-md relative overflow-hidden border border-slate-200/80">
        {/* Ambient radial blur aura */}
        <div 
          className="absolute -right-24 -bottom-24 w-[480px] h-[480px] rounded-full bg-blue-50/80 pointer-events-none blur-3xl" 
        />

        <div className="max-w-4xl relative z-10 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#0E62FE] border border-blue-200/80 uppercase tracking-wider">
              PRANA MISSION PORTAL · EMERGENCY SIMULATION
            </span>
            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
              15-Minute Individual Solution Showcase
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[0.92]">
            Where the Journey <br />
            <span className="text-[#0E62FE]">Becomes Care.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl">
            If the ambulance cannot beat the traffic, the treatment should not have to wait for it. 
            PRANA connects field paramedics, continuous sensor streams, explainable clinical decision support, and receiving hospital readiness into one unbroken coordination surface.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveRole('FIELD_MEDIC')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#0E62FE] hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-500/25 transition-all hover:gap-3 cursor-pointer"
            >
              <span>Resume Active Emergency ({activeCase.patient.name} · #{activeCase.id})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveRole('READINESS')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm transition-colors border border-slate-200/80 shadow-xs cursor-pointer"
            >
              <span>Inspect Medical Readiness</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Standardized Emergency Scenarios Dock */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">
              Standardized Competition Scenarios
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any scenario to initialize the full prehospital simulation state across Ambulance, Clinician, and Hospital consoles.
            </p>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            SIMULATED SCENARIOS — NOT CLINICAL DIAGNOSES
          </span>
        </div>

        {/* 3 Large Spatial Scenario Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {scenarios.map((scen) => {
            const isCurrentlyActive = activeCase.id === scen.id;
            const ScenIcon = scen.icon;

            return (
              <div
                key={scen.id}
                className={`prana-float-card p-7 sm:p-8 bg-white flex flex-col justify-between relative transition-all ${
                  isCurrentlyActive
                    ? 'border-2 border-[#0E62FE] ring-4 ring-blue-50 shadow-md'
                    : 'border border-slate-200/80 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Top active badge */}
                {isCurrentlyActive && (
                  <div className="absolute top-6 right-6 flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-[#0E62FE] text-white shadow-xs">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    <span>ACTIVE IN SIMULATION</span>
                  </div>
                )}

                <div>
                  {/* Scenario Icon Badge */}
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border shadow-xs"
                    style={{ 
                      backgroundColor: `${scen.color}15`,
                      borderColor: `${scen.color}40`,
                      color: scen.color,
                    }}
                  >
                    <ScenIcon className="w-6 h-6" />
                  </div>

                  {/* Domain & Title */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      CASE #{scen.id} · {scen.domain}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                    {scen.title}
                  </h3>

                  <p className="text-xs font-semibold text-[#0E62FE] mt-1">
                    {scen.pattern}
                  </p>

                  {/* Patient Profile Snapshot */}
                  <div className="mt-4 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{scen.patient}</span>
                      <span className="font-tabular text-[11px] text-slate-500 font-semibold">{scen.eta}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {scen.incident}
                    </p>
                    <div className="text-[10px] font-extrabold text-slate-800 pt-1 border-t border-slate-200/60 font-tabular">
                      {scen.vitalsPill}
                    </div>
                  </div>

                  {/* Clinical Tags */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {scen.tags.map((tag, idx) => (
                      <span 
                        key={idx}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Facility Destination */}
                  <div className="mt-4 text-xs text-slate-500 flex items-start gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span className="leading-snug">{scen.hospital}</span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col gap-2">
                  <button
                    onClick={() => handleLaunchScenario(scen.id, 'FIELD_MEDIC')}
                    className={`w-full py-3 px-4 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                      isCurrentlyActive
                        ? 'bg-[#0E62FE] hover:bg-blue-700 text-white shadow-blue-500/25'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{isCurrentlyActive ? 'Enter Field Console' : `Launch ${scen.domain} Case`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Quick Jump to Specific Roles */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Or start in:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLaunchScenario(scen.id, 'REMOTE_CLINICIAN')}
                        className="text-[#0E62FE] hover:underline font-bold"
                      >
                        Clinician
                      </button>
                      <span>·</span>
                      <button
                        onClick={() => handleLaunchScenario(scen.id, 'HOSPITAL_COMMAND')}
                        className="text-[#0E62FE] hover:underline font-bold"
                      >
                        Hospital
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
