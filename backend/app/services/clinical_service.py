import time
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.domain.models import (
    EmergencyCaseModel,
    VitalSnapshotModel,
    ClinicalSignalModel,
    DecisionSupportSignalModel,
    InterventionModel,
    ClinicianActionModel,
    UserModel
)
from app.domain.schemas import (
    VitalSnapshotCreate,
    InterventionCreate,
    ClinicianReviewCreate,
    ClinicianDataRequestCreate,
    ClinicianEscalationCreate,
    ClinicianAcknowledgeCreate
)
from app.engine.emergency_engine import evaluate_clinical_signal
from app.services.event_service import append_event
from app.realtime.broadcaster import dispatch_event_nowait
from app.ai.service import evaluate_case_decision_support

def record_vital(
    db: Session,
    case: EmergencyCaseModel,
    vital_in: VitalSnapshotCreate,
    actor_user: Optional[UserModel] = None
) -> VitalSnapshotModel:
    timestamp_str = vital_in.timestamp or datetime.now(timezone.utc).strftime("%H:%M:%S")
    vital_id = f"vit-{int(time.time() * 1000)}"
    actor_display = actor_user.display_name if actor_user else "FIELD MEDIC"
    actor_id = actor_user.id if actor_user else "MEDIC-102"
    actor_role = actor_user.role if actor_user else "FIELD_MEDIC"

    # Determine abnormal status based on domain rules
    is_abnormal = (
        vital_in.spo2 < 92 or
        vital_in.heart_rate > 115 or
        vital_in.heart_rate < 55 or
        vital_in.systolic_bp < 90
    )

    vital_model = VitalSnapshotModel(
        id=vital_id,
        case_id=case.id,
        timestamp=timestamp_str,
        heart_rate=vital_in.heart_rate,
        spo2=vital_in.spo2,
        systolic_bp=vital_in.systolic_bp,
        diastolic_bp=vital_in.diastolic_bp,
        respiratory_rate=vital_in.respiratory_rate,
        temperature_c=vital_in.temperature_c,
        is_abnormal=is_abnormal,
        created_at=datetime.now(timezone.utc)
    )
    db.add(vital_model)

    # Automatically compute new clinical signal based on updated vitals
    eval_res = evaluate_clinical_signal(
        case.domain,
        vital_in.heart_rate,
        vital_in.spo2,
        vital_in.systolic_bp,
        vital_in.diastolic_bp,
        vital_in.respiratory_rate
    )

    signal_model = ClinicalSignalModel(
        id=f"sig-{int(time.time() * 1000)}",
        case_id=case.id,
        risk_level=eval_res["risk_level"],
        risk_score=eval_res["risk_score"],
        detected_signals_json=eval_res["detected_signals"],
        clinical_significance=eval_res["clinical_significance"],
        next_step_recommendation=eval_res["next_step_recommendation"],
        is_reviewed=False,
        created_at=datetime.now(timezone.utc)
    )
    signal_model.detected_signals = eval_res["detected_signals"]
    db.add(signal_model)

    # Append immutable event to Event Store
    if is_abnormal:
        evt = append_event(
            db,
            case_id=case.id,
            title="Physiological Deterioration Event Detected",
            detail=f"Telemetry anomaly recorded by {actor_display}: HR {vital_in.heart_rate} bpm, SpO2 {vital_in.spo2}%, NIBP {vital_in.systolic_bp}/{vital_in.diastolic_bp} mmHg.",
            actor=actor_display,
            category="CLINICAL",
            status="CRITICAL" if eval_res["risk_level"] == "CRITICAL" else "WARNING",
            timestamp=timestamp_str,
            payload={"vitals": vital_in.model_dump(), "signal": eval_res, "actorUserId": actor_id}
        )
    else:
        evt = append_event(
            db,
            case_id=case.id,
            title="Vital Snapshot Recorded",
            detail=f"Telemetry snapshot recorded by {actor_display}: HR {vital_in.heart_rate} bpm, SpO2 {vital_in.spo2}%, NIBP {vital_in.systolic_bp}/{vital_in.diastolic_bp} mmHg.",
            actor=actor_display,
            category="CLINICAL",
            status="INFO",
            timestamp=timestamp_str,
            payload={"vitals": vital_in.model_dump(), "actorUserId": actor_id}
        )

    db.commit()
    db.refresh(case)

    # PERSIST THEN BROADCAST
    dispatch_event_nowait(
        case_id=case.id,
        event_type="VITAL_RECORDED",
        version=evt.version,
        event_id=evt.event_id,
        timestamp=evt.timestamp,
        actor_type="FIELD MEDIC",
        actor_id=actor_id,
        user_id=actor_id,
        role=actor_role,
        payload={
            "vitals": vital_in.model_dump(),
            "currentVitals": {
                "id": vital_model.id,
                "timestamp": vital_model.timestamp,
                "heartRate": vital_model.heart_rate,
                "spo2": vital_model.spo2,
                "systolicBp": vital_model.systolic_bp,
                "diastolicBp": vital_model.diastolic_bp,
                "respiratoryRate": vital_model.respiratory_rate,
                "temperatureC": vital_model.temperature_c,
                "isAbnormal": vital_model.is_abnormal
            },
            "signal": eval_res,
            "aiDecisionSupport": {
                "riskLevel": signal_model.risk_level,
                "riskScore": signal_model.risk_score,
                "detectedSignals": signal_model.detected_signals,
                "clinicalSignificance": signal_model.clinical_significance,
                "nextStepRecommendation": signal_model.next_step_recommendation,
                "isReviewed": signal_model.is_reviewed
            }
        }
    )

    # Automatically evaluate AI Decision Support (Phase 17)
    # Fail-safe: AI failures never block vital recording or WebSocket sync
    evaluate_case_decision_support(db, case, trigger_event=evt)

    return vital_model

