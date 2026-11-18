"""Fixtures do backend. Sempre PostgreSQL (agro_mro_test); não existe modo SQLite.

Variáveis exigidas (sem elas a sessão de teste NÃO roda, em vez de pular):
  TEST_DATABASE_URL             agro_app   em agro_mro_test (a aplicação e os testes)
  TEST_DATABASE_URL_MIGRATIONS  agro_owner em agro_mro_test (Alembic e limpeza)

No início da sessão:
  1. tools.db_parity.safety.assert_safe_test_database nas duas URLs
     (banco termina em _test e host local / serviço "postgres" do CI);
  2. DATABASE_URL / DATABASE_URL_MIGRATIONS do processo passam a ser as de teste;
  3. alembic downgrade base + upgrade head como agro_owner.
Antes de cada teste: TRUNCATE ... RESTART IDENTITY CASCADE em todas as tabelas
do schema public menos alembic_version, como agro_owner (o agro_app não tem TRUNCATE).
Nada de banco por template (o agro_owner não tem CREATEDB) nem criação a partir da metadata.

Teste pulado, xfail ou xpass faz a sessão falhar (pytest_sessionfinish).
"""

from __future__ import annotations

import os
from collections.abc import Iterator

import pytest
from alembic import command
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine, make_url

from app.core.config import load_settings
from app.db.migrations import alembic_config
from app.main import create_app
from tools.db_parity.safety import assert_safe_test_database

REQUIRED = ("TEST_DATABASE_URL", "TEST_DATABASE_URL_MIGRATIONS")


def pytest_configure(config: pytest.Config) -> None:
    missing = [name for name in REQUIRED if not os.environ.get(name)]
    if missing:
        raise pytest.UsageError(
            "variável de ambiente ausente: " + ", ".join(missing)
            + ". Os testes do backend rodam só no PostgreSQL agro_mro_test "
            "(use scripts/test_backend.sh ou veja .env.example)."
        )
    app_url = assert_safe_test_database(os.environ["TEST_DATABASE_URL"])
    owner_url = assert_safe_test_database(os.environ["TEST_DATABASE_URL_MIGRATIONS"])
    if app_url.username == owner_url.username:
        raise pytest.UsageError(
            "TEST_DATABASE_URL e TEST_DATABASE_URL_MIGRATIONS usam o mesmo usuário; "
            "a aplicação conecta como agro_app e as migrações como agro_owner"
        )
    # A aplicação e o Alembic leem estas variáveis: daqui em diante, só o banco de teste.
    os.environ["APP_ENV"] = "test"
    os.environ["DATABASE_URL"] = os.environ["TEST_DATABASE_URL"]
    os.environ["DATABASE_URL_MIGRATIONS"] = os.environ["TEST_DATABASE_URL_MIGRATIONS"]


def pytest_sessionfinish(session: pytest.Session, exitstatus: int) -> None:
    reporter = session.config.pluginmanager.get_plugin("terminalreporter")
    if reporter is None:
        return
    bad = sum(len(reporter.stats.get(k, [])) for k in ("skipped", "xfailed", "xpassed"))
    if bad:
        reporter.write_line(
            f"FALHA: {bad} teste(s) pulado(s)/xfail/xpass. No backend, teste pulado é falha.",
            red=True,
        )
        session.exitstatus = pytest.ExitCode.TESTS_FAILED


# --- banco ------------------------------------------------------------------------


def _engine(url: str, name: str) -> Engine:
    return create_engine(
        make_url(url),
        connect_args={"options": "-c timezone=UTC", "application_name": name},
    )


@pytest.fixture(scope="session")
def owner_engine() -> Iterator[Engine]:
    engine = _engine(os.environ["TEST_DATABASE_URL_MIGRATIONS"], "agro-mro-tests-owner")
    yield engine
    engine.dispose()


@pytest.fixture(scope="session")
def app_engine() -> Iterator[Engine]:
    """Conexão da APLICAÇÃO (agro_app), montada pelas mesmas settings da API."""
    from app.db.base import make_engine

    engine = make_engine(load_settings())
    yield engine
    engine.dispose()


def alembic_upgrade(revision: str = "head") -> None:
    command.upgrade(alembic_config(), revision)


def alembic_downgrade(revision: str) -> None:
    command.downgrade(alembic_config(), revision)


@pytest.fixture(scope="session", autouse=True)
def migrated_schema() -> None:
    """Esquema do zero, só por Alembic, como agro_owner."""
    alembic_downgrade("base")
    alembic_upgrade("head")


def _truncate_all(owner_engine: Engine) -> None:
    with owner_engine.begin() as conn:
        tables = conn.execute(
            text(
                "SELECT quote_ident(tablename) FROM pg_tables "
                "WHERE schemaname = 'public' AND tablename <> 'alembic_version' ORDER BY tablename"
            )
        ).scalars().all()
        if tables:
            conn.execute(text(f"TRUNCATE {', '.join(tables)} RESTART IDENTITY CASCADE"))


@pytest.fixture(autouse=True)
def clean_data(migrated_schema: None, owner_engine: Engine) -> None:
    _truncate_all(owner_engine)


# --- aplicação --------------------------------------------------------------------


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(create_app()) as c:
        yield c
