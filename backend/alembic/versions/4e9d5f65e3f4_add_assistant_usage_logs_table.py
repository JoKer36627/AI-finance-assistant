"""add assistant_usage_logs table

Revision ID: 4e9d5f65e3f4
Revises: e25c29691f7a
Create Date: 2025-10-08 20:51:12.812798

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4e9d5f65e3f4'
down_revision: Union[str, Sequence[str], None] = 'e25c29691f7a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "assistant_usage_logs",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("model", sa.String, nullable=False),
        sa.Column("prompt_tokens", sa.Integer, nullable=False),
        sa.Column("completion_tokens", sa.Integer, nullable=False),
        sa.Column("total_tokens", sa.Integer, nullable=False),
        sa.Column("duration", sa.Float, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now())
    )

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("assistant_usage_logs")
