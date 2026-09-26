from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.domain.models import EmergencyCaseModel, FacilityCandidateModel, FacilityReadinessModel
from app.engine.emergency_engine import calculate_facility_matching
from app.services.event_service import append_event
from app.realtime.broadcaster import dispatch_event_nowait

def recalculate_facilities(db: Session, case: EmergencyCaseModel) -> list[FacilityCandidateModel]:
    candidates_data = [
        {
            "id": f.facility_id,
            "name": f.name,
            "trauma_level": f.trauma_level,
            "distance_km": f.distance_km,
            "eta_minutes": f.eta_minutes,
            "specialty_fit": f.specialty_fit,
            "availability": f.availability,
        }
        for f in case.facilities
    ]

    _, _, updated_candidates = calculate_facility_matching(case.domain, candidates_data)

    # Update models in DB
    for updated in updated_candidates:
        cand_model = db.query(FacilityCandidateModel).filter(
            FacilityCandidateModel.case_id == case.id,
            FacilityCandidateModel.facility_id == updated["id"]
        ).first()
        if cand_model:
            cand_model.clinical_fit_score = updated["clinical_fit_score"]
            cand_model.availability_score = updated["availability_score"]
            cand_model.eta_score = updated["eta_score"]
            cand_model.match_score = updated["match_score"]
            cand_model.is_primary = updated["is_primary"]

    top_cand = next((c for c in updated_candidates if c.get("is_primary")), updated_candidates[0])
    case.ambulance.assigned_hospital = f"{top_cand['name']} ({top_cand['trauma_level']})"
    case.conduit_step = max(case.conduit_step, 4)

    evt = append_event(
        db,
        case_id=case.id,
        title=f"Facility Match Recalculated: {top_cand['name']}",
        detail=f"Automated match algorithm selected {top_cand['name']} (Match: {top_cand['match_score']}%).",
        actor="AI SUPPORT",
        category="SYSTEM",
        status="INFO"
    )

    db.commit()

    # PERSIST THEN BROADCAST
    dispatch_event_nowait(
        case_id=case.id,
        event_type="FACILITY_RECOMMENDED",
        version=evt.version,
        event_id=evt.event_id,
        timestamp=evt.timestamp,
        actor_type="AI SUPPORT",
        payload={
            "recommendedHospitalId": top_cand["id"],
            "assignedHospital": case.ambulance.assigned_hospital,
            "conduitStep": case.conduit_step
        }
    )

    return case.facilities

def dispatch_hospital_prealert(db: Session, case: EmergencyCaseModel) -> FacilityReadinessModel:
    readiness = case.readiness
    if not readiness:
        readiness = FacilityReadinessModel(
            id=f"read-{case.id}",
            case_id=case.id,
            status="PRE_ALERT_TRANSMITTED",
            assigned_bay="Trauma Bay 1 (Red Zone)",
            is_pre_alert_dispatched=True,
            is_pre_alert_acknowledged=False,
            resources_ready=[]
        )
        db.add(readiness)
    else:
        readiness.status = "PRE_ALERT_TRANSMITTED"
        readiness.is_pre_alert_dispatched = True

    case.conduit_step = max(case.conduit_step, 4)

    evt = append_event(
        db,
        case_id=case.id,
        title="Hospital Pre-Alert Dispatched",
        detail=f"Pre-arrival notification transmitted to {case.ambulance.assigned_hospital} receiving ED.",
        actor="SYSTEM",
        category="CLINICAL",
        status="SUCCESS"
    )

    db.commit()

    # PERSIST THEN BROADCAST
    dispatch_event_nowait(
        case_id=case.id,
        event_type="HOSPITAL_PREALERT_SENT",
        version=evt.version,
        event_id=evt.event_id,
        timestamp=evt.timestamp,
        actor_type="SYSTEM",
        payload={
            "status": readiness.status,
            "isPreAlertDispatched": True,
            "conduitStep": case.conduit_step
        }
    )

    return readiness

from typing import Optional
from app.domain.models import UserModel

def acknowledge_hospital_prealert(
    db: Session,
    case: EmergencyCaseModel,
    confirmed_by: Optional[str] = None,
    actor_user: Optional[UserModel] = None
) -> FacilityReadinessModel:
    now_ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
    verifier = actor_user.display_name if actor_user else (confirmed_by or "Sister Philomina, RN · Charge Nurse")
    actor_id = actor_user.id if actor_user else "HOSPITAL-704"
    actor_role = actor_user.role if actor_user else "HOSPITAL_COMMAND"

    readiness = case.readiness
    if readiness:
        readiness.is_pre_alert_acknowledged = True
        readiness.acknowledged_at = now_ts
        readiness.confirmed_by = verifier

    evt = append_event(
        db,
        case_id=case.id,
        title="Hospital Pre-Alert Formally Acknowledged",
        detail=f"Receiving facility acknowledged case handoff corridor; verified by {verifier}.",
        actor=verifier,
        category="CLINICAL",
        status="SUCCESS",
        timestamp=now_ts,
        payload={"confirmedBy": verifier, "actorUserId": actor_id}
    )

    db.commit()

    # PERSIST THEN BROADCAST
    dispatch_event_nowait(
        case_id=case.id,
        event_type="HOSPITAL_ACKNOWLEDGED",
        version=evt.version,
        event_id=evt.event_id,
        timestamp=evt.timestamp,
        actor_type="RECEIVING ED",
        actor_id=actor_id,
        user_id=actor_id,
        role=actor_role,
        payload={
            "isPreAlertAcknowledged": True,
            "acknowledgedAt": now_ts,
            "confirmedBy": verifier
        }
    )

    return readiness

