from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.auth_dependencies import AuthContext, get_auth_context
from app.database import get_db
from app.schemas import AnswerOut, SessionCreate, SessionOut, SessionSummary
from app.services import interview_service as svc

router = APIRouter(prefix="/interview", tags=["interview"])


def _out(s) -> SessionOut:
    return SessionOut(
        id=s.id,
        role=s.role,
        difficulty=s.difficulty,
        interview_type=s.interview_type,
        duration_minutes=s.duration_minutes,
        questions=s.questions,
    )


@router.get("", response_model=list[SessionSummary])
def list_interviews(
    context: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return svc.list_sessions(db, context.user.id)


@router.post("/start", response_model=SessionOut)
def start_interview(
    payload: SessionCreate,
    context: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return _out(svc.create_session(
        db, payload.role, payload.num_questions, payload.resume_id, context.user.id,
        payload.difficulty, payload.interview_type, payload.duration_minutes,
    ))


@router.get("/{session_id}", response_model=SessionOut)
def get_interview(
    session_id: int,
    context: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    return _out(svc.get_session(db, session_id, context.user.id))


# plain `def` -> FastAPI runs it in a threadpool, so heavy ML doesn't block the event loop
@router.post("/{session_id}/answer", response_model=AnswerOut)
def submit_answer(
    session_id: int,
    question_id: str = Form(...),
    audio: UploadFile = File(...),
    context: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    session = svc.get_session(db, session_id, context.user.id)
    return svc.process_answer(db, session, question_id, audio)
