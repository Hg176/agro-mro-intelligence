#!/usr/bin/env bash
# Confere tools/db_parity/ORACLE_MANIFEST.sha256 com sha256sum -c.
# Ignora comentários (#) e linhas vazias. Falha se algum arquivo listado
# mudou ou sumiu. Manifesto sem entradas: passa, avisando que está vazio.
#
#   scripts/check_oracle_manifest.sh [manifesto]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="${1:-$ROOT/tools/db_parity/ORACLE_MANIFEST.sha256}"
[ -f "$MANIFEST" ] || { echo "ERRO: manifesto não encontrado: $MANIFEST" >&2; exit 1; }

ENTRIES="$(tr -d '\r' < "$MANIFEST" | grep -Ev '^[[:space:]]*(#|$)' || true)"
if [ -z "$ENTRIES" ]; then
  echo "manifesto de oráculos: sem entradas (será preenchido no B1). OK."
  exit 0
fi

cd "$ROOT"
n="$(wc -l <<<"$ENTRIES" | tr -d ' ')"
echo "manifesto de oráculos: conferindo $n arquivo(s)"
# --strict: linha mal formatada também é falha.
sha256sum --strict -c - <<<"$ENTRIES"
