# PRANA

### *Where the Journey Becomes Care.*

**PRANA** is a clinician-supervised prehospital emergency-care coordination platform that connects field teams, decision support, clinicians, facilities, and receiving hospitals around one shared emergency journey.

---

## Overview

In conventional emergency medical systems, transit time between the field and the emergency department is often lost time. Ambulances navigate heavy traffic while vital signs evolve, remote medical specialists remain disconnected from the stretcher, and receiving hospital emergency bays only learn of critical patient status upon ambulance arrival.

PRANA transforms prehospital transit into continuous clinical stabilization time. We cannot always make the physical journey through congested corridors shorter; PRANA makes the journey clinically useful by keeping patient context, structured communication, explainable decision support, and receiving-facility preparation synchronized throughout transport.

By establishing a unified, authoritative emergency case state across the entire prehospital timeline, PRANA ensures that field paramedics, remote specialists, and receiving emergency department teams operate with shared clinical visibility, deterministic safety boundaries, and verifiable transfer of care.

---

## The Problem

Prehospital emergency care in high-density urban and regional environments faces persistent systemic friction:

- **Fragmented Prehospital Information**: Field observations, vital signs, and interventions are documented on paper or siloed mobile tools that do not stream synchronously to receiving emergency departments.
- **Uneven Clinical Capability**: Paramedics operating in the field encounter complex scenarios—such as unstable polytrauma, progressive elapid or viperid envenomation, and acute organophosphate toxindromes—where real-time specialist guidance is critical but difficult to coordinate.
- **Lack of Continuous Physiological Context**: Trend trajectories (such as narrowing pulse pressure, progressive hypovolemia, or subtle oxygen desaturation) are frequently obscured by episodic vital checks rather than continuous longitudinal monitoring.
- **Delayed Hospital Preparation**: Trauma teams, catheterization suites, toxicologists, and antivenom cold-chain stocks are often mobilized only after the ambulance pulls into the hospital bay, introducing critical resuscitational delays.
- **Disconnected Operational Systems**: Emergency call dispatch, ambulance telematics, clinical decision tools, and hospital bed management platforms operate on isolated databases with incompatible schemas.

---

## What PRANA Does

PRANA synchronizes all care participants around a single, authoritative 9-stage emergency lifecycle:

```
Incident Created ──> Field Assessment ──> Ambulance Transport ──> Clinician Review
         │
         └──> Facility Pre-Alert ──> Hospital Ready ──> Patient Arrived
                     │
                     └──> Handover Initiated ──> Transfer Completed
```

Every participant interacts with domain-specific projections of the same underlying case:
- **Field Medic**: Documents patient demographics, reviews live sensor telemetry, records observations, and initiates structured bedside handover.
- **Remote Clinician**: Monitors 10-minute multi-stream trends, interrogates explainable AI-generated clinical signals, and issues authoritative protocol endorsements (`CONFIRM`, `REQUEST DATA`, `ESCALATE`).
- **Hospital Command**: Evaluates incoming corridor transit countdowns, verifies algorithmic hospital matching criteria, and confirms sterile resuscitation bay readiness.
- **Receiving ED Physician**: Inspects the standardized prehospital handover package, verifies cryptographic record provenance, and executes the formal transfer of care acceptance.

---

## Core Capabilities

### Connected Emergency Lifecycle
A strict 9-stage state machine (`Incident` &rarr; `Assessment` &rarr; `Ambulance` &rarr; `Clinician` &rarr; `Facility` &rarr; `Hospital Ready` &rarr; `Arrival` &rarr; `Handover` &rarr; `Completed`) backed by an append-only event store (`timeline_events`). All actions emit immutable audit events with microsecond timestamps and actor attribution.

### Multimodal Case Intake
Field teams and emergency dispatchers can register emergency cases through three intake modalities:
- **Text Dispatch**: Unstructured field notes and incident descriptions parsed into structured clinical drafts.
- **Voice Ingestion**: Audio dispatch recordings transcribed via local speech-to-text (`faster-whisper`) and extracted with clinical entity validation.
- **File Upload**: Incident documentation, photo attachments, and transfer summaries parsed into validated schemas.
- **Human Confirmation Gate**: All ingested cases produce a preliminary `CaseDraft`. No emergency case is activated into the active care pipeline without explicit human clinician or medic confirmation.

