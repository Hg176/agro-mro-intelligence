"""Falha se algum teste de PostgreSQL foi pulado (ou se nenhum rodou).

    python scripts/check_no_pg_skips.py reports/junit-tools.xml
    python scripts/check_no_pg_skips.py --todos reports/junit-backend.xml

Um teste é "de PostgreSQL" se o nome ou a classe contém "postgresql"
(o fixture parametrizado gera ids como test_x[postgresql]).
Com --todos, TODO teste do junit conta como de PostgreSQL (backend/tests só
roda em PostgreSQL, então qualquer teste pulado é falha).
Sai com 1 se: houver teste de PostgreSQL pulado; nenhum teste de PostgreSQL
tiver rodado; ou houver falha/erro em qualquer teste.
"""

from __future__ import annotations

import sys
import xml.etree.ElementTree as ET


def main(path: str, todos: bool = False) -> int:
    root = ET.parse(path).getroot()
    cases = list(root.iter("testcase"))
    if todos:
        pg = cases
    else:
        pg = [c for c in cases if "postgresql" in (c.get("name", "") + c.get("classname", "")).lower()]
    skipped = [c for c in pg if c.find("skipped") is not None]
    broken = [c for c in cases if c.find("failure") is not None or c.find("error") is not None]
    ran = [c for c in pg if c not in skipped]

    print(f"junit: {len(cases)} teste(s); PostgreSQL: {len(pg)} ({len(ran)} executados, {len(skipped)} pulados)")
    rc = 0
    for c in skipped:
        msg = c.find("skipped").get("message", "")
        print(f"  PULADO: {c.get('classname')}::{c.get('name')}  {msg}")
        rc = 1
    if not ran:
        print("  ERRO: nenhum teste de PostgreSQL foi executado")
        rc = 1
    for c in broken:
        print(f"  FALHOU: {c.get('classname')}::{c.get('name')}")
        rc = 1
    print("ok: nenhum teste de PostgreSQL pulado" if rc == 0 else "FALHA na checagem do junit")
    return rc


if __name__ == "__main__":
    args = sys.argv[1:]
    todos = "--todos" in args
    args = [a for a in args if a != "--todos"]
    if len(args) != 1:
        print(__doc__)
        raise SystemExit(2)
    raise SystemExit(main(args[0], todos=todos))
