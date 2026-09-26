# PRANA — Coding Agent Instructions & Engineering Standards
## Project-Specific Directives for Antigravity & Future AI Coding Agents

> **File Mandate**: Persistent operational instructions for all AI coding agents working on the PRANA codebase.  
> **Repository**: PRANA — "Where the Journey Becomes Care"  
> **Status**: Active Productization & Engineering Standard  
> **Last Updated**: March 2026  

---

## 1. Product Context & Non-Negotiable Core Identity

PRANA is an unbroken prehospital emergency coordination and tele-specialist intelligence platform.
- **Core Value Thesis**: *"If the ambulance cannot beat the traffic, the treatment should not have to wait for it."*
- **Primary Operational Function**: Connects field paramedics, continuous sensor streams, explainable simulated decision support, and receiving hospital resuscitation suites into a single shared emergency state.
- **Classification**: PRANA is explicitly a **clinician-supervised emergency-care coordination platform**.
- **Important Workflow Rule**: **NEVER re-introduce manual "Send to Clinician" button gates.** PRANA automatically propagates patient data, serial vitals, observations, interventions, and CDS updates to the clinician workflow upon registration. Explicit human action is reserved for clinical endorsements and hospital bay confirmations.

---

## 2. Design Language & Visual System ("Clinical Spatialism")

PRANA is **NOT** a generic SaaS dashboard, a hospital billing admin panel, an AI chatbot, or a student hackathon demo. It is a high-confidence, clinical operating layer.

### 2.1 The Semantic Color Creed
Never use color purely as decoration. Adhere strictly to the master semantic hierarchy:
- **Structure & Frame**: Deep Navy (`#0B132B`, `#0F172A`)
- **Primary Workflows & Care Actions**: Electric / Cobalt Blue (`#0E62FE`, `#0050E6`)
- **Live Sensor Telemetry & Waves**: Cyan / Teal (`#06B6D4`, `#0D9488`)
- **Verified / Bay Ready States**: Medical Emerald (`#10B981`, `#059669`)
- **Traffic Delays & Compensated Warnings**: Technical Amber (`#F59E0B`, `#D97706`)
- **Critical Physiological Decompensation**: Rose / Crimson (`#EF4444`, `#E11D48`) — **Reserved strictly for genuine clinical alerts**.
- **Secondary Metadata**: Slate (`#64748B`, `#475569`, `#94A3B8`)
- **Foundational Stage Canvas**: Warm low-glare neutral (`#EEF1F6` / `#F4F6F9`)

### 2.2 Aesthetic Ground Rules
1. **Zero Emoji-as-Icons**: Never use emoji (`🚑`, `❤️`, `⚠️`) as interface icons. Use `lucide-react` exclusively with consistent stroke width (`1.75px` or `2.0px`).
2. **Tabular Numerals Everywhere**: All physiological metrics (HR, SpO2, BP, RR), countdown timers (ETA), coordinates, and scores must use `font-tabular` (`font-mono` with `tabular-nums`) to prevent optical jitter.
3. **No Uncontained SVG Sparklines**: All sparklines and waveform SVGs must have explicit bounding boxes with internal padding so curves never clip at view edges.
4. **Care Conduit Centerpiece**: Preserve the Care Conduit as PRANA's signature continuous route vector. Do not replace it with a simple vertical timeline card or generic SaaS pill.

---

## 3. Architecture Rules & Single Source of Truth

1. **One Shared Emergency State (`EmergencyCase`)**:
   - Ambulance, Clinician, Hospital Command, and Medical Readiness views MUST read from the identical `activeCase` in `EmergencyContext`.
   - Never create disconnected mock cases or separate role-specific state forks.
2. **Single Derived ETA Source of Truth**:
   - The formula `derivedEta = baseEtaMinutes + trafficDelayMinutes` is calculated centrally in `emergencyEngine.ts` and exposed via `EmergencyContext`.
   - All workspaces must consume this exact value. Never calculate an ad-hoc ETA locally in a component.
3. **Pure State Transitions in `emergencyEngine.ts`**:
   - State mutations must remain pure functions returning a new immutable `EmergencyCase` object.
   - Every mutation must automatically append a typed `TimelineEvent` to `activeCase.timeline`.