### Real-Time Coordination
A case-scoped WebSocket hub (`/api/v1/ws/cases/{id}`) broadcasts timeline milestones, physiological telemetry updates, hospital pre-alerts, bay readiness handshakes, and clinician escalations across all active browser sessions with monotonic versioning catch-up.

### Role-Based Workspaces
Five tailored operational surfaces designed with Clinical Spatialism principles:
- **`FIELD_MEDIC`**: Ambulance touch surface featuring patient identification, the Care Conduit journey anchor, live sensor sparklines, missing data requests, and handover initiation.
- **`REMOTE_CLINICIAN`**: Tele-specialist command console with multi-stream vital trend visualizers, observable signal synthesis, agent activity logs, and one-click protocol endorsement buttons.
- **`HOSPITAL_COMMAND`**: Receiving facility board tracking inbound corridor travel times, resuscitation bay assignments, and capability-matching transparency.
- **`READINESS`**: Resuscitation bay preparation surface for nursing staff, blood bank verification, and specialist team mobilization.
- **`PORTAL_ADMIN`**: Executive mission orchestrator, offline demonstration switcher, and multimodal case intake modal.

### Explainable Decision Support
AI decision support produces structured, bounded, and explainable physiological signals (e.g., progressive hypovolemic shock detection, envenomation margin expansion, cholinergic crisis pattern recognition). Outputs clearly display observable physiological indicators, physiological rationale, protocol recommendations, and contraindication warnings.

### Agentic Tool Use
An autonomous multi-turn agent loop (`AgentOrchestrator`) that queries case context using strictly read-only tools:
- `get_case_summary`: Retrieves patient demographics, chief complaint, and triage acuity.
- `get_latest_vitals`: Fetches current physiological sensor readings.
- `get_vitals_trend`: Analyzes 10-minute longitudinal vital sign trajectories.
- `get_timeline`: Inspects chronological prehospital event sequences.
- `get_hospital_matches`: Evaluates receiving facility capability fit.
- `detect_missing_data`: Systematically identifies absent diagnostic parameters (e.g., 20WBCT clotting tests, pupil assessment).
- *Strict Boundary*: Mutating tools (e.g., altering patient vitals, confirming plans, assigning hospital bays) are structurally excluded from the tool registry.

### Hospital Coordination & Matching
Dynamic tri-factor facility matching:
- **Clinical Capability Fit (40%)**: Matches patient pathology against hospital facilities (Level-1 trauma suites, toxicology centers, antivenom cold-chain, cath labs).
- **Bay Readiness (30%)**: Real-time availability of designated resuscitation bays and surgical teams.
- **Dynamic ETA (30%)**: Live corridor transit time accounting for urban traffic congestion (`derivedEta = baseEtaMinutes + trafficDelayMinutes`).

### Structured Prehospital Handover
Standardized bedside transfer of care complying with WHO patient safety recommendations:
- **SBAR Handover Package**: Structured Situation, Background, Assessment, and Recommendation summary (`HandoverPackageModel`).
- **Cryptographic Provenance**: RFC 8785 canonical JSON serialization with a SHA-256 cryptographic digest ensuring prehospital record integrity.
- **Multi-Format Export**: Generates standardized JSON records, printable A4 clinical handover documents, and HL7 FHIR R4 Bundle prototypes (`Encounter`, `Condition`, `Observation`, `Provenance`).
- **Two-Party Handshake**: Explicit initiation by the field medic followed by authenticated acceptance by the receiving ED physician.

---

## AI Architecture

PRANA implements a dual-system cognitive architecture designed for low latency, bounded execution, and absolute clinical governance:

