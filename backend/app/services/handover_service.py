import json
import hashlib
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.domain.models import (
    EmergencyCaseModel,
    HandoverPackageModel,
    TimelineEventModel,
    UserModel
)
from app.domain.schemas import (
    PrehospitalHandoverPackageSchema,
    HandoverVerifyResponse,
    UserRoleEnum
)
from app.engine.emergency_engine import calculate_derived_eta
from app.services.event_service import append_event
from app.realtime.broadcaster import dispatch_event_nowait

def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()

def format_timestamp():
    return datetime.now().strftime("%H:%M:%S")


def assess_handover_completeness(case: EmergencyCaseModel) -> dict:
    """
    Evaluates whether all essential operational and clinical data fields
    are present in the case for handover.
    """
    items_found = []
    missing_fields = []

    # 1. Patient identity
    if case.patient and case.patient.name and case.patient.age:
        items_found.append("Patient Demographics & Chief Complaint")
    else:
        missing_fields.append("Patient Demographics")

    # 2. Vitals
    if case.vitals and len(case.vitals) > 0:
        items_found.append(f"Recorded Physiological Vitals ({len(case.vitals)} readings)")
    else:
        missing_fields.append("Baseline Physiological Vitals")

    # 3. Transport & ETA
    if case.ambulance and case.ambulance.call_sign:
        items_found.append(f"Transit Unit & Corridor ({case.ambulance.call_sign})")
    else:
        missing_fields.append("Ambulance Unit Allocation")

    # 4. Receiving Destination
    if case.ambulance and case.ambulance.assigned_hospital:
        items_found.append(f"Destination Facility ({case.ambulance.assigned_hospital})")
    else:
        missing_fields.append("Destination Facility Assignment")

    # 5. Bay Allocation
    if case.readiness and case.readiness.assigned_bay:
        items_found.append(f"Resuscitation Bay ({case.readiness.assigned_bay})")
    else:
        missing_fields.append("Hospital Bay Allocation")

    total_checks = 5
    passed_checks = len(items_found)
    pct = int((passed_checks / total_checks) * 100)
    is_complete = (passed_checks == total_checks)

    return {
        "is_complete": is_complete,
        "completeness_percentage": pct,
        "missing_fields": missing_fields,
        "items_found": items_found
    }


