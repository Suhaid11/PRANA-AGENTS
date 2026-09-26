# PRANA — Case Lifecycle Specification

## 1. Overview & Core Philosophy

In prehospital and acute emergency medicine, care is not a discontinuous sequence of disconnected hops; it is a single continuous thread.
WHO guidelines and FHIR R4 Encounter lifecycles emphasize:
1. Distinguishing in-transit emergency care (`in-progress`) from completed encounters (`finished`).
2. Treating handover not merely as a documentation dump, but as a deliberate **transfer of care** event.
3. Requiring clear, traceable clinical governance: artificial intelligence provides **simulated decision support and observable signals**, while qualified human clinicians retain sole endorsement authority.

---

## 2. Authoritative 9-Stage Care Lifecycle State Machine

PRANA implements a strict, sequential 9-step state machine anchored in the shared `activeCase` model:

```
[1] INCIDENT CREATED
       │
       ▼
[2] FIELD ASSESSMENT
       │
       ▼
[3] AMBULANCE TRANSPORT (Transit en route)
       │
       ▼
[4] CLINICIAN REVIEW (Tele-specialist evaluation & endorsement)
       │
       ▼
[5] FACILITY PRE-ALERT (Corridor notification to receiving ED)
       │
       ▼
[6] HOSPITAL READY (Sterile bay verified & armed)
       │
       ▼
[7] PATIENT ARRIVED (Touchdown at receiving emergency bay)
       │
       ▼
[8] HANDOVER INITIATED (Paramedic bedside WHO SBAR transfer)
       │
       ▼
[9] TRANSFER COMPLETED (ED physician accepts care; transit encounter closed)
```

### Conduit Step Mapping

| Step Index | Stage Name | Visual State | Backend Event | Trigger / Authority |
|---|---|---|---|---|
| `conduitStep: 0` | **Incident** | Active / Seeded | `EMERGENCY_INCIDENT_CREATED` | Dispatch / Intake |
| `conduitStep: 1` | **Assessment** | Primary Survey | `FIELD_OBSERVATION_RECORDED` | Field Medic |
| `conduitStep: 2` | **Ambulance** | In Transit | `AMBULANCE_DISPATCHED` | Field Medic |
| `conduitStep: 3` | **Clinician** | Specialist Evaluation | `CLINICAL_PROTOCOL_ENDORSED` / `URGENT_REVIEW_ESCALATED` | Remote Clinician |
| `conduitStep: 4` | **Facility** | Corridor Pre-Alert | `HOSPITAL_PRE_ALERT_DISPATCHED` | Field / Specialist |
| `conduitStep: 5` | **Hospital Ready** | Sterile Bay Armed | `HOSPITAL_BAY_CONFIRMED` | ED Charge Nurse |
| `conduitStep: 6` | **Arrival** | At Receiving Facility | `PATIENT_ARRIVED` | Field Medic |
| `conduitStep: 7` | **Handover** | Transfer of Care | `PATIENT_HANDOVER_INITIATED` | Field Medic |
| `conduitStep: 8` | **Completed** | Care Transferred | `PATIENT_HANDOVER_ACKNOWLEDGED` / `TRANSFER_COMPLETED` | Receiving ED Physician |

---

## 3. Real-Time Synchronization & Escalation Loop

### Clinician Escalation
When a remote tele-specialist identifies severe physiological instability or surgical shock:
1. **Clinician Triggers Escalation**: Calls `POST /api/v1/cases/{case_id}/endorse` with `action="ESCALATED"`.
2. **WebSocket Broadcast**: Emits `CLINICIAN_ESCALATED` event to all active workspaces.
3. **Hospital Command Alert**: An urgent high-contrast alert card surfaces on `HospitalCommand` displaying:
   - Escalating specialist's identity and timestamp.
   - Clinical rationale.
   - Latest vital telemetry snapshot (HR, BP, SpO2, GCS).
4. **ED Charge Acknowledgment**: ED Command confirms team mobilization via `POST /api/v1/cases/{case_id}/escalation/acknowledge`.
5. **Bidirectional Feedback**: Emits `HOSPITAL_ESCALATION_ACKNOWLEDGED`, updating both the Clinician Review Console and Field Medic view in real time.

---

## 4. Single Source of Truth Guarantees

1. **Derived ETA**:
   `derivedEta = baseEtaMinutes + trafficDelayMinutes`
   Exposed synchronously across `FIELD_MEDIC`, `REMOTE_CLINICIAN`, and `HOSPITAL_COMMAND`.
2. **Deterministic Fallback**:
   When the FastAPI / SQLite backend is offline, the client state engine deterministically steps through the full 9-stage sequence with identical state transitions and event emission.
3. **No Premature State Leakage**:
   Freshly imported cases (via voice, text, or file) initialize in `conduitStep: 1`, `UNKNOWN` facility status, and `assignedBay: "Awaiting Assignment"`. Hospital readiness and bay assignment require explicit human operational actions.
