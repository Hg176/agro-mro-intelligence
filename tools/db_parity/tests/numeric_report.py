"""Monta tests/out/numeric_report.md a partir de out/numeric_<banco>.json.

Arquivo gerado, fora do git. Só contém valores do mini-modelo sintético.
"""

from __future__ import annotations

import datetime as dt
from pathlib import Path

OUT_DIR = Path(__file__).parent / "out"


def _cell(v: str | None) -> str:
    if v is None:
        return "_(não executado)_"
    return "`" + v.replace("|", "\\|") + "`"


def render_report(data: dict[str, dict], dialects: tuple[str, ...]) -> str:
    cols = [d for d in dialects if d in data] + sorted(d for d in data if d not in dialects)
    missing = [d for d in dialects if d not in data]

    order: list[tuple[str, str]] = []
    seen: set[str] = set()
    for d in cols:
        for o in data[d]["observacoes"]:
            if o["id"] not in seen:
                seen.add(o["id"])
                order.append((o["id"], o["descricao"]))
    values = {d: {o["id"]: o["valor"] for o in data[d]["observacoes"]} for d in cols}

    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        "# Numeric(18,4): o que cada banco devolve",
        "",
        f"Gerado por `tools/db_parity/tests/test_numeric.py` em {now}. Arquivo gerado, fora do git.",
        "Mini-modelo sintético `sint_posicao` (não é modelo do produto). Valores inseridos como",
        "`Decimal`: id 1 = `1.23456`, id 2 = `0.1`, id 3 = `0.00001`, coluna `qty Numeric(18,4)`.",
        "Cada célula é `tipo Python  repr(valor)`. O teste afirma exatamente estes valores e falha se mudarem.",
        "",
        "## Ambiente",
        "",
        "| Item | " + " | ".join(cols) + " |",
        "|---|" + "---|" * len(cols),
    ]
    env_keys: list[str] = []
    for d in cols:
        for k in data[d].get("ambiente", {}):
            if k not in env_keys:
                env_keys.append(k)
    for k in env_keys:
        lines.append(f"| {k} | " + " | ".join(_cell(data[d].get("ambiente", {}).get(k)) for d in cols) + " |")

    lines += [
        "",
        "## Observações",
        "",
        "| # | Leitura | " + " | ".join(cols) + " | Igual? |",
        "|---|---|" + "---|" * len(cols) + "---|",
    ]
    for i, (oid, desc) in enumerate(order, 1):
        vals = [values[d].get(oid) for d in cols]
        same = "sim" if len(set(vals)) == 1 and None not in vals else "**não**"
        lines.append(f"| {i} | {desc} (`{oid}`) | " + " | ".join(_cell(v) for v in vals) + f" | {same} |")

    if missing:
        lines += ["", f"**Atenção:** não executado em: {', '.join(missing)} (TEST_POSTGRES_URL ausente?)."]
    return "\n".join(lines) + "\n"