```
                      Prehospital Event / Sensor Telemetry / Intake
                                           │
                                           ▼
                               ┌──────────────────────┐
                               │    LAYA (System 1)   │
                               │  Fast-Path Triage    │
                               │  ~421M Parameters    │
                               └───────────┬──────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        │ Fast Path / Tool Bundle / Priority  │
                        ▼                                     ▼
             ┌─────────────────────┐               ┌────────────────────┐
             │   Deterministic     │               │  QWEN3 (System 2)  │
             │   Direct Path       │               │  Bounded Agent     │
             │   (P3 Non-Urgent)   │               │  8.19B Parameters  │
             └─────────────────────┘               └─────────┬──────────┘
                                                             │
                                        ┌────────────────────┴───────────────────┐
                                        ▼                                        ▼
                            ┌───────────────────────┐                ┌───────────────────────┐
                            │ Read-Only Tools       │                │ Missing Data Detector │
                            │ (Case-Scoped Data)    │                │ (Protocol Gaps)       │
                            └───────────┬───────────┘                └───────────┬───────────┘
                                        │                                        │
                                        └────────────────────┬───────────────────┘
                                                             │
                                                             ▼
                                                 ┌───────────────────────┐
                                                 │   Structured Signal   │
                                                 │   (Pydantic Schema)   │
                                                 └───────────┬───────────┘
                                                             │
                                                             ▼
                                                 ┌───────────────────────┐
                                                 │   Safety Validator    │
                                                 │ (Prohibited Actions)  │
                                                 └───────────┬───────────┘
                                                             │
                                                             ▼
                                                 ┌───────────────────────┐
                                                 │ Human Clinician Review│
                                                 │ (Mandatory Handshake) │
                                                 └───────────────────────┘
```

### Cognitive Governance Invariants
1. **Laya (System 1) Does Not Diagnose**: Acts strictly as a rapid triage gate, categorizing case urgency, selecting authorized read-only tool bundles, and determining whether System 2 generative synthesis is required.
2. **Qwen3 (System 2) Does Not Diagnose or Prescribe**: Operates as a bounded analytical assistant synthesizing observable physiological patterns and drafting candidate protocol suggestions.
3. **Zero Mutation Authority**: Neither model possesses tools or permissions to modify patient records, confirm clinical plans, administer medications, alter hospital destinations, or assign resuscitation bays.
4. **Human Authority**: All consequential clinical and operational actions remain under the exclusive control of licensed human clinicians and paramedics.
5. **No Chain-of-Thought Exposure**: Internal model deliberations are strictly contained; only structured, validated clinical outputs with clear rationale are presented to clinicians.

---

## Model Stack

| Component | Model / Engine | Parameter Scale | Runtime / Deployment | Primary Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **System 1 (Fast Triage)** | Laya (`Infin8-AI/laya`) | ~421M | In-process Python engine / Local HTTP | Sub-50ms case triage, urgency tiering, authorized tool bundle selection |
| **System 2 (Bounded Agent)** | Qwen3 (`qwen3:8b`) | 8.19B (`qwen3` arch, Q4_K_M) | Local Ollama (`http://localhost:11434`) | Multi-turn clinical context interrogation, structured signal generation, tool reasoning |
| **Speech-to-Text** | Whisper (`faster-whisper`) | `base.en` | Local CPU / GPU worker | Prehospital voice dispatch and field medic audio narrative transcription |
| **Clinical Safety Layer** | Pydantic v2 + Regex boundary guards | Rule-based engine | In-process FastAPI middleware | Schema enforcement, hallucination suppression, dosage/prohibited-action screening |
| **Simulation Fallback** | Deterministic Emergency Engine | Rule-based matrix | In-process Python / TypeScript | Zero-downtime offline continuity when local LLM services are unreachable |

---

## Safety & Clinical Governance

> **RESEARCH & PROTOTYPE NOTICE**
> PRANA is a research and clinical prototyping platform developed for emergency care coordination demonstration. All clinical rules, scoring formulas, toxindrome patterns, and thresholds implemented in this build are demonstration logic and must not be used as clinical diagnostic criteria in live patient care.

