"""Mini-modelo SINTÉTICO, só dos testes de tools/db_parity.

NÃO é modelo do produto e não representa nenhuma tabela real do Agro MRO.
Existe só para provar comportamento de tipo entre SQLite e PostgreSQL:
SKU/Local texto com zeros à esquerda, Numeric(18,4), NULL x 0 x "", Date,
DateTime sem fuso com server_default=func.now() e JSON guardado em Text.
Todos os valores são inventados.
"""

from __future__ import annotations

import datetime as dt
from decimal import Decimal

from sqlalchemy import Date, DateTime, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class BaseSintetica(DeclarativeBase):
    pass


class PosicaoSintetica(BaseSintetica):
    __tablename__ = "sint_posicao"
    __table_args__ = (UniqueConstraint("sku", "local", name="uq_sint_posicao_sku_local"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sku: Mapped[str] = mapped_column(String(40), nullable=False)
    local: Mapped[str] = mapped_column(String(20), nullable=False)
    qty: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    opcional_int: Mapped[int | None] = mapped_column(Integer, nullable=True)
    opcional_txt: Mapped[str | None] = mapped_column(String(40), nullable=True)
    data_ref: Mapped[dt.date] = mapped_column(Date, nullable=False)
    criado_em: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=False), server_default=func.now(), nullable=False
    )
    payload_json: Mapped[str | None] = mapped_column(Text, nullable=True)


# Linhas sintéticas. A ordem de inserção define o id (1, 2, 3).
LINHAS: list[dict] = [
    dict(sku="0010", local="0001", qty=Decimal("1.23456"), opcional_int=None, opcional_txt=None,
         data_ref=dt.date(2026, 1, 31), payload_json='{"origem": "sintetico", "n": 1}'),
    dict(sku="010", local="0001", qty=Decimal("0.1"), opcional_int=0, opcional_txt="",
         data_ref=dt.date(2026, 2, 28), payload_json="[]"),
    dict(sku="10", local="0001", qty=Decimal("0.00001"), opcional_int=7, opcional_txt="0",
         data_ref=dt.date(2026, 12, 31), payload_json=None),
]

# Para o teste de paridade, criado_em explícito (o server_default depende do relógio).
CRIADO_EM_FIXO = dt.datetime(2026, 11, 5, 12, 0, 0)