def record_intervention(
    db: Session,
    case: EmergencyCaseModel,
    interv_in: InterventionCreate,
    actor_user: Optional[UserModel] = None
) -> InterventionModel:
    timestamp_str = interv_in.timestamp or datetime.now(timezone.utc).strftime("%H:%M:%S")
    interv_id = f"int-{int(time.time() * 1000)}"
    actor_display = actor_user.display_name if actor_user else interv_in.actor
    actor_id = actor_user.id if actor_user else "MEDIC-102"
    actor_role = actor_user.role if actor_user else "FIELD_MEDIC"

    interv_model = InterventionModel(
        id=interv_id,
        case_id=case.id,
        action_label=interv_in.action_label,
        detail_text=interv_in.detail_text,
        actor=actor_display,
        status="SUCCESS",
        timestamp=timestamp_str,
        created_at=datetime.now(timezone.utc)
    )
    db.add(interv_model)

    evt = append_event(
        db,
        case_id=case.id,
        title=f"Intervention Recorded: {interv_in.action_label}",
        detail=f"{interv_in.detail_text} (Recorded by {actor_display})",
        actor=actor_display,
        category="CLINICAL",
        status="SUCCESS",
        timestamp=timestamp_str,
        payload={"action_label": interv_in.action_label, "detail": interv_in.detail_text, "actorUserId": actor_id}
    )

    db.commit()

    # PERSIST THEN BROADCAST
    dispatch_event_nowait(
        case_id=case.id,
        event_type="INTERVENTION_RECORDED",
        version=evt.version,
        event_id=evt.event_id,
        timestamp=evt.timestamp,
        actor_type="FIELD MEDIC",
        actor_id=actor_id,
        user_id=actor_id,
        role=actor_role,
        payload={
            "intervention": {
                "id": interv_model.id,
                "actionLabel": interv_model.action_label,
                "detailText": interv_model.detail_text,
                "actor": interv_model.actor,
                "status": interv_model.status,
                "timestamp": interv_model.timestamp
            }
        }
    )

    # Automatically re-evaluate decision support if relevant (Phase 17)
    evaluate_case_decision_support(db, case, trigger_event=evt)

    return interv_model