def build_handover_dictionary(case: EmergencyCaseModel, actor_user: UserModel) -> dict:
    """
    Constructs the canonical dictionary representation of the Prehospital Handover Package.
    Preserves source-event provenance for every clinical finding and enforces that AI output
    is strictly marked as SIMULATED DECISION SUPPORT and never as an autonomous diagnosis.
    """
    case_version = case.current_version or 1
    package_id = f"hop-{case.id.lower()}-v{case_version}"
    gen_time_iso = utc_now_iso()

    # 1. Patient
    p = case.patient
    patient_dict = {
        "id": p.id,
        "name": p.name,
        "age": p.age,
        "sex": p.sex,
        "incidentType": p.incident_type,
        "chiefComplaint": p.chief_complaint,
        "consciousState": p.conscious_state,
        "gcsScore": p.gcs_score,
        "reportedBloodLoss": p.reported_blood_loss
    }

    # 2. Incident & Journey
    incident_dict = {
        "domain": case.domain,
        "scenarioTitle": case.scenario_title,
        "status": case.status,
        "conduitStep": case.conduit_step
    }

    # 3. Transport
    amb = case.ambulance
    effective_eta = calculate_derived_eta(amb.base_eta_minutes, amb.traffic_delay_minutes)
    transport_dict = {
        "callSign": amb.call_sign,
        "crewLead": amb.crew_lead,
        "currentSpeedKmH": amb.current_speed_kmh,
        "baseEtaMinutes": amb.base_eta_minutes,
        "trafficDelayMinutes": amb.traffic_delay_minutes,
        "effectiveEtaMinutes": effective_eta,
        "isTrafficDelayed": amb.is_traffic_delayed,
        "assignedHospital": amb.assigned_hospital,
        "coordinates": {"lat": amb.lat, "lng": amb.lng}
    }

    # Helper: Find source event id matching criteria
    events_by_type = {}
    for ev in case.events:
        events_by_type[ev.event_id] = ev

    # 4. Vitals & Timeline
    all_vitals = sorted(case.vitals, key=lambda v: v.created_at)
    vitals_list = []
    for v in all_vitals:
        # Match with vital event if recorded
        matching_event_id = None
        for ev in case.events:
            if ev.payload.get("vitalSnapshotId") == v.id or ev.payload.get("id") == v.id:
                matching_event_id = ev.event_id
                break
        if not matching_event_id:
            matching_event_id = f"evt-vital-{v.id}"

        vitals_list.append({
            "id": v.id,
            "timestamp": v.timestamp,
            "heartRate": v.heart_rate,
            "spo2": v.spo2,
            "systolicBp": v.systolic_bp,
            "diastolicBp": v.diastolic_bp,
            "respiratoryRate": v.respiratory_rate,
            "temperatureC": v.temperature_c,
            "isAbnormal": v.is_abnormal,
            "sourceEventId": matching_event_id
        })

    latest_vital = vitals_list[-1] if vitals_list else {
        "id": "v-default",
        "timestamp": "00:00:00",
        "heartRate": 80,
        "spo2": 98,
        "systolicBp": 120,
        "diastolicBp": 80,
        "respiratoryRate": 16,
        "temperatureC": 37.0,
        "isAbnormal": False,
        "sourceEventId": "evt-init"
    }

    # 5. Observations (Extracted from clinical events)
    observations_list = []
    for ev in case.events:
        if ev.category == "CLINICAL" and "observation" in ev.title.lower():
            observations_list.append({
                "id": ev.event_id,
                "timestamp": ev.timestamp,
                "text": ev.detail,
                "actor": ev.actor,
                "sourceEventId": ev.event_id
            })

    # 6. Interventions
    interventions_list = []
    for i in sorted(case.interventions, key=lambda x: x.created_at):
        matching_ev_id = None
        for ev in case.events:
            if ev.payload.get("interventionId") == i.id:
                matching_ev_id = ev.event_id
                break
        interventions_list.append({
            "id": i.id,
            "timestamp": i.timestamp,
            "actionLabel": i.action_label,
            "detailText": i.detail_text,
            "actor": i.actor,
            "status": i.status,
            "sourceEventId": matching_ev_id or f"evt-intervention-{i.id}"
        })

    # 7. AI Decision Support Signals (STRICTLY NON-AUTONOMOUS)
    decision_support_list = []
    for sig in case.decision_signals:
        decision_support_list.append({
            "signalId": sig.id,
            "signalType": sig.signal_type,
            "title": sig.title,
            "observedData": sig.observed_data,
            "explanation": sig.explanation,
            "provider": sig.provider,
            "providerVersion": sig.provider_version,
            "safetyLabel": "SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS",
            "requiresClinicianReview": sig.requires_clinician_review,
            "status": sig.status,
            "sourceEventIds": sig.relevant_event_ids
        })

    # 8. Clinician Reviews
    clinician_reviews_list = []
    for act in case.clinician_actions:
        matching_ev_id = None
        for ev in case.events:
            if ev.payload.get("actionId") == act.id:
                matching_ev_id = ev.event_id
                break
        clinician_reviews_list.append({
            "id": act.id,
            "action": act.action,
            "clinicianId": act.clinician_id,
            "clinicianName": act.clinician_name,
            "timestamp": act.timestamp,
            "notes": act.notes,
            "reviewPlanTitle": act.review_plan_title,
            "requestedDataType": act.requested_data_type,
            "sourceEventId": matching_ev_id or f"evt-clinician-{act.id}"
        })

    # 9. Receiving Destination
    primary_cand = next((c for c in case.facilities if c.is_primary), case.facilities[0] if case.facilities else None)
    destination_dict = {
        "facilityId": primary_cand.facility_id if primary_cand else "FAC-MANIPAL-01",
        "name": primary_cand.name if primary_cand else amb.assigned_hospital,
        "traumaLevel": primary_cand.trauma_level if primary_cand else "Level-1 Trauma Center",
        "distanceKm": primary_cand.distance_km if primary_cand else 7.2,
        "etaMinutes": primary_cand.eta_minutes if primary_cand else effective_eta,
        "matchScore": primary_cand.match_score if primary_cand else 95,
        "specialtyFit": primary_cand.specialty_fit if primary_cand else "24/7 Trauma Surgery"
    }

    # 10. Bay Readiness
    readiness = case.readiness
    readiness_dict = {
        "status": readiness.status if readiness else "PREPARING",
        "assignedBay": readiness.assigned_bay if readiness else "Trauma Bay 1 (Red Zone)",
        "confirmedBy": readiness.confirmed_by if readiness else None,
        "timestamp": readiness.timestamp if readiness else None,
        "bedNumber": readiness.bed_number if readiness else None,
        "resourcesReady": readiness.resources_ready if readiness else [],
        "isBayReady": (readiness.status == "BAY_READY") if readiness else False,
        "sourceEventId": "evt-bay-ready" if (readiness and readiness.status == "BAY_READY") else None
    }

    # 11. Timeline Events
    timeline_list = [
        {
            "id": e.event_id,
            "version": e.version,
            "timestamp": e.timestamp,
            "category": e.category,
            "title": e.title,
            "detail": e.detail,
            "actor": e.actor,
            "status": e.status
        }
        for e in sorted(case.events, key=lambda x: x.created_at)
    ]

    # 12. Completeness Assessment
    completeness_eval = assess_handover_completeness(case)
    completeness_dict = {
        "isComplete": completeness_eval["is_complete"],
        "completenessPercentage": completeness_eval["completeness_percentage"],
        "missingFields": completeness_eval["missing_fields"],
        "itemsFound": completeness_eval["items_found"]
    }

    # Temporary provenance to calculate digest
    provenance_dict = {
        "sourceCaseVersion": case_version,
        "sourceEventCount": len(case.events),
        "generatedTimestamp": gen_time_iso,
        "contentDigestSha256": "PENDING_DIGEST",
        "generatorEngine": "PRANA-Prehospital-Handover-Engine-v1.0"
    }

    package_dict = {
        "packageId": package_id,
        "caseId": case.id,
        "caseVersion": case_version,
        "generatedAt": gen_time_iso,
        "generatedBy": {
            "id": actor_user.id,
            "name": actor_user.display_name,
            "role": actor_user.role
        },
        "status": "GENERATED",
        "patient": patient_dict,
        "incident": incident_dict,
        "transport": transport_dict,
        "latestVitals": latest_vital,
        "vitalTimeline": vitals_list,
        "observations": observations_list,
        "interventions": interventions_list,
        "decisionSupport": decision_support_list,
        "clinicianReviews": clinician_reviews_list,
        "destination": destination_dict,
        "readiness": readiness_dict,
        "eventTimeline": timeline_list,
        "provenance": provenance_dict,
        "completeness": completeness_dict,
        "safetyNotice": "This prototype prehospital handover package is generated from demonstration records and does not constitute a clinically validated medical record.",
        "acknowledgedAt": None,
        "acknowledgedBy": None
    }

    # Canonicalize and calculate SHA-256 integrity digest
    canonical_pre_hash = json.dumps(package_dict, sort_keys=True, separators=(",", ":"))
    content_hash = hashlib.sha256(canonical_pre_hash.encode("utf-8")).hexdigest()

    # Update with the computed hash
    package_dict["provenance"]["contentDigestSha256"] = content_hash
    package_dict["integrityHash"] = content_hash

    return package_dict


