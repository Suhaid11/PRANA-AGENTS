from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.domain.models import UserModel
from app.domain.schemas import TimelineEventSchema, EventCreate, UserRoleEnum
from app.services.case_service import get_case_or_404
from app.services.event_service import get_case_events, append_event
from app.realtime.broadcaster import dispatch_event_nowait
from app.api.deps import get_current_user, check_case_access

router = APIRouter(prefix="/cases", tags=["Append-Only Event Store"])

@router.get("/{case_id}/events", response_model=list[TimelineEventSchema])
def list_case_events(
    case_id: str,
    after_version: Optional[int] = Query(default=None, alias="after_version"),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve chronological event log directly from the PRANA Append-Only Event Store.
    Supports ?after_version={version} for client catch-up after reconnect.
    Requires authenticated user assigned to the emergency case.
    """
    check_case_access(case_id, current_user, db)
    get_case_or_404(db, case_id)
    events = get_case_events(db, case_id, after_version=after_version)
    return [
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
        )
        for e in events
    ]

@router.post("/{case_id}/events", response_model=TimelineEventSchema, status_code=status.HTTP_201_CREATED)
def record_case_event(
    case_id: str,
    event_in: EventCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Append an event directly to the Append-Only Event Store.
    Actor is derived authoritatively from the authenticated principal.
    Persists to SQLite first, then broadcasts to subscribed WebSocket clients.
    """
    check_case_access(case_id, current_user, db)
    get_case_or_404(db, case_id)
    actor_name = current_user.display_name
    actor_id = current_user.id
    actor_role = current_user.role

    payload = event_in.payload or {}
    payload["actorUserId"] = actor_id
    payload["actorRole"] = actor_role

    evt = append_event(
        db,
        case_id=case_id,
        title=event_in.title,
        detail=event_in.detail,
        actor=actor_name,
        category=event_in.category,
        status=event_in.status,
        timestamp=event_in.timestamp,
        payload=payload
    )

    dispatch_event_nowait(
        case_id=case_id,
        event_type=evt.category,
        version=evt.version,
        event_id=evt.event_id,
        timestamp=evt.timestamp,
        actor_type=actor_role,
        actor_id=actor_id,
        user_id=actor_id,
        role=actor_role,
        payload=payload
    )

    return TimelineEventSchema(
        id=evt.event_id,
        version=evt.version,
        timestamp=evt.timestamp,
        category=evt.category,
        title=evt.title,
        detail=evt.detail,
        actor=evt.actor,
        status=evt.status,
        payload=evt.payload
    )