### Structural Safety Invariants
- **No Autonomous Medication or Antidote Administration**: PRANA will never initiate, trigger, or approve drug administration. All protocol recommendations remain in an unconfirmed status until an authenticated clinician clicks `CONFIRM`.
- **No Autonomous Diagnostic Assertion**: Decision support outputs are framed and labeled strictly as *Observable Signals* and *Analytical Patterns*, never as definitive diagnoses.
- **Read-Only Agent Sandbox**: The autonomous tool loop is confined to non-mutating information retrieval tools. Tool definitions are statically validated before execution.
- **Anti-Prompt-Injection Safeguards**: Ingested text and voice narratives are sanitized through boundary checks preventing prompt escape or adversarial protocol modification.
- **Fail-Safe Deterministic Fallback**: If the local LLM runtime encounters latency timeouts, memory exhaustion, or service disconnection, PRANA transitions automatically and transparently to its deterministic clinical rule matrix with clear disclosure on the UI audit banner.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND WORKSPACES                             │
│  React 19 · TypeScript · Vite · Tailwind CSS v4 · Lucide · UI Portal   │
│  [Field Medic]     [Remote Clinician]     [Hospital Command / Ready]   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST / WebSocket
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FASTAPI BACKEND SERVICE                         │
│  Routers: /cases · /clinicians · /hospitals · /handover · /intake      │
│  Security: JWT Bearer Tokens · Role-Based Access Control · Argon2id    │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       DATABASE & EVENT STORE         │  │     REALTIME WEBSOCKET       │
│  SQLite / SQLAlchemy Core            │  │  Case-Scoped Connection Hub  │
│  • emergency_cases table             │  │  • Real-time Vital Broadcast │
│  • timeline_events (Append-Only)     │  │  • Pre-Alert State Sync      │
│  • handover_packages (SHA-256)       │  │  • Event Monotonic Catch-up  │
└──────────────────────────────────────┘  └──────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      AI COORDINATION & AGENT ENGINE                    │
│  AgentOrchestrator · ReadOnlyToolRegistry · ClinicalSafetyValidator   │
│  ┌──────────────────────────────┐    ┌──────────────────────────────┐  │
│  │ Laya System 1 Triage Gate    │───>│ Qwen3 System 2 Bounded Agent │  │
│  │ Fast urgency categorization  │    │ Multi-turn read-only tools   │  │
│  └──────────────────────────────┘    └──────────────────────────────┘  │
│                 │                                   │                  │
│                 └───────────────┬───────────────────┘                  │
│                                 ▼                                      │
│                Local Ollama Runtime / Fallback Engine                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript (strict), Vite 8, Tailwind CSS v4, Lucide React, Context API |
| **Backend** | Python 3.11+, FastAPI 0.115+, Pydantic v2 (strict schemas), SQLAlchemy 2.0+, Uvicorn |
| **Database** | SQLite 3 (WAL mode enabled), SQLAlchemy ORM, append-only event store table |
| **Realtime** | WebSocket protocol (`fastapi.websockets`), case-scoped multi-client broadcast |
| **AI Inference** | Ollama local runtime, Qwen3 8B (Q4_K_M), Laya fast classifier, faster-whisper |
| **Authentication** | JSON Web Tokens (PyJWT, HS256), Argon2id password hashing, RBAC middleware |
| **Standards & Interop** | RFC 8785 Canonical JSON Serialization, SHA-256 digests, HL7 FHIR R4 prototype |
| **Testing & Quality** | Pytest, Pytest-Asyncio, HTTPX TestClient, TSX acceptance harness, Oxlint |

---

## Running Locally

### 1. Clone the Repository
```bash
git clone https://github.com/Suhaid11/PRANA-AGENTS.git
cd PRANA
```

### 2. Frontend Setup
```bash
# Install frontend dependencies
npm install
```

### 3. Backend Setup
```bash
# Create and activate Python virtual environment
python -m venv backend/.venv

# On Linux/macOS:
source backend/.venv/bin/activate
# On Windows (PowerShell):
.\backend\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend/requirements.txt

# Configure environment variables
cp .env.example .env
```

### 4. Local AI Setup (Optional for Full AI Mode)
PRANA runs with full offline capability. To enable real local generative AI:
```bash
# Install Ollama from https://ollama.ai, then start service:
ollama serve

# In a separate terminal, pull the verified Qwen3 model:
ollama pull qwen3:8b
```
*Note: If Ollama is not running, PRANA automatically and transparently operates in deterministic fallback mode with zero crash risk.*

### 5. Start the Application
Start the backend and frontend development servers in separate terminals:

**Terminal 1 — Backend:**
```bash
# From repository root (with virtual environment active):
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```bash
# From repository root:
npm run dev
```

Open your browser to `http://localhost:5173` to access PRANA.

