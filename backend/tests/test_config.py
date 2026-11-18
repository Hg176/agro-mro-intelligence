"""Configuração: sem URL o app não sobe; só postgresql+psycopg; nenhum segredo na mensagem."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import pytest

from app.core.config import ConfigError, load_migration_settings, load_settings
from app.main import create_app

BACKEND_DIR = Path(__file__).resolve().parents[1]
senha_falsa = "s3nha-sintetica-NAO-pode-vazar"
URL_OK = f"postgresql+psycopg://agro_app:{senha_falsa}@127.0.0.1:55432/agro_mro_test"


@pytest.fixture
def env(monkeypatch: pytest.MonkeyPatch) -> pytest.MonkeyPatch:
    for name in ("DATABASE_URL", "DATABASE_URL_MIGRATIONS", "APP_DISPLAY_TIMEZONE"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("APP_ENV", "test")
    return monkeypatch


def test_sem_database_url_o_app_nao_sobe(env: pytest.MonkeyPatch) -> None:
    with pytest.raises(ConfigError) as info:
        create_app()
    msg = str(info.value)
    assert "DATABASE_URL" in msg
    assert "ausente" in msg


def test_sem_database_url_o_processo_termina_com_erro_e_sem_segredo() -> None:
    """O processo de verdade (o que o uvicorn --factory chama) não sobe sem DATABASE_URL."""
    clean = {k: v for k, v in os.environ.items() if k not in {"DATABASE_URL", "DATABASE_URL_MIGRATIONS"}}
    clean["APP_ENV"] = "dev"
    clean["DATABASE_URL_MIGRATIONS"] = f"postgresql+psycopg://agro_owner:{senha_falsa}@127.0.0.1:55432/agro_mro_test"
    proc = subprocess.run(
        [sys.executable, "-c", "from app.main import create_app; create_app()"],
        cwd=BACKEND_DIR,
        env=clean,
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert proc.returncode != 0
    assert "ConfigError" in proc.stderr
    assert "DATABASE_URL" in proc.stderr
    assert senha_falsa not in proc.stderr + proc.stdout


def test_sem_url_de_migracao_o_alembic_nao_roda(env: pytest.MonkeyPatch) -> None:
    with pytest.raises(ConfigError) as info:
        load_migration_settings()
    assert "DATABASE_URL_MIGRATIONS" in str(info.value)


def test_sem_app_env_recusa(env: pytest.MonkeyPatch) -> None:
    env.delenv("APP_ENV")
    env.setenv("DATABASE_URL", URL_OK)
    with pytest.raises(ConfigError, match="APP_ENV"):
        load_settings()


@pytest.mark.parametrize(
    "url",
    [
        "sqlite:///./agro_mro.db",
        "sqlite://",
        f"postgresql://agro_app:{senha_falsa}@127.0.0.1:55432/agro_mro",
        f"postgresql+psycopg2://agro_app:{senha_falsa}@127.0.0.1:55432/agro_mro",
        f"mysql+pymysql://agro_app:{senha_falsa}@127.0.0.1/agro_mro",
        "isto nao e uma url " + senha_falsa,
        "",
    ],
)
def test_url_que_nao_e_postgresql_psycopg_e_recusada_sem_mostrar_senha(
    env: pytest.MonkeyPatch, url: str
) -> None:
    env.setenv("DATABASE_URL", url)
    with pytest.raises(ConfigError) as info:
        create_app()
    msg = str(info.value)
    assert "DATABASE_URL" in msg
    assert senha_falsa not in msg
    assert "agro_app" not in msg  # nem o usuário
    assert "127.0.0.1" not in msg  # nem o host
    # a ValidationError original (que carrega o valor recebido) não vai junto
    assert info.value.__cause__ is None and info.value.__suppress_context__


def test_url_sem_usuario_ou_sem_banco_e_recusada(env: pytest.MonkeyPatch) -> None:
    for url in (
        "postgresql+psycopg://127.0.0.1:55432/agro_mro",
        "postgresql+psycopg://agro_app@127.0.0.1:55432",
    ):
        env.setenv("DATABASE_URL", url)
        with pytest.raises(ConfigError):
            load_settings()


def test_url_valida_fica_escondida_no_repr(env: pytest.MonkeyPatch) -> None:
    env.setenv("DATABASE_URL", URL_OK)
    settings = load_settings()
    assert senha_falsa not in repr(settings) and senha_falsa not in str(settings)
    assert settings.database_url().drivername == "postgresql+psycopg"
    assert settings.APP_DISPLAY_TIMEZONE == "America/Cuiaba"


def test_fuso_de_apresentacao_invalido_e_recusado(env: pytest.MonkeyPatch) -> None:
    env.setenv("DATABASE_URL", URL_OK)
    env.setenv("APP_DISPLAY_TIMEZONE", "America/Nao_Existe")
    with pytest.raises(ConfigError, match="APP_DISPLAY_TIMEZONE"):
        load_settings()


def test_app_env_fora_do_dominio_e_recusado(env: pytest.MonkeyPatch) -> None:
    env.setenv("DATABASE_URL", URL_OK)
    env.setenv("APP_ENV", "producao")
    with pytest.raises(ConfigError, match="APP_ENV"):
        load_settings()


def test_america_cuiaba_disponivel_via_tzdata() -> None:
    """D08: o fuso de apresentação precisa existir em imagem slim (pacote tzdata)."""
    from datetime import datetime
    from zoneinfo import ZoneInfo

    offset = datetime(2026, 11, 18, 12, tzinfo=ZoneInfo("America/Cuiaba")).utcoffset()
    assert offset is not None and offset.total_seconds() == -4 * 3600