def generate_and_persist_handover(
    db: Session,
    case: EmergencyCaseModel,
    actor_user: UserModel
) -> HandoverPackageModel:
    """
    Generates a new immutable Handover Package snapshot from current case state,
    stores it in the database, records an audit event on the Care Rail,
    increments case version, and broadcasts over WebSocket.
    """
    package_dict = build_handover_dictionary(case, actor_user)
    package_id = package_dict["packageId"]
    integrity_hash = package_dict["integrityHash"]
    completeness_status = "COMPLETE" if package_dict["completeness"]["isComplete"] else "PARTIAL"

    # Check if a package for this exact case version already exists
    existing = db.query(HandoverPackageModel).filter(
        HandoverPackageModel.case_id == case.id,
        HandoverPackageModel.case_version == case.current_version
    ).first()

    canonical_json_str = json.dumps(package_dict, sort_keys=True)

    if existing:
        existing.package_json = canonical_json_str
        existing.integrity_hash = integrity_hash
        existing.completeness_status = completeness_status
        existing.generated_by_id = actor_user.id
        existing.generated_by_name = actor_user.display_name
        existing.generated_by_role = actor_user.role
        package_model = existing
    else:
        package_model = HandoverPackageModel(
            id=package_id,
            case_id=case.id,
            case_version=case.current_version,
            status="GENERATED",
            package_json=canonical_json_str,
            integrity_hash=integrity_hash,
            completeness_status=completeness_status,
            generated_by_id=actor_user.id,
            generated_by_name=actor_user.display_name,
            generated_by_role=actor_user.role
        )
        db.add(package_model)

    # Append audit event to Timeline / Care Rail
    evt = append_event(
        db=db,
        case_id=case.id,
        category="SYSTEM",
        title="Prehospital Handover Package Generated",
        detail=f"Clinical & operational handover snapshot generated ({package_id}) with SHA-256 digest {integrity_hash[:12]}...",
        actor="SYSTEM",
        status="SUCCESS",
        payload={
            "packageId": package_id,
            "caseVersion": case.current_version,
            "integrityHash": integrity_hash,
            "completenessStatus": completeness_status,
            "generatedBy": actor_user.display_name,
            "role": actor_user.role
        }
    )

    db.commit()
    db.refresh(package_model)

    # Broadcast event via case-scoped WebSocket
    dispatch_event_nowait(
        case_id=case.id,
        event_type="HANDOVER_GENERATED",
        version=evt.version,
        event_id=evt.event_id,
        timestamp=evt.timestamp,
        actor_type="SYSTEM",
        actor_id=actor_user.id,
        user_id=actor_user.id,
        role=actor_user.role,
        payload={
            "packageId": package_id,
            "caseVersion": case.current_version,
            "status": package_model.status,
            "integrityHash": integrity_hash,
            "completenessStatus": completeness_status
        }
    )

    return package_model


