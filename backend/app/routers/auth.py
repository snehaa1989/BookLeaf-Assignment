from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import os
import secrets
from fastapi import Header
from app.database import get_db
from app.models import Author
from app.schemas import TokenResponse, UserResponse
from app.security import (
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(Author).filter(
        Author.email == form_data.username
    ).first()

    if not user or not verify_password(
        form_data.password, user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    token = create_access_token(
        subject=user.id,
        role=user.role
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role
    }


@router.get("/me", response_model=UserResponse)
def get_me(user: Author = Depends(get_current_user)):
    return user


@router.get("/diagnose-admin-password")
def diagnose_admin_password(
    diagnostic_key: str = Header(
        ..., alias="X-Diagnostic-Key"
    ),
    db: Session = Depends(get_db)
):
    expected_key = os.getenv("AUTH_DIAGNOSTIC_KEY")

    if not expected_key or not secrets.compare_digest(
        diagnostic_key, expected_key
    ):
        raise HTTPException(
            status_code=403,
            detail="Invalid diagnostic authorization"
        )

    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        raise HTTPException(
            status_code=503,
            detail="Admin environment configuration is incomplete"
        )

    user = db.query(Author).filter(
        Author.email == admin_email.strip()
    ).first()

    is_admin = bool(user and user.role == "admin")

    password_matches = bool(
        is_admin and verify_password(
            admin_password, user.password_hash
        )
    )

    return {
        "account_found": user is not None,
        "is_admin": is_admin,
        "configured_password_matches": password_matches
    }
