# PRANA — Operational Context & Architectural Specification

> **Persistent Agent Context**: Read this file at the start of every session.
> **Last Updated**: Day 2 Integration Audit & State Machine Verification

---

## 1. Product Summary & Core Thesis

**PRANA** is an unbroken prehospital emergency coordination and tele-specialist intelligence platform.
- **Core Value Thesis**: *"If the ambulance cannot beat the traffic, the treatment should not have to wait for it."*
- **Primary Innovation**: Converts prehospital transit time from dead time into active clinical stabilization time through continuous bi-directional sensor streaming, explainable decision support, and receiving hospital readiness handshakes.

---

## 2. Locked 4-Module Information Architecture (FROZEN)

The application navigation, layout, and component boundaries are **locked and must not be redesigned**:

1. **Mission Portal** (`PORTAL`):
   - Executive scenario orchestrator, offline demonstration launcher, and instant scenario switcher (`PR-8492` Trauma, `PR-7104` Snakebite, `PR-9521` Poisoning).
2. **Field Medic Command Surface** (`FIELD_MEDIC` / Ambulance Workspace):
   - 3-column asymmetric layout: Patient Card (left), Care Conduit center anchor (middle), Live sensor telemetry stream and PRANA Intelligence card (right), and bottom Care Rail.
3. **Remote Clinician Workspace** (`REMOTE_CLINICIAN`):
   - Tele-specialist authority console: Observable signals synthesis, 10-minute multi-stream trend analysis, authoritative protocol action buttons (`CONFIRM`, `REQUEST DATA`, `ESCALATE`, `ACKNOWLEDGE`), and clinical timeline.
4. **Hospital Command & Bay Readiness** (`HOSPITAL_COMMAND`):
   - Receiving facility command: Inbound corridor arrival countdown, sterile resuscitation bay confirmation handshake, and transparent "Why This Hospital?" matching breakdown.

### Unifying Components
- **Care Conduit**:
  - The central spatial centerpiece connecting Paramedic, Remote Specialist, and Receiving Facility. Renders in 3 domain-adapted variants: `journey` (Ambulance), `clinical` (Clinician), and `readiness` (Hospital).
- **Care Rail**:
  - Continuous chronological event track rendered directly from the single shared `activeCase.timeline` event log with zero separate bookkeeping.

---

## 3. The Three Competition Scenarios

1. **Trauma / Road Accident (`PR-8492`)**:
   - **Patient**: Rahul Verma, 34M. High-velocity motor vehicle collision.
   - **Clinical Picture**: Suspected pelvic fracture and retroperitoneal hemorrhage. Progressive tachycardia (HR 112 → 126+), narrowing pulse pressure (PP < 30 mmHg), and elevated Shock Index (> 1.2).
   - **Target Facility**: Manipal Hospital (Certified Level-1 Trauma Suite with 24/7 angio-embolization and available red bay).
2. **Snakebite / Envenomation (`PR-7104`)**:
   - **Patient**: Sunita Gowda, 28F. Russell's viper bite on right lower limb.
   - **Clinical Picture**: Ascending local edema (>10 cm margin spread), 20WBCT whole blood clotting failure risk, tachycardia. Strict avoidance of tourniquets.
   - **Target Facility**: Victoria Hospital (Regional Toxicology & Antivenom Center with dedicated antivenom cold-chain stocks).
3. **Poisoning / Toxicology (`PR-9521`)**:
   - **Patient**: Manoj Kumar, 45M. Agricultural organophosphate pesticide inhalation.
   - **Clinical Picture**: Cholinergic toxindrome (SLUDGE syndrome), severe vagal bradycardia (HR 54 → 42 bpm), SpO2 90% → 84%, copious bronchorrhea.
   - **Target Facility**: MS Ramaiah Medical Center (Dedicated Toxicology ICU with mechanical ventilation and atropine infusion protocols).

---

## 4. Technology Stack & Implementation Standards

