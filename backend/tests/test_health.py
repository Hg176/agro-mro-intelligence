"""/api/v1/health e /api/v1/health/db."""

from __future__ import annotations

import os
import time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.engine import Engine, make_url

from app.core.config import load_settings
from app.db.base import CONNECT_TIMEOUT_S
from app.db.migrations import code_head
from app.main import create_app
from tests.conftest import alembic_downgrade, alembic_upgrade


def _sem_segredo(body: str) -> None:
    for var in ("TEST_DATABASE_URL", "TEST_DATABASE_URL_MIGRATIONS"):
        url = make_url(os.environ[var])
        assert url.password and url.password not in body
        assert url.username and url.username not in body
    assert "Traceback" not in body and "postgresql" not in body


def test_health_200_sem_banco(client: TestClient) -> None:
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_health_db_200_com_a_revisao_head(client: TestClient) -> None:
    r = client.get("/api/v1/health/db")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "schema": code_head()}
    _sem_segredo(r.text)


def test_health_db_503_depois_de_downgrade(client: TestClient, owner_engine: Engine) -> None:
    try:
        alembic_downgrade("-1")
        r = client.get("/api/v1/health/db")
        assert r.status_code == 503
        assert r.json() == {"status": "schema_out_of_date"}
        _sem_segredo(r.text)

        # Sem a tabela alembic_version (banco nunca migrado): mesma resposta.
        with owner_engine.begin() as conn:
            conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
        r = client.get("/api/v1/health/db")
        assert r.status_code == 503
        assert r.json() == {"status": "schema_out_of_date"}
    finally:
        alembic_upgrade("head")
    r = client.get("/api/v1/health/db")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "schema": code_head()}


def test_health_db_503_quando_a_revisao_do_banco_e_desconhecida(
    client: TestClient, owner_engine: Engine
) -> None:
    try:
        with owner_engine.begin() as conn:
            conn.execute(text("UPDATE alembic_version SET version_num = 'revisao_do_futuro'"))
        r = client.get("/api/v1/health/db")
        assert r.status_code == 503
        assert r.json() == {"status": "schema_out_of_date"}
    finally:
        with owner_engine.begin() as conn:
            conn.execute(text("UPDATE alembic_version SET version_num = :h"), {"h": code_head()})


def test_health_db_503_sem_vazar_dados_quando_o_banco_nao_responde(monkeypatch: pytest.MonkeyPatch) -> None:
    """Porta fechada: 503 database_unavailable, sem URL, usuário, senha ou traceback."""
    real = make_url(os.environ["TEST_DATABASE_URL"])
    monkeypatch.setenv(
        "DATABASE_URL", real.set(host="127.0.0.1", port=1).render_as_string(hide_password=False)
    )
    with TestClient(create_app(load_settings()), raise_server_exceptions=False) as c:
        inicio = time.monotonic()
        r = c.get("/api/v1/health/db")
        decorrido = time.monotonic() - inicio
    # connect_timeout do engine (5 s): a requisição não fica pendurada.
    assert decorrido < 3 * CONNECT_TIMEOUT_S
    assert r.status_code == 503
    assert r.json() == {"status": "database_unavailable"}
    _sem_segredo(r.text)