4. **Care Rail Direct Array Binding**:
   - The Care Rail renders directly from `activeCase.timeline`. Never maintain a separate array or secondary cache for timeline events.
5. **Deterministic Reset without Page Reload**:
   - Calling `resetMission()` must restore the active scenario to its clean initial seed state without triggering a window reload.

---

## 4. Clinical Safety Boundaries & AI Usage Rules

### 4.1 When to Use AI:
- Summarizing complex case histories for specialist handovers.
- Converting unstructured paramedic field notes into structured observation lists.
- Explaining the multi-factor scoring rationale for hospital recommendations.
- Detecting observable physiological patterns (shock index drift, hypoxia trends).

### 4.2 When NOT to Use AI (Strictly Prohibited):
- **NEVER** allow AI to autonomously diagnose a medical condition.
- **NEVER** allow AI to autonomously prescribe or titrate medications, antivenoms, or fluids.
- **NEVER** administer drugs or procedures without recorded human clinician confirmation (`clinicianId`, `clinicianName`, `timestamp`).
- **NEVER** claim AI outputs are validated clinical diagnostic algorithms. Always include the standard disclaimer:
  > *"All clinical thresholds in the build are demonstration logic, not validated clinical decision rules."*

---

## 5. Coding & Component Conventions

1. **TypeScript Strictness**:
   - Strict mode enabled (`tsconfig.json`).
   - Do **NOT** use `any`. Define explicit types in `src/types/emergency.ts` or local component prop interfaces.
2. **Component Reuse & Selection**:
   - Consult `components.json` for configured registries (`@componentry` and `@cult-ui`).
   - Before building a custom component, check if an existing PRANA primitive or a suitable Componentry/Cult UI component satisfies the need.
   - Keep components focused and modular under `src/components/`:
     - `shell/`: Global navigation, command bar, and shell layout.
     - `ambulance/`: Paramedic field command and patient profile cards.
     - `clinician/`: Tele-specialist decision support and protocol action consoles.
     - `hospital/`: Receiving ED command, corridor countdown, and bay readiness.
     - `conduit/`: Care Conduit spatial route centerpiece.
     - `facility/`: Transparent hospital matching modals and score breakdowns.
     - `readiness/`: Medical inventory and kit verification.
     - `timeline/`: Continuous Care Rail and mission audit ledger.
3. **Tailwind CSS v4 Standards**:
   - Use standard Tailwind utility classes conforming to the design tokens.
   - Avoid hardcoded arbitrary color values in components; reference defined semantic tokens and variables.

---

## 6. Testing, Quality Assurance & Verification Expectations

Every coding agent must execute and satisfy the following verification gates before concluding any work:

### 6.1 State Machine Integration Gate (`npm test`)
Run `npm test` (or `tsx scripts/audit-state-machine.ts`).
- All **45 acceptance assertions** must PASS across Trauma (`PR-8492`), Snakebite (`PR-7104`), and Poisoning (`PR-9521`).
- The multi-scenario reset cycle (`TRAUMA → RESET → SNAKEBITE → RESET → POISONING → RESET`) must pass cleanly with zero state leakage.

### 6.2 Responsive Zero-Overflow Gate
Verify that `scrollWidth === clientWidth` at:
- Mobile: `390px`
- Tablet: `768px`
- Small Desktop: `1024px`
- Large Display: `1440px`

### 6.3 Accessibility Standards
- Ensure WCAG 2.1 AA color contrast compliance for all text.
- Maintain keyboard focus states with visible focus rings.
- Tabular numbers for all streaming figures.
- Screen-reader accessible labels on icon-only buttons.

---

## 7. Selected Agentic Awesome Skills (AAS)

The following skills are installed and actively leveraged for this project:

| Skill Identifier | Location | Primary Project Application |
| :--- | :--- | :--- |
| `@anti-ui-slop` | `.agents/skills/anti-ui-slop/` | Prevents generic SaaS patterns; enforces high-density clinical spatialism, authentic domain stance, and thorough review of rendered states. |
| `@frontend-lighthouse` | `.agents/skills/frontend-lighthouse/` | Enforces Core Web Vitals performance budgets, accessibility floors (≥ 90), and production bundle optimization. |

