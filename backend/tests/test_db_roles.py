"""Papéis do banco: a aplicação conecta como agro_app (só DML), em UTC, sem DDL."""

from __future__ import annotations

import pytest
from sqlalchemy import text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import ProgrammingError

INSUFFICIENT_PRIVILEGE = "42501"


def _sqlstate(exc: ProgrammingError) -> str | None:
    return getattr(exc.orig, "sqlstate", None)


def test_aplicacao_conecta_como_agro_app(app_engine: Engine) -> None:
    with app_engine.connect() as conn:
        assert conn.execute(text("SELECT current_user")).scalar_one() == "agro_app"
        assert conn.execute(text("SELECT current_database()")).scalar_one() == "agro_mro_test"
        row = conn.execute(
            text(
                "SELECT rolsuper, rolcreatedb, rolcreaterole, rolbypassrls "
                "FROM pg_roles WHERE rolname = current_user"
            )
        ).one()
        assert tuple(row) == (False, False, False, False)


def test_fuso_da_sessao_e_utc(app_engine: Engine) -> None:
    with app_engine.connect() as conn:
        assert conn.execute(text("SHOW timezone")).scalar_one() == "UTC"


def test_fuso_padrao_do_papel_e_do_banco_e_utc_sem_ajuda_da_conexao(app_engine: Engine) -> None:
    """Sem o "-c timezone=UTC" da aplicação, o servidor (papel/banco/Fase A) já devolve UTC."""
    from sqlalchemy import create_engine

    engine = create_engine(app_engine.url)
    try:
        with engine.connect() as conn:
            assert conn.execute(text("SHOW timezone")).scalar_one() == "UTC"
    finally:
        engine.dispose()


def test_agro_app_faz_dml_em_workspaces(app_engine: Engine) -> None:
    with app_engine.begin() as conn:
        wid = conn.execute(
            text("INSERT INTO workspaces (name) VALUES ('Espaço sintético') RETURNING id")
        ).scalar_one()
        assert conn.execute(text("SELECT name FROM workspaces WHERE id = :i"), {"i": wid}).scalar_one() == (
            "Espaço sintético"
        )
        conn.execute(text("UPDATE workspaces SET name = 'Renomeado' WHERE id = :i"), {"i": wid})
        assert conn.execute(text("SELECT name FROM workspaces WHERE id = :i"), {"i": wid}).scalar_one() == (
            "Renomeado"
        )
        assert conn.execute(text("DELETE FROM workspaces WHERE id = :i"), {"i": wid}).rowcount == 1
        assert conn.execute(text("SELECT count(*) FROM workspaces")).scalar_one() == 0


def test_dml_veio_do_default_privileges(owner_engine: Engine) -> None:
    """workspaces foi criada pelo agro_owner (Alembic) e o agro_app recebeu só DML."""
    with owner_engine.connect() as conn:
        owner = conn.execute(
            text("SELECT tableowner FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workspaces'")
        ).scalar_one()
        assert owner == "agro_owner"
        privs = {
            p: conn.execute(
                text("SELECT has_table_privilege('agro_app', 'public.workspaces', :p)"), {"p": p}
            ).scalar_one()
            for p in ("SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER")
        }
        assert privs == {
            "SELECT": True,
            "INSERT": True,
            "UPDATE": True,
            "DELETE": True,
            "TRUNCATE": False,
            "REFERENCES": False,
            "TRIGGER": False,
        }


@pytest.mark.parametrize(
    "ddl",
    [
        "CREATE TABLE b1_intrusa (id int)",
        "DROP TABLE workspaces",
        "ALTER TABLE workspaces ADD COLUMN intrusa int",
        "ALTER TABLE workspaces DROP COLUMN name",
        "TRUNCATE workspaces",
        "CREATE INDEX ix_intruso ON workspaces (name)",
    ],
)
def test_agro_app_nao_faz_ddl(app_engine: Engine, ddl: str) -> None:
    with app_engine.connect() as conn:
        with pytest.raises(ProgrammingError) as info:
            conn.execute(text(ddl))
        conn.rollback()
    assert _sqlstate(info.value) == INSUFFICIENT_PRIVILEGE, str(info.value.orig)
