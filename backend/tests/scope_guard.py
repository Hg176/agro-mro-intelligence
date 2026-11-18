"""Guarda de escopo por workspace (usado por test_workspace_scope_guard.py).

Toda tabela de dado de cliente precisa de:
  1. coluna workspace_id NOT NULL;
  2. FK de workspace_id para workspaces.id;
  3. um índice cuja PRIMEIRA coluna é workspace_id.
Exceções só por allowlist explícita, com motivo.
"""

from __future__ import annotations

from sqlalchemy import MetaData, Table

# Tabelas que NÃO são dado de um workspace. Cada entrada precisa de motivo.
ALLOWLIST: dict[str, str] = {
    "workspaces": "é a própria tabela de tenants",
}


def problems_for(table: Table) -> list[str]:
    col = table.columns.get("workspace_id")
    if col is None:
        return [f"{table.name}: sem coluna workspace_id"]
    out: list[str] = []
    if col.nullable:
        out.append(f"{table.name}: workspace_id aceita NULL")
    if not any(fk.target_fullname == "workspaces.id" for fk in col.foreign_keys):
        out.append(f"{table.name}: workspace_id sem FK para workspaces.id")
    if not any(ix.columns and list(ix.columns)[0].name == "workspace_id" for ix in table.indexes):
        out.append(f"{table.name}: nenhum índice começa por workspace_id")
    return out


def check_workspace_scope(metadata: MetaData, allowlist: dict[str, str] | None = None) -> list[str]:
    allow = ALLOWLIST if allowlist is None else allowlist
    out: list[str] = []
    for name in sorted(metadata.tables):
        if name in allow:
            continue
        out.extend(problems_for(metadata.tables[name]))
    return out
