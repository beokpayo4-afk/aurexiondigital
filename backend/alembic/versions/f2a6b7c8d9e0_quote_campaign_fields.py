"""Store custom campaign details on quote requests.

Revision ID: f2a6b7c8d9e0
Revises: e1f4a5b6c7d8
Create Date: 2026-10-06 10:45:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "f2a6b7c8d9e0"
down_revision: Union[str, Sequence[str], None] = "e1f4a5b6c7d8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("quote_requests", sa.Column("organization", sa.String(length=200), nullable=True))
    op.add_column("quote_requests", sa.Column("product_service", sa.String(length=200), nullable=True))
    op.add_column("quote_requests", sa.Column("target_location", sa.String(length=200), nullable=True))
    op.add_column("quote_requests", sa.Column("target_audience", sa.Text(), nullable=True))
    op.add_column("quote_requests", sa.Column("estimated_budget", sa.String(length=80), nullable=True))
    op.add_column("quote_requests", sa.Column("channels", postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column("quote_requests", "channels")
    op.drop_column("quote_requests", "estimated_budget")
    op.drop_column("quote_requests", "target_audience")
    op.drop_column("quote_requests", "target_location")
    op.drop_column("quote_requests", "product_service")
    op.drop_column("quote_requests", "organization")
