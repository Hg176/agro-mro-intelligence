#!/usr/bin/env bash
# Backup lógico de um banco do Agro MRO em formato custom (pg_dump -Fc).
#
#   scripts/db_backup.sh                         # agro_mro -> backups/agro_mro_<UTC>.dump
#   scripts/db_backup.sh agro_mro caminho.dump   # banco e destino explícitos
#
# Roda como agro_owner (dono de tudo nos bancos do produto). O pg_dump executa
# DENTRO do container do Postgres, então a versão do cliente é a do servidor.
# Imprime o caminho do arquivo gerado na última linha da saída (stdout).
# backups/ está no .gitignore: um dump pode conter dado de cliente.
set -euo pipefail
source "$(dirname "$0")/lib/pg.sh"

DB="${1:-agro_mro}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${2:-$REPO_ROOT/backups/${DB}_${STAMP}.dump}"
mkdir -p "$(dirname "$OUT")"

TMP="$OUT.partial"
trap 'rm -f "$TMP"' EXIT

log "backup: $DB -> $OUT"
pg_tool agro_owner pg_dump -Fc --no-password -d "$DB" > "$TMP"

# Confere que o arquivo é um dump custom legível antes de declarar sucesso.
head -c 5 "$TMP" | grep -q '^PGDMP' || die "arquivo gerado não é um dump custom (cabeçalho PGDMP ausente)"
pg_tool agro_owner pg_restore --list < "$TMP" > /dev/null || die "pg_restore --list não conseguiu ler o dump"

mv "$TMP" "$OUT"
trap - EXIT
log "backup: ok ($(wc -c < "$OUT" | tr -d ' ') bytes)"
printf '%s\n' "$OUT"
