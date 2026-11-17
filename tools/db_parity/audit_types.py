"""Auditoria de tipos para a troca SQLite -> PostgreSQL.

Recebe um MetaData (do modelo, ou refletido de uma URL) e lista as colunas que
merecem decisão antes de migrar. Não corrige nada: só aponta.

Categorias:
- float                  Float/REAL/DOUBLE: binário, não guarda decimal exato
- string_sem_tamanho     String/VARCHAR sem length (no PG vira varchar ilimitado)
- numeric                Numeric/DECIMAL: lista precisão e escala (ou a falta delas)
- datetime_sem_fuso      DateTime(timezone=False)
- server_default_agora   server_default com now()/CURRENT_TIMESTAMP (depende do fuso da sessão)
- json_em_texto          Text/String com nome *_json (JSON guardado como texto)
- identificador_nao_texto  colunas code/sku/location/local (ou *_code etc.) que não são texto

Uso:
    python -m tools.db_parity.audit_types --metadata pacote.modulo:Base --format md
    python -m tools.db_parity.audit_types --url sqlite:///arquivo.db --format json --out audit.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass

from sqlalchemy import MetaData, create_engine, types as sat
from sqlalchemy.sql.elements import TextClause
from sqlalchemy.sql.functions import FunctionElement
from sqlalchemy.sql.schema import DefaultClause

from ._load import load_metadata

CATEGORIES = (
    "float",
    "string_sem_tamanho",
    "numeric",
    "datetime_sem_fuso",
    "server_default_agora",
    "json_em_texto",
    "identificador_nao_texto",
)

_IDENT_RE = re.compile(r"(^|_)(code|sku|location|local)$", re.IGNORECASE)
_NOW_RE = re.compile(r"\b(now\s*\(|current_timestamp|localtimestamp|getdate\s*\(|datetime\s*\(\s*'now')", re.I)


@dataclass(frozen=True)
class Finding:
    table: str
    column: str
    category: str
    sql_type: str
    detail: str


def _type_str(t: sat.TypeEngine) -> str:
    try:
        return str(t)
    except Exception:  # tipos sem compilação genérica
        return type(t).__name__


def _server_default_text(col) -> str | None:
    sd = col.server_default
    if sd is None:
        return None
    if isinstance(sd, DefaultClause):
        arg = sd.arg
        if isinstance(arg, str):
            return arg
        if isinstance(arg, (TextClause, FunctionElement)):
            return str(arg)
        return str(arg)
    return repr(sd)


def audit_metadata(metadata: MetaData) -> list[Finding]:
    """Devolve os achados em ordem estável (tabela, coluna, categoria)."""
    out: list[Finding] = []
    for table in sorted(metadata.tables.values(), key=lambda t: t.fullname):
        for col in table.columns:
            t = col.type
            ts = _type_str(t)

            def add(cat: str, detail: str) -> None:
                out.append(Finding(table.fullname, col.name, cat, ts, detail))

            # Float é subclasse de Numeric: testar antes.
            if isinstance(t, sat.Float):
                add("float", "ponto flutuante binário; quantidade/preço exigem Numeric")
            elif isinstance(t, sat.Numeric):
                if t.precision is None or t.scale is None:
                    add("numeric", f"precisão={t.precision} escala={t.scale}: sem precisão/escala fixas")
                else:
                    add("numeric", f"precisão={t.precision} escala={t.scale}")

            if (
                isinstance(t, sat.String)
                and not isinstance(t, (sat.Text, sat.Enum))
                and getattr(t, "length", None) is None
            ):
                add("string_sem_tamanho", "VARCHAR sem tamanho")

            if isinstance(t, sat.DateTime) and not getattr(t, "timezone", False):
                add("datetime_sem_fuso", "timestamp sem fuso: o valor depende de quem gravou")

            sd = _server_default_text(col)
            if sd is not None and _NOW_RE.search(sd):
                add("server_default_agora", f"server_default={sd}: usa o fuso da sessão do banco")

            if col.name.lower().endswith("_json") and isinstance(t, sat.String):
                add("json_em_texto", "JSON guardado como texto")

            if _IDENT_RE.search(col.name) and not isinstance(t, sat.String):
                add("identificador_nao_texto", "identificador tem de ser texto (zeros à esquerda)")

    out.sort(key=lambda f: (f.table, f.column, CATEGORIES.index(f.category)))
    return out


def to_json(findings: list[Finding]) -> str:
    summary = {c: sum(1 for f in findings if f.category == c) for c in CATEGORIES}
    payload = {"total": len(findings), "por_categoria": summary, "achados": [asdict(f) for f in findings]}
    return json.dumps(payload, ensure_ascii=False, indent=2) + "\n"


def to_markdown(findings: list[Finding]) -> str:
    lines = ["# Auditoria de tipos", "", f"Total de achados: **{len(findings)}**", ""]
    lines += ["| Categoria | Achados |", "|---|---:|"]
    for c in CATEGORIES:
        lines.append(f"| `{c}` | {sum(1 for f in findings if f.category == c)} |")
    lines += ["", "| Tabela | Coluna | Categoria | Tipo | Detalhe |", "|---|---|---|---|---|"]
    for f in findings:
        detail = f.detail.replace("|", "\\|")
        lines.append(f"| `{f.table}` | `{f.column}` | `{f.category}` | `{f.sql_type}` | {detail} |")
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--metadata", help="pacote.modulo:atributo (MetaData ou Base)")
    src.add_argument("--url", help="URL SQLAlchemy para refletir o esquema (só leitura)")
    p.add_argument("--format", choices=("md", "json"), default="md")
    p.add_argument("--out", help="arquivo de saída (padrão: stdout)")
    a = p.parse_args(argv)

    if a.metadata:
        md = load_metadata(a.metadata)
    else:
        md = MetaData()
        engine = create_engine(a.url)
        try:
            md.reflect(bind=engine)
        finally:
            engine.dispose()

    findings = audit_metadata(md)
    text = to_markdown(findings) if a.format == "md" else to_json(findings)
    if a.out:
        with open(a.out, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text)
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