---

## AI Configuration

PRANA's AI behavior is configured through environment variables defined in `.env` (derived from `.env.example`):

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `AI_PROVIDER` | `hybrid` | Active AI provider: `hybrid`, `local`, `laya`, `qwen3`, or `demo` |
| `AI_LAYA_ENABLED` | `true` | Enables System 1 rapid triage classification layer |
| `AI_LAYA_RUNTIME` | `in_process` | Laya execution mode: `in_process` or `http` |
| `AI_QWEN3_ENABLED` | `true` | Enables System 2 bounded agentic generative reasoning |
| `AI_QWEN3_MODEL` | `qwen3:8b` | Ollama model identifier for System 2 agent |
| `AI_QWEN3_BASE_URL` | `http://localhost:11434` | Ollama service API endpoint |
| `AI_MAX_AGENT_ITERATIONS` | `5` | Maximum reasoning loop iterations per agent task |
| `AI_MAX_TOOL_CALLS` | `6` | Upper limit on read-only tool executions per turn |
| `AI_AGENT_TIMEOUT_SECONDS` | `45.0` | Timeout threshold for local model responses |
| `AI_FAIL_OPEN` | `true` | Falls back gracefully to deterministic logic upon error |
| `AI_FALLBACK_PROVIDER` | `demo` | Provider utilized during network or model failure |
| `PRANA_AI_VERIFY_IDENTITY` | `true` | Inspects Ollama model metadata to confirm genuine model architecture |
| `JWT_SECRET` | *(configured)* | Cryptographic key for session token signing |

---

## Testing & Verification

PRANA includes an automated verification pipeline covering backend unit/integration tests, frontend state machine acceptance tests, typechecking, and linting:

### Run Backend Test Suite
```bash
# Run 122+ backend unit, integration, and agent tests:
pytest backend/tests/
```

### Run Frontend State Machine Acceptance Gate
```bash
# Run 15-step end-to-end audit harness across all 4 scenarios (60 assertions):
npm test
```

### Production Build & Typecheck
```bash
# Typecheck and bundle production assets:
npm run build

# Standalone TypeScript check:
npx tsc -b --noEmit
```

### Static Code Analysis
```bash
# Run Oxlint across the TypeScript/React codebase:
npm run lint
```

### Current Verification Metrics
- **State Machine Acceptance Gate**: 60/60 PASS (100% across 4 scenarios)
- **Backend Test Suite**: 122/122 PASS (100% compliance across intake, lifecycle, and agent tests)
- **TypeScript & Vite Build**: Clean build in < 1 second with 0 errors
- **Static Analysis (Oxlint)**: 0 errors across all 48 source modules

---

## Demonstration Walkthrough

To experience the complete prehospital coordination flow, follow this 15-step demonstration sequence:

1. **Mission Portal**: Access `http://localhost:5173`. Review the active case overview. Select Scenario `PR-8492` (Trauma) or ingest a new scenario via the **Intake Modal**.
2. **Field Medic Command Surface**: Switch to the `FIELD_MEDIC` persona using the persona toggle in the navigation header.
3. **Sensor Telemetry**: Observe live, responsive physiological sparklines (HR, SpO2, RR, BP) updating in real time with tabular formatting.
4. **Observable Signals**: Review the AI-generated observable signal indicating worsening Shock Index and suspected retroperitoneal hemorrhage.
5. **Remote Clinician Surface**: Switch to the `REMOTE_CLINICIAN` persona. Observe the 10-minute longitudinal vital sign trends.
6. **Agent Activity Inspection**: Expand the Agent Activity panel to examine Laya System 1 classification, Qwen3 System 2 tool traces, and missing data detection flags.
7. **Protocol Endorsement**: Click **CONFIRM PROTOCOL** to endorse pelvic binder stabilization and permissive hypotension. Observe the action record appended to the Care Rail.
8. **Hospital Matching**: Inspect the facility recommendations. Observe the multi-factor scoring Breakdown (Level-1 trauma capability 40%, bay availability 30%, traffic-adjusted ETA 30%).
9. **Dispatch Pre-Alert**: Trigger the pre-alert notification to the target facility (Manipal Hospital).
10. **Hospital Command Surface**: Switch to the `HOSPITAL_COMMAND` persona. View the incoming ambulance corridor arrival countdown.
11. **Bay Readiness Confirmation**: Confirm resuscitation bay availability (Bay 04 — Red Priority Resuscitation Suite).
12. **Traffic Delay Adaptation**: Trigger a simulated traffic congestion delay (+8 min). Observe synchronized ETA recalibration across both ambulance and hospital surfaces.
13. **Corridor Arrival**: Progress the transit timeline to arrival. Observe ambulance arrival verification.
14. **Bedside SBAR Handover**: On the field medic console, initiate the formal handover package. Inspect the generated SBAR summary and SHA-256 provenance hash.
15. **Transfer Acceptance**: On the receiving ED physician surface, review and click **ACCEPT HANDOVER**. The state machine transitions to `Completed` with an immutable cryptographic handover record.