def confirm_hospital_bay_ready(
    db: Session,
    case: EmergencyCaseModel,
    assigned_bay: str = "Trauma Bay 1 (Red Zone)",
    confirmed_by: Optional[str] = None,
    actor_user: Optional[UserModel] = None
) -> FacilityReadinessModel:
    now_ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
    verifier = actor_user.display_name if actor_user else (confirmed_by or "Sister Philomina, RN · Charge Nurse")
    actor_id = actor_user.id if actor_user else "HOSPITAL-704"
    actor_role = actor_user.role if actor_user else "HOSPITAL_COMMAND"

    readiness = case.readiness
    if readiness:
        readiness.status = "BAY_READY"
        readiness.assigned_bay = assigned_bay
        readiness.confirmed_by = verifier
        readiness.timestamp = now_ts
        if not readiness.resources_ready:
            readiness.resources_ready = ["Sterile Bay Pre-Warmed", "Resuscitation Team Standby"]

    case.conduit_step = max(case.conduit_step, 5)

    evt = append_event(
        db,
        case_id=case.id,
        title=f"Hospital Readiness Confirmed: {assigned_bay}",
        detail=f"Sterile resuscitation bay confirmed ready by {verifier} at {now_ts}.",
        actor=verifier,
        category="CLINICAL",
        status="SUCCESS",
        timestamp=now_ts,
        payload={"assignedBay": assigned_bay, "confirmedBy": verifier, "actorUserId": actor_id}
    )

    db.commit()

    # PERSIST THEN BROADCAST
    dispatch_event_nowait(
        case_id=case.id,
        event_type="HOSPITAL_BAY_READY",
        version=evt.version,
        event_id=evt.event_id,
        timestamp=evt.timestamp,
        actor_type="RECEIVING ED",
        actor_id=actor_id,
        user_id=actor_id,
        role=actor_role,
        payload={
            "status": "BAY_READY",
            "assignedBay": assigned_bay,
            "confirmedBy": verifier,
            "timestamp": now_ts,
            "conduitStep": case.conduit_step,
            "resourcesReady": readiness.resources_ready if readiness else []
        }
    )

    return readiness

def update_case_traffic_delay(
    db: Session,
    case: EmergencyCaseModel,
    traffic_delay_minutes: int,
    actor_user: Optional[UserModel] = None
) -> int:
    """
    Updates the synchronized traffic delay and derives synchronized ETA across all workspaces.
    Formula: derivedEta = baseEtaMinutes + trafficDelayMinutes
    """
    now_ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
    actor_display = actor_user.display_name if actor_user else "FIELD MEDIC"
    actor_id = actor_user.id if actor_user else "MEDIC-102"
    actor_role = actor_user.role if actor_user else "FIELD_MEDIC"

    case.ambulance.traffic_delay_minutes = traffic_delay_minutes
    base_eta = case.ambulance.base_eta_minutes or 15
    derived_eta = base_eta + traffic_delay_minutes

    evt = append_event(
        db,
        case_id=case.id,
        title=f"Traffic Corridor Delay: +{traffic_delay_minutes} min",
        detail=f"Inbound transit delay updated by {actor_display} (+{traffic_delay_minutes} min). Synchronized Arrival ETA: {derived_eta} min.",
        actor=actor_display,
        category="SYSTEM",
        status="WARNING" if traffic_delay_minutes > 5 else "INFO",
        timestamp=now_ts,
        payload={"trafficDelayMinutes": traffic_delay_minutes, "derivedEta": derived_eta, "baseEtaMinutes": base_eta, "actorUserId": actor_id}
    )

    db.commit()

    # PERSIST THEN BROADCAST
    dispatch_event_nowait(
        case_id=case.id,
        event_type="TRAFFIC_UPDATED",
        version=evt.version,
        event_id=evt.event_id,
        timestamp=evt.timestamp,
        actor_type="FIELD MEDIC",
        actor_id=actor_id,
        user_id=actor_id,
        role=actor_role,
        payload={
            "trafficDelayMinutes": traffic_delay_minutes,
            "derivedEta": derived_eta,
            "baseEtaMinutes": base_eta
        }
    )

    return derived_eta
