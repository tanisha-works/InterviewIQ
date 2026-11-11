from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    filename = Column(String(255))
    text = Column(Text)
    skills = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    role = Column(String(50), default="general")
    difficulty = Column(String(16), nullable=False, default="Medium")
    interview_type = Column(String(16), nullable=False, default="Mixed")
    duration_minutes = Column(Integer, nullable=False, default=20)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    questions = Column(JSON, default=list)  # full question dicts for this session
    created_at = Column(DateTime(timezone=True), default=utcnow)
    answers = relationship("Answer", back_populates="session", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), index=True)
    question_id = Column(String(50))
    question_text = Column(Text)
    transcript = Column(Text)
    metrics = Column(JSON, default=dict)
    scores = Column(JSON, default=dict)
    overall_score = Column(Float, default=0.0)
    feedback = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    session = relationship("InterviewSession", back_populates="answers")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(320), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    auth_sessions = relationship("AuthSession", back_populates="user", cascade="all, delete-orphan")


class AuthSession(Base):
    __tablename__ = "auth_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    refresh_token_hash = Column(String(64), nullable=False, unique=True, index=True)
    csrf_token_hash = Column(String(64), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    user = relationship("User", back_populates="auth_sessions")
    refresh_tokens = relationship("AuthRefreshToken", back_populates="session", cascade="all, delete-orphan")


class AuthRefreshToken(Base):
    __tablename__ = "auth_refresh_tokens"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("auth_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), nullable=False, unique=True, index=True)
    csrf_token_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    consumed_at = Column(DateTime(timezone=True), nullable=True)
    session = relationship("AuthSession", back_populates="refresh_tokens")
