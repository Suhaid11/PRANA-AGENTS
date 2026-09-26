import asyncio
import logging
from typing import Optional
from app.realtime.manager import realtime_manager

logger = logging.getLogger("prana.realtime")

async def broadcast_domain_event(
    case_id: str,
    event_type: str,
    version: int,
    event_id: str,
    timestamp: str,
    actor_type: str,
    actor_id: Optional[str] = None,
    user_id: Optional[str] = None,
    role: Optional[str] = None,
    payload: Optional[dict] = None
):
    """
    Broadcasts a standardized domain event envelope to all WebSocket subscribers
    of the specified case_id.
    """
    envelope = {
        "eventId": event_id,
        "caseId": case_id,
        "eventType": event_type,
        "version": version,
        "timestamp": timestamp,
        "actor": {
            "type": actor_type,
            "id": actor_id or actor_type,
            "userId": user_id or actor_id or actor_type,
            "role": role or actor_type
        },
        "payload": payload or {}
    }
    await realtime_manager.broadcast_to_case(case_id, envelope)
    logger.info(f"[Realtime] Broadcast '{event_type}' (v{version}) to case '{case_id}' by {role or actor_type}:{user_id or actor_id}")

def dispatch_event_nowait(
    case_id: str,
    event_type: str,
    version: int,
    event_id: str,
    timestamp: str,
    actor_type: str,
    actor_id: Optional[str] = None,
    user_id: Optional[str] = None,
    role: Optional[str] = None,
    payload: Optional[dict] = None
):
    """
    Safe fire-and-forget dispatcher from synchronous service functions.
    Ensures that persistence has succeeded before scheduling the broadcast.
    Works whether invoked from main asyncio event loop or background threadpool.
    """
    coro = broadcast_domain_event(
        case_id=case_id,
        event_type=event_type,
        version=version,
        event_id=event_id,
        timestamp=timestamp,
        actor_type=actor_type,
        actor_id=actor_id,
        user_id=user_id,
        role=role,
        payload=payload
    )

    # 1. If currently inside the event loop thread
    try:
        current_loop = asyncio.get_running_loop()
        current_loop.create_task(coro)
        return
    except RuntimeError:
        pass

    # 2. If called from worker thread (FastAPI threadpool), dispatch thread-safely
    if realtime_manager.loop and realtime_manager.loop.is_running():
        asyncio.run_coroutine_threadsafe(coro, realtime_manager.loop)
    else:
        # Fallback: run directly if no server loop (e.g. sync test runner)
        try:
            asyncio.run(coro)
        except Exception as e:
            logger.debug(f"[Realtime Dispatch Fallback]: {e}")
