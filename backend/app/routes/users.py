from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth_dependencies import AuthContext, get_auth_context
from app.database import get_db
from app.schemas import ProfileUpdate, UserOut

router = APIRouter(prefix="/users", tags=["users"])
MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024


def _image_content_type(data: bytes) -> str | None:
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return "image/webp"
    return None


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


@router.put("/me/photo", status_code=status.HTTP_204_NO_CONTENT)
async def upload_profile_photo(
    photo: UploadFile = File(...),
    context: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    data = await photo.read(MAX_PROFILE_PHOTO_BYTES + 1)
    if len(data) > MAX_PROFILE_PHOTO_BYTES:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "Profile photos must be 2 MB or smaller.")
    content_type = _image_content_type(data)
    if not content_type:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Upload a JPEG, PNG, or WebP image.")

    context.user.profile_photo = data
    context.user.profile_photo_content_type = content_type
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me/photo")
def get_profile_photo(
    context: AuthContext = Depends(get_auth_context),
):
    if not context.user.profile_photo or not context.user.profile_photo_content_type:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return Response(
        content=context.user.profile_photo,
        media_type=context.user.profile_photo_content_type,
        headers={"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"},
    )