# PRANA — Information Architecture & Navigation Hierarchy

> **Architecture Principle:** "One Active Case, Role-Calibrated Surfaces"  
> **Goal:** High cohesion, zero cognitive friction, instantaneous context switching during competition presentations.

---

## 1. High-Level Navigation Topology

PRANA adopts a **Unified Command Framework**. Rather than fragmenting the application into disconnected silos, every screen is anchored to the active `EmergencyCase`.

```
                    ┌─────────────────────────────────────────┐
                    │      PRANA Global Command Header        │
                    │  [Brand] [Active Case ID] [ETA Pill]   │
                    │  [Role Switcher] [Simulation Director]  │
                    └───────────────────┬─────────────────────┘
                                        │
         ┌───────────────┬──────────────┼──────────────┬───────────────┐
         ▼               ▼              ▼              ▼               ▼
   ┌───────────┐   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────────┐
   │  MISSION  │   │   FIELD   │  │ CLINICIAN │  │ HOSPITAL  │  │  INVENTORY  │
   │  PORTAL   │   │ COMMAND   │  │  REVIEW   │  │ READINESS │  │ & LOGISTICS │
   │    (/)    │   │(/ambulance│  │(/clinician│  │(/hospital)│  │(/inventory)│
   └───────────┘   └───────────┘  └───────────┘  └───────────┘  └─────────────┘
         ▲               ▲              ▲              ▲               ▲
         └───────────────┴──────────────┴──────────────┴───────────────┘
                                        │
                                        ▼
                    ┌─────────────────────────────────────────┐
                    │     Integrated Living Event Timeline    │
                    │   (Underlying Every Role & Action)      │
                    └─────────────────────────────────────────┘
```

---

## 2. Core Workspaces Defined

### 1. Mission Portal (`/`)
- **Dominant Question Answered:** *"What is the state of our active prehospital emergency fleet?"*
- **Primary Hero Element:** The Care Journey Visualizer (Incident → Ambulance → Hospital) and Scenario Launcher.
- **Key Actions:**
  - Launch Synthetic Demo Scenario (Trauma, Snakebite, Toxicology).
  - Inspect Active Emergency Fleet status.
  - Reset / Replay simulation state.

### 2. Field Medic Command Surface (`/ambulance`)
- **Dominant Question Answered:** *"What is happening to my patient right now, and what intervention is required?"*
- **Primary Hero Element:** Central Journey & Vital Stream Focal Surface.
- **Sub-Panels:**
  - **Left Rail:** Patient Identity, Emergency Domain Tag, Triage Severity, GCS / AVPU Score.
  - **Center Hero:** Active Transit Path, Speed, Live Traffic Status, ETA, and Care Milestones.
  - **Right Rail:** High-visibility Telemetry (HR, SpO2, BP, RR, Temp) with trend sparklines and AI Deterioration Flags.
  - **Bottom Dock:** Field Interventions (Oxygen titration, IV access, Tourniquet, Splint, Antivenom preparation).

### 3. Remote Clinician Workspace (`/clinician`)
- **Dominant Question Answered:** *"What urgent clinical decision requires my expertise right now?"*
- **Primary Hero Element:** Telemetry Deterioration Analysis & AI Decision Support Card.
- **Sub-Panels:**
  - **Deterioration Summary:** What physiology is trending abnormal, evidence timeline, and baseline comparisons.
  - **AI Explainability Matrix:** Mathematical confidence, physiological triggers, differential risks.
  - **Action Controls:**
    - `[CONFIRM INTERVENTION]` — Endorse field medic treatment plan.
    - `[REQUEST TELEMETRY]` — Request targeted field assessment (e.g. neuro check, repeat BP).
    - `[TRIGGER FACILITY ESCALATION]` — Override routing to Level-1 Trauma or Toxicology Center.

### 4. Hospital Readiness Console (`/hospital`)
- **Dominant Question Answered:** *"What patient is arriving, at what exact minute, and are our bays and specialists prepped?"*
- **Primary Hero Element:** Real-time Arrival Countdown & Trauma Bay Status Grid.
- **Sub-Panels:**
  - **Pre-Alert Notification:** Audible/Visual alert receipt with 1-click Acknowledgment.
  - **Resource Preparation Matrix:**
    - Trauma Resuscitation Bay: `[READY / PREPARING / OCCUPIED]`
    - Critical Care ICU Bed: `[RESERVED / ASSIGNING / FULL]`
    - Diagnostic CT Scanner: `[ON STANDBY / IN USE]`
    - Trauma Surgical Team: `[PAGED / AT BAYSIDE]`
    - Blood Bank (O-Neg Units): `[CROSS-MATCHING / DELIVERED]`
  - **Bedside Handover Voucher:** Digital pre-arrival summary prepared for the incoming paramedic.

### 5. Medicine & Equipment Inventory (`/inventory`)
- **Dominant Question Answered:** *"Are onboard emergency supplies stocked, verified, and unexpired for this mission?"*
- **Primary Content:** Clean tabular grid of critical emergency supplies (IV fluids, Tranexamic Acid, Polyvalent Antivenom, Atropine, Intubation kits, Defibrillator pads).
- **Subtle Status Chips:** `[STOCKED]` (Green), `[LOW STOCK]` (Amber), `[EXPIRING SOON]` (Amber), `[DEPLETED]` (Red).

---

## 3. The Gravitational Core: The `EmergencyCase` Object

Every view and service subscribes to the canonical `EmergencyCase`:

```typescript
interface EmergencyCase {
  id: string;                      // e.g. "PRANA-CASE-8492"
  status: EmergencyStatus;         // DISPATCHED | ONBOARD | IN_TRANSIT | ARRIVED | HANDED_OVER
  domain: 'TRAUMA' | 'SNAKEBITE' | 'POISONING';
  patient: PatientProfile;         // Name, age, sex, chief complaint, baseline
  ambulance: AmbulanceUnit;        // Call sign, crew, vehicle status, GPS coordinates
  telemetry: VitalSignSnapshot[];  // Time-series array (HR, SpO2, SBP, DBP, RR, Temp)
  aiAssessment: AIAssessment;      // Deterioration flag, risk score, clinical triggers
  clinicianReview: ClinicianReview;// Review status, reviewing physician, approved orders
  facilityMatch: FacilityMatch;    // Recommended hospital, suitability score, criteria breakdown
  hospitalAlert: HospitalAlert;    // Alert status, acknowledgement timestamp, readiness grid
  transit: TransitTelemetry;       // Distance remaining, ETA, speed, traffic congestion level
  timeline: TimelineEvent[];       // Microsecond chronological event log
}
```
