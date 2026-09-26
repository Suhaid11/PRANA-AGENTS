from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.domain.models import UserModel
from app.domain.schemas import EmergencyCaseDetailSchema, UserRoleEnum
from app.services.case_service import get_case_or_404, build_case_snapshot
from app.services.facility_service import (
    recalculate_facilities,
    dispatch_hospital_prealert,
    acknowledge_hospital_prealert,
    confirm_hospital_bay_ready
)
from app.api.deps import get_current_user, require_role, check_case_access

router = APIRouter(prefix="/cases", tags=["Facilities & Hospital Readiness"])

@router.post("/{case_id}/facility-matching/recalculate", response_model=EmergencyCaseDetailSchema)
def recalculate_facility_matching(
    case_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Rerun multi-factor facility matching (Clinical Fit 40% + Availability 30% + ETA 30%).
    Requires authenticated user with assigned case access.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)
    recalculate_facilities(db, case)
    return build_case_snapshot(case)

@router.post("/{case_id}/hospital/pre-alert", response_model=EmergencyCaseDetailSchema)
def send_hospital_prealert(
    case_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dispatch pre-arrival electronic telemetry notification to the receiving facility.
    Requires authenticated case participant.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)
    dispatch_hospital_prealert(db, case)
    return build_case_snapshot(case)

@router.post("/{case_id}/hospital/acknowledge", response_model=EmergencyCaseDetailSchema)
def acknowledge_hospital(
    case_id: str,
    current_user: UserModel = Depends(require_role(UserRoleEnum.HOSPITAL_COMMAND.value, UserRoleEnum.PORTAL_ADMIN.value)),
    db: Session = Depends(get_db)
):
    """
    Formal receiving hospital acknowledgement handshake.
    Enforces HOSPITAL_COMMAND role requirement.
    Actor is authoritatively stamped from current_user.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)
    acknowledge_hospital_prealert(db, case, actor_user=current_user)
    return build_case_snapshot(case)

@router.post("/{case_id}/hospital/bay-ready", response_model=EmergencyCaseDetailSchema)
def confirm_bay_ready(
    case_id: str,
    assigned_bay: str = "Trauma Bay 1 (Red Zone)",
    current_user: UserModel = Depends(require_role(UserRoleEnum.HOSPITAL_COMMAND.value, UserRoleEnum.PORTAL_ADMIN.value)),
    db: Session = Depends(get_db)
):
    """
    Confirm sterile resuscitation bay readiness and team standby.
    Enforces HOSPITAL_COMMAND role requirement.
    FIELD_MEDIC or unauthorized callers are strictly rejected with 403 Forbidden.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)
    confirm_hospital_bay_ready(db, case, assigned_bay=assigned_bay, actor_user=current_user)
    return build_case_snapshot(case)
