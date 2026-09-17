# PRANA — 15-Minute Competition Demonstration & Pitch Script

> **Challenge Track:** AI in Healthcare · Individual Software Solution  
> **Presentation Duration:** Up to 15 Minutes (Including Q&A)  
> **Core Value Thesis:** "If the ambulance cannot beat the traffic, the treatment should not have to wait for it."

---

## 1. The 8-Act Presentation Walkthrough

### ACT 1 — Emergency Reported
- **Narration:**  
  *"Judges, prehospital emergency medicine has historically treated ambulance travel time as dead time. Traffic jams paralyze care, and emergency departments are caught completely off guard when the doors open. PRANA fundamentally changes this. In PRANA, travel time becomes clinically active time."*
- **Screen:** Open **Mission Portal** (`/`). Highlight the prominent `DEMO MODE` pill (running 100% offline).
- **Trigger:** Click `[LAUNCH TRAUMA EMERGENCY (SCENARIO 1)]`.

---

### ACT 2 — Care Begins in the Field
- **Narration:**  
  *"We are inside Ambulance Echo-4. Patient Rahul Verma, 34, blunt polytrauma following a road incident. Notice our visual stance: 'Clinical Spatialism.' In the center is the Care Conduit—connecting Incident, Ambulance, Clinician, and Hospital."*
- **Screen:** Switch to **Field Medic Command Surface** (`/ambulance`).
- **Visual:** Vitals begin streaming dynamically. Tabular numerals display:
  - Heart Rate: **118 bpm** (Elevating)
  - SpO2: **91%** (Hypoxic trend)
  - Blood Pressure: **92/60 mmHg** (Hypotensive trend)
  - Respiratory Rate: **24 /min**

---

### ACT 3 — Send Data to Clinical Decision Support
- **Narration:**  
  *"The paramedic does not wait for arrival to share findings. With one tap, the paramedic packages the live vitals, prehospital assessments, and current interventions into an operational snapshot transmitted directly to the remote tele-specialist. (Note: The competition prototype executes this transmission deterministically, 100% locally and offline without external network dependencies)."*
- **Screen:** In **Ambulance Workspace** (`/ambulance`), highlight the `CLINICAL DECISION SUPPORT [PACKAGE READY]` card.
- **Action Click:** Click `[SEND TO CLINICAL DECISION SUPPORT]`.
- **Visual:** The button transitions to `✓ DATA SENT TO CDS [SENT HH:MM:SS]`, the Care Conduit advances to CDS, and the Care Rail logs `Data Package Sent: Ambulance → CDS`.
- **Clinician Workspace State:** Switch to Clinician console (`/clinician`): previously showing `AWAITING AMBULANCE DATA`, it now displays `NEW AMBULANCE DATA RECEIVED` with the complete received telemetry package.

---

### ACT 4 — AI Decision Support: Observable Signals
- **Narration:**  
  *"PRANA does not pretend to be a black-box 'AI doctor' or prescribe drugs autonomously. That would be irresponsible. Instead, PRANA's intelligence engine synthesizes observable physiological signals into transparent decision support."*
- **Screen:** The Deterioration Alert surfaces on the Field & Clinician consoles:
  - **Status:** `HIGH RISK — DETERIORATION PATTERN DETECTED`
  - **Observable Signals:** Heart rate increasing, oxygen saturation decreasing, pulse pressure narrowing.
  - **Clinical Significance:** *Pattern indicates possible hypovolemic deterioration.*
  - **Next Step:** *Remote clinician review requested.*

---

### ACT 5 — Remote Clinician Protocol Review
- **Narration:**  
  *"A specialist trauma physician cannot physically sit inside every ambulance. But with PRANA, their expertise is instantly accessible."*
- **Screen:** In **Remote Clinician Workspace** (`/clinician`), inspect the received patient snapshot and 10-minute multi-stream trends.
- **Action Click:** Click `[CONFIRM]` on Authoritative Protocol Decisions.
- **Status Confirmed:** Handshake recorded: `Protocol endorsed by Dr. Sunita Rao, MD` with synchronized handshake transmitted to Hospital Command.

---

### ACT 6 — Destination: "Why This Hospital?"
- **Narration:**  
  *"Traditional navigation apps simply route to the geographically nearest clinic. But in trauma, the closest clinic without an ICU or surgeon is a death sentence. PRANA's facility matching engine balances capabilities, live transit, and hospital readiness."*
- **Screen:** View Receiving Facility Recommendation card:
  - **Recommended:** `Manipal Hospital` (ETA: 14 min · 7.2 km)
  - **Why this hospital?**
    - `✓ Required emergency trauma capability available`
    - `✓ Dedicated ICU bed unoccupied`
    - `✓ Specialist on-call: Trauma surgeon on duty`
    - `✓ Pre-alert transmitted and accepted`
    - `✓ Faster arterial corridor than alternatives`
- **Action Click:** Click `[SELECT & DISPATCH HOSPITAL PRE-ALERT]`.

---

### ACT 6 — Receiving Hospital Preparation
- **Narration:**  
  *"Before PRANA, emergency departments scramble the moment the stretcher wheels in. With PRANA Command, the hospital prepares 14 minutes in advance."*
- **Screen:** Open **Hospital Readiness Console** (`/hospital`).
- **Visual:** The ED team acknowledges the incoming pre-alert and toggles readiness:
  - CT available: `[✅ READY]`
  - Blood products available: `[✅ READY]`
  - Trauma team available: `[✅ READY]`
  - ICU available: `[✅ READY]`
  - Specialist available: `[✅ READY]`

---

### ACT 7 — The Traffic Delay: "Care Continues"
- **Narration:**  
  *"Now, urban reality strikes. A major traffic junction is gridlocked. Watch what happens."*
- **Action:** Click `[SIMULATE TRAFFIC DELAY]` in the Simulation Director.
- **Visual Shift:**
  - ETA jumps from **14 min** $\longrightarrow$ **27 min**.
  - But instead of a catastrophic failure message, PRANA's interface calmly asserts:
    ### **`TRANSPORT DELAY — CARE CONTINUES`**
  - The Care Conduit displays a continuous bypass line connecting the field to the clinician and hospital.
  - Visible Checklist:
    - `✓ Telemetry continuously streaming from field unit`
    - `✓ Remote clinician remains connected and monitoring`
    - `✓ Patient vital trend assessed continuously`
    - `✓ Receiving hospital alerted to revised arrival window`
    - `✓ Emergency team maintains active standby`
- **Narration:**  
  *"Traffic delayed the wheels, but it did not stop the care."*

---

### ACT 8 — Arrival, Bedside Handover & The Close
- **Narration:**  
  *"The ambulance arrives at Manipal Hospital. The paramedic and charge nurse perform a zero-second digital handover. Every vital sign, clinician authorization, and delay event is preserved in the immutable Living Event Timeline."*
- **Screen:** Click `[COMPLETE BEDSIDE HANDOVER]`. Open the **Living Event Timeline**.
- **Closing Punchline:**  
  *"PRANA: Where the Journey Becomes Care.*  
  *The ambulance didn't become faster. The care became smarter.*  
  *Thank you. I am ready for your questions."*

---

## 2. Demo Reliability & Offline Fallback
- **Demo Mode:** Fully active by default.
- **Offline Self-Containment:** All 3 scenarios (Trauma, Snakebite, Poisoning) run on the client-side in-memory state engine without internet.
- **One-Touch Reset:** `[RESTART MISSION]` instantly restores pristine initial state in <200ms.
