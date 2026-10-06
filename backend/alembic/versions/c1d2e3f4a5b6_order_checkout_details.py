"""Store checkout contact and address details on orders.

Revision ID: c1d2e3f4a5b6
Revises: b4c9d0e1f2a3
Create Date: 2026-10-06 16:40:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, Sequence[str], None] = "b4c9d0e1f2a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_COLUMNS = (
    ("customer_name", 200),
    ("customer_email", 255),
    ("customer_phone", 30),
    ("ship_line1", 200),
    ("ship_line2", 200),
    ("ship_city", 120),
    ("ship_state", 120),
    ("ship_postal_code", 20),
    ("ship_country", 80),
    ("bill_line1", 200),
    ("bill_line2", 200),
    ("bill_city", 120),
    ("bill_state", 120),
    ("bill_postal_code", 20),
    ("bill_country", 80),
)


def upgrade() -> None:
    for name, length in _COLUMNS:
        op.add_column("orders", sa.Column(name, sa.String(length=length), nullable=True))


def downgrade() -> None:
    for name, _length in reversed(_COLUMNS):
        op.drop_column("orders", name)
