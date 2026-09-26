from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.domain.models import (
    EmergencyCaseModel,
    PatientModel,
    AmbulanceModel,
    VitalSnapshotModel,
    ClinicalSignalModel,
    ClinicianActionModel,
    FacilityCandidateModel,
    FacilityReadinessModel,
    TimelineEventModel
)
from app.domain.schemas import (
    EmergencyCaseDetailSchema,
    PatientSchema,
    AmbulanceSchema,
    VitalSnapshotSchema,
    ClinicalSignalSchema,
    ClinicianEndorsementSchema,
    HospitalReadinessSchema,
    HospitalCandidateSchema,
    FacilityMatchingSchema,
    TimelineEventSchema
)
from app.engine.emergency_engine import calculate_derived_eta
from app.engine.seed_data import SCENARIOS
from app.services.event_service import append_event

def get_case_or_404(db: Session, case_id: str) -> EmergencyCaseModel:
    case = db.query(EmergencyCaseModel).filter(EmergencyCaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Emergency case '{case_id}' not found")
    return case

def build_case_snapshot(case: EmergencyCaseModel) -> EmergencyCaseDetailSchema:
    # 1. Patient
    p = case.patient
    patient_schema = PatientSchema(
        id=p.id,
        name=p.name,
        age=p.age,
        sex=p.sex,
        incidentType=p.incident_type,
        chiefComplaint=p.chief_complaint,
        consciousState=p.conscious_state,
        gcsScore=p.gcs_score,
        reportedBloodLoss=p.reported_blood_loss
    )

    # 2. Ambulance
    amb = case.ambulance
    effective_eta = calculate_derived_eta(amb.base_eta_minutes, amb.traffic_delay_minutes)
    ambulance_schema = AmbulanceSchema(
        callSign=amb.call_sign,
        crewLead=amb.crew_lead,
        currentSpeedKmH=amb.current_speed_kmh,
        baseEtaMinutes=amb.base_eta_minutes,
        trafficDelayMinutes=amb.traffic_delay_minutes,
        isTrafficDelayed=amb.is_traffic_delayed,
        effectiveEtaMinutes=effective_eta,
        assignedHospital=amb.assigned_hospital,
        coordinates={"lat": amb.lat, "lng": amb.lng}
    )

    # 3. Vitals
    all_vitals = sorted(case.vitals, key=lambda v: v.created_at)
    vitals_schemas = [
        VitalSnapshotSchema(
            id=v.id,
            timestamp=v.timestamp,
            heartRate=v.heart_rate,
            spo2=v.spo2,
            systolicBp=v.systolic_bp,
            diastolicBp=v.diastolic_bp,
            respiratoryRate=v.respiratory_rate,
            temperatureC=v.temperature_c,
            isAbnormal=v.is_abnormal
        ) for v in all_vitals
    ]

    current_vital = vitals_schemas[-1] if vitals_schemas else VitalSnapshotSchema(
        timestamp="00:00:00",
        heartRate=80,
        spo2=98,
        systolicBp=120,
        diastolicBp=80,
        respiratoryRate=16,
        temperatureC=37.0,
        isAbnormal=False
    )

    # 4. Clinical Signal
    latest_signal = case.clinical_signals[0] if case.clinical_signals else None
    signal_schema = None
    if latest_signal:
        signal_schema = ClinicalSignalSchema(
            riskLevel=latest_signal.risk_level,
            riskScore=latest_signal.risk_score,
            detectedSignals=latest_signal.detected_signals,
            clinicalSignificance=latest_signal.clinical_significance,
            nextStepRecommendation=latest_signal.next_step_recommendation,
            isReviewed=latest_signal.is_reviewed
        )

    # 5. Clinician Endorsement
    latest_action = case.clinician_actions[0] if case.clinician_actions else None
    endorsement_schema = ClinicianEndorsementSchema(
        status=latest_action.action if latest_action else "PENDING",
        clinicianName=latest_action.clinician_name if latest_action else "Dr. Sunita Rao, MD",
        clinicianId=latest_action.clinician_id if latest_action else "DOC-482",
        timestamp=latest_action.timestamp if latest_action else None,
        notes=latest_action.notes if latest_action else None,
        authorizedProtocol=latest_action.review_plan_title if latest_action else None
    )

    # 6. Facility Readiness
    readiness = case.readiness
    readiness_schema = None
    if readiness:
        readiness_schema = HospitalReadinessSchema(
            status=readiness.status,
            assignedBay=readiness.assigned_bay,
            confirmedBy=readiness.confirmed_by,
            timestamp=readiness.timestamp,
            isPreAlertDispatched=readiness.is_pre_alert_dispatched,
            isPreAlertAcknowledged=readiness.is_pre_alert_acknowledged,
            acknowledgedAt=readiness.acknowledged_at,
            bedNumber=readiness.bed_number,
            resourcesReady=readiness.resources_ready
        )

    # 7. Facilities & Matching
    facility_candidates = [
        HospitalCandidateSchema(
            id=f.facility_id,
            name=f.name,
            traumaLevel=f.trauma_level,
            distanceKm=f.distance_km,
            etaMinutes=f.eta_minutes,
            matchScore=f.match_score,
            clinicalFitScore=f.clinical_fit_score,
            availabilityScore=f.availability_score,
            etaScore=f.eta_score,
            isPrimary=f.is_primary,
            specialtyFit=f.specialty_fit,
            availability=f.availability,
            rationale=f.rationale
        ) for f in sorted(case.facilities, key=lambda x: x.match_score, reverse=True)
    ]

    primary_cand = next((c for c in facility_candidates if c.is_primary), facility_candidates[0] if facility_candidates else None)
    facility_matching_schema = None
    if primary_cand:
        facility_matching_schema = FacilityMatchingSchema(
            recommendedHospitalId=primary_cand.id,
            algorithmRationale=primary_cand.rationale,
            candidates=facility_candidates
        )

    # 8. Events (Timeline) - returned in reverse chronological order (newest first)
    timeline_schemas = [
        TimelineEventSchema(
            id=e.event_id,
            version=e.version,
            timestamp=e.timestamp,
            category=e.category,
            title=e.title,
            detail=e.detail,
            actor=e.actor,
            status=e.status,
            payload=e.payload
        ) for e in sorted(case.events, key=lambda x: x.created_at, reverse=True)
    ]

    return EmergencyCaseDetailSchema(
        id=case.id,
        domain=case.domain,
        status=case.status,
        scenarioTitle=case.scenario_title,
        conduitStep=case.conduit_step,
        currentVersion=case.current_version or 1,
        patient=patient_schema,
        ambulance=ambulance_schema,
        currentVitals=current_vital,
        vitalsHistory=vitals_schemas,
        timeline=timeline_schemas,
        aiDecisionSupport=signal_schema,
        activeDecisionSignal={
            "signalId": case.decision_signals[0].id,
            "caseId": case.decision_signals[0].case_id,
            "generatedAt": case.decision_signals[0].created_at.strftime("%H:%M:%S"),
            "provider": case.decision_signals[0].provider,
            "providerVersion": case.decision_signals[0].provider_version,
            "signalType": case.decision_signals[0].signal_type,
            "title": case.decision_signals[0].title,
            "observedData": case.decision_signals[0].observed_data,
            "explanation": case.decision_signals[0].explanation,
            "relevantTimelineEventIds": case.decision_signals[0].relevant_event_ids,
            "requiresClinicianReview": case.decision_signals[0].requires_clinician_review,
            "status": case.decision_signals[0].status,
            "safetyLabel": case.decision_signals[0].safety_label
        } if case.decision_signals else None,
        clinicianEndorsement=endorsement_schema,
        hospitalReadiness=readiness_schema,
        facilityMatching=facility_matching_schema,
        cdsDataStatus=case.cds_data_status or "NOT_SENT"
    )

def reset_case_to_seed(db: Session, case_id: str) -> EmergencyCaseModel:
    """
    Reset a case to its deterministic seed state.
    """
    seed = SCENARIOS.get(case_id)
    if not seed:
        raise HTTPException(status_code=404, detail=f"Seed scenario '{case_id}' not available")

    # Delete existing case if present
    existing = db.query(EmergencyCaseModel).filter(EmergencyCaseModel.id == case_id).first()
    if existing:
        db.delete(existing)
        db.commit()

    from app.init_db import seed_single_scenario, seed_demo_users
    seed_single_scenario(db, seed)
    seed_demo_users(db)
    db.commit()

    return get_case_or_404(db, case_id)
