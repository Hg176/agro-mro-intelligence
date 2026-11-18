"""Modelos do produto. Importar este pacote registra todas as tabelas em Base.metadata
(o Alembic e o guarda de workspace dependem disso)."""

from app.models.workspace import Workspace

__all__ = ["Workspace"]
