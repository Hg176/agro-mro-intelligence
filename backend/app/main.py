"""Aplicação FastAPI do Agro MRO Intelligence.

    uvicorn --factory app.main:create_app      (a partir de backend/)

``create_app()`` valida a configuração ANTES de montar a aplicação: faltou
variável ou URL inválida, ``ConfigError`` e o processo não sobe. O banco só é
tocado no lifespan (engine criado, nunca esquema: o esquema é do Alembic).
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import health
from app.core.config import AppSettings, load_settings
from app.db.base import make_engine, make_sessionmaker
from app.db.migrations import code_head

API_PREFIX = "/api/v1"


def create_app(settings: AppSettings | None = None) -> FastAPI:
    settings = settings or load_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        engine = make_engine(settings)
        app.state.engine = engine
        app.state.sessionmaker = make_sessionmaker(engine)
        app.state.alembic_head = code_head()
        try:
            yield
        finally:
            engine.dispose()

    is_prod = settings.APP_ENV == "prod"
    app = FastAPI(
        title="Agro MRO Intelligence API",
        version="0.1.0",
        lifespan=lifespan,
        # Documentação interativa só fora de produção.
        docs_url=None if is_prod else f"{API_PREFIX}/docs",
        redoc_url=None,
        openapi_url=None if is_prod else f"{API_PREFIX}/openapi.json",
    )
    app.state.settings = settings
    app.include_router(health.router, prefix=API_PREFIX)
    return app
