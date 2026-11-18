"""Tabela workspaces: uma linha por tenant (espaço do cliente).

Só identidade nesta etapa. Plano, sku_limit e estado do workspace (ativo,
somente leitura etc.) entram no passo de limites/cobrança.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Identity, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.types import DataHoraUTC


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[int] = mapped_column(Integer, Identity(), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DataHoraUTC, server_default=func.now(), nullable=False
    )
