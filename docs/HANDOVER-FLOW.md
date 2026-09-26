# PRANA — Prehospital Handover & Transfer-of-Care Specification

## 1. WHO Guidelines Alignment & Clinical Context

The World Health Organization (WHO) and emergency medical services consensus standards identify the paramedic-to-emergency department transition as one of the most safety-critical junctures in patient care.

PRANA explicitly decouples:
1. **The Prehospital Handover Package** (`PrehospitalHandoverPackage`):
   - An immutable, cryptographically verifiable record of the entire prehospital transit.
   - Contains SHA-256 provenance digest, complete vital signs telemetry time-series, field interventions, and tele-specialist endorsements.
2. **The Operational Transfer of Care** (`Transfer of Care Workflow`):
   - The structured interactive bedside handover between Paramedic and Receiving Emergency Department Charge Physician.
   - WHO-aligned SBAR structure (Situation, Background, Assessment, Recommendation).
   - Authoritative acceptance gate that formally concludes the transit encounter.

---

## 2. Handover Workflow Sequence

```
                               AMBULANCE
                                  │
                                  ▼
                     [ 1. PATIENT TOUCHDOWN ]
                                  │
                                  ▼
                   [ 2. INITIATE FORMAL HANDOVER ]
                   (Paramedic SBAR Bedside Briefing)
                                  │
                       POST /handover/initiate
                       WebSocket: PATIENT_HANDOVER_INITIATED
                                  │
                                  ▼
                           HOSPITAL COMMAND
                                  │
                                  ▼
                   [ 3. REVIEW HANDOVER PACKAGE ]
                   (Verifies SHA-256 digest + vitals)
                                  │
                                  ▼
                     [ 4. ACCEPT HANDOVER OF CARE ]
                     (ED Physician Assumes Responsibility)
                                  │
                        POST /handover/accept
                        WebSocket: PATIENT_HANDOVER_ACKNOWLEDGED
                        WebSocket: TRANSFER_COMPLETED
                                  │
                                  ▼
                   [ 5. TRANSIT ENCOUNTER CLOSED ]
                   (Care Rail locked, EHR transfer recorded)
```

---

## 3. Data Integrity & Verification

- **SHA-256 Digest**: Computed across patient demographics, injury classification, timeline event logs, and vital snapshots.
- **Field-Level Provenance**: Every extracted and recorded attribute tracks `source_type` (`VOICE`, `TEXT`, `FILE`, `SENSOR`, `MANUAL_OVERRIDE`), extraction timestamp, and confidence rating.
- **FHIR R4 Alignment**: Compatible with FHIR `Encounter` transitions (`in-progress` → `finished`) and `Composition` document bundles.
