"""Baseline for the existing InterviewIQ SQLite schema.

Revision ID: 0001_legacy_baseline
Revises:
Create Date: 2026-11-10
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = "0001_legacy_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    existing_tables = set(inspect(op.get_bind()).get_table_names())
    if existing_tables.intersection({"answers", "interview_sessions", "resumes"}):
        raise RuntimeError(
            "This database already contains InterviewIQ tables but has no applied baseline. "
            "Back it up, verify it matches this revision, then run "
            "'python -m alembic stamp 0001_legacy_baseline'."
        )

    op.create_table(
        "resumes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=True),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("skills", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_resumes_id", "resumes", ["id"], unique=False)

    op.create_table(
        "interview_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=True),
        sa.Column("resume_id", sa.Integer(), nullable=True),
        sa.Column("questions", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_interview_sessions_id", "interview_sessions", ["id"], unique=False)

    op.create_table(
        "answers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=True),
        sa.Column("question_id", sa.String(length=50), nullable=True),
        sa.Column("question_text", sa.Text(), nullable=True),
        sa.Column("transcript", sa.Text(), nullable=True),
        sa.Column("metrics", sa.JSON(), nullable=True),
        sa.Column("scores", sa.JSON(), nullable=True),
        sa.Column("overall_score", sa.Float(), nullable=True),
        sa.Column("feedback", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["session_id"], ["interview_sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_answers_id", "answers", ["id"], unique=False)
    op.create_index("ix_answers_session_id", "answers", ["session_id"], unique=False)


def downgrade() -> None:
    raise RuntimeError("The adopted legacy baseline cannot be downgraded because it would remove existing application data.")