import sys
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app.domain.models import (
    EmergencyCaseModel,
    PatientModel,
    AmbulanceModel,
    VitalSnapshotModel,
    FacilityCandidateModel,
    FacilityReadinessModel,
    ClinicianActionModel,
    TimelineEventModel,
    HandoverPackageModel,
    AgentTaskModel,
    AgentTraceItemModel
)
from app.engine.seed_data import SCENARIOS
from app.engine.emergency_engine import evaluate_clinical_signal
from app.services.clinical_service import ClinicalSignalModel

def seed_single_scenario(db: Session, seed: dict) -> EmergencyCaseModel:
    case_id = seed["id"]

    case = EmergencyCaseModel(
        id=case_id,
        domain=seed["domain"],
        status=seed["status"],
        scenario_title=seed["scenario_title"],
        conduit_step=seed.get("conduit_step", 2),
        created_at=datetime.now(timezone.utc)
    )
    db.add(case)

    # Patient
    p_data = seed["patient"]
    patient = PatientModel(
        id=p_data["id"],
        case_id=case_id,
        name=p_data["name"],
        age=p_data["age"],
        sex=p_data["sex"],
        incident_type=p_data["incident_type"],
        chief_complaint=p_data["chief_complaint"],
        conscious_state=p_data["conscious_state"],
        gcs_score=p_data["gcs_score"],
        reported_blood_loss=p_data["reported_blood_loss"]
    )
    db.add(patient)

    # Ambulance
    a_data = seed["ambulance"]
    ambulance = AmbulanceModel(
        id=a_data["id"],
        case_id=case_id,
        call_sign=a_data["call_sign"],
        crew_lead=a_data["crew_lead"],
        current_speed_kmh=a_data["current_speed_kmh"],
        base_eta_minutes=a_data["base_eta_minutes"],
        traffic_delay_minutes=a_data["traffic_delay_minutes"],
        is_traffic_delayed=a_data["is_traffic_delayed"],
        assigned_hospital=a_data["assigned_hospital"],
        lat=a_data["lat"],
        lng=a_data["lng"]
    )
    db.add(ambulance)

    # Vitals
    for idx, v in enumerate(seed["vitals"]):
        vital = VitalSnapshotModel(
            id=f"vit-{case_id}-{idx+1}",
            case_id=case_id,
            timestamp=v["timestamp"],
            heart_rate=v["heart_rate"],
            spo2=v["spo2"],
            systolic_bp=v["systolic_bp"],
            diastolic_bp=v["diastolic_bp"],
            respiratory_rate=v.get("respiratory_rate", 18),
            temperature_c=v.get("temperature_c", 37.0),
            is_abnormal=v.get("is_abnormal", False),
            created_at=datetime.now(timezone.utc)
        )
        db.add(vital)

    # Initial Clinical Signal computed from latest vital
    latest_vital = seed["vitals"][-1]
    sig_eval = evaluate_clinical_signal(
        seed["domain"],
        latest_vital["heart_rate"],
        latest_vital["spo2"],
        latest_vital["systolic_bp"],
        latest_vital["diastolic_bp"],
        latest_vital.get("respiratory_rate", 18)
    )

    signal = ClinicalSignalModel(
        id=f"sig-{case_id}-init",
        case_id=case_id,
        risk_level=sig_eval["risk_level"],
        risk_score=sig_eval["risk_score"],
        clinical_significance=sig_eval["clinical_significance"],
        next_step_recommendation=sig_eval["next_step_recommendation"],
        is_reviewed=False,
        created_at=datetime.now(timezone.utc)
    )
    signal.detected_signals = sig_eval["detected_signals"]
    db.add(signal)

    # Facilities
    for f in seed["facilities"]:
        fac = FacilityCandidateModel(
            id=f"{case_id}-{f['id']}",
            case_id=case_id,
            facility_id=f["facility_id"],
            name=f["name"],
            trauma_level=f["trauma_level"],
            distance_km=f["distance_km"],
            eta_minutes=f["eta_minutes"],
            match_score=f["match_score"],
            clinical_fit_score=f.get("clinical_fit_score", 70),
            availability_score=f.get("availability_score", 85),
            eta_score=f.get("eta_score", 80),
            is_primary=f.get("is_primary", False),
            specialty_fit=f["specialty_fit"],
            availability=f["availability"],
            rationale=f["rationale"]
        )
        db.add(fac)

    # Readiness
    r_data = seed["readiness"]
    readiness = FacilityReadinessModel(
        id=f"{case_id}-{r_data['id']}",
        case_id=case_id,
        status=r_data["status"],
        assigned_bay=r_data["assigned_bay"],
        bed_number=r_data.get("bed_number"),
        is_pre_alert_dispatched=r_data.get("is_pre_alert_dispatched", True),
        is_pre_alert_acknowledged=r_data.get("is_pre_alert_acknowledged", False),
        acknowledged_at=r_data.get("acknowledged_at"),
        confirmed_by=r_data.get("confirmed_by")
    )
    readiness.resources_ready = r_data.get("resources_ready", [])
    db.add(readiness)

    # Endorsement
    e_data = seed.get("endorsement")
    if e_data:
        action = ClinicianActionModel(
            id=f"act-{case_id}-init",
            case_id=case_id,
            action=e_data["status"],
            clinician_id=e_data.get("clinician_id", "DOC-482"),
            clinician_name=e_data.get("clinician_name", "Dr. Sunita Rao, MD"),
            timestamp=latest_vital["timestamp"],
            notes="Initial pending specialist review queue.",
            created_at=datetime.now(timezone.utc)
        )
        db.add(action)

    # Timeline (Events)
    for evt in seed["timeline"]:
        db_evt = TimelineEventModel(
            id=f"db-{case_id}-{evt['id']}",
            case_id=case_id,
            event_id=evt["id"],
            timestamp=evt["timestamp"],
            category=evt["category"],
            title=evt["title"],
            detail=evt["detail"],
            actor=evt["actor"],
            status=evt["status"],
            payload_json="{}",
            created_at=datetime.now(timezone.utc)
        )
        db.add(db_evt)

    db.flush()
    from app.ai.service import evaluate_case_decision_support
    evaluate_case_decision_support(db, case, force=True)

    try:
        from app.services.handover_service import generate_and_persist_handover
        from app.domain.models import UserModel
        system_user = UserModel(
            id="usr-system",
            username="system@prana.health",
            email="system@prana.health",
            password_hash="system",
            display_name="PRANA Coordination Engine",
            role="SYSTEM"
        )
        generate_and_persist_handover(db, case, system_user)
    except Exception as e:
        print(f"[PRANA DB Handover Notice] {e}")

    return case


