"""add PLN conversion fields to transactions

Revision ID: c3f7d8a1e2b9
Revises: 91d4f2b7a6c1
Create Date: 2026-04-10 16:05:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "c3f7d8a1e2b9"
down_revision = "91d4f2b7a6c1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "transactions",
        sa.Column("amount_pln", sa.Numeric(12, 2), nullable=True, server_default="0"),
    )
    op.add_column(
        "transactions",
        sa.Column("exchange_rate", sa.Numeric(12, 6), nullable=False, server_default="1"),
    )
    op.execute("UPDATE transactions SET amount_pln = amount WHERE amount_pln IS NULL")
    op.alter_column("transactions", "amount_pln", nullable=False, server_default=None)


def downgrade() -> None:
    op.drop_column("transactions", "exchange_rate")
    op.drop_column("transactions", "amount_pln")
