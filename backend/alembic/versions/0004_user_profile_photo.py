"""Store profile photos on user accounts.

Revision ID: 0004_user_profile_photo
Revises: 0003_session_options
Create Date: 2026-11-17
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004_user_profile_photo"
down_revision: Union[str, None] = "0003_session_options"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("profile_photo", sa.LargeBinary(), nullable=True))
    op.add_column("users", sa.Column("profile_photo_content_type", sa.String(length=16), nullable=True))


def downgrade() -> None:
    raise RuntimeError("Profile photos must not be removed by an automatic downgrade.")
