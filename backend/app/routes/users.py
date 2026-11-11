from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth_dependencies import AuthContext, get_auth_context
from app.database import get_db
from app.schemas import ProfileUpdate, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.patch("/me", response_model=UserOut)
def update_current_user(
    payload: ProfileUpdate,
    context: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    context.user.name = payload.name
    context.user.email = str(payload.email).strip().lower()
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")
    db.refresh(context.user)
    return context.user