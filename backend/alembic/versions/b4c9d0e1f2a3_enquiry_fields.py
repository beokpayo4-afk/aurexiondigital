"""Add contact details, enquiry assignment, and lead statuses.

Revision ID: b4c9d0e1f2a3
Revises: a3b8c9d0e1f2
Create Date: 2026-10-06 11:10:00
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b4c9d0e1f2a3"
down_revision: Union[str, Sequence[str], None] = "a3b8c9d0e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'contacted'")
    op.execute("ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'proposal_sent'")
    op.execute("ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'converted'")
    op.add_column("contact_submissions", sa.Column("company_name", sa.String(length=200), nullable=True))
    op.add_column("contact_submissions", sa.Column("promote", sa.Text(), nullable=True))
    op.add_column("contact_submissions", sa.Column("interest", sa.String(length=40), nullable=True))
    op.add_column("contact_submissions", sa.Column("channel", sa.String(length=20), nullable=True))
    op.add_column("contact_submissions", sa.Column("budget", sa.String(length=80), nullable=True))
    op.add_column("contact_submissions", sa.Column("target_location", sa.String(length=200), nullable=True))
    op.add_column("service_enquiries", sa.Column("company_name", sa.String(length=200), nullable=True))
    op.add_column("service_enquiries", sa.Column("notes", sa.Text(), nullable=True))
    op.add_column("service_enquiries", sa.Column("assigned_to_user_id", sa.Uuid(), nullable=True))
    op.create_index("ix_service_enquiries_assigned_to_user_id", "service_enquiries", ["assigned_to_user_id"])
    op.create_foreign_key(
        "fk_service_enquiries_assigned_to_user_id_users",
        "service_enquiries",
        "users",
        ["assigned_to_user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_service_enquiries_assigned_to_user_id_users", "service_enquiries", type_="foreignkey")
    op.drop_index("ix_service_enquiries_assigned_to_user_id", table_name="service_enquiries")
    op.drop_column("service_enquiries", "assigned_to_user_id")
    op.drop_column("service_enquiries", "notes")
    op.drop_column("service_enquiries", "company_name")
    op.drop_column("contact_submissions", "target_location")
    op.drop_column("contact_submissions", "budget")
    op.drop_column("contact_submissions", "channel")
    op.drop_column("contact_submissions", "interest")
    op.drop_column("contact_submissions", "promote")
    op.drop_column("contact_submissions", "company_name")
