import logging
import asyncio
from typing import Optional
import jwt
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.domain.models import EmergencyCaseModel, UserModel, CaseParticipantModel
from app.domain.schemas import UserRoleEnum
from app.core.security import decode_access_token
from app.realtime.manager import realtime_manager
from app.api.deps import record_security_event

logger = logging.getLogger("prana.realtime")
router = APIRouter(tags=["Real-Time Synchronization"])

@router.websocket("/ws/cases/{case_id}")
async def case_websocket_endpoint(
    websocket: WebSocket,
    case_id: str,
    token: Optional[str] = Query(default=None)
):
    """
    Authenticated case-scoped WebSocket endpoint for real-time emergency synchronization.
    
    Authentication & Authorization Handshake:
    1. Authenticate via ?token=<jwt> query parameter or initial {"type": "AUTH", "token": "..."} message.
    2. Validates JWT signature, claims, and non-expiration.
    3. Resolves user identity from persistent database.
    4. Authorizes case participant assignment (or PORTAL_ADMIN).
    5. Subscribes client to canonical case event channel.
    6. Rejects unauthorized access with WebSocket codes (4401 Unauthenticated, 4403 Unauthorized).
    """
    already_accepted = False

    # If token was not provided in query param, accept to receive initial auth frame
    if not token:
        await websocket.accept()
        already_accepted = True
        try:
            init_frame = await asyncio.wait_for(websocket.receive_json(), timeout=5.0)
            if isinstance(init_frame, dict) and init_frame.get("type") == "AUTH":
                token = init_frame.get("token")
        except asyncio.TimeoutError:
            await websocket.close(code=4401, reason="Authentication timeout: No auth frame provided")
            return
        except Exception:
            await websocket.close(code=4401, reason="Invalid handshake frame")
            return

    if not token:
        if not already_accepted:
            await websocket.accept()
        await websocket.close(code=4401, reason="Authentication required: Missing JWT token")
        return

    # Validate JWT
    try:
        claims = decode_access_token(token)
        user_id = claims.get("uid")
    except jwt.ExpiredSignatureError:
        if not already_accepted:
            await websocket.accept()
        await websocket.close(code=4401, reason="Token expired: Please re-authenticate")
        return
    except (jwt.PyJWTError, Exception) as exc:
        if not already_accepted:
            await websocket.accept()
        await websocket.close(code=4401, reason=f"Invalid token: {exc}")
        return

    # Database identity and case-level authorization verification
    db: Session = SessionLocal()
    try:
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user or not user.is_active:
            if not already_accepted:
                await websocket.accept()
            await websocket.close(code=4401, reason="User account is inactive or not found")
            return

        case = db.query(EmergencyCaseModel).filter(EmergencyCaseModel.id == case_id).first()
        if not case:
            if not already_accepted:
                await websocket.accept()
            await websocket.close(code=4004, reason=f"Emergency case '{case_id}' not found")
            return

        # Case-Level Authorization
        if user.role != UserRoleEnum.PORTAL_ADMIN.value:
            assignment = db.query(CaseParticipantModel).filter(
                CaseParticipantModel.case_id == case_id,
                CaseParticipantModel.user_id == user.id,
                CaseParticipantModel.active == True
            ).first()

            if not assignment:
                record_security_event(
                    db,
                    "CASE_ACCESS_DENIED_WS",
                    user.id,
                    case_id,
                    f"WebSocket subscription blocked for unassigned user '{user.display_name}' ({user.role})"
                )
                if not already_accepted:
                    await websocket.accept()
                await websocket.close(
                    code=4403,
                    reason=f"Forbidden: User '{user.display_name}' is not authorized for emergency case '{case_id}'"
                )
                return

        current_version = case.current_version or 1
        client_id = user.id
        role = user.role
        display_name = user.display_name
    finally:
        db.close()

    # Client is authenticated and authorized -> Register connection
    await realtime_manager.connect(
        websocket=websocket,
        case_id=case_id,
        client_id=client_id,
        role=role,
        current_version=current_version,
        already_accepted=already_accepted
    )

    try:
        while True:
            data = await websocket.receive_json()
            # Handle heartbeat ping/pong
            if isinstance(data, dict) and data.get("type") == "PING":
                await websocket.send_json({
                    "type": "PONG",
                    "caseId": case_id,
                    "currentVersion": current_version,
                    "userId": client_id,
                    "role": role
                })
    except WebSocketDisconnect:
        realtime_manager.disconnect(websocket)
    except Exception as e:
        logger.debug(f"[Realtime] WebSocket closed for {client_id}: {e}")
        realtime_manager.disconnect(websocket)
