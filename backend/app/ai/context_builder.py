from sqlalchemy.orm import Session
from app.domain.models import EmergencyCaseModel, TimelineEventModel
from app.ai.schemas import AIContextInput

def build_ai_case_context(case: EmergencyCaseModel, db: Session) -> AIContextInput:
    """
    Constructs a least-privilege, privacy-preserving case context representation
    for the AI Decision Support Engine.
    Excludes all authentication credentials, user records, and unrelated database data.
    """
    patient = case.patient
    ambulance = case.ambulance

    # 1. Latest Vitals & Trend (sorted chronologically)
    all_vitals = sorted(case.vitals, key=lambda v: v.created_at)
    latest_v = all_vitals[-1] if all_vitals else None
    
    latest_vitals_dict = {
        "heart_rate": latest_v.heart_rate if latest_v else 80,
        "spo2": latest_v.spo2 if latest_v else 98,
        "systolic_bp": latest_v.systolic_bp if latest_v else 120,
        "diastolic_bp": latest_v.diastolic_bp if latest_v else 80,
        "respiratory_rate": latest_v.respiratory_rate if latest_v else 16,
        "temperature_c": latest_v.temperature_c if latest_v else 37.0,
        "is_abnormal": latest_v.is_abnormal if latest_v else False,
        "timestamp": latest_v.timestamp if latest_v else "14:15:00"
    }

    recent_trend = [
        {
            "timestamp": v.timestamp,
            "heart_rate": v.heart_rate,
            "spo2": v.spo2,
            "systolic_bp": v.systolic_bp,
            "diastolic_bp": v.diastolic_bp,
        }
        for v in all_vitals[-5:]
    ]

    # 2. Recent Interventions
    interventions = [
        {
            "action_label": i.action_label,
            "detail_text": i.detail_text,
            "timestamp": i.timestamp
        }
        for i in sorted(case.interventions, key=lambda x: x.created_at)[-5:]
    ]

    # 3. Source Timeline Event IDs for provenance
    recent_events = (
        db.query(TimelineEventModel.event_id)
        .filter(TimelineEventModel.case_id == case.id)
        .order_by(TimelineEventModel.created_at.desc())
        .limit(5)
        .all()
    )
    event_ids = [e[0] for e in reversed(recent_events)]

    return AIContextInput(
        caseId=case.id,
        domain=case.domain,
        patientAge=patient.age if patient else 34,
        patientSex=patient.sex if patient else "Male",
        chiefComplaint=patient.chief_complaint if patient else "",
        consciousState=patient.conscious_state if patient else "Alert",
        gcsScore=patient.gcs_score if patient else 15,
        reportedBloodLoss=patient.reported_blood_loss if patient else "None",
        conduitStep=case.conduit_step,
        latestVitals=latest_vitals_dict,
        recentVitalsTrend=recent_trend,
        recentInterventions=interventions,
        recentEventIds=event_ids,
        assignedHospital=ambulance.assigned_hospital if ambulance else "",
        etaMinutes=ambulance.base_eta_minutes + ambulance.traffic_delay_minutes if ambulance else 15
    )
