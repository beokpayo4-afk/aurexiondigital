"""Add academy fields for course presentation and private resources.

Revision ID: e1f4a5b6c7d8
Revises: d9e2f3a4b5c6
Create Date: 2026-10-06 10:40:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "e1f4a5b6c7d8"
down_revision: Union[str, Sequence[str], None] = "d9e2f3a4b5c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("courses", sa.Column("thumbnail_url", sa.String(length=500), nullable=True))
    op.add_column(
        "courses",
        sa.Column("learning_outcomes", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
    )
    op.add_column("courses", sa.Column("certificate_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("course_resources", sa.Column("storage_key", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("course_resources", "storage_key")
    op.drop_column("courses", "certificate_enabled")
    op.drop_column("courses", "learning_outcomes")
    op.drop_column("courses", "thumbnail_url")