---

## Prototype Scenarios

PRANA ships with four pre-configured emergency scenarios reflecting critical prehospital challenges:

### 1. Trauma / Road Accident (`PR-8492`)
- **Patient**: Rahul Verma, 34M. High-velocity motor vehicle collision.
- **Clinical Presentation**: Suspected pelvic ring disruption, occult retroperitoneal hemorrhage, progressive tachycardia (HR 112 &rarr; 126 bpm), narrowing pulse pressure (PP < 30 mmHg), elevated Shock Index (> 1.2).
- **Target Facility**: Manipal Hospital (Certified Level-1 Trauma Suite with 24/7 angio-embolization).

### 2. Snakebite / Envenomation (`PR-7104`)
- **Patient**: Sunita Gowda, 28F. Russell's viper bite on the right lower extremity.
- **Clinical Presentation**: Ascending local edema (>10 cm margin progression), coagulopathy risk, 20WBCT whole-blood clotting test deficit. Strict avoidance of tourniquets; immobilization protocol.
- **Target Facility**: Victoria Hospital (Regional Toxicology & Antivenom Center with cold-chain antivenom reserves).

### 3. Toxicology / Pesticide Poisoning (`PR-9521`)
- **Patient**: Manoj Kumar, 45M. Agricultural organophosphate inhalation.
- **Clinical Presentation**: Acute cholinergic toxindrome (SLUDGE syndrome), severe vagal bradycardia (HR 54 &rarr; 42 bpm), oxygen desaturation (SpO2 90% &rarr; 84%), copious bronchorrhea. High-dose atropinization protocol.
- **Target Facility**: MS Ramaiah Medical Center (Toxicology ICU with invasive mechanical ventilation capacity).

### 4. Acute Respiratory Distress (`PR-4018`)
- **Patient**: Radha Sharma, 52F. Acute exacerbation of COPD with severe bronchospasm.
- **Clinical Presentation**: Respiratory fatigue (RR 32 bpm), marked wheezing, refractory hypoxia (SpO2 86% on room air). Non-invasive ventilation (BiPAP) and bronchodilator protocol.
- **Target Facility**: Apollo Hospital (Pulmonary Critical Care Unit).

---

## Data & Privacy

All patient identities, physiological streams, incident locations, and clinical trajectories in PRANA are synthetic and simulated for research demonstration purposes. No protected health information (PHI) or identifiable individual data is utilized.

Production clinical deployment would necessitate:
- Formal compliance with regional health data regulations (HIPAA, DISHA, EU GDPR).
- End-to-end envelope encryption for all WebSocket telemetry streams.
- Zero-trust device attestation for ambulance hardware terminals.
- Institutional Review Board (IRB) oversight and clinical governance protocols.

---

## Limitations

PRANA is an active research prototype and carries the following explicit limitations:

- **Simulated Physiological Streams**: Sensor waveforms and vital sign progressions are generated by mathematical models and pre-configured clinical trajectories rather than physical patient monitoring hardware.
- **Prototype Routing Logic**: Facility matching formulas utilize modeled corridor transit estimates and static capability matrices rather than municipal emergency dispatch computer-aided dispatch (CAD) integration.
- **SaMD Classification**: The system is not certified as Software as a Medical Device (SaMD) by the FDA, EMA, or CDSCO and has not undergone prospective clinical trials.
- **EHR Integration**: Prehospital handover export currently implements prototype HL7 FHIR R4 Bundles; full bidirectional SMART-on-FHIR clinical server synchronization is not yet established.

