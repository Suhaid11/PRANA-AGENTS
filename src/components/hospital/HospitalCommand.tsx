import React, { useState } from 'react';
import { useEmergency } from '../../context/useEmergency';
import { CareConduit } from '../conduit/CareConduit';
import { CareRail } from '../timeline/CareRail';
import { WhyThisHospitalModal } from '../facility/WhyThisHospitalModal';
import { Building2, CheckCircle2, ShieldCheck, Stethoscope, ArrowUpRight } from 'lucide-react';

export const HospitalCommand: React.FC = () => {
  const { activeCase, confirmHospitalBay, derivedEta } = useEmergency();
  const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);

  const { ambulance, patient, hospitalReadiness, clinicianEndorsement } = activeCase;
  const isBayReady = hospitalReadiness?.status === 'BAY_READY';
  const assignedBay = hospitalReadiness?.assignedBay || 'Trauma Bay 1 (Red Zone)';
  const isClinicianEndorsed = clinicianEndorsement?.status === 'CONFIRMED';
  const clinicianName = clinicianEndorsement?.clinicianName || 'Dr. Sunita Rao, MD';

  const handleConfirmReady = () => {
    confirmHospitalBay(assignedBay);
  };

  return (
    <>
      <div className="flex flex-col gap-6 py-2">
        {/* 1. Editorial Top Headline */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-extrabold text-[#0E62FE] uppercase tracking-widest mb-1">
              Receiving Facility Command · Emergency Readiness Console
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[0.95]">
              Hospital <br />
              <span className="text-slate-400 font-normal">Readiness & Bay Command.</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
              {ambulance.assignedHospital.toUpperCase()}
            </span>
          </div>
        </div>

        {/* 2. Contextual Reception Conduit (Inbound Corridor & Bay Standby) */}
        <CareConduit variant="readiness" />

        {/* 3. Main Hospital Command Stage: Focal Readiness Experience */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT / CENTER (7 cols): Incoming Triage & Why This Hospital? */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            
            {/* Incoming Triage & Bay Status Card */}
            <div className="prana-float-card p-6 bg-white/90 backdrop-blur-md flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#0E62FE]" />
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">
                    Incoming Patient Triage & Resuscitation Bay
                  </h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${
                  isBayReady
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-blue-50 text-[#0E62FE] border-blue-200/80'
                }`}>
                  {isBayReady ? 'BAY 1 STERILE & VERIFIED' : 'INBOUND PRE-ALERT ACTIVE'}
                </span>
              </div>

              {/* Arrival Countdown Hero Display */}
              <div className="p-5 rounded-3xl bg-[#F8FAFC] border border-slate-200/70 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    ESTIMATED ARRIVAL WINDOW
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-4xl font-extrabold font-tabular text-slate-900 leading-none">
                      {derivedEta}
                    </span>
                    <span className="text-base font-bold text-slate-400">MINUTES</span>
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Corridor: Ring Road Arterial ({ambulance.currentSpeedKmH} km/h)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/60 flex flex-col text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Incoming Unit</span>
                  <span className="text-sm font-extrabold text-slate-900">{ambulance.callSign} (ALS Unit)</span>
                  <span className="text-xs text-slate-500">Lead: {ambulance.crewLead}</span>
                </div>
              </div>

              {/* Remote Specialist Endorsement Status */}
              <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                isClinicianEndorsed 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                  : 'bg-amber-50/70 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Stethoscope className={`w-4 h-4 shrink-0 ${isClinicianEndorsed ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <div>
                    <strong className="block font-extrabold">
                      {isClinicianEndorsed ? 'Tele-Specialist Handshake Verified' : 'Clinical Protocol Review in Transit'}
                    </strong>
                    <span className="text-[11px] opacity-90">
                      {isClinicianEndorsed 
                        ? `Protocol endorsed by ${clinicianName} (${clinicianEndorsement?.timestamp})` 
                        : 'Remote emergency specialist is reviewing live sensor telemetry'}
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                  isClinicianEndorsed ? 'bg-emerald-100 border-emerald-300' : 'bg-amber-100 border-amber-300'
                }`}>
                  {clinicianEndorsement?.status || 'PENDING'}
                </span>
              </div>

              {/* Bay Allocation Confirmation Action */}
              <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Resuscitation Bay Allocation
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                    {assignedBay}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {isBayReady ? 'Sister Philomina, RN · Confirmed' : 'Awaiting charge nurse sterile clearance'}
                  </span>
                </div>

                {!isBayReady ? (
                  <button
                    onClick={handleConfirmReady}
                    className="px-5 py-2.5 rounded-2xl bg-[#0E62FE] hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    Confirm Bay Ready
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Bay Verified Ready</span>
                  </div>
                )}
              </div>
            </div>

            {/* Why This Hospital? Embedded Matrix Section */}
            <div className="prana-float-card p-6 bg-white/90 backdrop-blur-md flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0E62FE] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Why This Hospital? (Match Fit Rationale)</span>
                </div>
                <button
                  onClick={() => setIsWhyModalOpen(true)}
                  className="text-[11px] font-extrabold text-[#0E62FE] hover:underline flex items-center gap-1"
                >
                  <span>Compare Alternatives</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/60">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Clinical Match</span>
                  <strong className="text-xs font-bold text-slate-900 block mt-0.5">Level-1 Trauma Suite</strong>
                  <span className="text-[10px] text-slate-500">24/7 Surgical & IR Team</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/60">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Transit Corridor</span>
                  <strong className="text-xs font-bold text-slate-900 block mt-0.5">{derivedEta} Mins Live ETA</strong>
                  <span className="text-[10px] text-slate-500">7.2 km Ring Road highway</span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[10px] font-extrabold text-emerald-700 uppercase block">Suitability Score</span>
                  <strong className="text-lg font-extrabold font-tabular text-emerald-900 block leading-tight mt-0.5">94% Fit</strong>
                  <span className="text-[10px] text-emerald-700">Top ranked in catchment</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
                Manipal Hospital was selected over closer community clinics because advanced resuscitative angio-embolization and dedicated trauma surgery are required for suspected severe hemorrhage.
              </p>
            </div>
          </div>

          {/* RIGHT PANEL (5 cols): ED Resource Checklist & Incoming Patient Profile */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            
            {/* Incoming Patient Snapshot */}
            <div className="prana-float-card p-6 bg-white/90 backdrop-blur-md flex flex-col gap-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Incoming Patient Profile
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">{patient.name}</h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {patient.age}y · {patient.sex} · Conscious: {patient.consciousState}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-[#0E62FE] border border-blue-200">
                  GCS {patient.gcsScore}/15
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/60 text-xs text-slate-700">
                <strong className="block text-slate-900 text-[11px] mb-0.5">Reported Injury:</strong>
                {patient.chiefComplaint}
              </div>
            </div>

            {/* ED Capability Checklist */}
            <div className="prana-float-card p-6 bg-white/90 backdrop-blur-md flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
                  ED Capability Checklist
                </div>
                <span className="text-[10px] font-bold text-emerald-600">
                  5/5 Verified
                </span>
              </div>

              {[
                { name: 'CT Scanner Suite', state: 'HOT STANDBY', detail: 'Cleared for immediate polytrauma scan' },
                { name: 'O-Negative Blood Units', state: 'READY', detail: '4 units thawed in trauma blood refrigerator' },
                { name: 'Trauma Surgery Team', state: 'ON-SITE', detail: 'Surgical registrar & scrub nurse alerted' },
                { name: 'ICU Bed Allocation', state: 'RESERVED', detail: 'Bed ICU-B3 held with ventilator' },
                { name: 'Interventional Radiology', state: 'ALERTED', detail: 'On-call angio team paged' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block leading-tight">{item.name}</span>
                      <span className="text-[10px] text-slate-500">{item.detail}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    {item.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Bottom: Compact Persistent Care Rail */}
        <div className="mt-2 pt-4 border-t border-slate-200/50">
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
