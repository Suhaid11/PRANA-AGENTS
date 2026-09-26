import json
import time
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.domain.models import TimelineEventModel, EmergencyCaseModel

def append_event(
    db: Session,
    case_id: str,
    title: str,
    detail: str,
    actor: str = "SYSTEM",
    category: str = "SYSTEM",
    status: str = "INFO",
    timestamp: str | None = None,
    payload: dict | None = None
) -> TimelineEventModel:
    """
    Append an immutable event to the PRANA Append-Only Event Store.
    Assigns monotonically increasing version from the EmergencyCase aggregate.
    Never updates in-place.
    """
    now_ts = timestamp or datetime.now(timezone.utc).strftime("%H:%M:%S")
    event_id = f"evt-{int(time.time() * 1000)}-{case_id}"

    case = db.query(EmergencyCaseModel).filter(EmergencyCaseModel.id == case_id).first()
    new_version = ((case.current_version or 0) + 1) if case else 1
    if case:
        case.current_version = new_version
        db.add(case)

    event = TimelineEventModel(
        id=f"db-{event_id}",
        case_id=case_id,
        event_id=event_id,
        version=new_version,
        timestamp=now_ts,
        category=category,
        title=title,
        detail=detail,
        actor=actor,
        status=status,
        payload_json=json.dumps(payload or {}),
        created_at=datetime.now(timezone.utc)
    )
    db.add(event)
    db.flush()
    return event

def get_case_events(
    db: Session,
    case_id: str,
    after_version: int | None = None
) -> list[TimelineEventModel]:
    query = db.query(TimelineEventModel).filter(TimelineEventModel.case_id == case_id)
    if after_version is not None:
        query = query.filter(TimelineEventModel.version > after_version).order_by(TimelineEventModel.version.asc())
    else:
        query = query.order_by(TimelineEventModel.created_at.desc())
    return query.all()