When adding future skills from the canonical catalog (`https://github.com/sickn33/agentic-awesome-skills`), select selectively based on immediate technical relevance and document them here.

---

## 8. Do-Not-Break Checklist

Before committing any modifications, verify that you have NOT broken:
- [ ] The single shared `activeCase` state machine.
- [ ] The derived ETA formula (`derivedEta = baseEtaMinutes + trafficDelayMinutes`).
- [ ] The 3 competition scenarios (`PR-8492` Trauma, `PR-7104` Snakebite, `PR-9521` Poisoning).
- [ ] The Care Conduit centerpiece in any of its 3 domain variants (`journey`, `clinical`, `readiness`).
- [ ] The Care Rail chronological timeline and audit ledger.
- [ ] The clinician protocol endorsement workflow (`CONFIRM`, `REQUEST DATA`, `ESCALATE`, `ACKNOWLEDGE`).
- [ ] The transparent 40/30/30 hospital matching engine.
- [ ] The receiving hospital bay readiness handshake.
- [ ] The deterministic reset mechanism (`resetMission()`).

---

---

## 10. Phase 14 Backend Architecture & Persistent State Directives

With Phase 14, PRANA introduces a persistent FastAPI + SQLite backend with an Append-Only Event Store alongside the deterministic frontend engine:

### 10.1 Canonical Architecture & Single Source of Truth
1. **One Canonical EmergencyCase**: Never create separate frontend vs backend domain models. The Python SQLAlchemy/Pydantic models (`EmergencyCaseModel`, `EmergencyCaseSchema`) mirror the TypeScript `EmergencyCase` interface 1:1.
2. **Append-Only Event Store (`timeline_events`)**:
   - Every state mutation (`CASE_CREATED`, `VITAL_RECORDED`, `CLINICIAN_PLAN_CONFIRMED`, `INTERVENTION_RECORDED`, etc.) MUST append an immutable row into `timeline_events`.
   - Never update or delete an event in-place.
   - The Care Rail renders directly from this unified event stream.
3. **No Direct Component `fetch()` Calls**:
   - React components must NEVER call `fetch("/api/...")` directly.
   - All backend communication must pass through the strongly-typed API adapter in `src/services/api/` (`casesApi`, `vitalsApi`, `cliniciansApi`, `facilitiesApi`, `eventsApi`).
4. **Dual-Mode Operation & Offline Fallback**:
   - The application supports two modes: `PRODUCT` (connected to FastAPI + SQLite) and `DEMO` (local deterministic engine fallback).
   - If the backend is unreachable or fails, PRANA must gracefully fall back to the in-memory `emergencyEngine.ts` and display the unobtrusive amber status pill (`OFFLINE FALLBACK`).
   - Optimistic UI updates occur immediately so prehospital operations are never blocked by network latency.
5. **Automatic Clinician Propagation**:
   - When a paramedic records vitals, interventions, or observations, the backend automatically updates the case aggregate and derives clinical signals.
   - Clinician consoles receive this updated context automatically without requiring manual "send" buttons.
6. **Explicit Clinician Authority**:
   - Clinical endorsements (`CONFIRMED`, `DATA_REQUESTED`, `ESCALATED`, `ACKNOWLEDGED`) require deliberate specialist human actions.
   - Confirmation is recorded with `clinician_id`, `clinician_name`, and timestamp, persisting a `CLINICIAN_PLAN_CONFIRMED` event.
   - AI outputs remain simulated decision support—never autonomous prescribing or diagnosing.
7. **Backend Testing & Verification**:
   - Backend pytest suite in `backend/tests/` must achieve 100% pass rate (`pytest tests/`).
   - Frontend state machine audit must retain 45/45 pass rate (`npm test`).
   - Production bundle must compile cleanly (`npm run build`).

---

## 11. Phase 15 Real-Time Synchronization Directives

With Phase 15, PRANA introduces live multi-role emergency synchronization across Ambulance, Clinician, and Hospital Command workspaces:

