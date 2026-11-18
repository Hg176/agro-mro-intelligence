"""Revisão do Alembic: a do código (head) e a gravada no banco."""

from __future__ import annotations

from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import text
from sqlalchemy.engine import Connection

BACKEND_DIR = Path(__file__).resolve().parents[2]
ALEMBIC_INI = BACKEND_DIR / "alembic.ini"


def alembic_config() -> Config:
    """Config do Alembic do backend (script_location vem do alembic.ini)."""
    return Config(str(ALEMBIC_INI))


def code_head() -> str:
    """Head único das migrações do código. Mais de um head é erro de montagem."""
    heads = ScriptDirectory.from_config(alembic_config()).get_heads()
    if len(heads) != 1:
        raise RuntimeError(f"as migrações têm {len(heads)} heads; esperado 1")
    return heads[0]


def database_revision(conn: Connection) -> str | None:
    """Revisão gravada no banco, ou None se não houver tabela/linha alembic_version."""
    exists = conn.execute(text("SELECT to_regclass('public.alembic_version') IS NOT NULL")).scalar_one()
    if not exists:
        return None
    rows = conn.execute(text("SELECT version_num FROM alembic_version")).scalars().all()
    if len(rows) != 1:
        return None
    return rows[0]