- **Frontend**: React 19, TypeScript (strict), Vite 8, Tailwind CSS v4, Lucide React icons.
- **Backend / Storage (Option/Architecture)**: FastAPI, SQLite, local in-memory deterministic simulation engine for 100% offline competition resilience.
- **Design Tokens & Aesthetic Bar**: "Clinical Spatialism" — calm, high-density health-tech SaaS; crisp typography hierarchy; zero emoji-as-icons; zero placeholder text; tabular figures for all physiological values.
- **ETA Single Source of Truth**: `derivedEta = baseEtaMinutes + trafficDelayMinutes` exposed centrally in `EmergencyContext` and consumed synchronously by all workspaces.

---

## 5. Non-Negotiable Safety & Clinical Governance Rules

1. **AI Never Autonomously Prescribes or Administers**:
   - AI outputs are classified strictly as **Simulated Decision Support / Observable Signals**.
   - No drug or procedure is administered without explicit human clinician endorsement (`CONFIRMED` decision + clinician ID + timestamp).
2. **Demonstration Logic Disclaimer**:
   - *All clinical thresholds (shock index, hypoxia cutoffs, toxindrome patterns) in the competition build are demonstration logic, not validated clinical decision rules.*

---

## 6. Build & Integration Status

- **Build Tooling**: `npm run build` cleanly generates production bundle (`dist/`) with zero TypeScript errors.
- **State Machine Acceptance Gate**: 15-step automated acceptance test across all 4 scenarios (`npm test`) — **60/60 PASS (100%)**.
- **Backend Test Suite**: `pytest backend/tests/` — **121/122 tests PASS** (1 skipped live GPU test when Ollama server is offline) with zero errors. 12/12 dedicated intake tests pass; full lifecycle state flow test passes.
- **Authoritative 9-Stage Lifecycle (Final Pass)**:
  - Strict 9-stage state machine (`Incident` → `Assessment` → `Ambulance` → `Clinician` → `Facility` → `Hospital Ready` → `Arrival` → `Handover` → `Completed`).
  - True WHO-aligned transfer of care: Bedside SBAR handover initiation by field medic (`POST /handover/initiate`) + explicit receiving ED physician acceptance (`POST /handover/accept`).
  - Cryptographically verifiable prehospital transit record (`PrehospitalHandoverPackage` with SHA-256 digest) decoupled from operational transfer-of-care workflow.
  - Bidirectional clinician escalation (`URGENT_REVIEW_ESCALATED`) with receiving ED charge acknowledgment (`HOSPITAL_ESCALATION_ACKNOWLEDGED`) and real-time feedback loops.
  - Zero premature state leakage: New/imported cases initialize in `conduitStep: 1`, `UNKNOWN` facility status, and `assignedBay: "Awaiting Assignment"`.
- **Dynamic Case UI**: Fully decoupled from hardcoded demo names/incidents. Supports arbitrary cases and 4th scenario `PR-4018` (Radha Sharma · Acute Respiratory Distress) seamlessly across Mission Portal, Care Conduit, Care Rail, and role consoles.
- **Documentation**: Fully specified in `docs/CASE-LIFECYCLE.md`, `docs/HANDOVER-FLOW.md`, and `docs/PONYTAIL-AUDIT.md`.
- **Current Status**: AI Observability & Demo Transparency Pass Complete. Zero lint/type errors. Ready for review.

---

## 7. AI Observability Layer (Completed)

> **Directive**: Make PRANA's existing AI pipelines visible, traceable, and honest for live demos — without exposing chain-of-thought.

### 7.1 Backend: `ExtractionMetadataSchema`

- **Location**: `backend/app/domain/schemas.py` — `ExtractionMetadataSchema` (13 fields).
- **Fields**: `engine`, `provider`, `model`, `modelVerified`, `modelIdentity`, `isFallback`, `fallbackReason`, `transcriptionEngine`, `latencyMs`, `validationStatus`, `validationEngine`, `fieldsExtractedCount`, `rawCharCount`.
- **Propagation**: `extract_case_candidates()` in `extraction_service.py` generates metadata on every call. Exposed in `CaseDraftSchema` at top-level via `_build_draft_schema()` in `intake.py`.
- **Honesty Rule**: `isFallback = True` + `fallbackReason = "Local Qwen3 service offline (http://localhost:11434)"` when Ollama is unreachable. No fake AI attribution.

