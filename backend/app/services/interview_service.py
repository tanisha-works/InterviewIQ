from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session, selectinload

from app.ml.audio_features import compute_audio_features
from app.ml.nlp_evaluator import evaluate_text
from app.ml.scoring import compute_scores
from app.ml.speech_to_text import transcribe
from app.models import Answer, InterviewSession, Resume
from app.schemas import AnswerOut, SessionReport, SessionSummary
from app.services.question_generator import build_question_set
from app.utils.audio_validator import validate_audio_file, validate_audio_filename
from app.utils.file_handler import delete_file, save_upload


def create_session(
    db: Session,
    role: str,
    num_questions: int,
    resume_id: int | None,
    user_id: int,
    difficulty: str = "Medium",
    interview_type: str = "Mixed",
    duration_minutes: int = 20,
) -> InterviewSession:
    skills = None
    if resume_id:
        resume = db.query(Resume).filter_by(id=resume_id, user_id=user_id).first()
        if not resume:
            raise HTTPException(404, "Resume not found.")
        skills = resume.skills or None
    questions = build_question_set(
        role, max(1, min(num_questions, 10)), skills, interview_type, difficulty
    )
    session = InterviewSession(
        user_id=user_id,
        role=role,
        difficulty=difficulty,
        interview_type=interview_type,
        duration_minutes=duration_minutes,
        resume_id=resume_id,
        questions=questions,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_session(db: Session, session_id: int, user_id: int) -> InterviewSession:
    session = db.query(InterviewSession).filter_by(id=session_id, user_id=user_id).first()
    if not session:
        raise HTTPException(404, "Session not found.")
    return session


def list_sessions(db: Session, user_id: int) -> list[SessionSummary]:
    sessions = (
        db.query(InterviewSession)
        .options(selectinload(InterviewSession.answers))
        .filter_by(user_id=user_id)
        .order_by(InterviewSession.created_at.desc(), InterviewSession.id.desc())
        .all()
    )
    summaries = []
    for session in sessions:
        answers = session.answers
        dimension_values: dict[str, list[float]] = {}
        for answer in answers:
            for name, value in (answer.scores or {}).items():
                dimension_values.setdefault(name, []).append(float(value))
        dimension_scores = {
            name: round(sum(values) / len(values), 1)
            for name, values in dimension_values.items()
        }
        summaries.append(SessionSummary(
            id=session.id,
            role=session.role,
            difficulty=session.difficulty,
            interview_type=session.interview_type,
            duration_minutes=session.duration_minutes,
            created_at=session.created_at,
            answered=len(answers),
            total_questions=len(session.questions or []),
            average_score=round(sum(answer.overall_score for answer in answers) / len(answers), 1) if answers else 0.0,
            dimension_scores=dimension_scores,
        ))
    return summaries


def process_answer(db: Session, session: InterviewSession, question_id: str, upload: UploadFile) -> Answer:
    validate_audio_filename(upload.filename)
    question = next((q for q in session.questions if q["id"] == question_id), None)
    if not question:
        raise HTTPException(404, "Question not part of this session.")

    path = save_upload(upload)
    try:
        validate_audio_file(path)
        stt = transcribe(path)
    finally:
        delete_file(path)  # don't keep recordings (privacy)

    if not stt["text"]:
        raise HTTPException(422, "No speech detected. Please try again.")

    audio = compute_audio_features(stt["words"], stt["duration"])
    nlp = evaluate_text(stt["text"], question)
    result = compute_scores(question, audio, nlp)

    db.query(Answer).filter_by(session_id=session.id, question_id=question_id).delete()  # allow re-answer
    answer = Answer(
        session_id=session.id, question_id=question_id, question_text=question["question"],
        transcript=stt["text"],
        metrics={"audio": audio, "fillers": nlp["fillers"], "concepts": nlp["concepts"], "star": nlp["star"],
                 "relevance_similarity": nlp["relevance_similarity"], "language": stt["language"]},
        scores=result["scores"], overall_score=result["overall"], feedback=result["feedback"],
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)
    return answer


def build_report(db: Session, session_id: int, user_id: int) -> SessionReport:
    s = get_session(db, session_id, user_id)
    answers = s.answers
    avg = round(sum(a.overall_score for a in answers) / len(answers), 1) if answers else 0.0
    return SessionReport(
        session_id=s.id, role=s.role, difficulty=s.difficulty, interview_type=s.interview_type,
        duration_minutes=s.duration_minutes, answered=len(answers), total_questions=len(s.questions),
        average_score=avg, answers=[AnswerOut.model_validate(a) for a in answers],
    )
