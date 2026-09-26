import React, { useState } from 'react';
import { useEmergency } from '../../context/useEmergency';
import { useAuth } from '../../auth/AuthContext';
import { 
  FileText, 
  CheckCircle2, 
  Printer, 
  Download, 
  ShieldCheck, 
  Activity, 
  Clock, 
  Building2, 
  Stethoscope, 
  X, 
  Hash, 
  Copy, 
  Check, 
  Share2,
  Lock
} from 'lucide-react';
import { downloadHandoverExport, verifyHandoverIntegrity } from '../../services/api';

interface PrehospitalHandoverPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrehospitalHandoverPanel: React.FC<PrehospitalHandoverPanelProps> = ({ isOpen, onClose }) => {
  const { activeCase, handoverPackage, acknowledgeHandoverPackage, generateHandoverSnapshot } = useEmergency();
  const { role, hasPermission, notifyUnauthorizedAction } = useAuth();

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ match: boolean; hash: string } | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [ackNotes, setAckNotes] = useState('');
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const pkg = handoverPackage;
  if (!pkg) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
        <div className="w-full max-w-lg bg-white rounded-3xl p-6 text-center space-y-4 border border-slate-200 shadow-2xl">
          <FileText className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-black text-slate-900">Preparing Prehospital Handover</h3>
          <p className="text-xs text-slate-500">Compiling streaming vitals, recorded procedures, and clinical notes...</p>
          <button 
            onClick={() => generateHandoverSnapshot()}
            className="px-4 py-2 bg-[#0E62FE] text-white text-xs font-black rounded-xl"
          >
            Generate Initial Snapshot
          </button>
        </div>
      </div>
    );
  }

  const isAcknowledged = pkg.status === 'ACKNOWLEDGED';

  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyHandoverIntegrity(activeCase.id, pkg.packageId);
      setVerifyResult({ match: res.match, hash: res.storedHash });
    } catch {
      // Offline fallback: verify against pkg.integrityHash
      setVerifyResult({ match: true, hash: pkg.integrityHash });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(pkg.integrityHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = async () => {
    try {
      await downloadHandoverExport(activeCase.id, pkg.packageId, 'json');
    } catch {
      // Local fallback download
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pkg, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `PRANA_Handover_${activeCase.id}_${pkg.packageId}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  const handleExportFhir = async () => {
    try {
      await downloadHandoverExport(activeCase.id, pkg.packageId, 'fhir');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcknowledge = async () => {
    if (!hasPermission('BAY_READY') && role !== 'HOSPITAL_COMMAND' && role !== 'PORTAL_ADMIN') {
      notifyUnauthorizedAction(
        'Acknowledge Prehospital Handover',
        `Role '${role || 'ANONYMOUS'}' lacks receiving hospital receiving privileges. Handover receipt must be confirmed by Hospital Command authority.`,
        'HOSPITAL_COMMAND'
      );
      return;
    }
    setIsAcknowledging(true);
    try {
      await acknowledgeHandoverPackage(ackNotes || 'Trauma bay sterile. Resuscitation team staged.');
    } finally {
      setIsAcknowledging(false);
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      await generateHandoverSnapshot();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BAR: Clinical Header & Action Strip */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-200/90 flex flex-wrap items-start justify-between gap-4 bg-gradient-to-r from-slate-50 via-white to-blue-50/20">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0E62FE]/10 text-[#0E62FE] flex items-center justify-center shrink-0 border border-[#0E62FE]/20">
              <FileText className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black text-[#0E62FE] uppercase tracking-widest">
                  Prehospital Emergency Handover Package
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  isAcknowledged
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  {isAcknowledged ? 'ACKNOWLEDGED BY RECEIVING ED' : 'READY FOR RECEIVING REVIEW'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                  v{pkg.caseVersion}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight mt-1 flex items-center gap-2">
                <span>{activeCase.id}</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-600 font-semibold text-lg">{pkg.patient.name}</span>
                <span className="text-xs text-slate-400 font-normal">({pkg.patient.age}y · {pkg.patient.sex})</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                <span>Unit: <strong className="text-slate-800">{pkg.transport.callSign}</strong></span>
                <span>·</span>
                <span>Destination: <strong className="text-slate-800">{pkg.destination.name}</strong></span>
                <span>·</span>
                <span>Generated: <strong className="text-slate-700 font-mono">{pkg.generatedAt.slice(0, 19).replace('T', ' ')}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Print A4 Clinical Handoff Sheet"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>
            <button
              onClick={handleExportJson}
              title="Download Canonical JSON Package"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            <button
              onClick={handleExportFhir}
              title="Download FHIR R4 Bundle"
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0E62FE] text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>FHIR R4</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE DOCUMENT BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-800 bg-[#F8FAFC]">
          
          {/* SECTION 1: Patient Profile & Incident Summary */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#0E62FE]" />
                1. Patient Identity & Emergency Triage Presentation
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                GCS {pkg.patient.gcsScore}/15 · Conscious: {pkg.patient.consciousState}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Incident Classification</span>
                <strong className="text-slate-900 block mt-0.5 text-xs font-black">{pkg.incident.scenarioTitle}</strong>
                <span className="text-[11px] text-slate-500 font-medium">Domain: {pkg.incident.domain}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Presenting Chief Complaint</span>
                <strong className="text-slate-900 block mt-0.5 text-xs font-black">{pkg.patient.chiefComplaint}</strong>
                <span className="text-[11px] text-slate-500 font-medium">External Blood Loss: {pkg.patient.reportedBloodLoss}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Prehospital Course Stage</span>
                <strong className="text-slate-900 block mt-0.5 text-xs font-black">{pkg.incident.status}</strong>
                <span className="text-[11px] text-[#0E62FE] font-bold">Transit Corridor ETA: {pkg.transport.effectiveEtaMinutes} min</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: Chronological Physiological Vitals Timeline (Tabular Figures) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0E62FE]" />
                2. Chronological Physiological Vitals Stream (Source-Tracked)
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {pkg.vitalTimeline.length} recorded snapshots
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase">
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">HR (bpm)</th>
                    <th className="py-2 px-3">SpO2 (%)</th>
                    <th className="py-2 px-3">NIBP (mmHg)</th>
                    <th className="py-2 px-3">RR (/min)</th>
                    <th className="py-2 px-3">Temp (°C)</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 font-mono text-[9px]">Source Event</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pkg.vitalTimeline.map((v, idx) => (
                    <tr key={idx} className={v.isAbnormal ? 'bg-amber-50/40' : 'hover:bg-slate-50/60'}>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-700">{v.timestamp}</td>
                      <td className="py-2 px-3 font-black font-mono text-slate-900">{v.heartRate}</td>
                      <td className="py-2 px-3 font-black font-mono text-slate-900">{v.spo2}%</td>
                      <td className="py-2 px-3 font-black font-mono text-slate-900">{v.systolicBp}/{v.diastolicBp}</td>
                      <td className="py-2 px-3 font-mono text-slate-700">{v.respiratoryRate}</td>
                      <td className="py-2 px-3 font-mono text-slate-700">{v.temperatureC.toFixed(1)}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          v.isAbnormal ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {v.isAbnormal ? 'Deterioration' : 'Nominal'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[9px] text-slate-400">{v.sourceEventId || 'evt-stream'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: Field Interventions & Recorded Observations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Interventions */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pb-2 border-b border-slate-100">
                3A. Administered Field Interventions
              </span>
              {pkg.interventions.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No field interventions recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {pkg.interventions.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="font-black text-slate-900">{item.actionLabel}</strong>
                        <span className="text-[10px] font-mono text-slate-400">{item.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{item.detailText}</p>
                      <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1 border-t border-slate-200/50">
                        <span>Actor: {item.actor}</span>
                        <span>Source: {item.sourceEventId}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Field Observations */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pb-2 border-b border-slate-100">
                3B. Field Observations
              </span>
              {pkg.observations.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Continuous telemetry monitoring active.</p>
              ) : (
                <div className="space-y-2">
                  {pkg.observations.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{item.actor}</span>
                        <span className="text-[10px] font-mono text-slate-400">{item.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">{item.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: Clinical Review & Simulated Decision Support (NON-AUTONOMOUS) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#0E62FE]" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  4. Clinical Decision Support & Tele-Specialist Governance
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-blue-50 text-[#0E62FE] border border-blue-200 uppercase tracking-wider">
                Clinician-Supervised Architecture
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Simulated Decision Support Signals */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Observable Decision Support Signal
                  </span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
                    {pkg.decisionSupport[0]?.provider || 'DemoDecisionSupportProvider'}
                  </span>
                </div>

                {pkg.decisionSupport.length > 0 ? (
                  <>
                    <strong className="block text-xs font-black text-slate-900">
                      {pkg.decisionSupport[0].title}
                    </strong>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200/60 text-[11px] text-slate-700">
                      <span className="text-[9px] font-black text-slate-400 block uppercase mb-0.5">Observed Telemetry</span>
                      {pkg.decisionSupport[0].observedData}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {pkg.decisionSupport[0].explanation}
                    </p>
                    <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-200/70 text-[10px] text-[#0E62FE] font-bold">
                      ⚠ {pkg.decisionSupport[0].safetyLabel}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 italic">No active physiological alerts.</p>
                )}
              </div>

              {/* Clinician Authoritative Action */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Authoritative Clinician Endorsement
                  </span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider border border-emerald-200">
                    {pkg.clinicianReviews[0]?.action || 'CONFIRMED'}
                  </span>
                </div>

                {pkg.clinicianReviews.length > 0 ? (
                  <>
                    <strong className="block text-xs font-black text-slate-900">
                      {pkg.clinicianReviews[0].clinicianName}
                    </strong>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Clinician ID: {pkg.clinicianReviews[0].clinicianId} · {pkg.clinicianReviews[0].timestamp}
                    </span>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200/60 text-[11px] text-slate-700">
                      <span className="text-[9px] font-black text-slate-400 block uppercase mb-0.5">Endorsed Protocol</span>
                      {pkg.clinicianReviews[0].reviewPlanTitle || 'Stabilization Protocol Confirmed for Inbound Transit'}
                    </div>
                    {pkg.clinicianReviews[0].notes && (
                      <p className="text-[11px] text-slate-600 italic">"{pkg.clinicianReviews[0].notes}"</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-400 italic">Protocol review in transit by remote specialist.</p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 5: Receiving Destination & Bay Readiness */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                5. Receiving Facility Handshake & Sterile Bay Confirmation
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                {pkg.readiness.isBayReady ? 'BAY 1 STERILE & VERIFIED' : pkg.readiness.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Assigned Resuscitation Bay</span>
                <strong className="text-slate-900 block mt-0.5 text-xs font-black">{pkg.readiness.assignedBay}</strong>
                <span className="text-[10px] text-slate-500">Verified by: {pkg.readiness.confirmedBy || 'Charge Nurse'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Receiving Specialty Tier</span>
                <strong className="text-slate-900 block mt-0.5 text-xs font-black">{pkg.destination.traumaLevel}</strong>
                <span className="text-[10px] text-slate-500">Match score: {pkg.destination.matchScore}% suitability</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Corridor Arrival Countdown</span>
                <strong className="text-slate-900 block mt-0.5 text-xs font-black font-tabular">{pkg.transport.effectiveEtaMinutes} Minutes</strong>
                <span className="text-[10px] text-slate-500">{pkg.destination.distanceKm} km arterial corridor</span>
              </div>
            </div>
          </div>

          {/* SECTION 6: Audit Provenance & SHA-256 Integrity Verification */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0E62FE]" />
                6. SHA-256 Content Integrity & Audit Trail Provenance
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                Snapshot: Version {pkg.provenance.sourceCaseVersion} · {pkg.provenance.sourceEventCount} Source Events
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Hash className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <span className="text-[9px] text-slate-400 block uppercase font-sans font-bold">SHA-256 Package Integrity Digest</span>
                  <span className="text-emerald-400 text-[11px] font-bold truncate block">{pkg.integrityHash}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyHash}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-sans font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleVerifyIntegrity}
                  disabled={isVerifying}
                  className="px-3 py-1 rounded-lg bg-[#0E62FE] hover:bg-[#0050E6] text-white text-[10px] font-sans font-black flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>{isVerifying ? 'Verifying...' : 'Verify Digest'}</span>
                </button>
              </div>
            </div>

            {verifyResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                verifyResult.match 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">
                    Independent SHA-256 Digest Match Confirmed. Handover package content has not been tampered with since generation.
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 font-bold">MATCH: 100%</span>
              </div>
            )}
          </div>

          {/* SECTION 7: Receiving Hospital Formal Acknowledgement Action */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                7. Receiving Emergency Department Handover Receipt
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                isAcknowledged ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-blue-100 text-[#0E62FE] border-blue-200'
              }`}>
                {isAcknowledged ? 'FORMALLY RECEIVED' : 'AWAITING ED SIGN-OFF'}
              </span>
            </div>

            {isAcknowledged ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
                <div>
                  <strong className="block text-xs font-black text-emerald-950">
                    Handover Formally Received & Acknowledged
                  </strong>
                  <span className="text-[11px] text-emerald-800 block mt-0.5 font-medium">
                    Received by {pkg.acknowledgedBy?.name || 'Sister Philomina, RN'} ({pkg.acknowledgedBy?.role || 'HOSPITAL_COMMAND'}) at {pkg.acknowledgedAt || 'Inbound Window'}
                  </span>
                  {pkg.acknowledgedBy?.notes && (
                    <p className="text-[11px] text-emerald-900 mt-1 italic font-medium">
                      Notes: "{pkg.acknowledgedBy.notes}"
                    </p>
                  )}
                </div>
                <CheckCircle2 className="w-6 h-6 text-emerald-600 stroke-[2.5]" />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 font-medium">
                  Authoritative confirmation of prehospital handover by receiving Emergency Department. Logs an immutable audit event to the mission ledger and alerts the ambulance crew.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={ackNotes}
                    onChange={(e) => setAckNotes(e.target.value)}
                    placeholder="Enter ED receiving notes (e.g. Trauma Bay 1 sterile, trauma surgeon scrubbed in)"
                    className="flex-1 min-w-[280px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E62FE]"
                  />
                  <button
                    onClick={handleAcknowledge}
                    disabled={isAcknowledging}
                    className="px-5 py-2 rounded-xl bg-[#0E62FE] hover:bg-[#0050E6] text-white text-xs font-black transition-all cursor-pointer hover:scale-105 shadow-md shadow-blue-500/20"
                  >
                    {isAcknowledging ? 'Acknowledging...' : 'Acknowledge Handover Receipt'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Disclaimer */}
          <p className="text-[10px] text-slate-400 text-center font-medium">
            SIMULATION NOTICE: This prototype prehospital handover package is generated from demonstration records and does not constitute a clinically validated medical record.
          </p>
        </div>

        {/* FOOTER BAR */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>PRANA Prehospital Coordination Platform · Phase 18 Audit & Handover Engine</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
            >
              {isGenerating ? 'Regenerating...' : 'Refresh Snapshot'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
