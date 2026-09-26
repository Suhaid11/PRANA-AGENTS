from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.domain.models import UserModel
from app.domain.schemas import (
    UserLoginRequest,
    LoginResponseSchema,
    UserPublicSchema
)
from app.core.security import verify_password, create_access_token
from app.api.deps import get_current_user, record_security_event

router = APIRouter(prefix="/auth", tags=["Authentication & Identity"])

@router.post("/login", response_model=LoginResponseSchema)
def login(login_req: UserLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a user by username/email and password.
    Returns a signed JWT access token and user identity profile.
    """
    identifier = login_req.username.strip().lower()
    user = db.query(UserModel).filter(
        (UserModel.username == identifier) | (UserModel.email == identifier)
    ).first()

    if not user or not verify_password(login_req.password, user.password_hash):
        record_security_event(
            db,
            "USER_LOGIN_FAILED",
            user.id if user else None,
            None,
            f"Failed login attempt for identifier: '{identifier}'"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify username/email and password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        record_security_event(
            db,
            "USER_LOGIN_FAILED",
            user.id,
            None,
            f"Login rejected for deactivated user: '{identifier}'"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated. Contact an administrator.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Issue minimal claims JWT
    token = create_access_token(
        subject=user.email,
        role=user.role,
        user_id=user.id,
        display_name=user.display_name
    )

    record_security_event(
        db,
        "USER_LOGIN_SUCCESS",
        user.id,
        None,
        f"User '{user.display_name}' ({user.role}) logged in successfully"
    )

    return LoginResponseSchema(
        access_token=token,
        token_type="bearer",
        user=UserPublicSchema(
            id=user.id,
            username=user.username,
            email=user.email,
            displayName=user.display_name,
            role=user.role,
            isActive=user.is_active
        )
    )


@router.get("/me", response_model=UserPublicSchema)
def get_me(current_user: UserModel = Depends(get_current_user)):
    """
    Retrieve authenticated principal profile.
    """
    return UserPublicSchema(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        displayName=current_user.display_name,
        role=current_user.role,
        isActive=current_user.is_active
    )


@router.post("/logout")
def logout(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log out active user session and record security audit log.
    """
    record_security_event(
        db,
        "USER_LOGOUT",
        current_user.id,
        None,
        f"User '{current_user.display_name}' logged out"
    )
    return {"message": "Logged out successfully", "user_id": current_user.id}


@router.get("/demo-personas", response_model=list[UserPublicSchema])
def list_demo_personas(db: Session = Depends(get_db)):
    """
    List seeded development demo personas for demonstration switching.
    """
    users = db.query(UserModel).filter(UserModel.is_active == True).all()
    return [
        UserPublicSchema(
            id=u.id,
            username=u.username,
            email=u.email,
            displayName=u.display_name,
            role=u.role,
            isActive=u.is_active
        )
        for u in users
    ]