---

## Development Roadmap

```
CURRENT PROTOTYPE (COMPLETED)
├── Full-stack FastAPI + React 19 architecture
├── 9-stage authoritative emergency lifecycle state machine
├── Real local Qwen3 8B agent loop with read-only clinical tools
├── Laya System 1 rapid triage classification layer
├── Multimodal case intake (Text, Voice via faster-whisper, Files)
├── WHO-aligned bedside handover with SHA-256 cryptographic provenance
└── 60/60 automated state machine integration test pass

NEXT HORIZON (PLANNED)
├── Hardware Telemetry Gateway (Bluetooth LE / Medical serial interface)
├── Prospective multi-center clinical validation study
├── Bidirectional SMART-on-FHIR EHR integration (Epic / Cerner)
├── Offline mesh networking with peer-to-peer CRDT state synchronization
└── Regulatory SaMD compliance submission and clinical audit
```

---

## Project Structure

```
PRANA/
├── backend/                     # FastAPI Application Service
│   ├── app/
│   │   ├── ai/                  # AI Orchestrator, Laya, Qwen3, Tools, Safety
│   │   ├── api/v1/              # REST Endpoints: cases, clinicians, handover, intake
│   │   ├── core/                # Database engine, security, JWT, config
│   │   ├── domain/              # SQLAlchemy models & Pydantic v2 schemas
│   │   ├── engine/              # Deterministic clinical scenario matrices
│   │   ├── realtime/            # WebSocket connection manager & broadcast
│   │   └── services/            # Clinical, event, handover, and intake services
│   ├── tests/                   # Pytest suite (122 unit & integration tests)
│   └── requirements.txt         # Python dependencies
├── datasets/                    # Synthetic evaluation datasets & gold cases
├── docs/                        # Architecture specs, lifecycle docs, handover specs
├── public/                      # Static assets and icons
├── scripts/                     # State machine test harness & verification tools
│   ├── audit-state-machine.ts   # 15-step 4-scenario acceptance test
│   └── run_browser_e2e.py       # End-to-end browser verification script
├── src/                         # React 19 Frontend Application
│   ├── auth/                    # JWT authentication context and persona badges
│   ├── components/
│   │   ├── ambulance/           # Field medic workspace & sensor sparklines
│   │   ├── clinician/           # Specialist workspace, trend charts, AI panel
│   │   ├── conduit/             # Care Conduit spatial progress centerpiece
│   │   ├── hospital/            # Hospital Command & bay readiness console
│   │   ├── portal/              # Mission portal & multimodal intake modal
│   │   ├── shell/               # Global PranaShell layout & navigation rail
│   │   └── timeline/            # Care Rail chronological event stream
│   ├── context/                 # EmergencyContext, state machine, and engine hooks
│   ├── services/api/            # Clean client API adapters & WebSocket hooks
│   └── types/                   # Strict TypeScript domain interfaces
├── AGENTS.md                    # Operational context & project specifications
├── ARCHITECTURE.md              # Full-stack architectural specification
├── DESIGN-SYSTEM.md             # Clinical Spatialism design token reference
├── package.json                 # Frontend dependencies & npm scripts
└── vite.config.ts               # Vite bundler configuration
```

---

## Contributing

Contributions to PRANA are welcome for research, architectural improvements, and bug fixes. Please follow these guidelines:
1. Ensure all code adheres to TypeScript strict mode and Pydantic v2 validation standards.
2. Maintain clinical governance boundaries: AI components must never be granted mutation authority.
3. Verify that all test suites pass before submitting pull requests:
   ```bash
   pytest backend/tests/ && npm test && npm run build && npm run lint
   ```

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## Medical & Regulatory Disclaimer

PRANA is an experimental software research prototype designed for emergency coordination and clinical decision support evaluation. It is **not** a certified medical device, does not provide autonomous clinical diagnoses, and must **never** be used as a substitute for professional medical judgment, licensed physician consultation, or official emergency dispatch services. In a genuine medical emergency, immediately contact your local emergency response service (e.g., 112, 911, 999).
