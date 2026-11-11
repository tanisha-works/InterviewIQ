from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class SignupIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name must not be blank.")
        return value


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr

    @field_validator("name")
    @classmethod
    def normalize_profile_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name must not be blank.")
        return value


class AuthTokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class QuestionOut(BaseModel):
    id: str
    question: str
    category: str


class ResumeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    filename: str
    skills: list[str]


class SessionCreate(BaseModel):
    role: str = "general"
    num_questions: int = Field(default=5, ge=1, le=10)
    resume_id: Optional[int] = None
    difficulty: Literal["Easy", "Medium", "Hard"] = "Medium"
    interview_type: Literal["Technical", "HR", "Mixed"] = "Mixed"
    duration_minutes: int = Field(default=20, ge=5, le=180)


class SessionOut(BaseModel):
    id: int
    role: str
    difficulty: str
    interview_type: str
    duration_minutes: int
    questions: list[QuestionOut]


class SessionSummary(BaseModel):
    id: int
    role: str
    difficulty: str
    interview_type: str
    duration_minutes: int
    created_at: datetime
    answered: int
    total_questions: int
    average_score: float
    dimension_scores: dict[str, float]


class AnswerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    session_id: int
    question_id: str
    question_text: str
    transcript: str
    metrics: dict[str, Any]
    scores: dict[str, Any]
    overall_score: float
    feedback: list[str]


class SessionReport(BaseModel):
    session_id: int
    role: str
    difficulty: str
    interview_type: str
    duration_minutes: int
    answered: int
    total_questions: int
    average_score: float
    answers: list[AnswerOut]
