import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { CareConduit } from '../conduit/CareConduit';
import { PatientCard } from './PatientCard';
import { VitalCard } from './VitalCard';
import { CareRail } from '../timeline/CareRail';
import { WhyThisHospitalModal } from '../facility/WhyThisHospitalModal';
import { Wind, Syringe, Shield, ShieldAlert, ChevronRight, CheckCircle2, Stethoscope, Building2, ArrowUpRight } from 'lucide-react';

export const AmbulanceWorkspace: React.FC = () => {
  const { activeCase, addTimelineEvent, setActiveRole } = useEmergency();
  const { currentVitals, vitalsHistory, patient, domain, clinicianEndorsement, hospitalReadiness } = activeCase;
  const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);

  // Sparkline histories
  const hrSparkline = vitalsHistory.map((v) => v.heartRate);
  const spo2Sparkline = vitalsHistory.map((v) => v.spo2);
  const sbpSparkline = vitalsHistory.map((v) => v.systolicBp);

  const shockIndex = (currentVitals.heartRate / currentVitals.systolicBp).toFixed(2);
  const isShockElevated = Number(shockIndex) > 0.9;
  const pulsePressure = currentVitals.systolicBp - currentVitals.diastolicBp;

  const isClinicianEndorsed = clinicianEndorsement?.status === 'CONFIRMED';
  const isBayReady = hospitalReadiness?.status === 'BAY_READY';

  // Clinician-authorized prehospital intervention documentation
  const handleLogIntervention = (actionLabel: string, detailText: string) => {
    addTimelineEvent({
      category: 'CLINICAL',
      title: `Intervention Recorded: ${actionLabel}`,
      detail: detailText,
      actor: 'FIELD MEDIC',
      status: 'SUCCESS',
    });
  };

  return (
    <>
      <div className="flex flex-col gap-6 py-2">
        
        {/* 1. Main Spatial Stage: 3-Column Asymmetric Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Editorial Headline + Human Patient Context (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Editorial Display Headline */}
            <div>
              <div className="text-[10px] font-extrabold text-[#0E62FE] uppercase tracking-widest mb-1">
                Field Command · Locus Active
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[0.95]">
                Active <br />
                <span className="text-slate-400 font-normal">Emergency.</span>
              </h1>
            </div>

            {/* Floating Canvas-First Patient Surface */}
            <PatientCard patient={patient} />

            {/* Intervention Documentation Log (Safe clinical action logger) */}
            <div className="p-4 rounded-3xl bg-white/70 backdrop-blur-md border border-white/90 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.03)] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Intervention Log (Prehospital)
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Paramedic Authorized
                </span>
              </div>

              {/* Dynamic interventions tailored to scenario domain */}
              <div className="flex flex-col gap-1.5">
                {domain === 'SNAKEBITE' ? (
                  <>
                    <button
                      onClick={() => handleLogIntervention('Limb Splint Immobilization', 'Pressure immobilization bandage applied at heart level without tourniquet.')}
                      className="w-full text-left px-3.5 py-2 rounded-2xl bg-white hover:bg-emerald-50/60 text-slate-700 hover:text-emerald-700 text-xs font-bold border border-slate-200/60 transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Record limb immobilization</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                    </button>

                    <button
                      onClick={() => handleLogIntervention('Puncture Site Demarcation', 'Bite site boundary and progressive edema margin marked with indelible marker.')}
                      className="w-full text-left px-3.5 py-2 rounded-2xl bg-white hover:bg-blue-50/60 text-slate-700 hover:text-[#0E62FE] text-xs font-bold border border-slate-200/60 transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <Syringe className="w-3.5 h-3.5 text-blue-600" />
                        <span>Record bite margin marked</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0E62FE] transition-colors" />
                    </button>

                    <button
                      onClick={() => handleLogIntervention('20WBCT Sample Drawn', 'Clean glass tube whole blood sample collected; timer started for 20-min clot check.')}
                      className="w-full text-left px-3.5 py-2 rounded-2xl bg-white hover:bg-amber-50/60 text-slate-700 hover:text-amber-700 text-xs font-bold border border-slate-200/60 transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <Wind className="w-3.5 h-3.5 text-amber-600" />
                        <span>Record 20WBCT sample</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 transition-colors" />
                    </button>
                  </>
                ) : domain === 'POISONING' ? (
                  <>
                    <button
                      onClick={() => handleLogIntervention('Airway Suctioning', 'Continuous suction applied to clear copious oral and bronchial secretions.')}
                      className="w-full text-left px-3.5 py-2 rounded-2xl bg-white hover:bg-purple-50/60 text-slate-700 hover:text-purple-700 text-xs font-bold border border-slate-200/60 transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <Wind className="w-3.5 h-3.5 text-purple-600" />
                        <span>Record airway suctioned</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-600 transition-colors" />
                    </button>

                    <button
                      onClick={() => handleLogIntervention('Dermal Decontamination', 'Contaminated clothing safely excised; dermal areas cleansed with saline wash.')}
                      className="w-full text-left px-3.5 py-2 rounded-2xl bg-white hover:bg-blue-50/60 text-slate-700 hover:text-[#0E62FE] text-xs font-bold border border-slate-200/60 transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-blue-600" />
                        <span>Record decontamination</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0E62FE] transition-colors" />
                    </button>

                    <button
                      onClick={() => handleLogIntervention('High-Flow Oxygen', '100% FiO2 delivered via bag-valve mask with PEEP for severe pulmonary secretions.')}
                      className="w-full text-left px-3.5 py-2 rounded-2xl bg-white hover:bg-emerald-50/60 text-slate-700 hover:text-emerald-700 text-xs font-bold border border-slate-200/60 transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <Syringe className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Record high-flow O2</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleLogIntervention('Oxygen Support', 'High-flow O2 via non-rebreather mask titrated to maintain SpO2 > 92%.')}
                      className="w-full text-left px-3.5 py-2 rounded-2xl bg-white hover:bg-blue-50/60 text-slate-700 hover:text-[#0E62FE] text-xs font-bold border border-slate-200/60 transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <Wind className="w-3.5 h-3.5 text-blue-600" />
                        <span>Record oxygen support</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0E62FE] transition-colors" />
                    </button>

                    <button
                      onClick={() => handleLogIntervention('IV Access', '16-gauge large-bore peripheral cannula secured with warm crystalloid line.')}
                      className="w-full text-left px-3.5 py-2 rounded-2xl bg-white hover:bg-blue-50/60 text-slate-700 hover:text-[#0E62FE] text-xs font-bold border border-slate-200/60 transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <Syringe className="w-3.5 h-3.5 text-blue-600" />
                        <span>Record IV access</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0E62FE] transition-colors" />
                    </button>

                    <button
                      onClick={() => handleLogIntervention('Immobilization', 'Cervical collar and pelvic circumferential compression binder verified.')}
                      className="w-full text-left px-3.5 py-2 rounded-2xl bg-white hover:bg-emerald-50/60 text-slate-700 hover:text-emerald-700 text-xs font-bold border border-slate-200/60 transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Record immobilization</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: PRANA-Native Care Conduit Centerpiece (5 cols) */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <CareConduit />
          </div>

          {/* RIGHT COLUMN: Streaming Telemetry + Integrated Decision Support (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Physiological Stream
              </span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sensor Sync
              </span>
            </div>

            {/* Heart Rate Block */}
            <VitalCard
              label="Heart Rate"
              value={currentVitals.heartRate}
              unit="bpm"
              trend={domain === 'POISONING' ? (currentVitals.heartRate < 60 ? 'DOWN' : 'STABLE') : (currentVitals.heartRate > 105 ? 'UP' : 'STABLE')}
              status={domain === 'POISONING' ? (currentVitals.heartRate < 55 ? 'CRITICAL' : 'WARNING') : (currentVitals.heartRate > 115 ? 'CRITICAL' : currentVitals.heartRate > 100 ? 'WARNING' : 'NORMAL')}
              sparkline={hrSparkline}
              referenceRange={domain === 'POISONING' ? 'Cholinergic Bradycardia' : '60 - 100 bpm'}
            />

            {/* SpO2 Saturation Block */}
            <VitalCard
              label="SpO2 Saturation"
              value={`${currentVitals.spo2}%`}
              unit="O2"
              trend={currentVitals.spo2 < 94 ? 'DOWN' : 'STABLE'}
              status={currentVitals.spo2 < 92 ? 'CRITICAL' : currentVitals.spo2 < 95 ? 'WARNING' : 'NORMAL'}
              sparkline={spo2Sparkline}
              referenceRange="95 - 100 %"
            />

            {/* Blood Pressure & Shock Index Block */}
            <VitalCard
              label={`Blood Pressure (${isShockElevated ? `Shock Idx ${shockIndex}` : `PP ${pulsePressure}`})`}
              value={`${currentVitals.systolicBp}/${currentVitals.diastolicBp}`}
              unit="mmHg"
              trend={currentVitals.systolicBp < 100 ? 'DOWN' : 'STABLE'}
              status={currentVitals.systolicBp < 95 ? 'CRITICAL' : currentVitals.systolicBp < 105 ? 'WARNING' : 'NORMAL'}
              sparkline={sbpSparkline}
              referenceRange="110-130 / 70-85"
            />

            {/* Integrated PRANA Intelligence Decision Support */}
            <div className="p-4 rounded-3xl bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-xs flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#0E62FE]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800">
                    PRANA INTELLIGENCE
                  </span>
                </div>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
                  activeCase.aiDecisionSupport?.riskLevel === 'CRITICAL' || isShockElevated || currentVitals.spo2 < 92
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {activeCase.aiDecisionSupport?.riskLevel || (isShockElevated || currentVitals.spo2 < 92 ? 'HIGH RISK' : 'MONITORING')}
                </span>
              </div>

              {/* Dynamic Observable Signals */}
              <div className="text-xs text-slate-700 leading-snug">
                <div className="font-extrabold text-slate-900 mb-0.5 text-[11px]">
                  Simulated deterioration pattern detected
                </div>
                <div className="text-[10px] text-slate-500 mb-1">
                  Based on observed physiological signals · Clinical review requested
                </div>
                <div className="flex flex-wrap gap-x-2 text-[11px] font-bold text-slate-600 font-tabular">
                  <span className={currentVitals.heartRate > 110 || currentVitals.heartRate < 60 ? 'text-rose-600' : 'text-slate-700'}>
                    HR {currentVitals.heartRate} bpm
                  </span>
                  <span>·</span>
                  <span className={currentVitals.spo2 < 93 ? 'text-rose-600' : 'text-slate-700'}>
                    SpO2 {currentVitals.spo2}%
                  </span>
                  <span>·</span>
                  <span className={pulsePressure < 35 ? 'text-amber-600' : 'text-slate-700'}>
                    PP {pulsePressure} mmHg
                  </span>
                  {domain === 'TRAUMA' && (
                    <>
                      <span>·</span>
                      <span className={isShockElevated ? 'text-rose-600' : 'text-slate-700'}>
                        Shock Idx {shockIndex}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Active Clinical Pattern */}
              <div className="p-2.5 rounded-2xl bg-blue-50/50 border border-blue-100/70 text-[11px] text-slate-600">
                <strong className="text-[#0E62FE] block font-bold">
                  {activeCase.aiDecisionSupport?.clinicalSignificance || activeCase.scenarioTitle}
                </strong>
                <span>{activeCase.aiDecisionSupport?.nextStepRecommendation || 'Continuous tele-specialist link active in transit.'}</span>
              </div>

              {/* Remote Clinician Handshake State */}
              <div className="pt-1 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => setActiveRole('REMOTE_CLINICIAN')}
                  className="flex items-center gap-1 text-slate-600 hover:text-[#0E62FE] transition-colors"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-[#0E62FE]" />
                  <span className="font-semibold">{clinicianEndorsement?.clinicianName || 'Dr. Sunita Rao'}</span>
                </button>

                {isClinicianEndorsed ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1 text-[10px]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Endorsed ({clinicianEndorsement?.timestamp})</span>
                  </span>
                ) : (
                  <span className="text-amber-700 font-bold text-[10px]">
                    Review Requested →
                  </span>
                )}
              </div>

              {/* Receiving Hospital Handshake State */}
              <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => setIsWhyModalOpen(true)}
                  className="flex items-center gap-1 text-slate-600 hover:text-[#0E62FE] transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold truncate max-w-[130px]">
                    {activeCase.ambulance.assignedHospital.split('(')[0]}
                  </span>
                </button>

                {isBayReady ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1 text-[10px]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Bay 1 Sterile & Ready</span>
                  </span>
                ) : (
                  <button
                    onClick={() => setIsWhyModalOpen(true)}
                    className="text-[#0E62FE] font-bold text-[10px] flex items-center gap-0.5 hover:underline"
                  >
                    <span>Match 94%</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. BOTTOM SECTION: The Signature PRANA Care Rail (Connected Chronology) */}
        <div className="mt-1 pt-4 border-t border-slate-200/50">
          <CareRail compact={true} />
        </div>
      </div>

      {/* Why This Hospital Modal */}
      <WhyThisHospitalModal 
        isOpen={isWhyModalOpen} 
        onClose={() => setIsWhyModalOpen(false)} 
      />
    </>
  );
};