def acknowledge_handover_package(
    db: Session,
    case: EmergencyCaseModel,
    package_id: str,
    actor_user: UserModel,
    notes: Optional[str] = None
) -> HandoverPackageModel:
    """
    Receiving Emergency Department command acknowledges receipt of the prehospital handover.
    Restricted to HOSPITAL_COMMAND or PORTAL_ADMIN.
    Appends an immutable HANDOVER_ACKNOWLEDGED event to the Care Rail and broadcasts.
    """
    if actor_user.role not in [UserRoleEnum.HOSPITAL_COMMAND.value, UserRoleEnum.PORTAL_ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{actor_user.role}' lacks authority to acknowledge hospital receipt of prehospital handover. Requires HOSPITAL_COMMAND authority."
        )

    package = db.query(HandoverPackageModel).filter(
        HandoverPackageModel.id == package_id,
        HandoverPackageModel.case_id == case.id
    ).first()

    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Handover package '{package_id}' not found for case '{case.id}'"
        )

    ack_time = utc_now_iso()
    package.status = "ACKNOWLEDGED"
    package.acknowledged_at = datetime.now(timezone.utc)
    package.acknowledged_by_id = actor_user.id
    package.acknowledged_by_name = actor_user.display_name

    # Update canonical JSON with acknowledgement data
    pkg_data = package.package_data
    pkg_data["status"] = "ACKNOWLEDGED"
    pkg_data["acknowledgedAt"] = ack_time
    pkg_data["acknowledgedBy"] = {
        "id": actor_user.id,
        "name": actor_user.display_name,
        "role": actor_user.role,
        "notes": notes
    }
    package.package_json = json.dumps(pkg_data, sort_keys=True)

    # Append audit event to Timeline / Care Rail
    evt = append_event(
        db=db,
        case_id=case.id,
        category="CLINICAL",
        title="Prehospital Handover Received & Acknowledged",
        detail=f"Receiving Emergency Department ({actor_user.display_name}) acknowledged handover package {package_id}. Resuscitation team briefing underway.",
        actor="RECEIVING ED",
        status="SUCCESS",
        payload={
            "packageId": package_id,
            "caseVersion": case.current_version,
            "acknowledgedBy": actor_user.display_name,
            "role": actor_user.role,
            "notes": notes or "Nominal prehospital transfer verification"
        }
    )

    db.commit()
    db.refresh(package)

    # Broadcast event via case-scoped WebSocket
    dispatch_event_nowait(
        case_id=case.id,
        event_type="HANDOVER_ACKNOWLEDGED",
        version=evt.version,
        event_id=evt.event_id,
        timestamp=evt.timestamp,
        actor_type="RECEIVING ED",
        actor_id=actor_user.id,
        user_id=actor_user.id,
        role=actor_user.role,
        payload={
            "packageId": package_id,
            "caseVersion": case.current_version,
            "status": "ACKNOWLEDGED",
            "acknowledgedBy": actor_user.display_name,
            "notes": notes
        }
    )

    return package


