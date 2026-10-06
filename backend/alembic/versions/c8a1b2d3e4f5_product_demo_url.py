"""Add a demo URL to products.

Revision ID: c8a1b2d3e4f5
Revises: b7c1a2d4e5f6
Create Date: 2026-10-05 17:45:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c8a1b2d3e4f5"
down_revision: Union[str, Sequence[str], None] = "b7c1a2d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("products", sa.Column("demo_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "demo_url")