1. **Authoritative Backend**:
   - The backend (FastAPI + SQLite + Event Store) remains the single source of truth for all case data and event order.
   - Frontends must never create authoritative timestamps or version numbers locally.
2. **Persist-Before-Broadcast Rule**:
   - Real-time event broadcasting MUST occur AFTER database transactions commit successfully.
   - If persistence fails or aborts, no broadcast is dispatched. Phantom state broadcasts are strictly forbidden.
3. **Case-Scoped Channel Isolation**:
   - WebSocket subscriptions are strictly scoped by `case_id` (`WS /api/v1/ws/cases/{case_id}`).
   - Cross-case event leakage is prohibited. A client connected to Trauma (`PR-8492`) must never receive events from Snakebite (`PR-7104`).
4. **Monotonic Version Ordering**:
   - Every emergency case has a monotonically increasing `current_version`.
   - Out-of-order or stale events (`incoming.version <= lastKnownVersion`) must be safely discarded.
5. **Duplicate Event Deduplication**:
   - Clients must maintain an LRU cache of recently processed `eventId`s to prevent duplicate state applications.
6. **Reconnect & Catch-Up Reconciliation**:
   - Reconnections must use bounded exponential backoff (`1s, 2s, 4s, 8s, 15s`).
   - Clients must query `GET /api/v1/cases/{case_id}/events?after_version={version}` upon reconnecting to catch up on missed events.
7. **Connection State Indication**:
   - Use `LIVE SYNC` (Cyan / Teal pulse) when WebSocket is active.
   - Use `RECONNECTING` (Amber pulse) when reconnecting.
   - Never use Red for temporary network degradation—network instability is not a clinical emergency.

---

## 13. Phase 16 Authentication, RBAC & Case Authorization Directives

With Phase 16, PRANA establishes an authoritative identity, permission, and case boundary layer:

1. **Never Trust Client Role**:
   - The frontend role switcher or UI state is strictly for UX convenience.
   - Every mutation endpoint MUST verify permissions using server-side dependencies (`require_role(...)`).
2. **Never Trust Client Actor Identity**:
   - Actor IDs, display names, and roles recorded in domain events and database records MUST be derived authoritatively from the verified JWT principal (`current_user.id`, `current_user.display_name`, `current_user.role`).
   - Client payload fields like `clinician_id` or `actor` must never override the authenticated identity.
3. **Case-Level Access Check Required**:
   - Merely having a valid token is insufficient. The user MUST be assigned to the specific `case_id` in `case_participants` (or hold `PORTAL_ADMIN`).
   - Guessing `/cases/{case_id}` without participant assignment must return HTTP 403 Forbidden.
4. **Authenticated WebSockets Required**:
   - WebSockets must validate the JWT token via handshake (`?token=` or initial `AUTH` frame) and verify case authorization before subscribing the connection.
   - Unauthorized subscriptions must close with WebSocket codes `4401` or `4403`.
5. **Minimal Claims Principle**:
   - Tokens contain ONLY identity claims (`sub`, `uid`, `name`, `role`, `iat`, `exp`).
   - Never place vitals, clinical observations, notes, or patient data inside JWT tokens.
6. **No Secrets in Repository**:
   - Secrets and production cryptographic keys must reside strictly in environment variables (`JWT_SECRET`, `DATABASE_URL`).
7. **Auth Regression Tests Required**:
   - Maintain the 20 security tests in `backend/tests/test_auth.py` ensuring invalid passwords, inactive users, missing/expired tokens, role violations, and unauthorized case subscriptions are strictly rejected.

---

## 14. Phase 17 AI Provider Abstraction & Safe Decision Support Directives

1. **AI Never Prescribes or Diagnoses**:
   - AI outputs are classified strictly as *Simulated Decision Support / Observable Signals*.
   - All generated signals must be passed through `ClinicalSafetyValidator`.
   - Never allow AI to output prescription directives, diagnostic declarations, or clinician override instructions.
2. **Deterministic Demo Provider**:
   - The primary provider for hackathon demonstration is `DemoDecisionSupportProvider`.
   - Given identical physiological context, it must return identical structured signals.
   - All algorithmic rules must be documented as "Demonstration logic — not clinically validated."