def verify_handover_package_integrity(package: HandoverPackageModel) -> HandoverVerifyResponse:
    """
    Independently recalculates the SHA-256 hash of the stored package JSON payload
    and verifies whether it matches the stored provenance digest.
    """
    pkg_data = package.package_data
    stored_hash = package.integrity_hash

    # Re-calculate hash using the exact canonicalization method
    # Create copy with pre-digest placeholder as in build_handover_dictionary
    test_dict = json.loads(json.dumps(pkg_data))
    if "provenance" in test_dict:
        test_dict["provenance"]["contentDigestSha256"] = "PENDING_DIGEST"
    test_dict.pop("integrityHash", None)

    canonical_test_json = json.dumps(test_dict, sort_keys=True, separators=(",", ":"))
    recalculated_hash = hashlib.sha256(canonical_test_json.encode("utf-8")).hexdigest()

    is_match = (stored_hash == recalculated_hash)

    return HandoverVerifyResponse(
        match=is_match,
        packageId=package.id,
        storedHash=stored_hash,
        recalculatedHash=recalculated_hash,
        verifiedAt=utc_now_iso(),
        details="SHA-256 cryptographic digest verified against stored canonical payload. Content is unmodified."
        if is_match else "Integrity mismatch detected! Payload has diverged from stored digest."
    )