### 7.2 Frontend: AI Extraction Observability Card (Case Intake Modal)

- **Location**: `src/components/portal/CaseIntakeModal.tsx` — rendered in `REVIEW` state, above audit banner.
- **Content**: 5-step pipeline strip (SOURCE → TRANSCRIPTION → EXTRACTION → PYDANTIC VALIDATION → DRAFT STATUS), amber fallback disclosure banner with honest reason text, expandable Structured JSON Output preview.
- **Dynamic**: All labels wired directly to `draft.extractionMetadata` from API — no hardcoded strings.

### 7.3 Frontend: AI Authority Card + Pipeline Diagram (Clinician Workspace)

- **Location**: `src/components/clinician/AgentActivityPanel.tsx` — below missing data panel, above mandatory safety notice.
- **AI AUTHORITY BOUNDARIES**: Two-column CAN/CANNOT grid (open by default). Clear declaration of what AI can and cannot do.
- **HOW PRANA AI WORKS**: 9-step collapsible pipeline (collapsed by default). Steps 03 and 07 adapt live based on Qwen3 availability.

### 7.4 Care Rail: AI Reassessment Triggered Event

- **Location**: `src/context/EmergencyContext.tsx` — `submitFieldResponse()`.
- **Behavior**: When field response submitted → two Care Rail entries fire: `"Field Assessment Submitted"` + `"AI Reassessment Triggered"` (actor: `PRANA INTELLIGENCE`). `computeAiSignal()` then executes, closing the loop mechanically.
- **Rendering**: `CareRail.tsx` renders `PRANA INTELLIGENCE` actor as P0 priority, cyan color, visible in `AI_CLINICIAN` filter tab.

### 7.5 Test Gates (Post AI Observability & Extraction Fix Pass)

| Gate | Result |
|------|--------|
| `npm test -- --run` (60 state machine assertions) | **60/60 PASS** |
| `npm run build` (TypeScript + Vite) | **Built in 346ms, 1908 modules, 0 errors** |
| `npm run lint` (Oxlint) | **0 errors (9 warnings)** |
| `tsc -b --noEmit` | **0 errors** |
| `pytest backend/tests` | **122 passed, 0 failed, 1 warning (100%)** |
| Browser E2E Text Intake & Activation | **PASS (Case PR-9910 created, 11 fields verified, manual override verified)** |

---

## 8. Final AI Extraction Fix (Completed)

- **Root Causes Resolved**:
  1. Spoken compound numbers ("one twenty over eighty", "thirty two") unparsed by standard digits regex -> resolved via `normalize_spoken_numbers()`.
  2. Negation leakage ("no active bleeding", "no history of COPD") generating false positives -> resolved via `is_negated()` boundary checks.
  3. Ollama model identity forensics (`verify_model_identity()`): actively inspects model parameter counts and architecture via `/api/show`. Flags retagged sub-scale models (e.g. 494M Qwen2.5 retagged as 8B) and routes honestly to deterministic fallback with clear disclosure.
  4. Ollama structured outputs: enforced typed schema constraint (`"format": schema`) with pre-validators on `CaseExtractionResult`.
  5. Canonical dual-key normalization: `normalize_extraction_result()` ensures consistent snake_case / camelCase representation.
  6. Dynamic orchestrator case domain resolution: ensures `domain` accurately resolves to the emergency case record even if `get_case_summary` tool call was omitted during agentic multi-turn execution.
- **Human Authority Invariant**: `CaseDraft` remains unconfirmed until explicit human clinician/medic confirmation (`CONFIRMED & ACTIVATE EMERGENCY CASE`).
- **AI Reassessment Loop**: Field medic data response fires `AI_REASSESSMENT_TRIGGERED` under `PRANA INTELLIGENCE` actor on Care Rail.
