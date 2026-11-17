from __future__ import annotations

import json

from sqlalchemy import (
    JSON, Column, DateTime, Float, Integer, MetaData, Numeric, String, Table, Text, func, text,
)

from tools.db_parity.audit_types import audit_metadata, main, to_json, to_markdown
from tools.db_parity.tests.modelo_sintetico import BaseSintetica


def _cats(findings):
    return {(f.table, f.column, f.category) for f in findings}


def test_mini_modelo():
    got = _cats(audit_metadata(BaseSintetica.metadata))
    assert got == {
        ("sint_posicao", "qty", "numeric"),
        ("sint_posicao", "criado_em", "datetime_sem_fuso"),
        ("sint_posicao", "criado_em", "server_default_agora"),
        ("sint_posicao", "payload_json", "json_em_texto"),
    }


def test_todas_as_categorias():
    md = MetaData()
    Table(
        "sint_auditoria", md,
        Column("id", Integer, primary_key=True),
        Column("preco", Float),
        Column("nome", String),
        Column("qtd", Numeric(18, 4)),
        Column("valor_livre", Numeric),
        Column("quando", DateTime),
        Column("quando_tz", DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP")),
        Column("gravado", DateTime, server_default=func.now()),
        Column("dados_json", Text),
        Column("nativo_json", JSON),
        Column("code", Integer),
        Column("sku", String(40)),
        Column("location", Numeric(10, 0)),
        Column("replacement_code", Integer),
        Column("local", String(20)),
    )
    got = _cats(audit_metadata(md))
    t = "sint_auditoria"
    expected = {
        (t, "preco", "float"),
        (t, "nome", "string_sem_tamanho"),
        (t, "qtd", "numeric"),
        (t, "valor_livre", "numeric"),
        (t, "quando", "datetime_sem_fuso"),
        (t, "quando_tz", "server_default_agora"),
        (t, "gravado", "datetime_sem_fuso"),
        (t, "gravado", "server_default_agora"),
        (t, "dados_json", "json_em_texto"),
        (t, "code", "identificador_nao_texto"),
        (t, "location", "identificador_nao_texto"),
        (t, "location", "numeric"),
        (t, "replacement_code", "identificador_nao_texto"),
    }
    assert got == expected
    detalhe = {f.column: f.detail for f in audit_metadata(md) if f.category == "numeric"}
    assert detalhe["qtd"] == "precisão=18 escala=4"
    assert "sem precisão" in detalhe["valor_livre"]


def test_saidas_md_e_json(tmp_path):
    f = audit_metadata(BaseSintetica.metadata)
    j = json.loads(to_json(f))
    assert j["total"] == 4 and j["por_categoria"]["numeric"] == 1
    md = to_markdown(f)
    assert "| `sint_posicao` | `qty` | `numeric` |" in md

    out = tmp_path / "a.json"
    assert main(["--metadata", "tools.db_parity.tests.modelo_sintetico:BaseSintetica",
                 "--format", "json", "--out", str(out)]) == 0
    assert json.loads(out.read_text(encoding="utf-8"))["total"] == 4


def test_auditoria_por_reflexao(db):
    """Refletir o banco real (SQLite/PG) e auditar: qty segue Numeric(18,4) e
    criado_em segue sem fuso nos dois."""
    md = MetaData()
    md.reflect(bind=db.owner_engine, only=["sint_posicao"])
    got = {(f.column, f.category) for f in audit_metadata(md)}
    assert ("qty", "numeric") in got
    assert ("criado_em", "datetime_sem_fuso") in got
    assert ("criado_em", "server_default_agora") in got
    detalhe = {f.column: f.detail for f in audit_metadata(md) if f.category == "numeric"}
    assert detalhe["qty"] == "precisão=18 escala=4"
