"""Carrega um MetaData a partir de "pacote.modulo:atributo" (CLI)."""

from __future__ import annotations

import importlib

from sqlalchemy import MetaData


def load_metadata(spec: str) -> MetaData:
    """``spec`` = "pacote.modulo:atributo". O atributo pode ser um MetaData ou
    uma classe/objeto com ``.metadata`` (DeclarativeBase, registry)."""
    if ":" not in spec:
        raise ValueError(f"use 'pacote.modulo:atributo', recebido {spec!r}")
    mod_name, attr = spec.split(":", 1)
    obj = importlib.import_module(mod_name)
    for part in attr.split("."):
        obj = getattr(obj, part)
    if isinstance(obj, MetaData):
        return obj
    md = getattr(obj, "metadata", None)
    if isinstance(md, MetaData):
        return md
    raise TypeError(f"{spec!r} não é um MetaData nem tem .metadata")
