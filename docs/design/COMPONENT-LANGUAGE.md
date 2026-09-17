# PRANA — Reusable Component Language & Design System Specifications

> **Component Philosophy:** "High-Agency Tactical Primitives · Strict Semantic Hierarchy"

---

## 1. Primary Component Taxonomy

```
UI Architecture:
├── Layout & Shell
│   ├── PranaShell (App framework, universal header, role switcher, simulation HUD)
│   └── CommandSurface (Elevated floating canvas with soft inner rim reflection)
│
├── Visual Focal Anchors
│   ├── CareConduitHero (Interactive Pulse × Route signature visualization)
│   └── PatientIdentityHero (Human-centered demographic & triage banner)
│
├── Telemetry & Physiological Signals
│   ├── VitalMetricBlock (Tabular numerals, trend sparkline, calibrated threshold badges)
│   └── ShockIndexGauge (Physiological ratio calculator & indicator)
│
├── Clinical Decision & AI Support
│   ├── AIAssessmentCard (Explainable deterioration signals, confidence, action directive)
│   └── ClinicianOrderDrawer (One-touch endorsement, escalation, and protocol orders)
│
├── Facility & Coordination
│   ├── FacilityMatchCard (Transparent multi-factor suitability equation & criteria)
│   └── HospitalReadinessGrid (Bay, ICU, CT, surgical team, and blood product status chips)
│
├── Audit & Chronology
│   └── PulseTimeline (Continuous vertical/horizontal event conduit with expanding audit details)
│
└── Simulation & Demo Controls
    └── SimulationDirector (Scenario launcher, playback controls, traffic delay toggle, state reset)
```

---

## 2. Deep Component Specifications

### 1. `CareConduitHero` (Signature Visual Motif)
- **Role:** Central visual anchor grounding the emergency state.
- **Visual Structure:** A stylized SVG line that combines the continuous rhythm of a patient's ECG waveform with the geographic curves of the ambulance route.
- **Dynamic States:**
  - *Stable Transit:* Gentle flowing blue pulse (`#0E62FE`), steady heartbeat cadence.
  - *Deterioration Active:* Pulse accelerates, wave amplitude increases, color shifts toward amber/crimson.
  - *Traffic Delay:* Route path shows an amber congestion node; a visual branching line highlights that tele-clinician bandwidth and hospital pre-alert remain completely open and uninterrupted.

### 2. `VitalMetricBlock`
- **Props:**
  - `label`: string (e.g. "HEART RATE", "SpO2", "BLOOD PRESSURE")
  - `value`: string | number (e.g. 118, 91, "92/60")
  - `unit`: string (e.g. "bpm", "%", "mmHg")
  - `trend`: 'UP' | 'DOWN' | 'STABLE'
  - `status`: 'NORMAL' | 'WARNING' | 'CRITICAL'
  - `sparklineData`: number[]
- **Anatomy:**
  - Top: Label (11px uppercase) + Trend Delta Chip.
  - Middle: Big Tabular Numeral (`text-3xl font-bold font-mono`).
  - Bottom: Sparkline SVG with baseline guide + normal range boundary.

### 3. `AIAssessmentCard`
- **Rule:** Never display a black-box percentage without visible clinical reasoning.
- **Anatomy:**
  1. *Risk Header:* High / Moderate / Low badge with timestamp.
  2. *Observed Physiological Triggers:* Bulleted evidence (e.g., "Narrowing pulse pressure (32 mmHg)", "Hypoxia refractory to room air").
  3. *Underlying Algorithmic Rule:* Formatted equation (e.g., $\text{Shock Index} = \frac{\text{HR}}{\text{SBP}} = \frac{118}{92} = 1.28 > 0.9$).
  4. *Recommended Next Action:* "Physician clinical review requested before administering IV TXA."

### 4. `FacilityMatchCard`
- **Anatomy:**
  - Hospital Name, Distance, Real-time Traffic-adjusted ETA.
  - Capability Matrix: Trauma Level, ICU Availability, CT Status, On-duty Specialists.
  - Match Score Pill: 96% Match with hoverable breakdown tooltip.
  - Primary Action: `[SELECT RECEIVING FACILITY & TRANSMIT PRE-ALERT]`.

### 5. `PulseTimeline`
- **Anatomy:**
  - Unbroken vertical conduit line with pulsing active node.
  - Timestamp in tabular monospace (`09:43:14`).
  - Event title (e.g., "AI Flag: Hemorrhagic Shock Pattern").
  - Actor Pill (`SYSTEM` | `MEDIC` | `CLINICIAN` | `RECEIVING ED`).
  - Expandable accordion detail showing clinical actions taken.

### 6. `SimulationDirector`
- **Floating Bar (Bottom-Center of Screen):**
  - Scenario Selector: `[Trauma | Snakebite | Poisoning]`
  - Play / Step Forward / Auto-Advance controls.
  - Quick-Trigger: `[SIMULATE TRAFFIC CONGESTION]`
  - Reset: `[RESTART MISSION]` (instantly resets database and memory store).
