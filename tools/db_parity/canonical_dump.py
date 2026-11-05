"""Dump canônico: exporta todas as tabelas de um MetaData para JSON comparável
byte a byte entre bancos diferentes (SQLite x PostgreSQL).

Formato (um diretório por banco):
- ``_schema.json``      tabelas, colunas e chave primária (vem do MetaData, igual nos dois)
- ``<tabela>.jsonl``    uma linha por registro, ordenado pela chave primária,
                        colunas na ordem do MetaData

Regras de valor (sem perder informação, sem misturar estados):
- None            -> null
- int             -> número inteiro           (0 é 0, nunca null)
- bool            -> true/false
- str             -> string                   ("" é "", nunca null)
- Decimal         -> string em notação fixa, com TODAS as casas devolvidas
                     (Decimal("0.1000") -> "0.1000"; nunca float, nunca expoente)
- float           -> número com repr() de Python (ida e volta exata)
- date/datetime/time -> ISO 8601 (datetime sem fuso fica sem sufixo; com fuso, com offset)
- bytes           -> {"$bytes_hex": "..."}
- uuid.UUID       -> string
- dict/list (JSON nativo) -> objeto/array com chaves ordenadas
Qualquer outro tipo levanta TypeError: nada é convertido em silêncio.

Dois modos de leitura:
- tipado (padrão): usa os tipos do MetaData, ou seja, o que a aplicação recebe
  pelo SQLAlchemy em cada banco (no SQLite, Numeric volta arredondado para a escala);
- cru (``--cru`` / ``typed=False``): o valor como o driver devolve, sem os
  conversores do SQLAlchemy, ou seja, o que está GRAVADO (no SQLite, o REAL binário).
Compare sempre dumps feitos no mesmo modo.

Uso:
    python -m tools.db_parity.canonical_dump --url URL --metadata pacote.modulo:Base --out DIR [--cru]
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import os
import uuid
from decimal import Decimal
from pathlib import Path
from typing import Any

from sqlalchemy import MetaData, Table, create_engine, select, type_coerce
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.types import NullType

from ._load import load_metadata

SCHEMA_FILE = "_schema.json"


def canonical_value(value: Any) -> Any:
    """Converte um valor devolvido pelo driver/SQLAlchemy para JSON canônico."""
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        return value
    if isinstance(value, Decimal):
        if not value.is_finite():
            raise TypeError(f"Decimal não finito não é suportado: {value!r}")
        return format(value, "f")
    if isinstance(value, float):
        if not math.isfinite(value):
            raise TypeError(f"float não finito não é suportado: {value!r}")
        return value
    if isinstance(value, dt.datetime):
        return value.isoformat()
    if isinstance(value, (dt.date, dt.time)):
        return value.isoformat()
    if isinstance(value, (bytes, bytearray, memoryview)):
        return {"$bytes_hex": bytes(value).hex()}
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, dict):
        return {str(k): canonical_value(v) for k, v in sorted(value.items(), key=lambda kv: str(kv[0]))}
    if isinstance(value, (list, tuple)):
        return [canonical_value(v) for v in value]
    raise TypeError(f"tipo sem regra canônica: {type(value).__name__} ({value!r})")


def _dumps(obj: Any) -> str:
    # float: json usa repr(), que faz ida e volta exata.
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"), allow_nan=False)


def _order_columns(table: Table):
    pk = list(table.primary_key.columns)
    return pk if pk else list(table.columns)


def schema_description(metadata: MetaData) -> dict[str, Any]:
    tables = {}
    for t in sorted(metadata.tables.values(), key=lambda t: t.fullname):
        tables[t.fullname] = {
            "columns": [c.name for c in t.columns],
            "primary_key": [c.name for c in t.primary_key.columns],
            "order_by": [c.name for c in _order_columns(t)],
        }
    return {"format": "agro-mro-canonical-dump/1", "tables": tables}


def iter_table_lines(conn: Connection, table: Table, typed: bool = True):
    cols = list(table.columns)
    selected = cols if typed else [type_coerce(c, NullType()).label(c.name) for c in cols]
    stmt = select(*selected).order_by(*_order_columns(table))
    for row in conn.execute(stmt):
        rec = {c.name: canonical_value(row[i]) for i, c in enumerate(cols)}
        yield _dumps(rec)


def dump_database(
    bind: str | Engine, metadata: MetaData, out_dir: str | os.PathLike, typed: bool = True
) -> dict[str, int]:
    """Escreve o dump canônico em ``out_dir``. Devolve {tabela: nº de linhas}.

    ``bind`` pode ser uma URL ou um Engine. Só leitura no banco.
    ``typed=False`` lê o valor cru do driver (veja a docstring do módulo).
    """
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    engine = create_engine(bind) if isinstance(bind, str) else bind
    counts: dict[str, int] = {}
    try:
        with engine.connect() as conn:
            for table in sorted(metadata.tables.values(), key=lambda t: t.fullname):
                n = 0
                with open(out / f"{table.fullname}.jsonl", "w", encoding="utf-8", newline="\n") as fh:
                    for line in iter_table_lines(conn, table, typed=typed):
                        fh.write(line + "\n")
                        n += 1
                counts[table.fullname] = n
            conn.rollback()
    finally:
        if isinstance(bind, str):
            engine.dispose()
    with open(out / SCHEMA_FILE, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(json.dumps(schema_description(metadata), ensure_ascii=False, indent=2, sort_keys=True) + "\n")
    return counts


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--url", required=True, help="URL SQLAlchemy do banco (só leitura)")
    p.add_argument("--metadata", required=True, help="pacote.modulo:atributo (MetaData ou Base)")
    p.add_argument("--out", required=True, help="diretório de saída")
    p.add_argument("--cru", action="store_true", help="valor cru do driver, sem conversão do SQLAlchemy")
    a = p.parse_args(argv)
    counts = dump_database(a.url, load_metadata(a.metadata), a.out, typed=not a.cru)
    for t, n in counts.items():
        print(f"{t}: {n} linha(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
