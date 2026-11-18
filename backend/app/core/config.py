"""Configuração do backend, só por variáveis de ambiente (pydantic-settings).

Duas classes, uma por processo, para cada um receber só a credencial de que precisa:

- ``AppSettings`` (API): APP_ENV, DATABASE_URL (papel agro_app, só DML) e
  APP_DISPLAY_TIMEZONE.
- ``MigrationSettings`` (Alembic): APP_ENV e DATABASE_URL_MIGRATIONS (papel
  agro_owner, dono do schema). A API não recebe a senha do dono.

Regras:
- As URLs não têm valor padrão. Faltou, ``ConfigError`` com o NOME da variável.
- Só ``postgresql+psycopg://`` é aceito. Não existe modo SQLite.
- Nenhuma mensagem de erro mostra a URL, o usuário ou a senha: as URLs são
  ``SecretStr`` e a mensagem é montada aqui, sem o valor recebido.
- Nenhum arquivo é lido. Local: ``uvicorn --env-file ../.env`` ou
  ``dotenv -f ../.env run -- alembic ...`` (docs/operacao/backend-local.md).
"""

from __future__ import annotations

from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import Field, SecretStr, ValidationError, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL, make_url
from sqlalchemy.exc import ArgumentError

REQUIRED_DRIVER = "postgresql+psycopg"


class ConfigError(RuntimeError):
    """Configuração ausente ou inválida. A mensagem nunca contém segredo."""


def _check_database_url(value: SecretStr) -> SecretStr:
    raw = value.get_secret_value().strip()
    if not raw:
        raise ValueError("vazia")
    try:
        url = make_url(raw)
    except ArgumentError:
        raise ValueError(f"não é uma URL de banco válida (esperado {REQUIRED_DRIVER}://...)") from None
    if url.drivername != REQUIRED_DRIVER:
        raise ValueError(
            f"driver {url.drivername!r} recusado; use {REQUIRED_DRIVER}:// (o backend roda só em PostgreSQL)"
        )
    if not url.username:
        raise ValueError("sem usuário")
    if not url.database:
        raise ValueError("sem nome de banco")
    return SecretStr(raw)


class _Base(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=None,  # nunca lê arquivo: só o ambiente do processo
        extra="ignore",  # o ambiente tem outras variáveis (POSTGRES_PASSWORD etc.)
        case_sensitive=True,
        frozen=True,
    )

    APP_ENV: Literal["dev", "test", "prod"]


class AppSettings(_Base):
    DATABASE_URL: SecretStr
    APP_DISPLAY_TIMEZONE: str = Field(default="America/Cuiaba")

    @field_validator("DATABASE_URL")
    @classmethod
    def valida_url(cls, value: SecretStr) -> SecretStr:
        return _check_database_url(value)

    @field_validator("APP_DISPLAY_TIMEZONE")
    @classmethod
    def valida_fuso(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise ValueError(f"fuso {value!r} desconhecido (exemplo: America/Cuiaba)") from None
        return value

    def database_url(self) -> URL:
        return make_url(self.DATABASE_URL.get_secret_value())


class MigrationSettings(_Base):
    DATABASE_URL_MIGRATIONS: SecretStr

    @field_validator("DATABASE_URL_MIGRATIONS")
    @classmethod
    def valida_url(cls, value: SecretStr) -> SecretStr:
        return _check_database_url(value)

    def database_url(self) -> URL:
        return make_url(self.DATABASE_URL_MIGRATIONS.get_secret_value())


def _format(cls_name: str, exc: ValidationError) -> str:
    missing: list[str] = []
    invalid: list[str] = []
    for err in exc.errors(include_url=False, include_input=False, include_context=False):
        name = ".".join(str(p) for p in err["loc"]) or "?"
        if err["type"] == "missing":
            missing.append(name)
        else:
            msg = str(err["msg"]).removeprefix("Value error, ")
            invalid.append(f"{name}: {msg}")
    parts = []
    if missing:
        parts.append("variável de ambiente ausente: " + ", ".join(missing))
    if invalid:
        parts.append("variável de ambiente inválida: " + "; ".join(invalid))
    return f"configuração do backend ({cls_name}) recusada: " + " | ".join(parts)


def load_settings() -> AppSettings:
    """Lê e valida a configuração da API. Falha com ``ConfigError`` sem segredo."""
    try:
        return AppSettings()  # type: ignore[call-arg]
    except ValidationError as exc:
        raise ConfigError(_format("API", exc)) from None


def load_migration_settings() -> MigrationSettings:
    """Lê e valida a configuração das migrações. Falha com ``ConfigError`` sem segredo."""
    try:
        return MigrationSettings()  # type: ignore[call-arg]
    except ValidationError as exc:
        raise ConfigError(_format("migrações", exc)) from None
