"""SKU/Local, fuso do server_default e dump canônico, em SQLite e PostgreSQL."""

from __future__ import annotations

import datetime as dt
import json

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from tools.db_parity.canonical_dump import dump_database
from tools.db_parity.compare import compare_dirs
from tools.db_parity.tests.modelo_sintetico import CRIADO_EM_FIXO, LINHAS, BaseSintetica, PosicaoSintetica as P


def _inserir(engine, criado_em=None):
    with Session(engine) as s:
        for linha in LINHAS:
            extra = {"criado_em": criado_em} if criado_em else {}
            s.add(P(**linha, **extra))
        s.commit()


# --- SKU e Local -----------------------------------------------------------

def test_sku_e_local_voltam_identicos_e_na_mesma_ordem(db):
    _inserir(db.engine)
    with Session(db.engine) as s:
        rows = s.execute(select(P.sku, P.local).order_by(P.sku, P.local)).all()
        assert [tuple(r) for r in rows] == [("0010", "0001"), ("010", "0001"), ("10", "0001")]
        assert all(type(sku) is str and type(loc) is str for sku, loc in rows)

        # Ordem por SQL cru também (collation C.UTF-8 no PG = ordem binária do SQLite).
        raw = s.execute(text("SELECT sku FROM sint_posicao ORDER BY sku")).scalars().all()
        assert raw == ["0010", "010", "10"]

        # Igualdade é de texto: "010" não acha "0010" nem "10".
        assert s.scalars(select(P.sku).where(P.sku == "010")).all() == ["010"]
        assert s.scalars(select(P.local).where(P.local == "0001")).all() == ["0001"] * 3
        assert s.scalars(select(P.sku).where(P.local == "1")).all() == []


# --- Fuso -----------------------------------------------------------------

def test_server_default_now_grava_em_utc(db):
    antes = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)
    _inserir(db.engine)
    with Session(db.engine) as s:
        valores = s.scalars(select(P.criado_em).order_by(P.id)).all()
        if db.name == "postgresql":
            assert s.execute(text("SHOW timezone")).scalar() == "UTC"
    agora = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)
    for v in valores:
        assert isinstance(v, dt.datetime) and v.tzinfo is None
        # SQLite grava CURRENT_TIMESTAMP com resolução de segundo: margem de 1 min.
        assert abs((v - agora).total_seconds()) < 60, (v, agora)
        assert v >= antes.replace(microsecond=0) - dt.timedelta(seconds=1), (v, antes)


# --- Dump canônico ----------------------------------------------------------

def test_dump_distingue_null_zero_e_vazio(db, tmp_path):
    _inserir(db.engine, criado_em=CRIADO_EM_FIXO)
    out = tmp_path / f"dump_{db.name}"
    counts = dump_database(db.engine, BaseSintetica.metadata, out)
    assert counts == {"sint_posicao": 3}

    raw = (out / "sint_posicao.jsonl").read_text(encoding="utf-8")
    linhas = raw.splitlines()
    assert len(linhas) == 3 and raw.endswith("\n")
    recs = [json.loads(x) for x in linhas]

    assert [r["id"] for r in recs] == [1, 2, 3]  # ordenado pela PK
    assert [r["opcional_int"] for r in recs] == [None, 0, 7]
    assert [r["opcional_txt"] for r in recs] == [None, "", "0"]
    assert [type(r["opcional_int"]) for r in recs] == [type(None), int, int]
    assert '"opcional_int":null' in linhas[0] and '"opcional_int":0' in linhas[1]
    assert '"opcional_txt":null' in linhas[0] and '"opcional_txt":""' in linhas[1] and '"opcional_txt":"0"' in linhas[2]

    # Decimal como string em notação fixa, com as casas que o banco devolveu.
    assert [r["qty"] for r in recs] == ["1.2346", "0.1000", "0.0000"]
    assert [r["sku"] for r in recs] == ["0010", "010", "10"]
    assert recs[0]["data_ref"] == "2026-01-31"
    assert recs[0]["criado_em"] == "2026-11-05T12:00:00"
    assert recs[0]["payload_json"] == '{"origem": "sintetico", "n": 1}'
    assert list(recs[0]) == [c.name for c in P.__table__.columns]  # ordem das colunas do MetaData

    # Dump repetido é idêntico byte a byte.
    out2 = tmp_path / f"dump2_{db.name}"
    dump_database(db.engine, BaseSintetica.metadata, out2)
    assert compare_dirs(out, out2).equal


# --- Paridade entre os dois bancos --------------------------------------------

def test_paridade_sqlite_postgresql(sqlite_e_postgresql, tmp_path):
    """Leitura tipada: o mesmo dump nos dois bancos. Leitura crua: o SQLite
    GUARDOU 1.23456 (REAL) e o PostgreSQL guardou 1.2346. O dump cru mostra isso."""
    a, b = sqlite_e_postgresql
    _inserir(a.engine, criado_em=CRIADO_EM_FIXO)
    _inserir(b.engine, criado_em=CRIADO_EM_FIXO)

    ta, tb = tmp_path / "tipado_sqlite", tmp_path / "tipado_pg"
    dump_database(a.engine, BaseSintetica.metadata, ta)
    dump_database(b.engine, BaseSintetica.metadata, tb)
    res = compare_dirs(ta, tb)
    assert res.equal, res.first.describe() if res.first else ""

    ca, cb = tmp_path / "cru_sqlite", tmp_path / "cru_pg"
    dump_database(a.engine, BaseSintetica.metadata, ca, typed=False)
    dump_database(b.engine, BaseSintetica.metadata, cb, typed=False)
    res = compare_dirs(ca, cb)
    assert not res.equal
    by = {(d.key, d.column): (d.value_a, d.value_b) for d in res.divergences}
    assert by[('{"id":1}', "qty")] == ("1.23456", '"1.2346"')
    assert by[('{"id":3}', "qty")] == ("1e-05", '"0.0000"')
