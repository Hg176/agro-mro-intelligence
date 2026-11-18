"""Tipos de coluna comuns.

Quantidade e dinheiro são ``Numeric`` (Decimal no Python), nunca Float.
Hora é ``DateTime(timezone=True)`` (timestamptz), gravada em UTC.
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import DateTime, Numeric

# Mesma precisão do protótipo (NUMERIC(18,4) para quantidades e preços).
Quantidade = Numeric(18, 4, asdecimal=True)

# Fração de 0 a 1 com 4 casas (ex.: nível de serviço 0.9500), como no protótipo.
Percentual = Numeric(5, 4, asdecimal=True)

# timestamptz. O valor lido volta com tzinfo; a sessão está em UTC.
DataHoraUTC = DateTime(timezone=True)


def utcnow() -> datetime:
    """Agora, em UTC, com fuso (nunca datetime ingênuo)."""
    return datetime.now(UTC)
