# PRANA — Canonical User Flows & State Transition Mechanics

> **The Core Thesis:** "The ambulance does not have to become faster for care to become smarter."

---

## 1. The Canonical 14-Step End-to-End Emergency Journey

```
00:00 [REPORTED]      Emergency 108 Call Received → Case Created
00:02 [DISPATCHED]    Ambulance Echo-4 Dispatched to Incident Locus
00:05 [ONBOARD]       Field Paramedic Initiates Assessment; Patient Onboard
00:07 [VITALS]        Telemetry Sensor Sync (HR: 118, SpO2: 91%, BP: 92/60)
00:08 [SEND TO CDS]   Paramedic transmits Patient Data Package (Vitals, Assessment, Interventions, ETA)
00:09 [CDS RECEIVED]  Tele-Specialist Console receives transmitted snapshot (AWAITING DATA → RECEIVED)
00:10 [AI DETECT]     AI Decision Engine detects Deterioration Pattern (Shock Index: 1.28)
00:11 [NOTIFY DOC]    Remote Emergency Specialist Paged via PRANA Secure Telemetry
00:12 [CLINICIAN ACT] Remote Clinician reviews vitals, orders 500ml Saline + High-flow O2
00:13 [MATCH ENGINE]  Facility Matching Engine computes suitability (Hospital B chosen over A)
00:14 [PRE-ALERT]     Automated Pre-Alert sent to Hospital B Emergency Department
00:15 [ACK & PREP]    Hospital B ED Charge Nurse acknowledges; Trauma Bay 1 reserved
00:17 [TRAFFIC DELAY] Severe Junction Congestion detected (+8 min ETA adjustment)
00:18 [CARE CONTINUES]PRANA updates ETA; Clinician stays connected; ED team pre-warms blood
00:23 [ARRIVED]       Ambulance arrives at Hospital B Red Bay
00:25 [HANDOVER]      Zero-second digital bedside handover completed; Timeline archived
```

> **Note on Prototype Execution**: The competition prototype simulates the data handoff locally and offline (`NOT_SENT` → `SENT` / `RECEIVED`) without external network dependencies.

---

## 2. Role-Specific User Interaction Loops

### Flow A: The Field Paramedic (High-Stress Touch Optimization)

```
[1. View Active Mission]
      │
      ▼
[2. Tap Rapid Assessment Chips] (Blunt Trauma / GCS 13 / Pale Diaphoretic)
      │
      ▼
[3. Sensor Auto-Sync] (Monitors stream HR, BP, SpO2 directly into PRANA)
      │
      ▼
[4. Audio/Visual Tone: AI Flag] ("SpO2 < 92% · Hypotensive Trend")
      │
      ▼
[5. Receive Remote Clinician Directives] (Banner: "Dr. Rao approved: 1g TXA IV + 15L O2")
      │
      ▼
[6. Tap Checkmark to Confirm Intervention Given]
      │
      ▼
[7. Monitor Real-Time Hospital Readiness] (See "Trauma Bay 1 PREPARED" badge)
      │
      ▼
[8. Touch "Complete Bedside Handover" upon Physical Transfer]
```

### Flow B: The Remote Clinician (High-Fidelity Decision Support)

```
[1. Incoming Critical Alert Badge] (Push alert with patient demographic + critical vitals)
      │
      ▼
[2. Enter Emergency Console]
      │
      ▼
[3. Inspect Explainable AI Signals]
      ├─ Vitals Trend (Drop in MAP from 75 to 60 mmHg over 6 mins)
      ├─ Hemorrhage Risk Score (High, 84/100)
      └─ Physical Signs (Abdominal tenderness + seatbelt sign)
      │
      ▼
[4. Make Clinical Determination]
      ├─ Action: [Authorize IV Tranexamic Acid (TXA)]
      ├─ Action: [Request Repeat Blood Pressure in 3 mins]
      └─ Action: [Direct Ambulance to Trauma Center with Interventional Radiology]
      │
      ▼
[5. Transmit Orders] (Instant sync to Ambulance Console + Hospital ED)
```

### Flow C: The Receiving Hospital Emergency Department (Proactive Readiness)

```
[1. Pre-Alert Signal Received on ED Dashboard] (Audio Chime + Pulsing Amber Banner)
      │
      ▼
[2. One-Click Acknowledge] (Notifies Ambulance crew that ED is aware)
      │
      ▼
[3. Review Incoming Clinical Summary & ETA Countdown]
      │
      ▼
[4. Toggle Resource Readiness Cards]
      ├─ Trauma Bay 1: [Mark READY]
      ├─ CT Scanner: [Mark ON STANDBY]
      ├─ Trauma Surgery Team: [Mark NOTIFIED]
      └─ O-Negative Blood: [Mark ORDERED]
      │
      ▼
[5. Traffic Delay Alert Received] (ETA updates from 10:02 to 10:10)
      └─ ED team adjusts prep without panic; telemetry continues streaming live
      │
      ▼
[6. Ambulance Physical Arrival] → Paramedic scans handover QR/code → Records merged
```

---

## 3. The Traffic Delay Story Twist (Demonstration Narrative)

During the competition demo, at step `00:16`, a simulated traffic jam occurs:
- Traditional ambulances: The journey pauses, and the hospital remains blind. The patient deteriorates with no clinical oversight.
- In **PRANA**:
  1. The UI displays an amber alert: `TRAFFIC DELAY DETECTED (+8 MIN)`.
  2. The ETA updates from `6 MIN` to `14 MIN`.
  3. Rather than an error or failure, PRANA's interface reinforces:
     **"TRANSIT EXTENDED · CLINICAL TELEMETRY ACTIVE · ED MAINTAINING READINESS"**
  4. The remote clinician monitors vitals, instructs titration of intravenous fluids, and the receiving hospital prepares blood products early.
  5. The takeaway for judges is immediate and powerful: **Travel time was transformed into treatment time.**
