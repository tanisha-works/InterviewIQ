"""Persist interview setup choices on sessions.

Revision ID: 0003_session_options
Revises: 0002_auth_and_ownership
Create Date: 2026-11-11
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003_session_options"
down_revision: Union[str, None] = "0002_auth_and_ownership"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "interview_sessions",
        sa.Column("difficulty", sa.String(length=16), nullable=False, server_default="Medium"),
    )
    op.add_column(
        "interview_sessions",
        sa.Column("interview_type", sa.String(length=16), nullable=False, server_default="Mixed"),
    )
    op.add_column(
        "interview_sessions",
        sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default="20"),
    )


def downgrade() -> None:
    raise RuntimeError("Interview setup choices must not be removed by an automatic downgrade.")