from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.domain.models import UserModel
from app.domain.schemas import InterventionCreate, EmergencyCaseDetailSchema, UserRoleEnum
from app.services.case_service import get_case_or_404, build_case_snapshot
from app.services.clinical_service import record_intervention
from app.api.deps import get_current_user, require_role, check_case_access

router = APIRouter(prefix="/cases", tags=["Field Interventions & Observations"])

@router.post("/{case_id}/interventions", response_model=EmergencyCaseDetailSchema, status_code=status.HTTP_201_CREATED)
def add_intervention(
    case_id: str,
    interv_in: InterventionCreate,
    current_user: UserModel = Depends(require_role(UserRoleEnum.FIELD_MEDIC.value, UserRoleEnum.PORTAL_ADMIN.value)),
    db: Session = Depends(get_db)
):
    """
    Record a prehospital intervention or clinical observation:
    - Enforces FIELD_MEDIC role requirement.
    - Enforces case authorization check.
    - Persists intervention with authenticated actor attribution.
    - Appends event to event store and broadcasts.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)
    record_intervention(db, case, interv_in, actor_user=current_user)
    return build_case_snapshot(case)

@router.post("/{case_id}/observations", response_model=EmergencyCaseDetailSchema, status_code=status.HTTP_201_CREATED)
def add_observation(
    case_id: str,
    interv_in: InterventionCreate,
    current_user: UserModel = Depends(require_role(UserRoleEnum.FIELD_MEDIC.value, UserRoleEnum.PORTAL_ADMIN.value)),
    db: Session = Depends(get_db)
):
    """
    Record an observation alias.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)
    record_intervention(db, case, interv_in, actor_user=current_user)
    return build_case_snapshot(case)
