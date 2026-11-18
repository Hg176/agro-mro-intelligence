"""Guarda: toda tabela fora da allowlist é escopada por workspace."""

from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Index, Integer, MetaData, String, Table
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

import app.models  # noqa: F401  (registra as tabelas)
from app.db.base import Base
from app.db.mixins import Timestamps, WorkspaceScoped
from tests.scope_guard import ALLOWLIST, check_workspace_scope


def test_toda_tabela_do_produto_e_escopada_por_workspace() -> None:
    assert "workspaces" in Base.metadata.tables, "modelos não registrados em Base.metadata"
    assert set(ALLOWLIST) <= set(Base.metadata.tables), "allowlist cita tabela que não existe"
    assert check_workspace_scope(Base.metadata) == []


def _sintetica() -> MetaData:
    md = MetaData()
    Table("workspaces", md, Column("id", Integer, primary_key=True))
    return md


def test_guarda_reprova_tabela_sem_workspace_id() -> None:
    md = _sintetica()
    Table("sint_sem_ws", md, Column("id", Integer, primary_key=True), Column("code", String(40)))
    assert check_workspace_scope(md) == ["sint_sem_ws: sem coluna workspace_id"]


def test_guarda_reprova_workspace_id_anulavel_sem_fk_e_sem_indice() -> None:
    md = _sintetica()
    Table("sint_frouxa", md, Column("id", Integer, primary_key=True), Column("workspace_id", Integer, nullable=True))
    assert check_workspace_scope(md) == [
        "sint_frouxa: workspace_id aceita NULL",
        "sint_frouxa: workspace_id sem FK para workspaces.id",
        "sint_frouxa: nenhum índice começa por workspace_id",
    ]


def test_guarda_reprova_indice_em_que_workspace_id_nao_e_a_primeira_coluna() -> None:
    md = _sintetica()
    t = Table(
        "sint_indice_errado",
        md,
        Column("id", Integer, primary_key=True),
        Column("code", String(40), nullable=False),
        Column("workspace_id", Integer, ForeignKey("workspaces.id"), nullable=False),
    )
    Index("ix_errado", t.c.code, t.c.workspace_id)
    assert check_workspace_scope(md) == ["sint_indice_errado: nenhum índice começa por workspace_id"]


def test_guarda_aprova_indice_composto_que_comeca_por_workspace_id() -> None:
    md = _sintetica()
    t = Table(
        "sint_composta",
        md,
        Column("id", Integer, primary_key=True),
        Column("code", String(40), nullable=False),
        Column("workspace_id", Integer, ForeignKey("workspaces.id"), nullable=False),
    )
    Index("ix_ok", t.c.workspace_id, t.c.code)
    assert check_workspace_scope(md) == []


def test_mixin_workspace_scoped_passa_no_guarda() -> None:
    """Controle positivo: uma tabela feita com o mixin (Base separada) é aprovada."""

    class BaseSintetica(DeclarativeBase):
        metadata = _sintetica()

    class Posicao(WorkspaceScoped, Timestamps, BaseSintetica):
        __tablename__ = "sint_posicao"
        id: Mapped[int] = mapped_column(primary_key=True)
        code: Mapped[str] = mapped_column(String(40))

    table = BaseSintetica.metadata.tables["sint_posicao"]
    assert check_workspace_scope(BaseSintetica.metadata) == []
    fk = next(iter(table.c.workspace_id.foreign_keys))
    assert fk.ondelete == "RESTRICT"
    assert table.c.created_at.type.timezone is True and table.c.updated_at.type.timezone is True
    assert "sint_posicao" not in Base.metadata.tables  # não vazou para o Base do produto
    assert Posicao.__tablename__ == "sint_posicao"


def test_allowlist_explicita_e_minima() -> None:
    assert ALLOWLIST.keys() == {"workspaces"}
