from __future__ import annotations

import inspect
import json

import pytest

from tools.db_parity import compare
from tools.db_parity.compare import compare_dirs, main


def _write(d, name, lines, schema=True):
    d.mkdir(parents=True, exist_ok=True)
    (d / name).write_text("".join(json.dumps(x, separators=(",", ":")) + "\n" for x in lines), encoding="utf-8")
    if schema:
        (d / "_schema.json").write_text(
            json.dumps({"tables": {"t": {"columns": ["id", "qty"], "primary_key": ["id"], "order_by": ["id"]}}}),
            encoding="utf-8",
        )


def test_iguais(tmp_path):
    rows = [{"id": 1, "qty": "1.2346"}, {"id": 2, "qty": "0.1000"}]
    _write(tmp_path / "a", "t.jsonl", rows)
    _write(tmp_path / "b", "t.jsonl", rows)
    res = compare_dirs(tmp_path / "a", tmp_path / "b")
    assert res.equal and res.total == 0
    assert main([str(tmp_path / "a"), str(tmp_path / "b")]) == 0


def test_acusa_diferenca_na_quarta_casa_decimal(tmp_path, capsys):
    _write(tmp_path / "a", "t.jsonl", [{"id": 1, "qty": "1.2346"}, {"id": 2, "qty": "0.1000"}])
    _write(tmp_path / "b", "t.jsonl", [{"id": 1, "qty": "1.2347"}, {"id": 2, "qty": "0.1000"}])
    res = compare_dirs(tmp_path / "a", tmp_path / "b")
    assert not res.equal
    assert res.total == 1
    d = res.first
    assert (d.file, d.key, d.column, d.value_a, d.value_b) == ("t.jsonl", '{"id":1}', "qty", '"1.2346"', '"1.2347"')

    assert main([str(tmp_path / "a"), str(tmp_path / "b")]) == 1
    out = capsys.readouterr().out
    assert "PRIMEIRA DIVERGÊNCIA" in out and "1.2346" in out and "1.2347" in out and "TOTAL: 1" in out


def test_zero_a_direita_tambem_e_diferenca(tmp_path):
    # "0.1" e "0.1000" têm o mesmo valor numérico, mas não os mesmos bytes: é divergência.
    _write(tmp_path / "a", "t.jsonl", [{"id": 1, "qty": "0.1000"}])
    _write(tmp_path / "b", "t.jsonl", [{"id": 1, "qty": "0.1"}])
    assert compare_dirs(tmp_path / "a", tmp_path / "b").total == 1


def test_null_zero_e_vazio_sao_diferentes(tmp_path):
    for a_val, b_val in [(None, 0), (None, ""), (0, ""), (0, "0"), (0, False)]:
        _write(tmp_path / "a", "t.jsonl", [{"id": 1, "qty": a_val}])
        _write(tmp_path / "b", "t.jsonl", [{"id": 1, "qty": b_val}])
        assert compare_dirs(tmp_path / "a", tmp_path / "b").total == 1, (a_val, b_val)


def test_registro_e_arquivo_ausentes(tmp_path):
    _write(tmp_path / "a", "t.jsonl", [{"id": 1, "qty": "1"}, {"id": 2, "qty": "2"}])
    _write(tmp_path / "b", "t.jsonl", [{"id": 1, "qty": "1"}])
    _write(tmp_path / "a", "u.jsonl", [], schema=False)
    res = compare_dirs(tmp_path / "a", tmp_path / "b")
    kinds = sorted(d.kind for d in res.divergences)
    assert kinds == ["arquivo só em A", "registro só em A"]


def test_ordem_diferente_e_divergencia(tmp_path):
    rows = [{"id": 1, "qty": "1"}, {"id": 2, "qty": "2"}]
    _write(tmp_path / "a", "t.jsonl", rows)
    _write(tmp_path / "b", "t.jsonl", list(reversed(rows)))
    res = compare_dirs(tmp_path / "a", tmp_path / "b")
    assert res.total == 1 and res.first.kind == "ordem diferente"


def test_nao_existe_opcao_de_tolerancia(tmp_path):
    _write(tmp_path / "a", "t.jsonl", [{"id": 1, "qty": "1"}])
    _write(tmp_path / "b", "t.jsonl", [{"id": 1, "qty": "1"}])
    for flag in ("--tolerance", "--tolerancia", "--rtol", "--atol", "--epsilon"):
        with pytest.raises(SystemExit) as exc:
            main([str(tmp_path / "a"), str(tmp_path / "b"), flag, "0.001"])
        assert exc.value.code == 2
    params = set(inspect.signature(compare_dirs).parameters)
    assert params == {"dir_a", "dir_b"}
    src = inspect.getsource(compare).lower()
    for word in ("isclose", "rtol", "atol", "epsilon", "round("):
        assert word not in src, word