3. **Cross-Role Visibility is Strictly Read-Only**:
   - Clinicians can see ambulance vitals and field interventions, but cannot edit ambulance telemetry or record field procedures.
   - Paramedics cannot confirm specialist review plans.
   - Hospital Command cannot modify clinical records or approve clinician protocols.
4. **Demo Persona Switcher is Demo-Only**:
   - The UI persona switcher exists solely for demonstration walkthrough convenience.
   - It must never be treated as production authorization architecture.
5. **No Chatbot Slop**:
   - Do NOT build an open-ended chatbot box ("Ask PRANA anything..."). AI must be integrated into the spatial clinical workflow.
6. **No Manual "Send to AI" Button**:
   - AI evaluation triggers automatically on relevant telemetry events. Do not gate decision support behind a manual paramedic button.
7. **Resilience & Fail-Open Guarantee**:
   - If AI service fails or times out, PRANA must continue regular care coordination; vital recording and WebSocket sync must not fail (`AI_FAIL_OPEN=true`).

---

## 15. Phase 18 Auditability, Handover Package & Structured Export Directives

With Phase 18, PRANA introduces the Prehospital Handover Package, cryptographic content verification, receiving ED handoff acknowledgement, and structured FHIR R4 export:

1. **Handover as Derived Snapshot, Never a New Truth**:
   - The handover package (`HandoverPackageModel`, `PrehospitalHandoverPackage`) is a synthesized point-in-time clinical snapshot derived strictly from the canonical case and append-only `timeline_events`.
   - Creating or updating a handover package must NEVER alter, overwrite, or delete historical case records or events.
2. **AI Decision Support Is Non-Autonomous in Handoffs**:
   - Handover packages must retain the explicit disclaimer `SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS`.
   - Summaries must present observable findings, sensor deltas, and clinician endorsement attribution (`clinician_name`, `clinician_id`, timestamp).
   - Under no circumstances may AI recommendations be promoted to definitive clinical diagnoses in the handover record.
3. **Cryptographic Integrity & Independent Verification**:
   - Every generated handover snapshot is canonicalized (sorted keys, compact JSON separators) and stamped with a SHA-256 digest (`integrityHash`).
   - Receivers must be capable of verifying payload integrity independently via `GET /cases/{case_id}/handover/{package_id}/verify` or client-side recalculation.
4. **Structured Interoperability Export (JSON + HL7 FHIR R4)**:
   - Provide clean export endpoints for receiving facility EHR ingestion:
     * `format=json`: Canonical JSON snapshot with full provenance.
     * `format=fhir`: Standard HL7 FHIR R4 Bundle (`Composition`, `Patient`, `Encounter`, `Observation`, `Procedure`) with extension-based provenance tracing back to `source_event_id`.
5. **Receiving Facility Reception Handshake**:
   - Only authenticated users with `HOSPITAL_COMMAND` role (or `PORTAL_ADMIN`) are authorized to formally acknowledge handover receipt (`POST /cases/{case_id}/handover/{package_id}/acknowledge`).
   - Unauthorized roles (e.g. `FIELD_MEDIC`) must receive HTTP 403 Forbidden.
   - Handover acknowledgement appends a `HANDOVER_ACKNOWLEDGED` event to the immutable Care Rail and broadcasts in real time via WebSocket.
6. **Print-Optimized Emergency Department Handoff**:
   - Maintain dedicated CSS print styling (`@media print`) enabling 1-click A4 physical printout (`window.print()`) with high-contrast monochrome readability, hidden interactive chrome, and unbroken clinical tables.
7. **Prototype Disclaimers & Non-Clinical Certification Boundary**:
   - Maintain explicit notices that PRANA prehospital handover packages, integrity digests, and FHIR bundles are demonstration prototypes and not certified medical device software or legally binding digital signatures.

---

## 16. Mandatory Final Line in All Reports

At the conclusion of EVERY implementation response, summary, or report, the agent must include:

```
REUSABLE COMPONENTS USED:
[explicitly list the reusable Componentry, Cult UI, shadcn/ui, or project components used in this work]
```
If no external component was used:
```
REUSABLE COMPONENTS USED:
Existing PRANA components only.
```



