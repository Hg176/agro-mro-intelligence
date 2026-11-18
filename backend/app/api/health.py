"""Saúde da API.

GET /api/v1/health     200 {"status":"ok"}; não toca no banco.
GET /api/v1/health/db  SELECT 1 como agro_app e compara a revisão do Alembic
                       gravada no banco com o head do código.
                       igual                          -> 200 {"status":"ok","schema":"<rev>"}
                       diferente / sem alembic_version -> 503 {"status":"schema_out_of_date"}
                       banco inacessível               -> 503 {"status":"database_unavailable"}

Nenhuma resposta traz URL, usuário, senha ou traceback. O log registra só o
tipo da exceção (a mensagem do driver pode conter host e usuário).
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.db.migrations import database_revision

log = logging.getLogger("agro_mro.health")

router = APIRouter(prefix="/health", tags=["saúde"])


@router.get("")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/db")
def health_db(request: Request) -> JSONResponse:
    head: str = request.app.state.alembic_head
    try:
        with request.app.state.engine.connect() as conn:
            conn.execute(text("SELECT 1")).scalar_one()
            current = database_revision(conn)
    except SQLAlchemyError as exc:
        log.warning("health/db: banco inacessível (%s)", type(exc).__name__)
        return JSONResponse(status_code=503, content={"status": "database_unavailable"})

    if current != head:
        log.warning("health/db: esquema desatualizado (banco=%s, código=%s)", current, head)
        return JSONResponse(status_code=503, content={"status": "schema_out_of_date"})
    return JSONResponse(status_code=200, content={"status": "ok", "schema": current})
