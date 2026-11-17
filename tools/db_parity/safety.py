"""Trava de segurança: só deixa ferramentas destrutivas (create_all/drop_all,
limpeza de tabela) rodarem contra um banco de TESTE descartável.

Motivo (CONTEXTO §15.3, AM-07): um conftest que sobrescreve DATABASE_URL e faz
drop_all pode apagar o banco errado. Esta função é chamada antes de qualquer DDL.

Regras:
- PostgreSQL: o nome do banco termina em "_test" E o host é localhost,
  127.0.0.1, ::1 ou "postgres" (nome do serviço no CI / na rede do compose).
- SQLite: o arquivo fica dentro do diretório temporário do sistema
  (tempfile.gettempdir(), onde o pytest cria tmp_path). ":memory:" é aceito.
- Qualquer outro dialeto é recusado.
Não há variável de ambiente nem parâmetro para "liberar" outro banco: de propósito.
"""

from __future__ import annotations

import tempfile
from pathlib import Path

from sqlalchemy.engine import URL, make_url

SAFE_PG_HOSTS = frozenset({"localhost", "127.0.0.1", "::1", "postgres"})
TEST_DB_SUFFIX = "_test"


class UnsafeDatabaseError(RuntimeError):
    """O banco indicado não é um banco de teste descartável."""


def _is_within(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
    except ValueError:
        return False
    return True


def assert_safe_test_database(url: str | URL) -> URL:
    """Levanta UnsafeDatabaseError se ``url`` não for um banco de teste seguro.

    Devolve a URL já interpretada (útil para logar com a senha escondida).
    """
    parsed = make_url(url) if not isinstance(url, URL) else url
    backend = parsed.get_backend_name()
    shown = parsed.render_as_string(hide_password=True)

    if backend == "postgresql":
        db = parsed.database or ""
        host = (parsed.host or "").lower()
        if not db.endswith(TEST_DB_SUFFIX):
            raise UnsafeDatabaseError(
                f"recusado: o banco {db!r} não termina em {TEST_DB_SUFFIX!r} ({shown})"
            )
        if host not in SAFE_PG_HOSTS:
            raise UnsafeDatabaseError(
                f"recusado: host {host!r} não é local nem o serviço 'postgres' do CI ({shown})"
            )
        return parsed

    if backend == "sqlite":
        db = parsed.database or ""
        if db in ("", ":memory:"):
            return parsed
        if db.startswith("file:"):
            raise UnsafeDatabaseError(f"recusado: URI 'file:' de SQLite não é suportada ({shown})")
        tmp = Path(tempfile.gettempdir()).resolve()
        target = Path(db).resolve()
        if not _is_within(target, tmp):
            raise UnsafeDatabaseError(
                f"recusado: o arquivo SQLite {str(target)!r} não está no diretório temporário {str(tmp)!r}"
            )
        return parsed

    raise UnsafeDatabaseError(f"recusado: dialeto {backend!r} não suportado ({shown})")
