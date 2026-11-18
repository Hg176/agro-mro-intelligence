"""Tipos: quantidade volta Decimal exato (nunca float) e hora volta com fuso UTC.

Modelo sintético num MetaData SEPARADO (não registrado no Base do produto),
criado e apagado pelo próprio teste como agro_owner e usado como agro_app.
"""

from __future__ import annotations

from collections.abc import Iterator
from datetime import UTC, timedelta
from decimal import Decimal

import pytest
from sqlalchemy import Column, Identity, Integer, MetaData, String, Table, func, insert, select
from sqlalchemy.engine import Engine

from app.db.base import Base
from app.db.types import DataHoraUTC, Percentual, Quantidade, utcnow
from tools.db_parity.audit_types import audit_metadata

metadata = MetaData()
sint_tipos = Table(
    "b1_sint_tipos",
    metadata,
    Column("id", Integer, Identity(), primary_key=True),
    Column("sku", String(40), nullable=False),
    Column("qty", Quantidade, nullable=False),
    Column("ns", Percentual),
    Column("created_at", DataHoraUTC, server_default=func.now(), nullable=False),
)


@pytest.fixture
def tabela(owner_engine: Engine) -> Iterator[Table]:
    with owner_engine.begin() as conn:
        sint_tipos.drop(conn, checkfirst=True)
        sint_tipos.create(conn)
    try:
        yield sint_tipos
    finally:
        with owner_engine.begin() as conn:
            sint_tipos.drop(conn, checkfirst=True)


def test_quantidade_volta_decimal_exato(app_engine: Engine, tabela: Table) -> None:
    with app_engine.begin() as conn:
        conn.execute(insert(tabela).values(sku="00150", qty=Decimal("1.2346"), ns=Decimal("0.9500")))
        row = conn.execute(select(tabela.c.sku, tabela.c.qty, tabela.c.ns)).one()
        total = conn.execute(select(func.sum(tabela.c.qty))).scalar_one()
    assert row.sku == "00150"  # zeros à esquerda preservados
    assert type(row.qty) is Decimal and not isinstance(row.qty, float)
    assert row.qty == Decimal("1.2346") and str(row.qty) == "1.2346"
    assert type(row.ns) is Decimal and str(row.ns) == "0.9500"
    assert type(total) is Decimal and total == Decimal("1.2346")


def test_quantidade_nao_arredonda_em_silencio_com_float(app_engine: Engine, tabela: Table) -> None:
    """Ida e volta de um valor de 4 casas sem passar por float binário."""
    valor = Decimal("12345678901234.5678")  # 18 dígitos, 4 casas: limite do Numeric(18,4)
    with app_engine.begin() as conn:
        conn.execute(insert(tabela).values(sku="X", qty=valor))
        lido = conn.execute(select(tabela.c.qty)).scalar_one()
    assert lido == valor and str(lido) == "12345678901234.5678"


def test_created_at_volta_com_fuso_utc(app_engine: Engine, tabela: Table) -> None:
    antes = utcnow()
    with app_engine.begin() as conn:
        conn.execute(insert(tabela).values(sku="A", qty=Decimal("0")))
        created = conn.execute(select(tabela.c.created_at)).scalar_one()
    depois = utcnow()
    assert created.tzinfo is not None
    assert created.utcoffset() == timedelta(0)
    assert antes - timedelta(seconds=5) <= created <= depois + timedelta(seconds=5)


def test_utcnow_tem_fuso_utc() -> None:
    agora = utcnow()
    assert agora.tzinfo is UTC and agora.utcoffset() == timedelta(0)


def test_tipos_comuns() -> None:
    assert (Quantidade.precision, Quantidade.scale, Quantidade.asdecimal) == (18, 4, True)
    assert (Percentual.precision, Percentual.scale, Percentual.asdecimal) == (5, 4, True)
    assert DataHoraUTC.timezone is True


def test_modelo_do_produto_sem_float_e_sem_hora_sem_fuso() -> None:
    """tools/db_parity/audit_types sobre o Base do produto: nada de Float nem DateTime ingênuo."""
    import app.models  # noqa: F401

    proibidos = {"float", "datetime_sem_fuso", "string_sem_tamanho", "identificador_nao_texto"}
    achados = [
        f
        for f in audit_metadata(Base.metadata)
        if f.category in proibidos or (f.category == "numeric" and "sem precisão" in f.detail)
    ]
    assert achados == []
    assert "b1_sint_tipos" not in Base.metadata.tables