def handle_clinician_review(
    db: Session,
    case: EmergencyCaseModel,
    review_in: ClinicianReviewCreate,
    actor_user: Optional[UserModel] = None
) -> ClinicianActionModel:
    timestamp_str = review_in.timestamp or datetime.now(timezone.utc).strftime("%H:%M:%S")
    action_id = f"act-{int(time.time() * 1000)}"
    # Authoritatively derive clinician identity from authenticated principal
    clinician_id = actor_user.id if actor_user else review_in.clinician_id
    clinician_name = actor_user.display_name if actor_user else review_in.clinician_name
    role = actor_user.role if actor_user else "REMOTE_CLINICIAN"

    action_model = ClinicianActionModel(
        id=action_id,
        case_id=case.id,
        action="CONFIRMED",
        clinician_id=clinician_id,
        clinician_name=clinician_name,
        timestamp=timestamp_str,
        notes=review_in.notes,
        review_plan_title=review_in.review_plan_title or "Trauma Stabilization & Readiness Plan",
        created_at=datetime.now(timezone.utc)
    )
    db.add(action_model)

    # Append immutable event to Event Store
    domain_plan_name = (
        "Trauma Review Plan Confirmed"
        if case.domain == "TRAUMA"
        else "Envenomation Review Plan Confirmed"
        if case.domain == "SNAKEBITE"
        else "Toxicology Review Plan Confirmed"
    )

    evt = append_event(
        db,
        case_id=case.id,
        title=domain_plan_name,
        detail=f"Plan confirmed by {clinician_name} ({clinician_id}). Notes: {review_in.notes or 'Clinical coordination protocol endorsed for inbound transit.'}",
        actor=clinician_name,
        category="CLINICAL",
        status="SUCCESS",
        timestamp=timestamp_str,
        payload={"clinician": clinician_name, "clinicianId": clinician_id, "plan": review_in.review_plan_title}
    )

    # Advance conduit step to Clinician Review step if lower
    case.conduit_step = max(case.conduit_step, 3)

    db.commit()

    # PERSIST THEN BROADCAST
    dispatch_event_nowait(
        case_id=case.id,
        event_type="CLINICIAN_PLAN_CONFIRMED",
        version=evt.version,
        event_id=evt.event_id,
        timestamp=evt.timestamp,
        actor_type="CLINICIAN",
        actor_id=clinician_id,
        user_id=clinician_id,
        role=role,
        payload={
            "action": "CONFIRMED",
            "clinicianId": clinician_id,
            "clinicianName": clinician_name,
            "reviewPlanTitle": review_in.review_plan_title or "Trauma Stabilization & Readiness Plan",
            "notes": review_in.notes,
            "conduitStep": case.conduit_step
        }
    )

    return action_model

def handle_clinician_data_request(
    db: Session,
    case: EmergencyCaseModel,
    data_req_in: ClinicianDataRequestCreate,
    actor_user: Optional[UserModel] = None
) -> ClinicianActionModel:
    timestamp_str = data_req_in.timestamp or datetime.now(timezone.utc).strftime("%H:%M:%S")
    action_id = f"act-{int(time.time() * 1000)}"
    clinician_id = actor_user.id if actor_user else data_req_in.clinician_id
    clinician_name = actor_user.display_name if actor_user else data_req_in.clinician_name
    role = actor_user.role if actor_user else "REMOTE_CLINICIAN"

    action_model = ClinicianActionModel(
        id=action_id,
        case_id=case.id,
        action="DATA_REQUESTED",
        clinician_id=clinician_id,
        clinician_name=clinician_name,
        timestamp=timestamp_str,
        notes=data_req_in.notes,
        requested_data_type=data_req_in.requested_data_type,
        created_at=datetime.now(timezone.utc)
    )
    db.add(action_model)

    evt = append_event(
        db,
        case_id=case.id,
        title=f"Clinical Observation Requested: {data_req_in.requested_data_type}",
        detail=f"Specialist {clinician_name} requested: {data_req_in.requested_data_type}. {data_req_in.notes or ''}",
        actor=clinician_name,
        category="CLINICAL",
        status="WARNING",
        timestamp=timestamp_str,
        payload={"requestedDataType": data_req_in.requested_data_type, "clinicianId": clinician_id}
    )

    db.commit()

    # PERSIST THEN BROADCAST
    dispatch_event_nowait(
        case_id=case.id,
        event_type="CLINICIAN_DATA_REQUESTED",
        version=evt.version,
        event_id=evt.event_id,
        timestamp=evt.timestamp,
        actor_type="CLINICIAN",
        actor_id=clinician_id,
        user_id=clinician_id,
        role=role,
        payload={
            "action": "DATA_REQUESTED",
            "requestedDataType": data_req_in.requested_data_type,
            "clinicianId": clinician_id,
            "clinicianName": clinician_name
        }
    )

    return action_model

