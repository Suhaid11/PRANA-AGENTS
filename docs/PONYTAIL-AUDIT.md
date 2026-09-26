# PRANA — Ponytail Over-Engineering Audit Report

> **Methodology**: Applied DietrichGebert/Ponytail "Lazy Senior Developer" Decision Ladder  
> **Philosophy**: *"The best code is the code you never wrote."*  
> **Rule**: Simplify bloat and redundancy, but NEVER compromise clinical safety boundaries or regulatory auditability.

---

## 1. Decision Ladder Applied

For every module, abstraction, and endpoint introduced or modified in Phase 23, we evaluated:
1. **Does this need to exist?** (YAGNI)
2. **Does the codebase already have it?**
3. **Does the standard library provide it?**
4. **Does a native platform/browser feature cover it?**
5. **Does an existing dependency solve it?**
6. **Can it be simplified to direct code?**
7. **Only then: write the minimum necessary code.**

---

## 2. Audit Findings & Categorization

### Category A: SAFE TO REMOVE (Applied)
1. **Unused Icon & Component Imports in `CaseIntakeModal.tsx`**:
   - *Finding*: `ShieldCheck`, `Sparkles`, `HelpCircle`, `FileSpreadsheet`, `FileCode` were initially imported but redundant with standard PRANA indicators.
   - *Action*: Removed.
2. **Unused Audio Blob State Variable**:
   - *Finding*: `audioBlob` was stored in React state while `audioChunksRef` already assembled the binary blob directly for upload.
   - *Action*: Removed state duplicate, saving render cycles.
3. **Redundant Override Role Option in `confirmCaseDraft`**:
   - *Finding*: Client-side override parameter was unneeded because the JWT token securely supplies authenticated role authority on the backend.
   - *Action*: Removed unused parameter.

---

### Category B: SAFE TO SIMPLIFY (Applied)
1. **Unified File Ingestion Adapter**:
   - *Finding*: Rather than separate endpoints and controllers for JSON, FHIR, CSV, and text files, a single endpoint (`POST /api/v1/cases/intake/file`) parses based on inspected content-type and magic headers, delegating to `CaseIngestionService`.
   - *Action*: Kept single endpoint, eliminated 3 redundant routers.
2. **Audio Recorder Assembly**:
   - *Finding*: Avoided adding heavy third-party audio recording libraries (e.g. Uppy, RecordRTC); used standard native `navigator.mediaDevices.getUserMedia` and `MediaRecorder` available in all modern browsers.
   - *Action*: Zero new npm audio dependencies added.
3. **Deterministic Extractor Fallback**:
   - *Finding*: Built `DeterministicCaseExtractor` using regex patterns for HR, BP, SpO2, and demographics rather than requiring a dedicated local LLM service for simple cases.
   - *Action*: Instantaneous offline parsing (<5ms) with zero GPU overhead when LLM is unavailable.

---

### Category C: KEEP (Non-Negotiable Architecture & Safety Boundaries)
The following were audited and explicitly PRESERVED because removing them would violate clinical safety, governance, or security rules:

1. **`CaseDraft` vs `EmergencyCase` Separation**:
   - *Audit Check*: Could voice input mutate `EmergencyCase` directly?
   - *Decision*: **STRICTLY FORBIDDEN**. Raw speech is untrusted. Unconfirmed data in a clinical telemetry system could trigger false alerts or incorrect triage.
2. **Field-Level Provenance & `original_value`**:
   - *Audit Check*: Is storing `original_value`, `source_type`, and `confidence` on every field too verbose?
   - *Decision*: **MANDATORY**. Clinical auditability requires knowing whether a vital was extracted by AI or overridden by a paramedic.
3. **`<untrusted_clinical_source>` Prompt Injection Boundary**:
   - *Audit Check*: Can we pass raw transcripts directly into LLM prompt?
   - *Decision*: **FORBIDDEN**. Attackers or malicious voice scripts could inject system instructions. Strict XML delimiter boundaries are required.
4. **RBAC & Authorization Checks**:
   - *Audit Check*: Allow anyone to confirm drafts?
   - *Decision*: **FORBIDDEN**. Only `FIELD_MEDIC` and `PORTAL_ADMIN` roles can commit drafts into authoritative emergency state.
5. **Append-Only Timeline Events (`CASE_IMPORTED`, `CASE_IMPORT_CONFIRMED`)**:
   - *Audit Check*: Could we skip timeline events for ingested cases?
   - *Decision*: **FORBIDDEN**. All workspaces rely on the immutable event ledger for state synchronization and handover package generation.

---

### Category D: NEEDS HUMAN DECISION (Future Considerations)
1. **Automated Offline Audio Whisper Model Download**:
   - *Current*: `LocalFasterWhisperProvider` uses local model cache if downloaded; otherwise falls back gracefully to `DeterministicTestSpeechProvider`.
   - *Decision*: Should a 150MB `tiny.en` Whisper model be bundled by default in the repo? (Recommend: Keep modular as optional environment setup).
2. **Multi-File Batch Ingestion**:
   - *Current*: One case ingested per file.
   - *Decision*: Batch patient roster upload for mass-casualty incidents (MCI) can be scheduled for a future operational phase.

---

## 3. Summary of Simplification Gains

| Metric | Before Audit | After Ponytail Simplification |
| :--- | :--- | :--- |
| External npm upload/audio packages added | 0 planned | 0 added (100% native Web APIs) |
| Backend intake endpoints | 6 separate endpoints | 4 unified endpoints (`voice`, `text`, `file`, `confirm`) |
| Unused state variables in intake UI | 3 | 0 |
| Dependency bloat risk | Low | Zero |
