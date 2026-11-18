"""Mixins de coluna.

- ``WorkspaceScoped``: toda tabela de dado de cliente. workspace_id NOT NULL,
  FK para workspaces.id com ON DELETE RESTRICT (apagar workspace nunca apaga
  dado em cascata sem decisão explícita) e índice com workspace_id na frente.
  O guarda tests/test_workspace_scope_guard.py exige isso de toda tabela fora
  da allowlist.
- ``Timestamps``: created_at e updated_at timestamptz com default no servidor.
  updated_at é atualizado pelo ORM (onupdate); SQL direto precisa setar.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, declared_attr, mapped_column

from app.db.types import DataHoraUTC


class WorkspaceScoped:
    @declared_attr
    def workspace_id(cls) -> Mapped[int]:  # noqa: N805 (declared_attr recebe a classe)
        return mapped_column(
            ForeignKey("workspaces.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        )


class Timestamps:
    created_at: Mapped[datetime] = mapped_column(
        DataHoraUTC, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DataHoraUTC, server_default=func.now(), onupdate=func.now(), nullable=False
    )