def export_handover_fhir_r4(package_data: dict) -> dict:
    """
    Transforms the Prehospital Handover Package into a standard FHIR R4 Bundle
    (type: document). Each clinical resource retains an extension mapping
    directly to the PRANA Timeline source-event ID for end-to-end traceability.
    """
    package_id = package_data.get("packageId", "hop-unknown")
    case_id = package_data.get("caseId", "unknown")
    patient_info = package_data.get("patient", {})
    transport_info = package_data.get("transport", {})
    destination_info = package_data.get("destination", {})

    entries = []

    # 1. Composition Resource (Document root)
    composition_resource = {
        "resourceType": "Composition",
        "id": f"comp-{package_id}",
        "status": "final",
        "type": {
            "coding": [{
                "system": "http://loinc.org",
                "code": "81216-4",
                "display": "Emergency medical service encounter summary"
            }],
            "text": "PRANA Prehospital Emergency Handover Summary"
        },
        "subject": {
            "reference": f"Patient/{patient_info.get('id', 'pat-1')}",
            "display": patient_info.get("name", "Emergency Patient")
        },
        "encounter": {
            "reference": f"Encounter/enc-{case_id}",
            "display": f"Prehospital ALS Transport {transport_info.get('callSign', '')}"
        },
        "date": package_data.get("generatedAt", utc_now_iso()),
        "author": [{
            "display": package_data.get("generatedBy", {}).get("name", "PRANA Emergency Platform")
        }],
        "title": f"Prehospital Handover: Case {case_id}",
        "custodian": {
            "display": destination_info.get("name", "Receiving Emergency Facility")
        },
        "section": [
            {
                "title": "Vital Signs Stream",
                "code": {
                    "coding": [{
                        "system": "http://loinc.org",
                        "code": "8716-3",
                        "display": "Vital signs"
                    }]
                },
                "text": {
                    "status": "generated",
                    "div": f"<div xmlns='http://www.w3.org/1999/xhtml'>Latest HR {package_data.get('latestVitals', {}).get('heartRate')} bpm, SpO2 {package_data.get('latestVitals', {}).get('spo2')}%</div>"
                }
            },
            {
                "title": "Field Interventions & Procedures",
                "code": {
                    "coding": [{
                        "system": "http://loinc.org",
                        "code": "29554-3",
                        "display": "Procedure narrative"
                    }]
                }
            },
            {
                "title": "Simulated Decision Support Signals",
                "code": {
                    "coding": [{
                        "system": "http://prana.health/fhir/codes",
                        "code": "decision-support",
                        "display": "Observable Clinical Signals"
                    }]
                }
            }
        ]
    }
    entries.append({"resource": composition_resource})

    # 2. Patient Resource
    patient_resource = {
        "resourceType": "Patient",
        "id": patient_info.get("id", "pat-1"),
        "identifier": [{
            "system": "http://prana.health/patients",
            "value": patient_info.get("id", "pat-1")
        }],
        "name": [{
            "use": "official",
            "text": patient_info.get("name", "Emergency Patient")
        }],
        "gender": patient_info.get("sex", "unknown").lower(),
        "extension": [
            {
                "url": "http://prana.health/fhir/StructureDefinition/age-years",
                "valueInteger": patient_info.get("age", 0)
            },
            {
                "url": "http://prana.health/fhir/StructureDefinition/gcs-score",
                "valueInteger": patient_info.get("gcsScore", 15)
            }
        ]
    }
    entries.append({"resource": patient_resource})

    # 3. Encounter Resource
    encounter_resource = {
        "resourceType": "Encounter",
        "id": f"enc-{case_id}",
        "status": "in-progress",
        "class": {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            "code": "AMB",
            "display": "Ambulatory Emergency"
        },
        "subject": {
            "reference": f"Patient/{patient_info.get('id', 'pat-1')}"
        },
        "serviceProvider": {
            "display": destination_info.get("name", "Receiving Emergency Facility")
        }
    }
    entries.append({"resource": encounter_resource})

    # 4. Vital Observations (LOINC coded)
    loinc_map = {
        "heartRate": {"code": "8867-4", "display": "Heart rate", "unit": "/min"},
        "spo2": {"code": "2708-6", "display": "Oxygen saturation in Arterial blood", "unit": "%"},
        "systolicBp": {"code": "8480-6", "display": "Systolic blood pressure", "unit": "mmHg"},
        "diastolicBp": {"code": "8462-4", "display": "Diastolic blood pressure", "unit": "mmHg"},
        "respiratoryRate": {"code": "9279-1", "display": "Respiratory rate", "unit": "/min"},
        "temperatureC": {"code": "8310-5", "display": "Body temperature", "unit": "Cel"}
    }

    latest_vitals = package_data.get("latestVitals", {})
    source_evt_id = latest_vitals.get("sourceEventId", "evt-vital")
    for key, loinc in loinc_map.items():
        if key in latest_vitals:
            val = latest_vitals[key]
            obs_res = {
                "resourceType": "Observation",
                "id": f"obs-{key}-{latest_vitals.get('id', '1')}",
                "status": "final",
                "category": [{
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                        "code": "vital-signs",
                        "display": "Vital Signs"
                    }]
                }],
                "code": {
                    "coding": [{
                        "system": "http://loinc.org",
                        "code": loinc["code"],
                        "display": loinc["display"]
                    }]
                },
                "subject": {
                    "reference": f"Patient/{patient_info.get('id', 'pat-1')}"
                },
                "effectiveDateTime": latest_vitals.get("timestamp", utc_now_iso()),
                "valueQuantity": {
                    "value": val,
                    "unit": loinc["unit"],
                    "system": "http://unitsofmeasure.org"
                },
                "extension": [{
                    "url": "http://prana.health/fhir/StructureDefinition/source-event-id",
                    "valueString": source_evt_id
                }]
            }
            entries.append({"resource": obs_res})

    # 5. Procedure Resources for Interventions
    for idx, intervention in enumerate(package_data.get("interventions", [])):
        proc_res = {
            "resourceType": "Procedure",
            "id": f"proc-{idx}-{intervention.get('id', '1')}",
            "status": "completed",
            "code": {
                "text": intervention.get("actionLabel", "Prehospital Intervention")
            },
            "subject": {
                "reference": f"Patient/{patient_info.get('id', 'pat-1')}"
            },
            "performer": [{
                "actor": {
                    "display": intervention.get("actor", "FIELD MEDIC")
                }
            }],
            "note": [{
                "text": intervention.get("detailText", "")
            }],
            "extension": [{
                "url": "http://prana.health/fhir/StructureDefinition/source-event-id",
                "valueString": intervention.get("sourceEventId", f"evt-intervention-{idx}")
            }]
        }
        entries.append({"resource": proc_res})

    # 6. Decision Support Signals (Observed Signals, strictly marked as SIMULATED)
    for idx, signal in enumerate(package_data.get("decisionSupport", [])):
        sig_res = {
            "resourceType": "Observation",
            "id": f"signal-{idx}-{signal.get('signalId', '1')}",
            "status": "preliminary",
            "category": [{
                "coding": [{
                    "system": "http://prana.health/fhir/codes",
                    "code": "simulated-decision-support",
                    "display": "Simulated Decision Support"
                }]
            }],
            "code": {
                "text": signal.get("title", "Clinical Signal")
            },
            "subject": {
                "reference": f"Patient/{patient_info.get('id', 'pat-1')}"
            },
            "note": [
                {"text": f"Observed Data: {signal.get('observedData', '')}"},
                {"text": f"Explanation: {signal.get('explanation', '')}"},
                {"text": f"Safety Notice: {signal.get('safetyLabel', 'SIMULATED DECISION SUPPORT — NOT A DIAGNOSIS')}"}
            ],
            "extension": [
                {
                    "url": "http://prana.health/fhir/StructureDefinition/provider",
                    "valueString": f"{signal.get('provider', '')} v{signal.get('providerVersion', '')}"
                }
            ]
        }
        entries.append({"resource": sig_res})

    fhir_bundle = {
        "resourceType": "Bundle",
        "id": f"bundle-{package_id}",
        "type": "document",
        "timestamp": package_data.get("generatedAt", utc_now_iso()),
        "entry": entries
    }

    return fhir_bundle
