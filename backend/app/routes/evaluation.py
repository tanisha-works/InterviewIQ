from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.auth_dependencies import AuthContext, get_auth_context
from app.database import get_db
from app.models import Answer
from app.schemas import AnswerOut, SessionReport
from app.services import interview_service as svc

router = APIRouter(prefix="/evaluation", tags=["evaluation"])


@router.get("/session/{session_id}", response_model=SessionReport)
def session_report(
    session_id: int,
    response: Response,
    context: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    return svc.build_report(db, session_id, context.user.id)


@router.get("/answer/{answer_id}", response_model=AnswerOut)
def answer_detail(
    answer_id: int,
    context: AuthContext = Depends(get_auth_context),
    db: Session = Depends(get_db),
):
    answer = db.query(Answer).join(Answer.session).filter(
        Answer.id == answer_id, Answer.session.has(user_id=context.user.id)
    ).first()
    if not answer:
        raise HTTPException(404, "Answer not found.")
    return answer
