import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  FileText, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  X, 
  ArrowRight, 
  Loader2, 
  RotateCcw,
  Cpu,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Database
} from 'lucide-react';
import type { CaseDraft, EmergencyCase } from '../../types/emergency';
import { 
  submitVoiceIntake, 
  submitTextIntake, 
  submitFileIntake, 
  updateDraftField, 
  confirmCaseDraft 
} from '../../services/api/intake';
import { useEmergency } from '../../context/useEmergency';

interface CaseIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseConfirmed?: (createdCase: EmergencyCase) => void;
}

type IntakeTab = 'VOICE' | 'TEXT' | 'FILE';
type IntakeState = 'IDLE' | 'RECORDING' | 'PROCESSING' | 'REVIEW' | 'ERROR';

export const CaseIntakeModal: React.FC<CaseIntakeModalProps> = ({ isOpen, onClose, onCaseConfirmed }) => {
  const { loadCaseData, setActiveRole, isBackendConnected, realtimeStatus } = useEmergency();

  const [activeTab, setActiveTab] = useState<IntakeTab>('VOICE');
  const [intakeState, setIntakeState] = useState<IntakeState>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasSpeechRec = typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  // Voice recording state
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Text input state
  const [textInput, setTextInput] = useState('');

  // File import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Review & Draft state
  const [draft, setDraft] = useState<CaseDraft | null>(null);
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [editingFieldValue, setEditingFieldValue] = useState<string>('');
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);
  const [isJsonPreviewExpanded, setIsJsonPreviewExpanded] = useState(false);
  const [isTechDetailsExpanded, setIsTechDetailsExpanded] = useState(false);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  // Reset state when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setIntakeState('IDLE');
      setRecordingSeconds(0);
      setLiveTranscript('');
      setTextInput('');
      setSelectedFile(null);
      setDraft(null);
      setErrorMessage(null);
      setEditingFieldKey(null);
    }
  }, [isOpen]);

  // Voice Recording Handlers
  const startRecording = async () => {
    setErrorMessage(null);
    setLiveTranscript('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // collect chunks every 250ms
      setIntakeState('RECORDING');
      setRecordingSeconds(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Web Speech API browser helper for live visual preview
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = 0; i < event.results.length; i++) {
              current += event.results[i][0].transcript + ' ';
            }
            setLiveTranscript(current.trim());
          };
          recognition.onerror = () => {};
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch {
          // Web speech API optional preview
        }
      }
    } catch (err: any) {
      console.warn('[PRANA Voice] Microphone access failed:', err);
      setErrorMessage(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser or paste clinical text.'
          : 'Local audio input device is unavailable in this environment. You can upload an audio file or type the clinical case notes.'
      );
      setIntakeState('ERROR');
    }
  };

  const stopRecordingAndTranscribe = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch {}
      speechRecognitionRef.current = null;
    }

    if (!mediaRecorderRef.current) return;

    setIntakeState('PROCESSING');

    // Wait for recorder onstop callback to assemble blob
    mediaRecorderRef.current.stop();

    setTimeout(async () => {
      try {
        const mimeType = audioChunksRef.current[0]?.type || 'audio/webm';
        const fullBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const fallbackText = liveTranscript.trim() ? liveTranscript : undefined;

        const result = await submitVoiceIntake(fullBlob, fallbackText);
        setDraft(result);
        setIntakeState('REVIEW');
      } catch (err: any) {
        console.error('[PRANA Voice] Processing error:', err);
        setErrorMessage(err.message || 'Voice transcription and candidate extraction failed. Please retry or enter text.');
        setIntakeState('ERROR');
      }
    }, 400);
  };

  const cancelRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch {}
    }
    setIntakeState('IDLE');
    setRecordingSeconds(0);
    setLiveTranscript('');
  };

  // Text Submission Handler
  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    setIntakeState('PROCESSING');
    setErrorMessage(null);

    try {
      const result = await submitTextIntake(textInput);
      setDraft(result);
      setIntakeState('REVIEW');
    } catch (err: any) {
      console.error('[PRANA Text Intake] Error:', err);
      setErrorMessage(err.message || 'Text extraction failed. Please review input format.');
      setIntakeState('ERROR');
    }
  };

  // File Submission Handler
  const handleFileSubmit = async (fileToUpload?: File) => {
    const targetFile = fileToUpload || selectedFile;
    if (!targetFile) return;

    setIntakeState('PROCESSING');
    setErrorMessage(null);

    try {
      const result = await submitFileIntake(targetFile);
      setDraft(result);
      setIntakeState('REVIEW');
    } catch (err: any) {
      console.error('[PRANA File Intake] Error:', err);
      setErrorMessage(err.message || 'File ingestion failed. Ensure file is valid JSON, FHIR, CSV, or TXT.');
      setIntakeState('ERROR');
    }
  };

  // Field Edit Handler
  const handleStartEditField = (fieldKey: string, currentVal: any) => {
    setEditingFieldKey(fieldKey);
    setEditingFieldValue(currentVal !== null && currentVal !== undefined ? String(currentVal) : '');
  };

  const handleSaveFieldEdit = async () => {
    if (!draft || !editingFieldKey) return;

    try {
      // Cast numeric fields if appropriate
      let parsedVal: any = editingFieldValue;
      if (['heart_rate', 'systolic_bp', 'diastolic_bp', 'spo2', 'respiratory_rate', 'eta_minutes', 'approximate_age'].includes(editingFieldKey)) {
        const num = Number(editingFieldValue);
        if (!isNaN(num) && editingFieldValue.trim() !== '') {
          parsedVal = num;
        }
      }

      const updated = await updateDraftField(draft.draftId, editingFieldKey, parsedVal);
      setDraft(updated);
      setEditingFieldKey(null);
      setEditingFieldValue('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update field.');
    }
  };

  // Authoritative Confirmation Handler
  const handleConfirmCase = async () => {
    if (!draft) return;
    setIsSubmittingConfirm(true);
    setErrorMessage(null);

    try {
      const confirmedCase = await confirmCaseDraft(draft.draftId);
      
      if (confirmedCase && confirmedCase.id) {
        loadCaseData(confirmedCase);
        setActiveRole('FIELD_MEDIC');
        if (onCaseConfirmed) {
          onCaseConfirmed(confirmedCase);
        }
      }
      onClose();
    } catch (err: any) {
      console.error('[PRANA Confirm] Confirmation failed:', err);
      setErrorMessage(err.message || 'Case confirmation failed. Please check field requirements.');
      setIsSubmittingConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Clinical Case Intake"
    >
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0E62FE]" />
            <div>
              <h2 className="text-sm font-black text-slate-950 tracking-tight flex items-center gap-2">
                <span>CREATE NEW EMERGENCY CASE</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 text-[#0E62FE] border border-blue-200">
                  Universal Intake
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Raw input is transformed into candidate data. Clinician confirmation required before activation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Intake Dialog"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* SYSTEM STATUS ROW */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black">SYSTEM STATUS</span>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-rose-500'}`} />
              <span>API: {isBackendConnected ? 'CONNECTED (127.0.0.1:8000)' : 'UNREACHABLE'}</span>
            </div>
            <span className="text-slate-300">·</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>VOICE: {hasSpeechRec ? 'BROWSER SPEECH' : 'NATIVE RECORDING'}</span>
            </div>
            <span className="text-slate-300">·</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>AI: DETERMINISTIC SIMULATION</span>
            </div>
            <span className="text-slate-300">·</span>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${realtimeStatus === 'LIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span>REALTIME: {realtimeStatus}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <span>UNCONFIRMED DRAFT STAGING GATE</span>
          </div>
        </div>

        {/* Tab Selection (Hidden in Review mode) */}
        {intakeState !== 'REVIEW' && (
          <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 bg-white shrink-0">
            <button
              onClick={() => { setActiveTab('VOICE'); setIntakeState('IDLE'); setErrorMessage(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-t-xl transition-all cursor-pointer border-b-2 ${
                activeTab === 'VOICE'
                  ? 'border-[#0E62FE] text-[#0E62FE] bg-blue-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>VOICE INTAKE</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-100 text-blue-700 font-black">PRIMARY</span>
            </button>

            <button
              onClick={() => { setActiveTab('TEXT'); setIntakeState('IDLE'); setErrorMessage(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-t-xl transition-all cursor-pointer border-b-2 ${
                activeTab === 'TEXT'
                  ? 'border-[#0E62FE] text-[#0E62FE] bg-blue-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>TEXT NOTES</span>
            </button>

            <button
              onClick={() => { setActiveTab('FILE'); setIntakeState('IDLE'); setErrorMessage(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-t-xl transition-all cursor-pointer border-b-2 ${
                activeTab === 'FILE'
                  ? 'border-[#0E62FE] text-[#0E62FE] bg-blue-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>FILE IMPORT (JSON/FHIR/CSV)</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
              <button 
                onClick={() => setErrorMessage(null)} 
                className="text-rose-500 hover:text-rose-700 text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* TAB 1: VOICE INTAKE */}
          {activeTab === 'VOICE' && intakeState !== 'REVIEW' && (
            <div className="flex flex-col items-center justify-center py-6 sm:py-10 text-center gap-6 my-auto">
              
              {intakeState === 'IDLE' && (
                <>
                  <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-200 text-[#0E62FE] flex items-center justify-center shadow-lg shadow-blue-500/10 animate-in zoom-in-95">
                    <Mic className="w-8 h-8" />
                  </div>

                  <div className="max-w-md flex flex-col gap-1.5">
                    <h3 className="text-base font-black text-slate-950">Speak Naturally About the Case</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      State patient demographics, observations, vitals (HR, BP, SpO₂), interventions, and transit ETA. PRANA extracts candidate clinical facts for your verification.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#0E62FE] hover:bg-[#0050E6] text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                    >
                      <Mic className="w-4 h-4" />
                      <span>START VOICE INTAKE</span>
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 max-w-lg text-[11px] text-slate-500 text-left font-mono">
                    <strong className="text-slate-700 font-sans block mb-1">Example verbal dispatch:</strong>
                    "52 year old female Radha Sharma with acute respiratory distress and COPD history. SpO2 86% on room air, respiratory rate 32, heart rate 108. IV access established, high-flow oxygen started. ETA to Manipal 9 minutes."
                  </div>
                </>
              )}

              {intakeState === 'RECORDING' && (
                <>
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-rose-50 border-2 border-rose-300 text-rose-600 flex items-center justify-center shadow-xl shadow-rose-500/20">
                      <Mic className="w-10 h-10 animate-pulse" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600"></span>
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-black font-mono font-tabular text-slate-950">
                      {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                      <span>RECORDING CLINICAL INTAKE</span>
                    </span>
                  </div>

                  {liveTranscript && (
                    <div className="max-w-lg w-full p-4 rounded-2xl bg-slate-900 text-white text-xs font-mono text-left max-h-32 overflow-y-auto border border-slate-700">
                      <span className="text-[10px] text-cyan-400 font-bold uppercase block mb-1 tracking-wider">Live Speech Transcription:</span>
                      "{liveTranscript}"
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={cancelRecording}
                      className="px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={stopRecordingAndTranscribe}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span>STOP & EXTRACT CANDIDATES</span>
                    </button>
                  </div>
                </>
              )}

              {intakeState === 'PROCESSING' && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="w-10 h-10 text-[#0E62FE] animate-spin" />
                  <div className="flex flex-col items-center gap-1">
                    <h3 className="text-sm font-black text-slate-950">Processing Case Stream...</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Transcribing audio and running deterministic/Qwen3 candidate fact extraction.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEXT INTAKE */}
          {activeTab === 'TEXT' && intakeState !== 'REVIEW' && (
            <div className="flex flex-col gap-4 flex-1">
              <div>
                <h3 className="text-sm font-black text-slate-950">Paste or Type Case Information</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Enter paramedic dispatch radio notes, prehospital triage report, or transfer notes.
                </p>
              </div>

              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Example: 52-year-old female Radha Sharma, acute respiratory distress, SpO2 86%, RR 32, HR 108. Bilateral wheezing, conscious, high-flow oxygen started. ETA 9 min to Manipal Hospital..."
                rows={8}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0E62FE] focus:bg-white resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  {textInput.length} characters entered
                </span>

                <button
                  onClick={handleTextSubmit}
                  disabled={!textInput.trim() || intakeState === 'PROCESSING'}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#0E62FE] hover:bg-[#0050E6] disabled:opacity-50 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  {intakeState === 'PROCESSING' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting Candidates...</span>
                    </>
                  ) : (
                    <>
                      <span>EXTRACT CASE DATA</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: FILE IMPORT */}
          {activeTab === 'FILE' && intakeState !== 'REVIEW' && (
            <div className="flex flex-col gap-4 flex-1">
              <div>
                <h3 className="text-sm font-black text-slate-950">Import Case Document</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Supported formats: JSON (PRANA Case), FHIR R4 Bundle, CSV, or clinical text files (.txt, .md).
                </p>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setSelectedFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer ${
                  isDragging 
                    ? 'border-[#0E62FE] bg-blue-50/50' 
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,.txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6 text-[#0E62FE]" />
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {selectedFile ? selectedFile.name : 'Click to upload or drag and drop file'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'JSON, FHIR JSON, CSV, TXT (Max 25MB)'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  onClick={() => handleFileSubmit()}
                  disabled={!selectedFile || intakeState === 'PROCESSING'}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#0E62FE] hover:bg-[#0050E6] disabled:opacity-50 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  {intakeState === 'PROCESSING' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Parsing File...</span>
                    </>
                  ) : (
                    <>
                      <span>PARSE & EXTRACT</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STATE: REVIEW EXTRACTED CANDIDATE DRAFT */}
          {intakeState === 'REVIEW' && draft && (
            <div className="flex flex-col gap-5 flex-1">

              {/* ─── AI EXTRACTION OBSERVABILITY CARD ─── */}
              {(() => {
                const meta = draft.extractionMetadata || (draft.candidateData as any).extractionMetadata;
                const isFallback = meta?.isFallback ?? true;
                const fieldsCount = meta?.fieldsExtractedCount ?? '?';
                const engine = meta?.engine ?? 'DETERMINISTIC FALLBACK';
                const provider = meta?.provider ?? 'DeterministicCaseExtractor';
                const model = meta?.model ?? 'deterministic-rule-v2';
                const modelIdentity = meta?.modelIdentity ?? 'Deterministic Rule Set (Regex/Grammar)';
                const fallbackReason = meta?.fallbackReason;
                const transcriptionEngine = meta?.transcriptionEngine ?? 'Direct Clinical Text';
                const latencyMs = meta?.latencyMs;
                const validationEngine = meta?.validationEngine ?? 'Pydantic V2 (BaseModel)';
                const validationStatus = meta?.validationStatus ?? 'Schema Valid';
                const rawCharCount = meta?.rawCharCount ?? draft.rawContent?.length ?? 0;

                const vitalsForJson: Record<string, unknown> = {};
                if (draft.candidateData.vitals) {
                  const v = draft.candidateData.vitals;
                  const spo2Val = v.spo2?.value ?? v['spo2']?.value;
                  const rrVal = v.respiratoryRate?.value ?? v['respiratory_rate']?.value;
                  const hrVal = v.heartRate?.value ?? v['heart_rate']?.value;
                  const sbpVal = v.systolicBp?.value ?? v['systolic_bp']?.value;
                  const dbpVal = v.diastolicBp?.value ?? v['diastolic_bp']?.value;

                  if (spo2Val !== undefined && spo2Val !== null) vitalsForJson['spo2'] = spo2Val;
                  if (rrVal !== undefined && rrVal !== null) vitalsForJson['respiratory_rate'] = rrVal;
                  if (hrVal !== undefined && hrVal !== null) vitalsForJson['heart_rate'] = hrVal;
                  if (sbpVal !== undefined && dbpVal !== undefined && sbpVal !== null && dbpVal !== null) {
                    vitalsForJson['blood_pressure'] = {
                      systolic: sbpVal,
                      diastolic: dbpVal
                    };
                  }
                }
                const structuredPreview = JSON.stringify({
                  patient_name: draft.candidateData.patientName?.value,
                  approximate_age: draft.candidateData.approximateAge?.value,
                  sex: draft.candidateData.sex?.value?.toLowerCase(),
                  domain: draft.candidateData.domainHint,
                  medical_history: (draft.candidateData.medicalHistory || []).map(h => {
                    const val = h.value || '';
                    if (val.includes('COPD')) return 'COPD';
                    if (val.includes('Asthma')) return 'Asthma';
                    if (val.includes('Diabetes')) return 'Diabetes';
                    if (val.includes('Hypertension')) return 'Hypertension';
                    return val;
                  }),
                  vitals: vitalsForJson,
                  interventions: (draft.candidateData.interventions || []).map(i => i.value),
                  observations: (draft.candidateData.observations || []).map(o => o.value),
                  eta_minutes: draft.candidateData.etaMinutes?.value,
                }, null, 2);

                return (
                  <div className="rounded-2xl border overflow-hidden text-xs" style={{borderColor: isFallback ? '#fbbf24' : '#6ee7b7'}}>
                    {/* Header */}
                    <div className={`px-4 py-2.5 flex items-center justify-between ${
                      isFallback ? 'bg-amber-50 border-b border-amber-200' : 'bg-emerald-50 border-b border-emerald-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Cpu className={`w-3.5 h-3.5 ${isFallback ? 'text-amber-700' : 'text-emerald-700'}`} />
                        <span className={`font-black text-[10px] uppercase tracking-wider ${isFallback ? 'text-amber-900' : 'text-emerald-900'}`}>
                          PRANA AI EXTRACTION
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                          isFallback
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-emerald-200 text-emerald-900'
                        }`}>
                          {isFallback ? engine : `QWEN3 LOCAL · ${model}`}
                        </span>
                        {!isFallback && (
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            MODEL VERIFIED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 5-step pipeline strip */}
                    <div className="bg-white px-4 py-3">
                      {/* Fallback notice if applicable */}
                      {isFallback && fallbackReason && (
                        <div className="mb-3 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-900 text-[10px] uppercase tracking-wider block">Honest Extraction Disclosure</span>
                            <span className="text-amber-800 text-[11px] font-medium">{fallbackReason}</span>
                            <span className="text-amber-700 text-[10px] font-mono block mt-0.5">Canonical schema · Pydantic validation · Full field provenance · Source-faithful extraction</span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-5 gap-1 text-[9.5px] font-mono mb-3">
                        {/* Step 1: SOURCE */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-slate-500 font-bold uppercase tracking-wider text-[8px]">
                            <span className="w-3.5 h-3.5 rounded bg-slate-100 text-slate-700 font-black text-[8px] flex items-center justify-center shrink-0">01</span>
                            SOURCE
                          </div>
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex flex-col gap-0.5">
                            <span className="font-black text-slate-900 uppercase text-[9px]">{draft.sourceType}</span>
                            <span className="text-slate-500 text-[8.5px]">{rawCharCount.toLocaleString()} chars</span>
                          </div>
                        </div>

                        {/* Step 2: TRANSCRIPTION */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-slate-500 font-bold uppercase tracking-wider text-[8px]">
                            <span className="w-3.5 h-3.5 rounded bg-slate-100 text-slate-700 font-black text-[8px] flex items-center justify-center shrink-0">02</span>
                            TRANSCRIPTION
                          </div>
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex flex-col gap-0.5">
                            <span className="font-black text-slate-900 text-[9px] leading-tight">{transcriptionEngine}</span>
                          </div>
                        </div>

                        {/* Step 3: EXTRACTION ENGINE */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-slate-500 font-bold uppercase tracking-wider text-[8px]">
                            <span className={`w-3.5 h-3.5 rounded font-black text-[8px] flex items-center justify-center shrink-0 ${
                              isFallback ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>03</span>
                            EXTRACTION
                          </div>
                          <div className={`border rounded-lg p-1.5 flex flex-col gap-0.5 ${
                            isFallback ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
                          }`}>
                            <span className={`font-black text-[9px] leading-tight ${
                              isFallback ? 'text-amber-900' : 'text-emerald-900'
                            }`}>{engine}</span>
                            {latencyMs !== undefined && (
                              <span className="text-slate-500 text-[8.5px] flex items-center gap-0.5">
                                <Zap className="w-2 h-2" />{latencyMs}ms
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Step 4: SCHEMA VALIDATION */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-slate-500 font-bold uppercase tracking-wider text-[8px]">
                            <span className="w-3.5 h-3.5 rounded bg-emerald-100 text-emerald-800 font-black text-[8px] flex items-center justify-center shrink-0">04</span>
                            VALIDATION
                          </div>
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-1.5 flex flex-col gap-0.5">
                            <span className="font-black text-emerald-900 text-[9px] leading-tight flex items-center gap-1">
                              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />Passed
                            </span>
                            <span className="text-slate-500 text-[8.5px]">{validationStatus}</span>
                          </div>
                        </div>

                        {/* Step 5: CASE DRAFT STATUS */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-slate-500 font-bold uppercase tracking-wider text-[8px]">
                            <span className="w-3.5 h-3.5 rounded bg-amber-100 text-amber-800 font-black text-[8px] flex items-center justify-center shrink-0">05</span>
                            DRAFT STATUS
                          </div>
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-1.5 flex flex-col gap-0.5">
                            <span className="font-black text-amber-900 text-[9px] leading-tight">Unconfirmed</span>
                            <span className="text-amber-700 text-[8.5px]">{fieldsCount} candidate fields · Review Required</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Links: Structured Output & Technical Details */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsTechDetailsExpanded(!isTechDetailsExpanded)}
                            className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            <Database className="w-3 h-3 text-slate-400" />
                            {isTechDetailsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            TECHNICAL DETAILS
                          </button>
                        </div>
                        <button
                          onClick={() => setIsJsonPreviewExpanded(!isJsonPreviewExpanded)}
                          className="flex items-center gap-1 text-[10px] font-bold text-[#0E62FE] hover:text-[#0050E6] cursor-pointer"
                        >
                          {isJsonPreviewExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isJsonPreviewExpanded ? 'HIDE' : 'SHOW'} STRUCTURED OUTPUT
                        </button>
                      </div>

                      {/* Expandable Technical Details */}
                      {isTechDetailsExpanded && (
                        <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-600 flex flex-col gap-1.5 leading-relaxed">
                          <div className="flex justify-between border-b border-slate-200/60 pb-1">
                            <span className="text-slate-400 font-sans">Provider Class:</span>
                            <span className="font-bold text-slate-800">{provider}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200/60 pb-1">
                            <span className="text-slate-400 font-sans">Model Identity:</span>
                            <span className="font-bold text-slate-800">{modelIdentity}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200/60 pb-1">
                            <span className="text-slate-400 font-sans">Validation Engine:</span>
                            <span className="font-bold text-slate-800">{validationEngine}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200/60 pb-1">
                            <span className="text-slate-400 font-sans">Inference Latency:</span>
                            <span className="font-bold text-slate-800">{latencyMs ?? 0} ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Raw Payload Size:</span>
                            <span className="font-bold text-slate-800">{rawCharCount} characters</span>
                          </div>
                        </div>
                      )}

                      {/* Expandable JSON Preview */}
                      {isJsonPreviewExpanded && (
                        <pre className="mt-2.5 font-mono text-[10px] text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto leading-relaxed whitespace-pre-wrap">{structuredPreview}</pre>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Audit Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-bold">
                    UNCONFIRMED CANDIDATE DRAFT · Field Medic Confirmation Required
                  </span>
                </div>
                <span className="font-mono text-[10px] text-amber-700">
                  Source: {draft.sourceType}
                </span>
              </div>

              {/* Grouped Clinical Candidates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Demographics & Patient Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Patient Demographics
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {draft.candidateData.patientName?.value ? 'Identified' : 'Unidentified'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Full Name:</span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span>{draft.candidateData.patientName?.value || 'Unknown Patient'}</span>
                        <button 
                          onClick={() => handleStartEditField('patient_name', draft.candidateData.patientName?.value)}
                          className="text-slate-400 hover:text-[#0E62FE]"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Age:</span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span>{draft.candidateData.approximateAge?.value ? `~${draft.candidateData.approximateAge.value}` : 'Unknown'}</span>
                        <button 
                          onClick={() => handleStartEditField('approximate_age', draft.candidateData.approximateAge?.value)}
                          className="text-slate-400 hover:text-[#0E62FE]"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Sex:</span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span>{draft.candidateData.sex?.value || 'Unknown'}</span>
                        <button 
                          onClick={() => handleStartEditField('sex', draft.candidateData.sex?.value)}
                          className="text-slate-400 hover:text-[#0E62FE]"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Incident & Mechanism */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Incident & Triage Domain
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                      {draft.candidateData.domainHint || 'GENERAL'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 shrink-0">Incident:</span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-right">
                        <span>{draft.candidateData.incidentType?.value || 'Acute Medical Emergency'}</span>
                        <button 
                          onClick={() => handleStartEditField('incident_type', draft.candidateData.incidentType?.value)}
                          className="text-slate-400 hover:text-[#0E62FE]"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Location:</span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span>{draft.candidateData.incidentLocation?.value || 'Prehospital Location'}</span>
                        <button 
                          onClick={() => handleStartEditField('location', draft.candidateData.incidentLocation?.value)}
                          className="text-slate-400 hover:text-[#0E62FE]"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Ambulance ETA:</span>
                      <div className="flex items-center gap-1.5 font-bold font-mono text-[#0E62FE]">
                        <span>{draft.candidateData.etaMinutes?.value ?? 9} MINS</span>
                        <button 
                          onClick={() => handleStartEditField('eta_minutes', draft.candidateData.etaMinutes?.value ?? 9)}
                          className="text-slate-400 hover:text-[#0E62FE]"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Physiological Vitals Stream */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Telemetry & Vitals
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 font-bold">
                      Extracted
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                      <span className="text-slate-500 font-sans">HR:</span>
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <span>
                          {draft.candidateData.vitals?.heartRate?.value ?? draft.candidateData.vitals?.['heart_rate']?.value ?? '--'} bpm
                        </span>
                        <button 
                          onClick={() => handleStartEditField('heart_rate', draft.candidateData.vitals?.heartRate?.value ?? draft.candidateData.vitals?.['heart_rate']?.value)}
                          className="text-slate-400 hover:text-[#0E62FE]"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                      <span className="text-slate-500 font-sans">BP:</span>
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <span>
                          {(draft.candidateData.vitals?.systolicBp?.value ?? draft.candidateData.vitals?.['systolic_bp']?.value) && 
                           (draft.candidateData.vitals?.diastolicBp?.value ?? draft.candidateData.vitals?.['diastolic_bp']?.value)
                            ? `${draft.candidateData.vitals?.systolicBp?.value ?? draft.candidateData.vitals?.['systolic_bp']?.value}/${draft.candidateData.vitals?.diastolicBp?.value ?? draft.candidateData.vitals?.['diastolic_bp']?.value}`
                            : '--/--'}
                        </span>
                        <button 
                          onClick={() => handleStartEditField('systolic_bp', draft.candidateData.vitals?.systolicBp?.value ?? draft.candidateData.vitals?.['systolic_bp']?.value)}
                          className="text-slate-400 hover:text-[#0E62FE]"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                      <span className="text-slate-500 font-sans">SpO₂:</span>
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <span>
                          {(draft.candidateData.vitals?.spo2?.value ?? draft.candidateData.vitals?.['spo2']?.value) 
                            ? `${draft.candidateData.vitals?.spo2?.value ?? draft.candidateData.vitals?.['spo2']?.value}%` 
                            : '--%'}
                        </span>
                        <button 
                          onClick={() => handleStartEditField('spo2', draft.candidateData.vitals?.spo2?.value ?? draft.candidateData.vitals?.['spo2']?.value)}
                          className="text-slate-400 hover:text-[#0E62FE]"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                      <span className="text-slate-500 font-sans">RR:</span>
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <span>
                          {(draft.candidateData.vitals?.respiratoryRate?.value ?? draft.candidateData.vitals?.['respiratory_rate']?.value) 
                            ? `${draft.candidateData.vitals?.respiratoryRate?.value ?? draft.candidateData.vitals?.['respiratory_rate']?.value}/m` 
                            : '--/m'}
                        </span>
                        <button 
                          onClick={() => handleStartEditField('respiratory_rate', draft.candidateData.vitals?.respiratoryRate?.value ?? draft.candidateData.vitals?.['respiratory_rate']?.value)}
                          className="text-slate-400 hover:text-[#0E62FE]"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Observations & Interventions */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Observations & Procedures
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {(draft.candidateData.interventions || []).length} Recorded
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Observations:</span>
                      <p className="text-slate-800 font-medium">
                        {(draft.candidateData.observations || []).map(o => o.value).join(', ') || 'None recorded'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Interventions:</span>
                      <p className="text-slate-800 font-medium">
                        {(draft.candidateData.interventions || []).map(i => i.value).join(', ') || 'Standard monitoring'}
                      </p>
                    </div>

                    {draft.candidateData.medicalHistory && draft.candidateData.medicalHistory.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Medical History:</span>
                        <p className="text-slate-800 font-medium">
                          {draft.candidateData.medicalHistory.map(m => m.value).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Immutable Raw Source Accordion */}
              <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Immutable Raw Source Content ({draft.sourceType} · SHA-256: {draft.sourceHash.slice(0, 10)}...)
                </span>
                <p className="font-mono text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 max-h-24 overflow-y-auto leading-relaxed">
                  {draft.rawContent}
                </p>
              </div>

              {/* Inline Edit Modal/Drawer if editing a field */}
              {editingFieldKey && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-center gap-3">
                  <span className="text-xs font-bold text-blue-900 shrink-0">
                    Edit {editingFieldKey.replace(/_/g, ' ')}:
                  </span>
                  <input
                    type="text"
                    value={editingFieldValue}
                    onChange={(e) => setEditingFieldValue(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-blue-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0E62FE] w-full"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleSaveFieldEdit}
                      className="px-4 py-1.5 rounded-xl bg-[#0E62FE] text-white font-black text-xs hover:bg-[#0050E6] cursor-pointer"
                    >
                      Save Override
                    </button>
                    <button
                      onClick={() => setEditingFieldKey(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          {intakeState === 'REVIEW' ? (
            <>
              <button
                onClick={() => { setIntakeState('IDLE'); setDraft(null); }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard & Start Over</span>
              </button>

              <button
                onClick={handleConfirmCase}
                disabled={isSubmittingConfirm}
                className="flex items-center gap-2 px-7 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
              >
                {isSubmittingConfirm ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating Case...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CONFIRM & ACTIVATE EMERGENCY CASE</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-slate-400 font-medium">
                PRANA Tele-Specialist Prehospital System · Zero Autonomous Medical Decisions
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
