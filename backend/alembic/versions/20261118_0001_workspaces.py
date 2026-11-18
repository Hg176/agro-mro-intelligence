"""workspaces: uma linha por tenant

Revision ID: 0001
Revises:
Create Date: 2026-11-18

Só identidade (id, name, created_at). Plano, sku_limit e estado do workspace
vêm no passo de limites. Sem GRANT: o DML do agro_app vem do DEFAULT
PRIVILEGES da Fase A (conferido em tests/test_db_roles.py).
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "workspaces",
        sa.Column("id", sa.Integer(), sa.Identity(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_workspaces")),
    )


def downgrade() -> None:
    op.drop_table("workspaces")
