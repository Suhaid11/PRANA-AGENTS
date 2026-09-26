from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.domain.models import UserModel
from app.domain.schemas import VitalSnapshotCreate, VitalSnapshotSchema, EmergencyCaseDetailSchema, UserRoleEnum
from app.services.case_service import get_case_or_404, build_case_snapshot
from app.services.clinical_service import record_vital
from app.api.deps import get_current_user, require_role, check_case_access

router = APIRouter(prefix="/cases", tags=["Vitals & Telemetry"])

@router.post("/{case_id}/vitals", response_model=EmergencyCaseDetailSchema, status_code=status.HTTP_201_CREATED)
def record_case_vital(
    case_id: str,
    vital_in: VitalSnapshotCreate,
    current_user: UserModel = Depends(require_role(UserRoleEnum.FIELD_MEDIC.value, UserRoleEnum.PORTAL_ADMIN.value)),
    db: Session = Depends(get_db)
):
    """
    Record a new vital snapshot for an emergency case:
    1. Enforces FIELD_MEDIC role requirement.
    2. Enforces case-level assignment check.
    3. Persists vital in SQLite database with authoritatively stamped actor.
    4. Deterministically computes updated clinical signal.
    5. Appends immutable event to Append-Only Event Store.
    6. Broadcasts event with authenticated actor identity.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)
    record_vital(db, case, vital_in, actor_user=current_user)
    return build_case_snapshot(case)

@router.get("/{case_id}/vitals", response_model=list[VitalSnapshotSchema])
def get_case_vitals(
    case_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get full chronological history of vital snapshots for an emergency case.
    Requires authenticated user with assigned case access.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)
    return [
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
        )
        for v in sorted(case.vitals, key=lambda v: v.created_at)
    ]
