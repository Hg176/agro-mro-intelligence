from __future__ import annotations

import tempfile
from pathlib import Path

import pytest

from tools.db_parity.safety import UnsafeDatabaseError, assert_safe_test_database

PG = "postgresql+psycopg://agro_app:x@{host}:5432/{db}"


def test_recusa_banco_do_produto():
    with pytest.raises(UnsafeDatabaseError, match="_test"):
        assert_safe_test_database(PG.format(host="localhost", db="agro_mro"))


def test_aceita_banco_de_teste():
    assert assert_safe_test_database(PG.format(host="localhost", db="agro_mro_test")).database == "agro_mro_test"


@pytest.mark.parametrize("host", ["localhost", "127.0.0.1", "postgres"])
def test_aceita_hosts_locais_e_servico_do_ci(host):
    assert_safe_test_database(PG.format(host=host, db="agro_mro_test"))


@pytest.mark.parametrize("db", ["agro_mro_restore_check", "agro_mro_test_old", "test", "agro_mro_testes", ""])
def test_recusa_nomes_que_nao_terminam_em_test(db):
    with pytest.raises(UnsafeDatabaseError):
        assert_safe_test_database(PG.format(host="localhost", db=db))


@pytest.mark.parametrize("host", ["db.exemplo.com", "10.0.0.5", "postgres.prod", "rds.amazonaws.com"])
def test_recusa_host_remoto_mesmo_com_sufixo_test(host):
    with pytest.raises(UnsafeDatabaseError, match="host"):
        assert_safe_test_database(PG.format(host=host, db="agro_mro_test"))


def test_recusa_socket_sem_host():
    with pytest.raises(UnsafeDatabaseError):
        assert_safe_test_database("postgresql+psycopg://agro_app:x@/agro_mro_test")


def test_sqlite_em_diretorio_temporario(tmp_path):
    assert_safe_test_database(f"sqlite:///{(tmp_path / 'x.db').as_posix()}")
    assert_safe_test_database(f"sqlite:///{Path(tempfile.gettempdir(), 'y.db').as_posix()}")
    assert_safe_test_database("sqlite://")
    assert_safe_test_database("sqlite:///:memory:")


def test_sqlite_fora_do_temporario_recusado():
    repo_db = Path(__file__).resolve().parents[3] / "agro_mro.db"
    with pytest.raises(UnsafeDatabaseError, match="temporário"):
        assert_safe_test_database(f"sqlite:///{repo_db.as_posix()}")
    with pytest.raises(UnsafeDatabaseError):
        assert_safe_test_database("sqlite:///agro_mro.db")  # relativo ao diretório atual


def test_sqlite_escapando_do_temporario_com_dotdot_recusado(tmp_path):
    fuga = Path(tempfile.gettempdir()) / ".." / ".." / "agro_mro.db"
    if Path(fuga).resolve().is_relative_to(Path(tempfile.gettempdir()).resolve()):
        pytest.skip("diretório temporário na raiz do sistema")
    with pytest.raises(UnsafeDatabaseError):
        assert_safe_test_database(f"sqlite:///{fuga.as_posix()}")


@pytest.mark.parametrize("url", ["mysql://u:p@localhost/agro_mro_test", "mssql+pyodbc://u:p@localhost/agro_mro_test"])
def test_recusa_outros_dialetos(url):
    with pytest.raises(UnsafeDatabaseError, match="dialeto"):
        assert_safe_test_database(url)
