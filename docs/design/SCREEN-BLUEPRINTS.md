# PRANA — Screen Blueprints & Wireframe Specifications

> **Core Layout Philosophy:** "Clinical Spatialism · Large Focal Care Conduit · Floating Secondary Modules · Zero Clutter"

---

## Blueprint 1: Mission Portal (`/`)

### Purpose
Establish the PRANA world, articulate the core philosophy ("Where the Journey Becomes Care"), provide situational awareness of prehospital emergency coordination, and allow 1-click launch of the 3 standardized demo scenarios.

### Composition & Layout
- **Hero Stance:** Spacious, serene typography introducing PRANA.
- **Demo Mode Pill:** Visible, elegant badge indicating `DEMO MODE · OFFLINE-READY LOCAL ENGINE`.
- **Unified Scenario Selector Dock:**
  1. `SCENARIO 1: TRAUMA / ROAD ACCIDENT` (Male, 34, blunt trauma, hemorrhagic deterioration pattern)
  2. `SCENARIO 2: SNAKEBITE / ENVENOMATION` (Female, 28, Russell's viper bite, coagulopathy pattern)
  3. `SCENARIO 3: POISONING / TOXICOLOGY` (Male, 42, suspected organophosphate, cholinergic pattern)
- **Fleet Situational Bar:** Coordinated prehospital metrics (Ambulances active, receiving network readiness).

---

## Blueprint 2: Field Medic Command Surface (`/ambulance`)

### Spatial Composition (Central Focal Anchor + Floating Peripheral Modules)
Avoid rigid 4-column card walls. Use an open canvas with floating, elevated surfaces:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [PRANA FIELD]  CASE: #PR-8492  [DEMO MODE]  DESTINATION: MANIPAL HOSPITAL  │
├─────────────────┬─────────────────────────────────────────┬─────────────────┤
│ FLOATING LEFT:  │            CENTER FOCAL HERO:           │ FLOATING RIGHT: │
│ PATIENT CONTEXT │             THE CARE CONDUIT            │   LIVE VITALS   │
│                 │                                         │   & SIGNALS     │
│ • Rahul Verma   │              INCIDENT (00:00)           │                 │
│   Male, 34      │                     ●                   │ • HR: 118 bpm ⚠️│
│ • Category: RED │                     │                   │ • SpO2: 91% 🚨  │
│ • Priority: MVC │             PATIENT ONBOARD             │ • BP: 92/60 ⚠️  │
│ • GCS: 13       │                     ●                   │ • RR: 24 /min   │
│                 │                     │                   │                 │
│ RAPID CLINICAL  │          AMBULANCE ECHO-4 (TRANSIT)     │ OBSERVABLE      │
│ OBSERVATIONS:   │          ●━━━━━━━━━━━━━━● (ETA: 14 min) │ SIGNALS ALERT:  │
│ [Airway Patent] │                         │               │ [Deterioration  │
│ [Chest Tender]  │                    CLINICIAN            │  Flag Active]   │
│ [Pelvic Stable] │                         ●               │                 │
│                 │                         │               │ PROTOCOL STATUS:│
│                 │                   HOSPITAL READY        │ • High-Flow O2  │
│                 │                         ●               │ • IV Access     │
│                 │                         │               │ • Clinician     │
│                 │                      ARRIVAL            │   Notified      │
├─────────────────┴─────────────────────────────────────────┴─────────────────┤
│ FLOATING BOTTOM: LIVING EVENT TIMELINE (EXPANDABLE / COLLAPSIBLE CONDUIT)   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Blueprint 3: Remote Clinician Workspace (`/clinician`)

### Purpose
Enable remote emergency physicians to review streaming field physiology, assess AI-detected deterioration patterns, and authorize standardized clinical protocols without acting as an autonomous drug-ordering store.

### Key Layout Elements
- **Observable Signals Card:**
  - `HIGH RISK: DETERIORATION PATTERN DETECTED`
  - Observed Signals: Heart rate trending upward (118 bpm), SpO2 dropping (91%), Blood pressure narrowing (92/60 mmHg), Estimated blood loss significant.
  - Clinical Significance: *Pattern indicates possible hypovolemic deterioration.*
  - Action Required: *Remote specialist protocol review requested.*
- **Clinical Protocol Review Actions (Clean & Responsible):**
  - `[✓ CONFIRM ASSESSMENT]`
  - `[? REQUEST MORE DATA]`
  - `[⚡ ESCALATE FACILITY PRIORITY]`
  - `[ℹ️ ACKNOWLEDGE & STAND BY]`
- **Status Display:**
  - `Authorized protocol recorded: Trauma Resuscitation Protocol A · Dr. S. Rao, MD`

---

## Blueprint 4: Receiving Facility Matching ("Why This Hospital?")

### Purpose
Explainable destination recommendation based on real-time clinical suitability, live transit, and hospital capability.

### The "Why This Hospital?" Card Anatomy
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ RECOMMENDED RECEIVING FACILITY: MANIPAL HOSPITAL                            │
│ Suitability Score: 94% · Real-Time Transit ETA: 14 min (7.2 km)             │
├─────────────────────────────────────────────────────────────────────────────┤
│ WHY THIS HOSPITAL?                                                          │
│ ✓ Required Trauma Capability: Level-1 Resuscitation Suite Available         │
│ ✓ ICU Bed Capacity: 3 Dedicated Emergency Beds Unoccupied                   │
│ ✓ Specialist Available: On-Call Trauma Surgeon & Anesthetist Present        │
│ ✓ Hospital Acceptance: Pre-Alert Transmitted & Confirmed                    │
│ ✓ ETA Advantage: Direct arterial corridor faster than alternatives          │
├─────────────────────────────────────────────────────────────────────────────┤
│ ALTERNATIVE FACILITIES EVALUATED:                                           │
│ • City Care Hospital (3.8 km · 19 min): ❌ UNFIT — No available ICU beds     │
│ • Apex Specialty Center (9.1 km · 28 min): ⚠️ SUB-OPTIMAL — Traffic delay   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Blueprint 5: Hospital Readiness Console (`/hospital`)

### Purpose
Prepare receiving emergency teams before physical ambulance arrival with clean, standardized readiness indicators.

### Clean Clinical Readiness Items (Simplified & Realistic)
- **CT available:** `[✅ READY]` / `[⚠️ LIMITED]` / `[❌ UNAVAILABLE]`
- **Blood products available:** `[✅ READY]` / `[⚠️ LIMITED]` / `[❌ UNAVAILABLE]`
- **Trauma team available:** `[✅ READY]` / `[⚠️ LIMITED]` / `[❌ UNAVAILABLE]`
- **ICU available:** `[✅ READY]` / `[⚠️ LIMITED]` / `[❌ UNAVAILABLE]`
- **Specialist available:** `[✅ READY]` / `[⚠️ LIMITED]` / `[❌ UNAVAILABLE]`

---

## Blueprint 6: Transport Delay State ("Care Continues")

When the traffic event occurs:
- **Banner Headline:** `TRANSPORT DELAY — CARE CONTINUES`
- **Dynamic ETA:** From `14 MIN` $\longrightarrow$ `27 MIN`
- **Care Continuity Checklist (Prominently Rendered):**
  - `✓ Telemetry continuously streaming from field unit`
  - `✓ Remote clinician remains connected and monitoring`
  - `✓ Patient vital trend assessed every 30 seconds`
  - `✓ Receiving hospital alerted to revised arrival window`
  - `✓ Emergency team preparation maintains active standby`

---

## Blueprint 7: PRANA Medical Readiness (`/inventory`)

### Purpose
High-level visibility into prehospital ambulance equipment and emergency resources.

| Resource Category | Readiness Status | Operational Detail |
| :--- | :---: | :--- |
| **Emergency Medication Supplies** | `✅ READY` | Emergency stock sealed, ambient temp monitored |
| **IV Supplies** | `✅ READY` | Infusion lines, cannulas, crystalloids verified |
| **Oxygen & Resuscitation** | `✅ READY` | Main tank 2000 PSI, portable cylinder verified |
| **Airway Equipment** | `✅ READY` | Suction operational, bag-valve-mask checked |
| **Snakebite Emergency Resources** | `✅ AVAILABLE` | Polyvalent antivenom pack stocked in cooling unit |
| **Poisoning Emergency Resources** | `⚠️ LOW` | Atropine baseline ready; activated charcoal low |
| **Trauma Supplies** | `✅ READY` | Tourniquets, pelvic binder, splints verified |
