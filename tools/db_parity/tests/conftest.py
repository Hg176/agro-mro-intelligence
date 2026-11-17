"""Fixtures dos testes de tools/db_parity.

O fixture ``db`` é parametrizado: cada teste roda em SQLite e em PostgreSQL.

PostgreSQL:
- TEST_POSTGRES_URL        conexão da APLICAÇÃO (agro_app) em agro_mro_test: DML
- TEST_POSTGRES_OWNER_URL  conexão do DONO (agro_owner) em agro_mro_test: create/drop
  O agro_app não tem CREATE no schema; criar as tabelas como agro_owner e usá-las
  como agro_app prova o DEFAULT PRIVILEGES de verdade.
- Sem TEST_POSTGRES_URL: os testes de Postgres são PULADOS (pytest.skip), exceto
  no CI (variável CI definida), onde a ausência é FALHA. O CI ainda confere o
  junit para garantir que nenhum teste de Postgres foi pulado.

Antes de qualquer DDL, ``assert_safe_test_database`` recusa banco que não seja de teste.
"""

from __future__ import annotations

import json
import os
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

from tools.db_parity.safety import assert_safe_test_database
from tools.db_parity.tests.modelo_sintetico import BaseSintetica
from tools.db_parity.tests.numeric_report import OUT_DIR, render_report

DIALECTS = ("sqlite", "postgresql")


@dataclass
class DB:
    name: str
    engine: Engine        # papel da aplicação (SQLite: o mesmo arquivo)
    owner_engine: Engine  # papel dono (DDL)


def _pg_urls() -> tuple[str, str] | None:
    url = os.environ.get("TEST_POSTGRES_URL")
    if not url:
        if os.environ.get("CI"):
            pytest.fail("TEST_POSTGRES_URL ausente no CI: testes de PostgreSQL não podem ser pulados")
        pytest.skip("TEST_POSTGRES_URL não definida: teste de PostgreSQL pulado (só permitido fora do CI)")
    owner = os.environ.get("TEST_POSTGRES_OWNER_URL")
    if not owner:
        pytest.fail("TEST_POSTGRES_URL definida sem TEST_POSTGRES_OWNER_URL (necessária para criar as tabelas)")
    return url, owner


@contextmanager
def open_db(name: str, tmp_path: Path):
    if name == "sqlite":
        tmp_path.mkdir(parents=True, exist_ok=True)
        url = f"sqlite:///{(tmp_path / 'sintetico.db').as_posix()}"
        assert_safe_test_database(url)
        engine = create_engine(url)
        owner = engine
    elif name == "postgresql":
        url, owner_url = _pg_urls()
        assert_safe_test_database(url)
        assert_safe_test_database(owner_url)
        engine = create_engine(url)
        owner = create_engine(owner_url)
    else:  # pragma: no cover
        raise ValueError(name)

    BaseSintetica.metadata.drop_all(owner)
    BaseSintetica.metadata.create_all(owner)
    try:
        yield DB(name, engine, owner)
    finally:
        engine.dispose()
        BaseSintetica.metadata.drop_all(owner)
        owner.dispose()


@pytest.fixture(params=DIALECTS)
def db(request, tmp_path):
    with open_db(request.param, tmp_path) as d:
        yield d


@pytest.fixture
def sqlite_e_postgresql(tmp_path):
    """Os dois bancos ao mesmo tempo (teste de paridade)."""
    with open_db("sqlite", tmp_path / "a") as a, open_db("postgresql", tmp_path / "b") as b:
        yield a, b


# ---------------------------------------------------------------------------
# numeric_report.md: cada execução do teste do Numeric grava
# out/numeric_<banco>.json; no fim da sessão juntamos tudo num Markdown.


def pytest_sessionstart(session):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for p in OUT_DIR.glob("numeric_*.json"):
        p.unlink()


def pytest_sessionfinish(session, exitstatus):
    files = {p.stem.removeprefix("numeric_"): p for p in OUT_DIR.glob("numeric_*.json")}
    if not files:
        return
    data = {k: json.loads(v.read_text(encoding="utf-8")) for k, v in files.items()}
    (OUT_DIR / "numeric_report.md").write_text(render_report(data, DIALECTS), encoding="utf-8", newline="\n")
