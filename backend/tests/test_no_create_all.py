"""Grep no código de backend/: esquema só por Alembic e lifespan no lugar de on_event."""

from __future__ import annotations

from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
SUFIXOS = {".py", ".ini", ".mako", ".cfg", ".toml", ".txt", ".md"}
IGNORAR = {"__pycache__", ".pytest_cache", ".venv", "venv"}

# Montados por partes para este próprio arquivo não acusar a si mesmo.
PROIBIDOS = ("create" + "_all(", "on" + "_event(")


def _arquivos() -> list[Path]:
    return sorted(
        p
        for p in BACKEND_DIR.rglob("*")
        if p.is_file() and p.suffix in SUFIXOS and not (IGNORAR & set(p.relative_to(BACKEND_DIR).parts))
    )


def test_ha_arquivos_para_varrer() -> None:
    nomes = {p.name for p in _arquivos()}
    assert {"main.py", "base.py", "env.py", "conftest.py"} <= nomes


@pytest.mark.parametrize("termo", PROIBIDOS)
def test_backend_nao_usa(termo: str) -> None:
    achados = [
        f"{p.relative_to(BACKEND_DIR).as_posix()}:{n}"
        for p in _arquivos()
        for n, linha in enumerate(p.read_text(encoding="utf-8").splitlines(), 1)
        if termo in linha
    ]
    assert achados == [], f"{termo!r} encontrado em: {achados}"
