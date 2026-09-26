<div align="center">

# PRANA (प्राण)
### *Where the Journey Becomes Care.*

**Unbroken Prehospital Emergency Coordination & Tele-Specialist Intelligence Platform**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![State Machine](https://img.shields.io/badge/State_Engine-45%2F45_PASS-10B981?style=flat-square&logo=checkmarx&logoColor=white)](#-acceptance-gate--deterministic-engine)
[![Lighthouse](https://img.shields.io/badge/Lighthouse-93_Perf_%7C_91_A11y-00CC66?style=flat-square&logo=lighthouse&logoColor=white)](#-performance--accessibility)
[![Offline First](https://img.shields.io/badge/Architecture-100%25_Offline_Deterministic-blueviolet?style=flat-square)](#-offline-first-architecture)
[![License](https://img.shields.io/badge/License-MIT-slate?style=flat-square)](LICENSE)

<br />

> *"If the ambulance cannot beat the traffic, the treatment should not have to wait for it."*

</div>

---

## 🚨 The Emergency Care Thesis

In traditional emergency medical systems, **prehospital transit time is dead time**. 

An ambulance sits stranded in congested city corridors while vital signs deteriorate, the remote physician remains disconnected from the stretcher, and the receiving trauma center only discovers what they are facing the moment the wheels hit the emergency bay.

**PRANA converts prehospital transit into active clinical stabilization time.**

```
                                      ┌────────────────────────┐
                                      │   REMOTE SPECIALIST    │
                                      │  (Clinical Authority)  │
                                      └───────────▲────────────┘
                                                  │
                             [2. Explainable Signals / Telemetry]
                             [3. Protocol Endorsement Handshake ]
                                                  │
┌─────────────────────────┐           ┌───────────┴────────────┐           ┌─────────────────────────┐
│     FIELD PARAMEDIC     │ ────────> │      CARE CONDUIT      │ ────────> │     RECEIVING ED BAY    │
│  (Ambulance Workspace)  │  [1. Send │   (Bi-Directional Locus│  [4. Pre- │  (Hospital Readiness)   │
│  Continuous Telemetry   │   Package]│   & Shared Timeline)   │   Alert]  │  Sterile Resuscitation  │
└─────────────────────────┘           └────────────────────────┘           └─────────────────────────┘
                                                  │
                                     [5. Synchronized ETA +8m ]
                                     ["Care Continues In Delay"]
```

---

## ✨ Key Architectural Innovations

### 1. 🩸 Continuous Sensor Telemetry & Contained Sparklines
- Real-time tabular figures (`font-tabular`) for Heart Rate, SpO2, Respiratory Rate, and Blood Pressure (`118/76 mmHg`).
- Proportional vector waveforms calibrated in responsive coordinate geometry (`viewBox="0 0 100 32"`) with zero boundary clipping or horizontal page scroll.

### 2. 📦 Paramedic → Clinical Decision Support (CDS) Operational Handoff
- Data does not magically appear to remote doctors. The field paramedic explicitly triggers `[SEND TO CLINICAL DECISION SUPPORT]`.
- Generates an immutable snapshot containing patient identity, presenting complaint, vital streams, recent interventions, observable toxidrome/trauma markers, and derived ETA.
- Remote Clinician workspace displays an explicit `AWAITING AMBULANCE DATA` holding banner prior to transmission, transitioning to `NEW AMBULANCE DATA RECEIVED` upon packet receipt.

### 3. 🧠 Observable Signals Synthesis (Explainable AI Decision Support)
- Transparent, deterministic clinical decision engine.
- Flags dynamic clinical deterioration patterns:
  - **Shock Index** ($\text{HR} / \text{SBP} > 1.0$)
  - **Narrowing Pulse Pressure** ($\text{PP} < 30\text{ mmHg}$)
  - **SLUDGE Cholinergic Toxidrome** (Organophosphate crisis)
  - **Whole Blood Clotting Failure Risk** (Russell's viper envenomation)
- **Strict Governance Rule**: *AI never prescribes or administers drugs.* Recommendations remain advisory until validated by human clinician endorsement (`CONFIRMED` + Timestamp + Doctor ID).

### 4. 🏥 "Why This Hospital?" Dynamic Facility Matching
- Triages beyond raw geographic distance using an explainable **40 / 30 / 30 multi-attribute algorithm**:
  $$\text{Match Score} = 0.40 \times \text{Clinical Fit} + 0.30 \times \text{Live Availability} + 0.30 \times \text{Corridor ETA}$$
- Real-time capacity awareness: if a Level-1 bay enters diversion or goes occupied, PRANA dynamically recalculates and recommends the next best regional center.

### 5. ⏱️ Single Source of Truth Derived ETA
- All workspaces consume a single, synchronized derived transit state:
  $$\text{Derived ETA} = \text{Base ETA} + \text{Traffic Delay}$$
- When arterial corridor congestion strikes (+8 min), the interface asserts:  
  **`TRANSPORT DELAY — CARE CONTINUES`**  
  The remote clinician stays linked, vital monitoring persists, and the receiving hospital maintains active sterile standby.

---

## 🖥️ The Four Unified Command Surfaces

| Workspace | Domain Role | Primary Operational Surface |
| :--- | :--- | :--- |
| **Mission Portal** (`PORTAL`) | System Orchestrator | High-density scenario launcher, global emergency switcher, and offline demonstration launcher. |
| **Field Medic Command** (`FIELD_MEDIC`) | Paramedic Unit | Asymmetric 3-column cockpit: Patient Card (AVPU/GCS/Bleeding), Care Conduit center anchor, streaming telemetry cards, and explicit `[SEND TO CDS]` operational transmission. |
| **Remote Clinician Review** (`REMOTE_CLINICIAN`) | Tele-Specialist | Specialist authority console: Observable signals synthesis, 10-minute multi-stream trend analysis, and authoritative protocol actions (`CONFIRM`, `REQUEST DATA`, `ESCALATE`, `ACKNOWLEDGE`). |
| **Hospital Command & Bay Readiness** (`HOSPITAL_COMMAND`) | Receiving Facility | Receiving ED command: Inbound corridor countdown, capability verification checklist (CT, Blood Bank, Surgery, ICU), and sterile resuscitation bay confirmation handshake. |

---

## 🎯 Three Clinical Scenarios

PRANA includes 3 deterministic prehospital emergency scenarios:

### 1. 🚗 Trauma / Road Accident (`PR-8492`)
- **Patient**: Rahul Verma, 34M — High-velocity motor vehicle collision.
- **Clinical Picture**: Suspected pelvic disruption, retroperitoneal hemorrhage. Progressive tachycardia (HR 112 $\rightarrow$ 126+ bpm), narrowing pulse pressure (PP 34 mmHg), elevated Shock Index ($1.14 \rightarrow 1.23$).
- **Destination**: Manipal Hospital (Certified Level-1 Trauma Suite with 24/7 angio-embolization and Red Bay 1).

### 2. 🐍 Snakebite / Envenomation (`PR-7104`)
- **Patient**: Sunita Gowda, 28F — Russell's viper bite on right lower limb in peri-urban nursery.
- **Clinical Picture**: Rapidly ascending local edema (>10 cm from puncture site), 20WBCT whole blood clotting failure risk, strict avoidance of arterial tourniquets.
- **Destination**: Victoria Hospital (Regional Toxicology & Antivenom Center with cold-chain ASV stock).

### 3. 🧪 Poisoning / Toxicology (`PR-9521`)
- **Patient**: Manoj Kumar, 45M — Agricultural organophosphate pesticide inhalation in greenhouse.
- **Clinical Picture**: Severe cholinergic crisis (SLUDGE syndrome), vagal bradycardia (HR 54 $\rightarrow$ 42 bpm), SpO2 90% $\rightarrow$ 84%, copious bronchorrhea.
- **Destination**: MS Ramaiah Medical Center (Dedicated Toxicology ICU with mechanical ventilation and atropine titration).

---

## 🕹️ Product-First vs Demo Mode

PRANA is built **Product-First**:

- **Default State (`PRODUCT MODE`)**:
  - The application opens into a clean, operational clinical interface.
  - Zero presenter toolbars, zero floating buttons, zero presentation clutter.
  - Paramedics, clinicians, and ED nurses interact solely through native clinical controls.
- **Presentation Layer (`DEMO MODE`)**:
  - Click the **`● PRODUCT MODE`** header pill or press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd> to unlock the **Demo Director**.
  - Provides a 10-Act scripted presenter drawer for staged walkthroughs:
    - *Act 1: Emergency Reported*
    - *Act 2: Care Begins in Field*
    - *Act 3: Send Ambulance Data to CDS*
    - *Act 4: Deteriorate & AI Signal*
    - *Act 5: Clinician Endorsement*
    - *Act 6: Mutate Facility Match (Live Diversion Shift)*
    - *Act 7: Pre-Alert Hospital*
    - *Act 8: Traffic Congestion (+8m Care Continues)*
    - *Act 9: Confirm Bay Sterile & Ready*
    - *Act 10: Bedside Handover & Reset*
  - **Zero Duplicate Logic**: The Demo Director is a thin caller invoking the exact same `EmergencyContext` actions.

---

## 🧪 Acceptance Gate & Deterministic Engine

PRANA includes an automated 15-step end-to-end integration harness executing across all 3 scenarios:

```bash
npm test
```

```text
========================================================================================
  PRANA — Full Prototype Integration Audit: 15-Step End-to-End Acceptance Test Harness
========================================================================================

----------------------------------------------------------------------------------------
  FINAL AUDIT PASS/FAIL MATRIX (15 Steps × 3 Scenarios = 45 Assertions)
----------------------------------------------------------------------------------------
Step  Milestone / State Transition        Trauma        Snakebite     Poisoning     
====================================================================================
#1    SCENARIO START                      ✓ PASS        ✓ PASS        ✓ PASS
#2    PATIENT registered                  ✓ PASS        ✓ PASS        ✓ PASS
#3    VITAL CHANGE                        ✓ PASS        ✓ PASS        ✓ PASS
#4    AI SIGNAL                           ✓ PASS        ✓ PASS        ✓ PASS
#5    CLINICIAN ALERT                     ✓ PASS        ✓ PASS        ✓ PASS
#6    CLINICIAN CONFIRM                   ✓ PASS        ✓ PASS        ✓ PASS
#7    FACILITY MATCH (Recalc + Mutate)    ✓ PASS        ✓ PASS        ✓ PASS
#8    HOSPITAL PRE-ALERT                  ✓ PASS        ✓ PASS        ✓ PASS
#9    HOSPITAL ACKNOWLEDGE                ✓ PASS        ✓ PASS        ✓ PASS
#10   HOSPITAL READY                      ✓ PASS        ✓ PASS        ✓ PASS
#11   TRAFFIC DELAY                       ✓ PASS        ✓ PASS        ✓ PASS
#12   ETA UPDATE (Multi-View Sync)        ✓ PASS        ✓ PASS        ✓ PASS
#13   CARE CONTINUES                      ✓ PASS        ✓ PASS        ✓ PASS
#14   TIMELINE RECORD (Care Rail Shared   ✓ PASS        ✓ PASS        ✓ PASS
#15   CDS DATA HANDOFF                    ✓ PASS        ✓ PASS        ✓ PASS
====================================================================================
TOTAL ASSERTIONS: 45/45 PASSED

--- Multi-Scenario Transition & Reset Cycle Verification ---
✓ Reset Cycle Verified: TRAUMA → RESET → SNAKEBITE → RESET → POISONING → RESET without browser reload. Zero cross-scenario leakage.

★★★ ALL 45 ACCEPTANCE GATES PASSED — FULL PROTOTYPE STATE MACHINE INTEGRATION PROVEN ★★★
```

---

## ⚡ Quickstart & Local Setup

### Prerequisites
- Node.js `20.x` or later
- npm `10.x` or later

### Installation
```bash
# Clone the repository
git clone https://github.com/Suhaid11/PRANA.git
cd PRANA

# Install dependencies
npm install

# Start local dev server
npm run dev
```

### Production Build & Verification
```bash
# Run the 45-step state-machine acceptance audit
npm test

# Run Oxlint (0 errors, 0 warnings enforced)
npm run lint

# Build optimized production bundle (<500ms build time)
npm run build

# Preview production build locally
npm run preview -- --port 4173
```
Open **`http://localhost:4173/`** to view the live production build.

---

## 🤖 AI Provider Setup & Agentic Benchmark

PRANA's **Agentic Clinical Coordination Engine** operates without paid cloud API dependencies.

### OPTION A — DEMO (Zero Setup)
Runs 100% locally with deterministic clinical simulation logic.
```bash
# In backend/.env
AI_PROVIDER=demo

# Run the 22-case synthetic benchmark
cd backend
python -m app.ai.evaluation.run --provider demo
```

### OPTION B — LOCAL OPEN MODEL (Recommended for Competition)
Runs on your local machine using open-weight foundation models via Ollama or vLLM:
1. **Install Ollama**: [https://ollama.com](https://ollama.com)
2. **Download Model**:
   ```bash
   ollama pull qwen2.5:3b
   ```
3. **Configure Environment** (`backend/.env`):
   ```env
   AI_PROVIDER=local
   AI_LOCAL_RUNTIME=ollama
   AI_LOCAL_BASE_URL=http://localhost:11434
   AI_LOCAL_MODEL=qwen2.5:3b
   ```
4. **Verify Health**:
   ```bash
   curl http://localhost:8000/api/v1/ai/provider-status?provider=local
   ```
5. **Run Agentic Benchmark**:
   ```bash
   python -m app.ai.evaluation.run --provider local
   ```

### OPTION C — OPTIONAL CLOUD
Only if explicitly configured for cloud evaluation:
```env
AI_PROVIDER=cloud
AI_API_KEY=sk-...
AI_CLOUD_MODEL=gpt-4o-mini
```


---

## 🎨 Design DNA: Clinical Spatialism

PRANA adheres to **Clinical Spatialism**—a bespoke design philosophy created specifically for high-stress prehospital operations:

- **Calm, High-Density Palette**: Deep mission slate (`#0C1220`), crisp porcelain foundation (`#EEF1F6`), and authoritative cobalt (`#0E62FE`).
- **Tabular Figures**: Every numeric vital, time duration, and score uses `font-tabular` numerals to prevent layout shifting during high-frequency telemetry updates.
- **Medical Iconography**: Exclusively rendered using **Lucide React** clinical glyphs. Zero frivolous emojis.
- **Care Rail Timeline**: A single, shared chronologically descending event track (`activeCase.timeline`) providing an immutable operational audit trail from first 108 report to bedside handover.

---

## 🛡️ Clinical Governance Disclaimer

> **Demonstration Logic Disclaimer**:  
> PRANA is an individual software prototype developed for clinical coordination modeling and competition demonstrations. All physiological thresholds (shock index, hypoxia alerts, toxindrome indicators) represent deterministic demonstration logic and are **not** validated clinical decision algorithms for direct patient diagnostic use. In all operations, PRANA acts strictly as decision support; ultimate clinical authority rests with licensed human medical professionals.

---

<div align="center">

**PRANA — Where the Journey Becomes Care.**  
*Built with React 19, TypeScript, Vite & Tailwind CSS.*

</div>
