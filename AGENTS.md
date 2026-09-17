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

- **Build Tooling**: `npm run build` cleanly generates production bundle (`dist/`).
- **State Machine Acceptance Gate**: 14-step automated acceptance test across all 3 scenarios (`npm test` / `npm run test:audit`) — **42/42 PASS**.
- **Multi-Scenario Reset**: Deterministic in-memory reset cleanly verified across scenarios (`TRAUMA → RESET → SNAKEBITE → RESET → POISONING → RESET`).
- **Lighthouse Performance & Accessibility**:
  - Performance: **93** (Green)
  - Accessibility: **91** (Green)
- **Skills Installed**: `.agents/skills/anti-ui-slop` and `.agents/skills/frontend-lighthouse`.
- **Current Phase**: Day 2 Integration Audit & State Machine Hardening (**COMPLETED**). Day 3 Polish, Rehearsal & Freeze (**AWAITING USER GO-AHEAD**).
