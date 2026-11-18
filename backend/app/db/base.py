"""Base declarativa, engine e sessão.

- ``Base``: DeclarativeBase com naming_convention fixa, para que índices, UQ, CK,
  FK e PK tenham o mesmo nome no modelo e nas migrações (o autogenerate compara).
- O esquema nasce SÓ por Alembic (backend/alembic). Não existe criação de tabela
  a partir da metadata em lugar nenhum (teste: tests/test_no_create_all.py).
- Engine e sessão são criados por aplicação (no lifespan), a partir de
  ``AppSettings``; nada se conecta ao banco na importação do módulo.
"""

from __future__ import annotations

from collections.abc import Iterator

from fastapi import Request
from sqlalchemy import MetaData
from sqlalchemy.engine import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import AppSettings

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_N_label)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_N_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

CONNECT_TIMEOUT_S = 5


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


def make_engine(settings: AppSettings) -> Engine:
    """Engine da aplicação (papel agro_app).

    ``timezone=UTC`` na conexão: toda sessão grava e lê em UTC mesmo que o
    servidor esteja mal configurado. America/Cuiaba é só apresentação.
    ``connect_timeout``: banco fora do ar responde 503 rápido, sem pendurar a requisição.
    """
    return create_engine(
        settings.database_url(),
        pool_pre_ping=True,
        connect_args={
            "options": "-c timezone=UTC",
            "application_name": "agro-mro-api",
            "connect_timeout": CONNECT_TIMEOUT_S,
        },
    )


def make_sessionmaker(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db(request: Request) -> Iterator[Session]:
    """Dependência FastAPI: uma sessão por requisição. Commit é explícito no serviço."""
    session: Session = request.app.state.sessionmaker()
    try:
        yield session
    finally:
        session.close()