def handle_clinician_escalation(
    db: Session,
    case: EmergencyCaseModel,
    esc_in: ClinicianEscalationCreate,
    actor_user: Optional[UserModel] = None
) -> ClinicianActionModel:
    timestamp_str = esc_in.timestamp or datetime.now(timezone.utc).strftime("%H:%M:%S")
    action_id = f"act-{int(time.time() * 1000)}"
    clinician_id = actor_user.id if actor_user else esc_in.clinician_id
    clinician_name = actor_user.display_name if actor_user else esc_in.clinician_name
    role = actor_user.role if actor_user else "REMOTE_CLINICIAN"

    action_model = ClinicianActionModel(
        id=action_id,
        case_id=case.id,
        action="ESCALATED",
        clinician_id=clinician_id,
        clinician_name=clinician_name,
        timestamp=timestamp_str,
        notes=esc_in.notes or esc_in.reason,
        created_at=datetime.now(timezone.utc)
    )
    db.add(action_model)

    evt = append_event(
        db,
        case_id=case.id,
        title="Case Escalated for Urgent Senior Review",
        detail=f"Priority escalated by {clinician_name}. Reason: {esc_in.reason}",
        actor=clinician_name,
        category="CLINICAL",
        status="CRITICAL",
        timestamp=timestamp_str,
        payload={"reason": esc_in.reason, "clinicianId": clinician_id}
    )

    db.commit()

    # PERSIST THEN BROADCAST
    dispatch_event_nowait(
        case_id=case.id,
        event_type="CLINICIAN_ESCALATED",
        version=evt.version,
        event_id=evt.event_id,
        timestamp=evt.timestamp,
        actor_type="CLINICIAN",
        actor_id=clinician_id,
        user_id=clinician_id,
        role=role,
        payload={
            "action": "ESCALATED",
            "reason": esc_in.reason,
            "clinicianId": clinician_id,
            "clinicianName": clinician_name
        }
    )

    return action_model

def handle_clinician_acknowledgement(
    db: Session,
    case: EmergencyCaseModel,
    ack_in: ClinicianAcknowledgeCreate,
    actor_user: Optional[UserModel] = None
) -> ClinicianActionModel:
    timestamp_str = ack_in.timestamp or datetime.now(timezone.utc).strftime("%H:%M:%S")
    action_id = f"act-{int(time.time() * 1000)}"
    clinician_id = actor_user.id if actor_user else ack_in.clinician_id
    clinician_name = actor_user.display_name if actor_user else ack_in.clinician_name
    role = actor_user.role if actor_user else "REMOTE_CLINICIAN"

    action_model = ClinicianActionModel(
        id=action_id,
        case_id=case.id,
        action="ACKNOWLEDGED",
        clinician_id=clinician_id,
        clinician_name=clinician_name,
        timestamp=timestamp_str,
        notes=ack_in.notes or "Signal acknowledged by clinician.",
        created_at=datetime.now(timezone.utc)
    )
    db.add(action_model)

    evt = append_event(
        db,
        case_id=case.id,
        title="Hemodynamic Signal Acknowledged by Clinician",
        detail=f"Remote specialist {clinician_name} reviewed the telemetry signal without protocol change.",
        actor=clinician_name,
        category="CLINICAL",
        status="INFO",
        timestamp=timestamp_str,
        payload={"signalId": ack_in.signal_id, "clinicianId": clinician_id}
    )

    # Mark active AI decision support signals as ACKNOWLEDGED (Phase 17)
    now_utc = datetime.now(timezone.utc)
    active_signals = db.query(DecisionSupportSignalModel).filter(
        DecisionSupportSignalModel.case_id == case.id,
        DecisionSupportSignalModel.status == "NEW"
    ).all()
    for sig in active_signals:
        sig.status = "ACKNOWLEDGED"
        sig.acknowledged_at = now_utc
        sig.acknowledged_by = clinician_name

    db.commit()

    # PERSIST THEN BROADCAST
    dispatch_event_nowait(
        case_id=case.id,
        event_type="CLINICIAN_SIGNAL_ACKNOWLEDGED",
        version=evt.version,
        event_id=evt.event_id,
        timestamp=evt.timestamp,
        actor_type="CLINICIAN",
        actor_id=clinician_id,
        user_id=clinician_id,
        role=role,
        payload={
            "action": "ACKNOWLEDGED",
            "signalId": ack_in.signal_id,
            "clinicianId": clinician_id,
            "clinicianName": clinician_name
        }
    )

    return action_model
