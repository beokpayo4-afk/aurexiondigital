"""Add a private download key to products.

Revision ID: d9e2f3a4b5c6
Revises: c8a1b2d3e4f5
Create Date: 2026-10-06 10:30:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d9e2f3a4b5c6"
down_revision: Union[str, Sequence[str], None] = "c8a1b2d3e4f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("products", sa.Column("download_storage_key", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "download_storage_key")