from sqlalchemy import text
from app.domain.models import (
    EmergencyCaseModel,
    PatientModel,
    AmbulanceModel,
    VitalSnapshotModel,
    FacilityCandidateModel,
    FacilityReadinessModel,
    ClinicianActionModel,
    TimelineEventModel,
    UserModel,
    CaseParticipantModel
)
from app.core.security import hash_password
from app.domain.schemas import UserRoleEnum

DEMO_USERS = [
    {
        "id": "usr-medic-102",
        "username": "medic@demo.prana",
        "email": "medic@demo.prana",
        "password": "prana-demo-2026",
        "display_name": "Paramedic Rajesh Kumar",
        "role": UserRoleEnum.FIELD_MEDIC.value,
        "cases": ["PR-8492", "PR-7104", "PR-9521", "PR-4018"]
    },
    {
        "id": "usr-clinician-482",
        "username": "clinician@demo.prana",
        "email": "clinician@demo.prana",
        "password": "prana-demo-2026",
        "display_name": "Dr. Sunita Rao, MD",
        "role": UserRoleEnum.REMOTE_CLINICIAN.value,
        "cases": ["PR-8492", "PR-7104", "PR-9521", "PR-4018"]
    },
    {
        "id": "usr-hospital-704",
        "username": "hospital@demo.prana",
        "email": "hospital@demo.prana",
        "password": "prana-demo-2026",
        "display_name": "Sister Philomina, RN",
        "role": UserRoleEnum.HOSPITAL_COMMAND.value,
        "cases": ["PR-8492", "PR-7104", "PR-9521", "PR-4018"]
    },
    {
        "id": "usr-readiness-301",
        "username": "readiness@demo.prana",
        "email": "readiness@demo.prana",
        "password": "prana-demo-2026",
        "display_name": "Officer Anil Deshmukh",
        "role": UserRoleEnum.READINESS.value,
        "cases": ["PR-8492", "PR-7104", "PR-9521", "PR-4018"]
    },
    {
        "id": "usr-admin-001",
        "username": "admin@demo.prana",
        "email": "admin@demo.prana",
        "password": "prana-demo-2026",
        "display_name": "Director Vikram Sharma",
        "role": UserRoleEnum.PORTAL_ADMIN.value,
        "cases": ["PR-8492", "PR-7104", "PR-9521", "PR-4018"]
    },
    {
        "id": "usr-medic-999",
        "username": "unassigned@demo.prana",
        "email": "unassigned@demo.prana",
        "password": "prana-demo-2026",
        "display_name": "Paramedic Unassigned",
        "role": UserRoleEnum.FIELD_MEDIC.value,
        "cases": [] # No cases assigned for case authorization denial tests
    }
]

