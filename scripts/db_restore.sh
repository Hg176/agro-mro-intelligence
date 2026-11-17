#!/usr/bin/env bash
# Restaura um dump (-Fc) num banco DESCARTÁVEL. Nunca sobre agro_mro nem agro_mro_test.
#
#   scripts/db_restore.sh backups/agro_mro_20261105T120000Z.dump            # -> agro_mro_restore_check
#   scripts/db_restore.sh backups/x.dump agro_mro_restore_check
#
# Regras de segurança:
#   - o banco de destino tem de terminar em "_restore_check";
#   - se o destino já existir, o script recusa (use DROP_EXISTING=1 para recriar).
# Cria o destino com dono agro_owner, UTF8 e C.UTF-8, e roda pg_restore como
# superusuário com --exit-on-error (qualquer erro aborta).
set -euo pipefail
source "$(dirname "$0")/lib/pg.sh"

DUMP="${1:?uso: db_restore.sh <arquivo.dump> [banco_destino_restore_check]}"
TARGET="${2:-agro_mro_restore_check}"

[ -f "$DUMP" ] || die "dump não encontrado: $DUMP"
[[ "$TARGET" =~ ^[a-z][a-z0-9_]*_restore_check$ ]] \
  || die "destino '$TARGET' recusado: o nome tem de terminar em _restore_check (banco descartável)"

exists="$(psql_val "$PG_SUPERUSER" postgres "SELECT count(*) FROM pg_database WHERE datname = '$TARGET'" | tr -d '\r')"
if [ "$exists" != "0" ]; then
  [ "${DROP_EXISTING:-0}" = "1" ] || die "banco $TARGET já existe (use DROP_EXISTING=1 para recriar)"
  log "restore: apagando $TARGET existente"
  psql_as "$PG_SUPERUSER" postgres -c "DROP DATABASE \"$TARGET\" WITH (FORCE)" >/dev/null
fi

log "restore: criando $TARGET"
psql_as "$PG_SUPERUSER" postgres -c \
  "CREATE DATABASE \"$TARGET\" OWNER agro_owner TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C.UTF-8' LC_CTYPE 'C.UTF-8'" >/dev/null

log "restore: $DUMP -> $TARGET"
pg_tool "$PG_SUPERUSER" pg_restore --no-password --exit-on-error -d "$TARGET" < "$DUMP"
log "restore: ok"
