from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.domain.models import UserModel
from app.domain.schemas import (
    ClinicianReviewCreate,
    ClinicianDataRequestCreate,
    ClinicianEscalationCreate,
    ClinicianAcknowledgeCreate,
    EmergencyCaseDetailSchema,
    UserRoleEnum
)
from pydantic import BaseModel, ConfigDict
from typing import Optional
from app.services.case_service import get_case_or_404, build_case_snapshot
from app.services.clinical_service import (
    handle_clinician_review,
    handle_clinician_data_request,
    handle_clinician_escalation,
    handle_clinician_acknowledgement,
    handle_hospital_escalation_acknowledgement
)
from app.api.deps import require_role, check_case_access

router = APIRouter(prefix="/cases", tags=["Clinician Tele-Specialist Authority"])

@router.post("/{case_id}/clinician-review", response_model=EmergencyCaseDetailSchema)
def confirm_review_plan(
    case_id: str,
    review_in: ClinicianReviewCreate,
    current_user: UserModel = Depends(require_role(UserRoleEnum.REMOTE_CLINICIAN.value)),
    db: Session = Depends(get_db)
):
    """
    CONFIRM REVIEW PLAN:
    Specialist endorses the prehospital coordination/review plan for inbound transit.
    Enforces REMOTE_CLINICIAN role authority and case participant assignment.
    Actor identity is authoritatively derived from the authenticated principal.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)
    handle_clinician_review(db, case, review_in, actor_user=current_user)
    return build_case_snapshot(case)

@router.post("/{case_id}/data-request", response_model=EmergencyCaseDetailSchema)
def request_additional_data(
    case_id: str,
    req_in: ClinicianDataRequestCreate,
    current_user: UserModel = Depends(require_role(UserRoleEnum.REMOTE_CLINICIAN.value)),
    db: Session = Depends(get_db)
):
    """
    REQUEST ADDITIONAL DATA:
    Specialist requests a specific physical/clinical observation from the field team.
    Enforces REMOTE_CLINICIAN role authority.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)
    handle_clinician_data_request(db, case, req_in, actor_user=current_user)
    return build_case_snapshot(case)

@router.post("/{case_id}/escalation", response_model=EmergencyCaseDetailSchema)
def escalate_for_urgent_review(
    case_id: str,
    esc_in: ClinicianEscalationCreate,
    current_user: UserModel = Depends(require_role(UserRoleEnum.REMOTE_CLINICIAN.value)),
    db: Session = Depends(get_db)
):
    """
    ESCALATE FOR URGENT REVIEW:
    Raises case priority for high-acuity intervention/senior consultation.
    Enforces REMOTE_CLINICIAN role authority.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)
    handle_clinician_escalation(db, case, esc_in, actor_user=current_user)
    return build_case_snapshot(case)

@router.post("/{case_id}/acknowledgement", response_model=EmergencyCaseDetailSchema)
def acknowledge_telemetry_signal(
    case_id: str,
    ack_in: ClinicianAcknowledgeCreate,
    current_user: UserModel = Depends(require_role(UserRoleEnum.REMOTE_CLINICIAN.value)),
    db: Session = Depends(get_db)
):
    """
    ACKNOWLEDGE SIGNAL:
    Records that tele-specialist has reviewed the observable signal without altering the protocol.
    Enforces REMOTE_CLINICIAN role authority.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)
    handle_clinician_acknowledgement(db, case, ack_in, actor_user=current_user)
    return build_case_snapshot(case)

class HospitalEscalationAcknowledgeCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    notes: Optional[str] = None
    timestamp: Optional[str] = None

@router.post("/{case_id}/escalation/acknowledge", response_model=EmergencyCaseDetailSchema)
def acknowledge_clinician_escalation(
    case_id: str,
    ack_in: Optional[HospitalEscalationAcknowledgeCreate] = None,
    current_user: UserModel = Depends(require_role(UserRoleEnum.HOSPITAL_COMMAND.value, UserRoleEnum.PORTAL_ADMIN.value)),
    db: Session = Depends(get_db)
):
    """
    Hospital Command formally acknowledges urgent specialist escalation.
    Propagates back to Clinician Workspace and logs audit event on Care Rail.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)
    notes = ack_in.notes if ack_in else None
    handle_hospital_escalation_acknowledgement(db, case, notes=notes, actor_user=current_user)
    return build_case_snapshot(case)
