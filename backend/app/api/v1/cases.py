from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, ConfigDict

from app.database import get_db
from app.domain.models import EmergencyCaseModel, CaseParticipantModel, UserModel
from app.domain.schemas import EmergencyCaseDetailSchema, UserRoleEnum
from app.services.case_service import get_case_or_404, build_case_snapshot, reset_case_to_seed
from app.services.facility_service import update_case_traffic_delay
from app.api.deps import get_current_user, require_role, check_case_access

router = APIRouter(prefix="/cases", tags=["Emergency Cases"])

@router.get("", response_model=list[EmergencyCaseDetailSchema])
def list_cases(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List active emergency cases accessible by the authenticated user.
    PORTAL_ADMIN has universal visibility. Other operational roles only see cases
    they have been explicitly assigned to.
    """
    if current_user.role == UserRoleEnum.PORTAL_ADMIN.value:
        cases = db.query(EmergencyCaseModel).all()
    else:
        assigned_case_ids = [
            cp.case_id for cp in db.query(CaseParticipantModel).filter(
                CaseParticipantModel.user_id == current_user.id,
                CaseParticipantModel.active == True
            ).all()
        ]
        cases = db.query(EmergencyCaseModel).filter(EmergencyCaseModel.id.in_(assigned_case_ids)).all()

    return [build_case_snapshot(c) for c in cases]

@router.get("/{case_id}", response_model=EmergencyCaseDetailSchema)
def get_case(
    case_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve canonical snapshot of an emergency case.
    Enforces case-level authorization: users cannot guess IDs of unassigned cases.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)
    return build_case_snapshot(case)

class TrafficDelayUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    traffic_delay_minutes: int = Field(alias="trafficDelayMinutes")

@router.post("/{case_id}/traffic", response_model=EmergencyCaseDetailSchema)
def update_traffic(
    case_id: str,
    traffic_in: TrafficDelayUpdate,
    current_user: UserModel = Depends(require_role(UserRoleEnum.FIELD_MEDIC.value, UserRoleEnum.PORTAL_ADMIN.value)),
    db: Session = Depends(get_db)
):
    """
    Update transit traffic delay for an ambulance and recalculate derived ETA synchronously.
    Requires FIELD_MEDIC role and case assignment.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)
    update_case_traffic_delay(db, case, traffic_in.traffic_delay_minutes, actor_user=current_user)
    return build_case_snapshot(case)

@router.post("/{case_id}/reset", response_model=EmergencyCaseDetailSchema)
def reset_case(
    case_id: str,
    current_user: UserModel = Depends(require_role(UserRoleEnum.PORTAL_ADMIN.value)),
    db: Session = Depends(get_db)
):
    """
    Reset an emergency case back to its initial deterministic seed state.
    Restricted to PORTAL_ADMIN.
    """
    case = reset_case_to_seed(db, case_id)
    return build_case_snapshot(case)
