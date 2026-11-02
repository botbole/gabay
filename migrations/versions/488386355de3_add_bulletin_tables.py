"""add bulletin tables

Revision ID: 488386355de3
Revises: a7f4c2d9e861
Create Date: 2026-11-02 23:46:25.854984

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '488386355de3'
down_revision: Union[str, Sequence[str], None] = 'a7f4c2d9e861'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(name: str) -> bool:
    return name in inspect(op.get_bind()).get_table_names()


def upgrade() -> None:
    """Upgrade schema."""
    # Existing dev databases already have these tables from SQLModel create_all.
    if not _has_table("bulletin_config"):
        op.create_table(
            "bulletin_config",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("rabbi", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column("address", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column("announcements", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column("default_sections", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
    if not _has_table("bulletin_week_overrides"):
        op.create_table(
            "bulletin_week_overrides",
            sa.Column("id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column("week_start", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.Column("sections", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_bulletin_week_overrides_week_start"),
            "bulletin_week_overrides",
            ["week_start"],
            unique=True,
        )


def downgrade() -> None:
    """Downgrade schema."""
    if _has_table("bulletin_week_overrides"):
        op.drop_index(
            op.f("ix_bulletin_week_overrides_week_start"),
            table_name="bulletin_week_overrides",
        )
        op.drop_table("bulletin_week_overrides")
    if _has_table("bulletin_config"):
        op.drop_table("bulletin_config")
