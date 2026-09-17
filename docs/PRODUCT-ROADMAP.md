# PRANA — 3-Day Sprint Roadmap, Scope Cuts & Competition Alignment

> **Target Competition Date:** Saturday, September 19, 2026 (~3 Days)  
> **Challenge Track:** AI in Healthcare · Individual Software Solution (1 Participant)  
> **Prime Directive:** Working End-to-End Core Workflow > Feature Quantity.

---

## 1. The Calibrated 3-Day Implementation Schedule

### Day 1: Shell + One Working Emergency Case (Wed, Sep 16) — COMPLETED
- [x] Phase 0: Design Research, Architecture Specs, Design DNA, Tokens, Blueprints.
- [x] Initialize frontend repository (React 19 + TypeScript + Vite + Tailwind CSS + Lucide).
- [x] Implement design system tokens, typography (tabular nums), and CSS variables.
- [x] Build global `PranaShell` with Command Bar, Role Switcher, and `DEMO MODE` indicator.
- [x] Implement **Care Conduit** visual prototype in the center hero.
- [x] Implement **Field Medic Surface** (`/ambulance`) with patient profile and live vitals stream.
- [x] Implement basic **Event Timeline** logging.
- [x] **Day 1 Goal Gate:** An emergency case is created → ambulance loads → vitals stream → timeline logs events.

### Day 2: Intelligence, Clinician, Facility Matching & Hospital (Thu, Sep 17) — COMPLETED
- [x] Build **AI Decision Support** with observable signal detection (HR, SpO2, BP) and clinical significance explanation.
- [x] Build **Remote Clinician Workspace** (`/clinician`) with clinical protocol review actions (`CONFIRM`, `REQUEST MORE DATA`, `ESCALATE`, `ACKNOWLEDGE`).
- [x] Build **Facility Matching Engine** with transparent **"Why This Hospital?"** explanation card (40/30/30 formula).
- [x] Build **Hospital Readiness Console** (`/hospital`) with capability checklist & bay allocation handshake.
- [x] Implement pre-alert dispatch and receipt flow.
- [x] State machine acceptance test harness: **42/42 assertions PASSING**.

### Day 3: Freeze, Polish & Demo-Ready (Fri, Sep 18) — COMPLETED & FROZEN
- [x] Overhaul **Care Rail** from card timeline into an open operational **mission telemetry rail** with continuous connecting track, unclipped milestones, tabular timestamps, and structured audit log.
- [x] Build **Competition Demo Director** (`Ctrl + Shift + D`) as a thin wrapper over tested context methods for deterministic stage delivery.
- [x] Full dry-run browser recordings captured for all 3 scenarios (`docs/recordings/`):
  - Trauma (`prana_trauma_demo.webp` · 9.26 MB)
  - Snakebite (`prana_snakebite_demo.webp` · 7.03 MB)
  - Poisoning (`prana_poisoning_demo.webp` · 10.38 MB)
- [x] Verify **Horizontal Overflow Gate** (`scrollWidth - clientWidth === 0`) at 390px, 768px, 1024px, 1440px.
- [x] Prepare comprehensive **Judge Q&A Prep Sheet** (`docs/JUDGE_QA_PREP.md`) and **Rehearsal Checklist** (`docs/DAY3-CHECKLIST.md`).
- [x] Final production build freeze (`tsc -b && vite build`) with zero errors.
- [x] Git tagged release: `v1.0-competition`.

---

## 2. Competition & Regulatory Safeguards

- **Individual Participant Requirement:** The submitted codebase and presentation are architected as an individual software contribution. All code, design tokens, and components are original and verifiable.
- **Responsible Healthcare AI:** PRANA explicitly disclaims autonomous medical diagnosis, prescribing, or drug administration. AI output is strictly decision support highlighting observable physiological patterns for qualified clinical physician review.
- **100% Offline Resilience:** The application is self-contained with zero required external network calls during the live demonstration.
