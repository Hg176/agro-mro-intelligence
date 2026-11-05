"""Compara dois dumps canônicos (canonical_dump) byte a byte.

Igualdade é igualdade de bytes. NÃO existe opção de tolerância numérica, de
propósito: diferença numérica entre bancos é bug, não "tolerância" (CONTEXTO §15.3).

Quando os bytes diferem, o relatório explica onde:
- arquivo que só existe de um lado;
- registro (pela chave primária do _schema.json) que só existe de um lado;
- registro presente nos dois com coluna diferente (valor A x valor B);
- mesmos registros em ordem diferente.
Imprime a primeira divergência (arquivo, chave, valor A, valor B) e o total.

Uso:
    python -m tools.db_parity.compare DIR_A DIR_B
Saída: 0 = idênticos; 1 = divergentes; 2 = erro de uso/leitura.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .canonical_dump import SCHEMA_FILE

_MISSING = "<ausente>"


@dataclass(frozen=True)
class Divergence:
    file: str
    key: str
    column: str
    value_a: str
    value_b: str
    kind: str

    def describe(self) -> str:
        return (
            f"arquivo={self.file} chave={self.key} coluna={self.column} "
            f"A={self.value_a} B={self.value_b} ({self.kind})"
        )


@dataclass
class CompareResult:
    files_compared: int = 0
    divergences: list[Divergence] = field(default_factory=list)

    @property
    def equal(self) -> bool:
        return not self.divergences

    @property
    def total(self) -> int:
        return len(self.divergences)

    @property
    def first(self) -> Divergence | None:
        return self.divergences[0] if self.divergences else None


def _j(v: Any) -> str:
    return json.dumps(v, ensure_ascii=False, separators=(",", ":"))


def _pk_columns(schema: dict, file: str) -> list[str] | None:
    table = file[: -len(".jsonl")] if file.endswith(".jsonl") else None
    if table is None:
        return None
    info = schema.get("tables", {}).get(table)
    return list(info["order_by"]) if info else None


def _load_schema(d: Path) -> dict:
    p = d / SCHEMA_FILE
    if not p.is_file():
        return {}
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def _compare_jsonl(name: str, a: bytes, b: bytes, pk: list[str] | None) -> list[Divergence]:
    out: list[Divergence] = []
    la, lb = a.decode("utf-8").splitlines(), b.decode("utf-8").splitlines()

    def key_of(rec: Any, idx: int) -> str:
        if pk and isinstance(rec, dict) and all(c in rec for c in pk):
            return _j({c: rec[c] for c in pk})
        return f"linha {idx + 1}"

    def parse(lines: list[str]) -> list[tuple[str, Any, str]]:
        res = []
        for i, line in enumerate(lines):
            try:
                rec = json.loads(line)
            except ValueError:
                rec = line
            res.append((key_of(rec, i), rec, line))
        return res

    ra, rb = parse(la), parse(lb)
    da = {k: (rec, line) for k, rec, line in ra}
    db = {k: (rec, line) for k, rec, line in rb}
    keys_in_order = [k for k, _, _ in ra] + [k for k, _, _ in rb if k not in da]

    for k in keys_in_order:
        if k not in db:
            out.append(Divergence(name, k, "*", da[k][1], _MISSING, "registro só em A"))
            continue
        if k not in da:
            out.append(Divergence(name, k, "*", _MISSING, db[k][1], "registro só em B"))
            continue
        (rec_a, line_a), (rec_b, line_b) = da[k], db[k]
        if line_a == line_b:
            continue
        if isinstance(rec_a, dict) and isinstance(rec_b, dict):
            cols = list(rec_a) + [c for c in rec_b if c not in rec_a]
            diff_cols = [
                c for c in cols
                if c not in rec_a or c not in rec_b or _j(rec_a[c]) != _j(rec_b[c]) or type(rec_a[c]) is not type(rec_b[c])
            ]
            if not diff_cols:  # mesma informação, bytes diferentes (ordem de chave / espaço)
                out.append(Divergence(name, k, "*", line_a, line_b, "mesmo conteúdo, bytes diferentes"))
            for c in diff_cols:
                out.append(Divergence(
                    name, k, c,
                    _j(rec_a[c]) if c in rec_a else _MISSING,
                    _j(rec_b[c]) if c in rec_b else _MISSING,
                    "valor diferente",
                ))
        else:
            out.append(Divergence(name, k, "*", line_a, line_b, "linha diferente"))

    if not out and a != b:
        # Mesmo conjunto de registros, mas em outra ordem (ou fim de arquivo diferente).
        keys_a, keys_b = [k for k, _, _ in ra], [k for k, _, _ in rb]
        for i, (ka, kb) in enumerate(zip(keys_a, keys_b)):
            if ka != kb:
                out.append(Divergence(name, f"posição {i + 1}", "*", ka, kb, "ordem diferente"))
                break
        else:
            out.append(Divergence(name, "-", "*", f"{len(a)} bytes", f"{len(b)} bytes", "bytes diferentes"))
    return out


def compare_dirs(dir_a: str | Path, dir_b: str | Path) -> CompareResult:
    """Compara os arquivos dos dois diretórios. Sem tolerância de nenhum tipo."""
    a, b = Path(dir_a), Path(dir_b)
    for d in (a, b):
        if not d.is_dir():
            raise NotADirectoryError(f"não é diretório: {d}")
    files_a = {p.name for p in a.iterdir() if p.is_file()}
    files_b = {p.name for p in b.iterdir() if p.is_file()}
    schema = _load_schema(a) or _load_schema(b)
    res = CompareResult()

    for name in sorted(files_a | files_b):
        res.files_compared += 1
        if name not in files_b:
            res.divergences.append(Divergence(name, "-", "*", "presente", _MISSING, "arquivo só em A"))
            continue
        if name not in files_a:
            res.divergences.append(Divergence(name, "-", "*", _MISSING, "presente", "arquivo só em B"))
            continue
        ba, bb = (a / name).read_bytes(), (b / name).read_bytes()
        if ba == bb:
            continue
        if name.endswith(".jsonl"):
            res.divergences.extend(_compare_jsonl(name, ba, bb, _pk_columns(schema, name)))
        else:
            res.divergences.append(Divergence(name, "-", "*", f"{len(ba)} bytes", f"{len(bb)} bytes", "bytes diferentes"))
    return res


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("dir_a")
    p.add_argument("dir_b")
    a = p.parse_args(argv)
    try:
        res = compare_dirs(a.dir_a, a.dir_b)
    except (OSError, UnicodeDecodeError) as exc:
        print(f"erro: {exc}", file=sys.stderr)
        return 2
    if res.equal:
        print(f"IGUAIS: {res.files_compared} arquivo(s) idênticos byte a byte.")
        return 0
    print(f"PRIMEIRA DIVERGÊNCIA: {res.first.describe()}")
    print(f"TOTAL: {res.total} divergência(s) em {res.files_compared} arquivo(s) comparado(s).")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
