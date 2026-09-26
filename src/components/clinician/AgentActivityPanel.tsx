import React, { useState } from 'react';
import type { AgentTask } from '../../types/emergency';
import { 
  Sparkles, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck,
  Cpu,
  Send,
  Ban,
  CheckCircle2,
  ArrowRight,
  Info
} from 'lucide-react';

interface AgentActivityPanelProps {
  agentTask?: AgentTask;
  pendingRequest?: import('../../types/emergency').ClinicalDataRequest;
  onRequestData?: (requestType: string, reason?: string) => void;
}

export const AgentActivityPanel: React.FC<AgentActivityPanelProps> = ({ 
  agentTask,
  pendingRequest,
  onRequestData 
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isHowItWorksExpanded, setIsHowItWorksExpanded] = useState<boolean>(false);
  const [isAuthorityExpanded, setIsAuthorityExpanded] = useState<boolean>(true);

  if (!agentTask) {
    return (
      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-500 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
          <span className="font-semibold text-slate-700">PRANA Intelligence Agent</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Observing Telemetry Stream</span>
      </div>
    );
  }

  const isHybrid = agentTask.provider.toLowerCase().includes('hybrid');
  const isLocalModel = agentTask.provider.toLowerCase().includes('local') && !agentTask.provider.toLowerCase().includes('fallback');
  const isRealCloud = agentTask.provider.toLowerCase().includes('real') && !agentTask.provider.toLowerCase().includes('fallback');
  const isFallback = agentTask.provider.toLowerCase().includes('fallback');

  const providerLabel = isHybrid
    ? `HYBRID OPEN AI (LAYA SYS-1 + QWEN3 SYS-2) · ACTIVE`
    : isLocalModel
    ? `LOCAL OPEN MODEL (${agentTask.model || 'Qwen 2.5 3B'}) · READY`
    : isFallback
    ? 'LOCAL MODEL UNAVAILABLE · DEMO DECISION SUPPORT ACTIVE'
    : isRealCloud
    ? `CLOUD MODEL (${agentTask.model || 'gpt-4o-mini'}) · SUPERVISED`
    : 'DEMO ENGINE · ACTIVE';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* 1. Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-tight text-white">
                PRANA INTELLIGENCE AGENT
              </span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${
                isHybrid
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : isLocalModel 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : isFallback
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : isRealCloud
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}>
                {providerLabel}
              </span>
            </div>
            <p className="text-[10px] text-slate-300 font-medium">
              Autonomous observation, tool-calling & evidence provenance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[9px] font-mono font-black uppercase text-cyan-300 block">
              STATUS
            </span>
            <span className="text-[10.5px] font-mono font-bold text-white">
              {agentTask.status === 'REQUIRES_HUMAN_REVIEW' ? 'HUMAN REVIEW REQUIRED' : agentTask.status}
            </span>
          </div>
          <button 
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title={isExpanded ? 'Collapse Agent Panel' : 'Expand Agent Panel'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Expanded Body */}
      {isExpanded && (
        <div className="p-4 flex flex-col gap-4 text-xs">
          
          {/* Fallback Notice Banner */}
          {isFallback && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold">Local Model Offline: Automatic deterministic fallback preserves demo continuity.</span>
              </div>
              <span className="text-[10px] font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded">RESILIENT DEMO MODE</span>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[10px] font-mono">
            <div>
              <span className="text-slate-400 block font-bold">TASK ID</span>
              <span className="text-slate-800 font-black">{agentTask.taskId}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold">TOOLS CALLED</span>
              <span className="text-[#0E62FE] font-black">{agentTask.toolCallCount} Read-Only</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold">DATA GAPS</span>
              <span className="text-amber-600 font-black">{agentTask.missingData?.length || 0} Detected</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold">SAFETY STATUS</span>
              <span className="text-emerald-600 font-black flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                {agentTask.safetyStatus}
              </span>
            </div>
          </div>

          {/* System 1: Laya Fast Decision Gate Card */}
          {agentTask.layaGate && (
            <div className="p-3 bg-purple-50/60 border border-purple-200/80 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-purple-900 font-black text-[10px] font-mono uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                  <span>SYSTEM 1: LAYA FAST DECISION GATE (~421M PARAMETERS)</span>
                </div>
                <span className="text-[9px] font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                  SINGLE FORWARD-PASS
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px] font-mono mb-2">
                <div className="bg-white p-2 rounded-lg border border-purple-200/70">
                  <div className="text-[8.5px] text-slate-400 font-bold uppercase">RELEVANCE</div>
                  <div className={`font-black uppercase ${
                    agentTask.layaGate.relevance === 'deep_analysis'
                      ? 'text-purple-700'
                      : agentTask.layaGate.relevance === 'routine_analysis'
                      ? 'text-blue-700'
                      : 'text-slate-500'
                  }`}>
                    {agentTask.layaGate.relevance.replace('_', ' ')}
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-purple-200/70">
                  <div className="text-[8.5px] text-slate-400 font-bold uppercase">TARGET BUNDLE</div>
                  <div className="font-black text-slate-800 uppercase">{agentTask.layaGate.toolBundle}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-purple-200/70">
                  <div className="text-[8.5px] text-slate-400 font-bold uppercase">REVIEW PRIORITY</div>
                  <div className="font-black text-rose-600 uppercase">{agentTask.layaGate.reviewPriority}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-purple-200/70">
                  <div className="text-[8.5px] text-slate-400 font-bold uppercase">CONFIDENCE</div>
                  <div className="font-black text-emerald-600">{Math.round(agentTask.layaGate.confidence * 100)}%</div>
                </div>
              </div>
              <p className="text-[11px] text-purple-950 font-medium leading-tight">
                {agentTask.layaGate.reason}
              </p>
            </div>
          )}

          {/* Autonomous Evidence Gathering Progression */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="text-[9.5px] font-mono font-black uppercase text-slate-500 block mb-2 tracking-wider">
              HYBRID PIPELINE PROGRESSION: SYSTEM 1 → SYSTEM 2 → HUMAN CLINICIAN
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[10.5px] font-mono">
              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-purple-100 text-purple-800 font-black text-[9px] flex items-center justify-center shrink-0">01</span>
                <div>
                  <div className="text-[8.5px] text-slate-400 font-bold">LAYA GATE</div>
                  <div className="text-slate-800 font-bold">{agentTask.layaGate ? agentTask.layaGate.relevance : 'Evaluated'}</div>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-cyan-100 text-cyan-800 font-black text-[9px] flex items-center justify-center shrink-0">02</span>
                <div>
                  <div className="text-[8.5px] text-slate-400 font-bold">QWEN3 TOOLS</div>
                  <div className="text-slate-800 font-bold">{agentTask.toolCallCount} Tool Calls</div>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-cyan-100 text-cyan-800 font-black text-[9px] flex items-center justify-center shrink-0">03</span>
                <div>
                  <div className="text-[8.5px] text-slate-400 font-bold">EVIDENCE</div>
                  <div className="text-slate-800 font-bold">Assembled</div>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200 flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-amber-200 text-amber-900 font-black text-[9px] flex items-center justify-center shrink-0">04</span>
                <div>
                  <div className="text-[8.5px] text-amber-700 font-bold">CLINICAL GATE</div>
                  <div className="text-amber-900 font-bold">Human Review</div>
                </div>
              </div>
            </div>
          </div>

          {/* Reasoning Summary */}
          {agentTask.reasoningSummary && (
            <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl">
              <span className="text-[9.5px] font-mono font-black uppercase text-[#0E62FE] block mb-1">
                OBSERVABLE REASONING SUMMARY (NO CHAIN-OF-THOUGHT)
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {agentTask.reasoningSummary}
              </p>
            </div>
          )}

          {/* Read-Only Tool Execution Trace */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span>AUTHORIZED TOOL EXECUTION TRACE</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                STRICTLY READ-ONLY (ZERO DIRECT MUTATIONS)
              </span>
            </div>

            <div className="space-y-2">
              {agentTask.traces.map((trace) => (
                <div 
                  key={trace.id} 
                  className="p-2.5 bg-white border border-slate-200/90 rounded-xl flex items-start justify-between gap-3 text-[11px]"
                >
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-mono font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      {trace.stepIndex}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#0E62FE]">{trace.toolName}()</span>
                        {trace.sourceEventIds && trace.sourceEventIds.length > 0 && (
                          <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-sm">
                            {trace.sourceEventIds.join(', ')}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 mt-0.5 font-medium">{trace.resultSummary}</p>
                    </div>
                  </div>
                  <span className="text-[9.5px] font-mono text-slate-400 shrink-0">
                    {trace.durationMs}ms
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Data Detection Card */}
          {agentTask.missingData && agentTask.missingData.length > 0 && (
            <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>DETECTED CLINICAL DATA GAPS ({agentTask.missingData.length})</span>
                </div>
                <span className="text-[9.5px] font-mono text-amber-700">
                  EXPLICIT UNCERTAINTY — NO HALLUCINATIONS
                </span>
              </div>

              <div className="space-y-2 mb-3">
                {agentTask.missingData.map((gap, i) => (
                  <div key={i} className="bg-white p-2.5 rounded-lg border border-amber-200/80 text-xs flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{gap.field}</span>
                        <span className={`text-[8.5px] font-mono font-extrabold px-1.5 py-0.2 rounded-sm ${
                          gap.clinicalImportance === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {gap.clinicalImportance}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{gap.reason}</p>
                    </div>

                    {onRequestData && (
                      pendingRequest && pendingRequest.field.toLowerCase().includes(gap.field.toLowerCase()) ? (
                        pendingRequest.status === 'PENDING' ? (
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[10px] font-bold shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>Awaiting Field Response</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md text-[10px] font-bold shrink-0">
                            <span>Response Received</span>
                          </div>
                        )
                      ) : (
                        <button
                          onClick={() => onRequestData(gap.field, gap.reason)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[10px] font-bold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Prepare structured clinical data request for field paramedic"
                        >
                          <Send className="w-3 h-3" />
                          <span>Request Field Data</span>
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>

              {agentTask.recommendedDataRequest && (
                <p className="text-[11px] text-amber-900 font-medium italic">
                  Suggested Specialist Action: &ldquo;{agentTask.recommendedDataRequest}&rdquo;
                </p>
              )}
            </div>
          )}


          {/* ─── AI AUTHORITY CARD ─── */}
          <div className="rounded-xl border border-slate-200/80 overflow-hidden">
            <button
              onClick={() => setIsAuthorityExpanded(!isAuthorityExpanded)}
              className="w-full px-3 py-2.5 bg-slate-50 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>AI AUTHORITY BOUNDARIES</span>
              </div>
              {isAuthorityExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {isAuthorityExpanded && (
              <div className="px-3 pb-3 pt-2 bg-white grid grid-cols-2 gap-2 text-[10.5px]">
                {/* CAN column */}
                <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-black text-[9.5px] uppercase tracking-wider mb-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>AI CAN</span>
                  </div>
                  <ul className="space-y-1 text-emerald-900 font-medium">
                    {[
                      'Structure raw clinical inputs',
                      'Identify missing data gaps',
                      'Surface decision-support signals',
                      'Call read-only data tools',
                      'Reassess on new field data',
                      'Flag ambiguities / approximations',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* CANNOT column */}
                <div className="p-2.5 bg-rose-50/60 border border-rose-200/80 rounded-xl">
                  <div className="flex items-center gap-1.5 text-rose-800 font-black text-[9.5px] uppercase tracking-wider mb-2">
                    <Ban className="w-3 h-3 text-rose-600" />
                    <span>AI CANNOT</span>
                  </div>
                  <ul className="space-y-1 text-rose-900 font-medium">
                    {[
                      'Diagnose or triage patients',
                      'Prescribe or administer drugs',
                      'Confirm hospital bay ready',
                      'Mark patient arrived',
                      'Initiate or complete handover',
                      'Override human clinical action',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Ban className="w-2.5 h-2.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* ─── HOW PRANA AI WORKS ─── */}
          <div className="rounded-xl border border-slate-200/80 overflow-hidden">
            <button
              onClick={() => setIsHowItWorksExpanded(!isHowItWorksExpanded)}
              className="w-full px-3 py-2.5 bg-slate-50 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-[#0E62FE]" />
                <span>HOW PRANA AI WORKS</span>
              </div>
              {isHowItWorksExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {isHowItWorksExpanded && (
              <div className="px-3 pb-3 pt-2 bg-white">
                <p className="text-[10px] text-slate-500 font-medium mb-2.5">
                  End-to-end AI pipeline — from raw field input to human-reviewed clinical signal.
                </p>
                {/* Pipeline steps */}
                <div className="flex flex-col gap-1.5 text-[10px] font-mono">
                  {[
                    { step: '01', label: 'INPUT', desc: 'Voice / Text / File from field medic', color: 'bg-slate-100 text-slate-700 border-slate-200' },
                    { step: '02', label: 'TRANSCRIPTION', desc: 'Browser Speech API or Faster-Whisper STT', color: 'bg-slate-100 text-slate-700 border-slate-200' },
                    { step: '03', label: 'EXTRACTION', desc: isFallback ? 'Deterministic Rule Extractor (Qwen3 offline)' : 'Qwen3 LLM structured entity extraction', color: isFallback ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200' },
                    { step: '04', label: 'PYDANTIC V2 VALIDATION', desc: 'Schema gate — rejects hallucinations, enforces types', color: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
                    { step: '05', label: 'HUMAN CONFIRMATION', desc: 'Field medic reviews and confirms CaseDraft', color: 'bg-blue-50 text-blue-900 border-blue-200' },
                    { step: '06', label: 'LAYA SYSTEM 1', desc: 'Fast relevance / routing gate (~421M params, single forward pass)', color: 'bg-purple-50 text-purple-900 border-purple-200' },
                    { step: '07', label: isFallback ? 'FALLBACK EVALUATOR' : 'QWEN3 SYSTEM 2', desc: isFallback ? 'Deterministic CDS signals — same safety, no LLM' : 'Bounded tool-calling evaluation + gap detection', color: isFallback ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-cyan-50 text-cyan-900 border-cyan-200' },
                    { step: '08', label: 'SAFETY VALIDATION', desc: 'ClinicalSafetyValidator — overconfidence & autonomy gate', color: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
                    { step: '09', label: 'HUMAN ACTION', desc: 'Clinician reviews signal — CONFIRM / REQUEST DATA / ESCALATE', color: 'bg-amber-50 text-amber-900 border-amber-200' },
                  ].map(({ step, label, desc, color }, idx, arr) => (
                    <div key={step}>
                      <div className={`flex items-start gap-2 p-2 rounded-lg border ${color}`}>
                        <span className={`w-5 h-5 rounded font-black text-[9px] flex items-center justify-center shrink-0 ${color}`}>{step}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-[9.5px] uppercase tracking-wide">{label}</div>
                          <div className="font-medium text-[9px] leading-snug opacity-80">{desc}</div>
                        </div>
                      </div>
                      {idx < arr.length - 1 && (
                        <div className="flex justify-start pl-3">
                          <ArrowRight className="w-3 h-3 text-slate-300 rotate-90" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 p-2 bg-slate-50 border border-slate-200 rounded-xl text-[9.5px] text-slate-600 font-medium">
                  <span className="font-black text-slate-800">Agentic Data-Gap Loop: </span>
                  AI detects gap → Clinician clicks REQUEST DATA → Field Medic receives alert → Field response submitted → AI reassessment triggered → New signal generated
                </div>
              </div>
            )}
          </div>

          {/* Mandatory Clinical Safety Notice */}
          <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1 font-bold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS
            </span>
            <span>HUMAN CLINICIAN CONFIRMATION MANDATORY</span>
          </div>

        </div>
      )}
    </div>
  );
};