def seed_demo_users(db: Session):
    """
    Seed development demo personas with hashed passwords and case access.
    """
    for u_info in DEMO_USERS:
        existing = db.query(UserModel).filter(
            (UserModel.id == u_info["id"]) | (UserModel.username == u_info["username"])
        ).first()
        if not existing:
            user = UserModel(
                id=u_info["id"],
                username=u_info["username"],
                email=u_info["email"],
                password_hash=hash_password(u_info["password"]),
                display_name=u_info["display_name"],
                role=u_info["role"],
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(user)
            db.flush()
            print(f"[PRANA DB] Seeded demo user: {user.display_name} ({user.role})")
        else:
            user = existing

        # Seed case participants
        for case_id in u_info["cases"]:
            existing_part = db.query(CaseParticipantModel).filter(
                CaseParticipantModel.case_id == case_id,
                CaseParticipantModel.user_id == user.id
            ).first()
            if not existing_part:
                part = CaseParticipantModel(
                    id=f"cp-{case_id}-{user.id}",
                    case_id=case_id,
                    user_id=user.id,
                    role=user.role,
                    assigned_at=datetime.now(timezone.utc),
                    active=True
                )
                db.add(part)


def ensure_schema_migrations():
    """
    Lightweight forward migration for existing SQLite database files.
    """
    with engine.connect() as conn:
        try:
            conn.execute(text("SELECT current_version FROM cases LIMIT 1"))
        except Exception:
            try:
                conn.execute(text("ALTER TABLE cases ADD COLUMN current_version INTEGER NOT NULL DEFAULT 1"))
                conn.commit()
                print("[PRANA DB Migration] Added column 'current_version' to 'cases' table.")
            except Exception as e:
                print(f"[PRANA DB Migration Notice] cases migration: {e}")

        try:
            conn.execute(text("SELECT version FROM timeline_events LIMIT 1"))
        except Exception:
            try:
                conn.execute(text("ALTER TABLE timeline_events ADD COLUMN version INTEGER NOT NULL DEFAULT 1"))
                conn.commit()
                print("[PRANA DB Migration] Added column 'version' to 'timeline_events' table.")
            except Exception as e:
                print(f"[PRANA DB Migration Notice] timeline_events migration: {e}")

def init_db(force: bool = False):
    """
    Initializes SQLite tables and seeds the 3 competition scenarios plus demo users.
    """
    if force:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    ensure_schema_migrations()

    db: Session = SessionLocal()
    try:
        for case_id, seed in SCENARIOS.items():
            existing = db.query(EmergencyCaseModel).filter(EmergencyCaseModel.id == case_id).first()
            if not existing:
                print(f"[PRANA DB] Seeding scenario: {case_id} ({seed['domain']})...")
                seed_single_scenario(db, seed)
            else:
                print(f"[PRANA DB] Scenario {case_id} already exists in database.")
        
        # Seed users and participants
        seed_demo_users(db)

        db.commit()
        print("[PRANA DB] Database initialized and seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"[PRANA DB Error] Failed to initialize database: {e}", file=sys.stderr)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
