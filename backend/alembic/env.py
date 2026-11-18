"""Ambiente do Alembic.

- Conecta como o DONO do schema (agro_owner) por DATABASE_URL_MIGRATIONS.
  A aplicação usa outro papel (agro_app, só DML); as tabelas criadas aqui
  recebem DML para o agro_app pelo DEFAULT PRIVILEGES da Fase A
  (infra/postgres/init/01-roles.sh). Migração não faz GRANT.
- target_metadata = Base.metadata com todos os modelos importados.
- compare_type=True: "alembic check" acusa diferença de tipo.
"""

from __future__ import annotations

from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

import app.models  # noqa: F401  (registra as tabelas em Base.metadata)
from app.core.config import load_migration_settings
from app.db.base import Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

target_metadata = Base.metadata

COMPARE_OPTS = {"compare_type": True, "compare_server_default": True}


def run_migrations_offline() -> None:
    """Gera SQL sem conectar (alembic upgrade head --sql)."""
    url = load_migration_settings().database_url()
    context.configure(
        url=url.render_as_string(hide_password=True),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        **COMPARE_OPTS,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    url = load_migration_settings().database_url()
    engine = create_engine(
        url,
        poolclass=pool.NullPool,
        connect_args={"options": "-c timezone=UTC", "application_name": "agro-mro-alembic"},
    )
    try:
        with engine.connect() as connection:
            context.configure(connection=connection, target_metadata=target_metadata, **COMPARE_OPTS)
            with context.begin_transaction():
                context.run_migrations()
    finally:
        engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
