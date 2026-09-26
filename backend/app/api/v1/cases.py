from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, ConfigDict

from app.database import get_db
from app.domain.models import EmergencyCaseModel, CaseParticipantModel, UserModel
from app.domain.schemas import EmergencyCaseDetailSchema, UserRoleEnum
from app.services.case_service import get_case_or_404, build_case_snapshot, reset_case_to_seed
from app.services.facility_service import update_case_traffic_delay
from app.services.event_service import append_event
from app.realtime.broadcaster import dispatch_event_nowait
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

class PatientArrivalCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    facility: Optional[str] = None
    notes: Optional[str] = None
    timestamp: Optional[str] = None

@router.post("/{case_id}/arrival", response_model=EmergencyCaseDetailSchema)
def mark_patient_arrived(
    case_id: str,
    arrival_in: Optional[PatientArrivalCreate] = None,
    current_user: UserModel = Depends(require_role(UserRoleEnum.FIELD_MEDIC.value, UserRoleEnum.PORTAL_ADMIN.value, UserRoleEnum.HOSPITAL_COMMAND.value)),
    db: Session = Depends(get_db)
):
    """
    Explicit patient arrival event at receiving facility.
    Does not rely on ETA countdown reaching zero.
    Updates case status to ARRIVED, advances conduit step to 6, appends audit event,
    and broadcasts PATIENT_ARRIVED event over WebSocket.
    """
    check_case_access(case_id, current_user, db)
    case = get_case_or_404(db, case_id)

    now_ts = (arrival_in.timestamp if arrival_in and arrival_in.timestamp else None) or datetime.now(timezone.utc).strftime("%H:%M:%S")
    facility_name = (arrival_in.facility if arrival_in and arrival_in.facility else None) or (case.ambulance.assigned_hospital if case.ambulance else "Receiving Emergency Facility")

    case.status = "ARRIVED"
    case.conduit_step = max(case.conduit_step, 6)
    if case.ambulance:
        case.ambulance.current_speed_kmh = 0
        case.ambulance.base_eta_minutes = 0
        case.ambulance.traffic_delay_minutes = 0

    evt = append_event(
        db,
        case_id=case.id,
        title="Ambulance Arrived at Receiving Facility",
        detail=f"Transport unit arrived at {facility_name}. Patient staged for immediate transfer of care.",
        actor=current_user.display_name,
        category="CLINICAL",
        status="SUCCESS",
        timestamp=now_ts,
        payload={"facility": facility_name, "arrivedAt": now_ts, "status": "ARRIVED", "conduitStep": 6}
    )

    db.commit()

    dispatch_event_nowait(
        case_id=case.id,
        event_type="PATIENT_ARRIVED",
        version=evt.version,
        event_id=evt.event_id,
        timestamp=evt.timestamp,
        actor_type="FIELD_MEDIC",
        actor_id=current_user.id,
        user_id=current_user.id,
        role=current_user.role,
        payload={
            "facility": facility_name,
            "arrivedAt": now_ts,
            "status": "ARRIVED",
            "conduitStep": 6
        }
    )

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
