import uuid
from datetime import datetime, timezone
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import decode_access_token
from app.domain.models import UserModel, CaseParticipantModel, SecurityEventModel
from app.domain.schemas import UserRoleEnum

bearer_scheme = HTTPBearer(auto_error=False)

def record_security_event(
    db: Session,
    event_type: str,
    user_id: Optional[str],
    case_id: Optional[str],
    detail: str
):
    """
    Log security-relevant audit events (login success/fail, access denial, unauthorized attempts)
    never storing plaintext passwords or sensitive tokens.
    """
    now = datetime.now(timezone.utc)
    evt = SecurityEventModel(
        id=f"sec-{uuid.uuid4().hex[:12]}",
        event_type=event_type,
        user_id=user_id,
        case_id=case_id,
        detail=detail,
        timestamp=now.isoformat(),
        created_at=now
    )
    db.add(evt)
    try:
        db.commit()
    except Exception:
        db.rollback()


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> UserModel:
    """
    Extracts Bearer JWT from Authorization header, validates signature and expiration,
    and returns the active UserModel principal.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Missing Bearer token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except (jwt.PyJWTError, Exception) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = payload.get("uid")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token claims: missing user identifier.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        record_security_event(db, "INACTIVE_USER_LOGIN_BLOCKED", user.id, None, f"Inactive user {user.username} tried accessing API")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user


def require_role(*allowed_roles: str):
    """
    Role-Based Access Control (RBAC) dependency factory.
    Enforces server-side permission checks.
    """
    def role_checker(
        current_user: UserModel = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> UserModel:
        if current_user.role not in allowed_roles:
            record_security_event(
                db,
                "UNAUTHORIZED_ACTION_BLOCKED",
                current_user.id,
                None,
                f"User '{current_user.display_name}' ({current_user.role}) attempted action requiring {allowed_roles}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action not authorized. Role '{current_user.role}' lacks permission for this endpoint. Required role(s): {', '.join(allowed_roles)}."
            )
        return current_user
    return role_checker


def check_case_access(
    case_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserModel:
    """
    Case-Level Authorization check.
    Verifies that the authenticated user is explicitly assigned to the emergency case.
    PORTAL_ADMIN is permitted cross-case administrative visibility.
    """
    if current_user.role == UserRoleEnum.PORTAL_ADMIN.value:
        return current_user

    assignment = db.query(CaseParticipantModel).filter(
        CaseParticipantModel.case_id == case_id,
        CaseParticipantModel.user_id == current_user.id,
        CaseParticipantModel.active == True
    ).first()

    if not assignment:
        record_security_event(
            db,
            "CASE_ACCESS_DENIED",
            current_user.id,
            case_id,
            f"User '{current_user.display_name}' ({current_user.role}) denied access to unassigned case {case_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: User '{current_user.display_name}' is not assigned to emergency case '{case_id}'."
        )

    return current_user
