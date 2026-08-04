"""Add the gabai authorization role.

Revision ID: a7f4c2d9e861
Revises: 462a2db307be
"""

from alembic import op

revision = "a7f4c2d9e861"
down_revision = "462a2db307be"
branch_labels = None
depends_on = None


def upgrade() -> None:
    if op.get_bind().dialect.name == "postgresql":
        op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'GABAI'")


def downgrade() -> None:
    # PostgreSQL enum values cannot be removed safely without rebuilding the type.
    pass
