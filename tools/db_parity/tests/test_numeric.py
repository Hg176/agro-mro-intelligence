"""Numeric(18,4) em SQLite x PostgreSQL: registra e AFIRMA o comportamento observado.

Não esconde diferença: cada banco tem o seu conjunto esperado (EXPECTED). Se a
versão do driver/SQLAlchemy/banco mudar o comportamento, o teste falha e o
numeric_report.md mostra o quê. Mudar EXPECTED exige entender a mudança e
registrar no PR (é a prova de tipo da migração, não um oráculo do produto).
"""

from __future__ import annotations

import json
import sqlite3
from decimal import Decimal

import psycopg
import sqlalchemy
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from tools.db_parity.tests.numeric_report import OUT_DIR
from tools.db_parity.tests.modelo_sintetico import LINHAS, PosicaoSintetica as P

ALVO = Decimal("1.2346")  # 1.23456 arredondado para escala 4


def _fmt(v) -> str:
    return f"{type(v).__name__} {v!r}"


def _observe(db) -> tuple[dict, list[dict]]:
    obs: list[dict] = []

    def add(oid: str, desc: str, value) -> None:
        obs.append({"id": oid, "descricao": desc, "valor": value if isinstance(value, str) else _fmt(value)})

    with Session(db.engine) as s:
        objs = [P(**linha) for linha in LINHAS]
        s.add_all(objs)
        s.commit()
        s.expire_all()
        for o in objs:
            s.refresh(o)
        for o in objs:
            add(f"orm_id{o.id}", f"ORM após commit + expire_all + refresh, id {o.id}", o.qty)

        for i, v in enumerate(s.scalars(select(P.qty).order_by(P.id)), 1):
            add(f"core_id{i}", f"select(P.qty) tipado, id {i}", v)

        for i, v in enumerate(s.execute(text("SELECT qty FROM sint_posicao ORDER BY id")).scalars(), 1):
            add(f"sql_id{i}", f"SELECT qty textual (valor cru do driver), id {i}", v)

        tipo_fn = "typeof(qty)" if db.name == "sqlite" else "pg_typeof(qty)::text"
        tipos = s.execute(text(f"SELECT {tipo_fn} FROM sint_posicao ORDER BY id")).scalars().all()
        add("tipo_no_banco", f"tipo gravado no banco ({tipo_fn}), ids 1-3", ", ".join(tipos))

        add("sum_tipado", "SUM em SQL via select(func.sum(P.qty))", s.scalar(select(func.sum(P.qty))))
        add("avg_tipado", "AVG em SQL via select(func.avg(P.qty))", s.scalar(select(func.avg(P.qty))))
        add("sum_sql", "SUM em SQL textual (cru)", s.execute(text("SELECT SUM(qty) FROM sint_posicao")).scalar())
        add("avg_sql", "AVG em SQL textual (cru)", s.execute(text("SELECT AVG(qty) FROM sint_posicao")).scalar())

        add("where_tipado_1_2346", "count WHERE P.qty == Decimal('1.2346') (bind tipado)",
            s.scalar(select(func.count()).where(P.qty == ALVO)))
        add("where_sql_1_2346", "count WHERE qty = 1.2346 (literal SQL)",
            s.execute(text("SELECT count(*) FROM sint_posicao WHERE qty = 1.2346")).scalar())
        add("where_sql_1_23456", "count WHERE qty = 1.23456 (literal SQL, valor inserido)",
            s.execute(text("SELECT count(*) FROM sint_posicao WHERE qty = 1.23456")).scalar())

        if db.name == "sqlite":
            server = f"SQLite {sqlite3.sqlite_version}"
        else:
            server = s.execute(text("SELECT current_setting('server_version')")).scalar()
            server = f"PostgreSQL {server}"

    env = {
        "servidor": server,
        "SQLAlchemy": sqlalchemy.__version__,
        "driver": "sqlite3 (stdlib)" if db.name == "sqlite" else f"psycopg {psycopg.__version__}",
    }
    return env, obs


# Comportamento observado em 2026-11-05 com SQLAlchemy 2.0.57, psycopg 3.3.8,
# PostgreSQL 17.11 e SQLite 3.46.1 (python:3.12-slim). Preenchido a partir da
# observação, não do desejo. Leitura:
# - SQLite grava Numeric como REAL binário (1.23456 inteiro, sem a escala 4);
#   o SQLAlchemy só arredonda para 4 casas na LEITURA tipada.
# - SUM tipado no SQLite mascara a diferença (1.33457 -> 1.3346); o cru não.
# - AVG tipado no SQLite volta float; no PG volta Decimal com 20 casas.
# - WHERE qty = 1.2346 não acha a linha no SQLite (lá está 1.23456); no PG acha.
EXPECTED: dict[str, dict[str, str]] = {
    "sqlite": {
        "orm_id1": "Decimal Decimal('1.2346')",
        "orm_id2": "Decimal Decimal('0.1000')",
        "orm_id3": "Decimal Decimal('0.0000')",
        "core_id1": "Decimal Decimal('1.2346')",
        "core_id2": "Decimal Decimal('0.1000')",
        "core_id3": "Decimal Decimal('0.0000')",
        "sql_id1": "float 1.23456",
        "sql_id2": "float 0.1",
        "sql_id3": "float 1e-05",
        "tipo_no_banco": "real, real, real",
        "sum_tipado": "Decimal Decimal('1.3346')",
        "avg_tipado": "float 0.4448566666666667",
        "sum_sql": "float 1.33457",
        "avg_sql": "float 0.4448566666666667",
        "where_tipado_1_2346": "int 0",
        "where_sql_1_2346": "int 0",
        "where_sql_1_23456": "int 1",
    },
    "postgresql": {
        "orm_id1": "Decimal Decimal('1.2346')",
        "orm_id2": "Decimal Decimal('0.1000')",
        "orm_id3": "Decimal Decimal('0.0000')",
        "core_id1": "Decimal Decimal('1.2346')",
        "core_id2": "Decimal Decimal('0.1000')",
        "core_id3": "Decimal Decimal('0.0000')",
        "sql_id1": "Decimal Decimal('1.2346')",
        "sql_id2": "Decimal Decimal('0.1000')",
        "sql_id3": "Decimal Decimal('0.0000')",
        "tipo_no_banco": "numeric, numeric, numeric",
        "sum_tipado": "Decimal Decimal('1.3346')",
        "avg_tipado": "Decimal Decimal('0.44486666666666666667')",
        "sum_sql": "Decimal Decimal('1.3346')",
        "avg_sql": "Decimal Decimal('0.44486666666666666667')",
        "where_tipado_1_2346": "int 1",
        "where_sql_1_2346": "int 1",
        "where_sql_1_23456": "int 0",
    },
}


def test_numeric_comportamento_por_banco(db):
    env, obs = _observe(db)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / f"numeric_{db.name}.json").write_text(
        json.dumps({"ambiente": env, "observacoes": obs}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    observed = {o["id"]: o["valor"] for o in obs}
    assert observed == EXPECTED[db.name], (
        f"comportamento do Numeric mudou em {db.name}; veja tools/db_parity/tests/out/numeric_report.md"
    )
