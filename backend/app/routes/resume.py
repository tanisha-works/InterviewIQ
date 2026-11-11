from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.auth_dependencies import AuthContext, get_auth_context
from app.database import get_db
from app.models import InterviewSession, Resume
from app.schemas import ResumeOut
from app.services.resume_services import create_resume

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/upload", response_model=ResumeOut)
def upload_resume(
    file: UploadFile = File(...),
    context: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return create_resume(db, file, context.user.id)


@router.get("/{resume_id}", response_model=ResumeOut)
def get_resume(
    resume_id: int,
    context: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter_by(id=resume_id, user_id=context.user.id).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")
    return resume


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: int,
    context: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    resume = db.query(Resume).filter_by(id=resume_id, user_id=context.user.id).first()
    if not resume:
        raise HTTPException(404, "Resume not found.")
    db.query(InterviewSession).filter_by(user_id=context.user.id, resume_id=resume_id).update(
        {"resume_id": None}, synchronize_session=False
    )
    db.delete(resume)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
