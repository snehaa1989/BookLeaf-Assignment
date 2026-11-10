from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

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