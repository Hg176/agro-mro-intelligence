#!/usr/bin/env bash
# Ensaio de restauração: backup -> restaura em agro_mro_restore_check ->
# compara contagem de linhas (e hash do conteúdo) por tabela -> apaga o banco de prova.
#
#   scripts/db_restore_drill.sh              # ensaia agro_mro
#   scripts/db_restore_drill.sh agro_mro_test
#   DRILL_SEED=1 scripts/db_restore_drill.sh # cria antes uma tabela SINTÉTICA de prova
#                                            # na origem (apagada no fim), útil enquanto
#                                            # o banco ainda não tem tabelas do produto
#   KEEP_DUMP=1  ...                         # não apaga o .dump gerado em backups/
#
# Sai com código != 0 se alguma tabela divergir ou se a origem não tiver tabela.
set -euo pipefail
SCRIPTS="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPTS/lib/pg.sh"

SRC="${1:-agro_mro}"
TARGET="agro_mro_restore_check"
SEED_TABLE="_drill_seed_sintetico"
SEEDED=0
DUMP=""

cleanup() {
  local s=$?
  psql_as "$PG_SUPERUSER" postgres -c "DROP DATABASE IF EXISTS \"$TARGET\" WITH (FORCE)" >/dev/null 2>&1 \
    && log "drill: banco de prova $TARGET apagado" || log "drill: AVISO: não consegui apagar $TARGET"
  if [ "$SEEDED" = "1" ]; then
    psql_as agro_owner "$SRC" -c "DROP TABLE IF EXISTS public.$SEED_TABLE" >/dev/null 2>&1 || true
    log "drill: tabela sintética $SEED_TABLE removida da origem"
  fi
  if [ -n "$DUMP" ] && [ "${KEEP_DUMP:-0}" != "1" ]; then rm -f "$DUMP"; fi
  exit $s
}
trap cleanup EXIT

# Contagem e hash por tabela (todas as tabelas fora dos schemas de sistema).
# O hash ordena as linhas pelo texto, então não depende da ordem física.
read -r -d '' COUNT_SQL <<'SQL' || true
SELECT format('%I.%I', n.nspname, c.relname),
       (xpath('/row/n/text()', query_to_xml(
          format('SELECT count(*) AS n FROM %I.%I', n.nspname, c.relname), false, true, '')))[1]::text,
       (xpath('/row/h/text()', query_to_xml(
          format('SELECT md5(coalesce(string_agg(t::text, E''\n'' ORDER BY t::text), '''')) AS h FROM %I.%I t',
                 n.nspname, c.relname), false, true, '')))[1]::text
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE c.relkind IN ('r', 'p')
   AND n.nspname NOT IN ('pg_catalog', 'information_schema')
   AND n.nspname NOT LIKE 'pg\_toast%'
 ORDER BY 1;
SQL

counts() { psql_as "$PG_SUPERUSER" "$1" -At -F '|' -c "$COUNT_SQL" | tr -d '\r'; }

if [ "${DRILL_SEED:-0}" = "1" ]; then
  log "drill: criando tabela sintética $SEED_TABLE em $SRC"
  psql_as agro_owner "$SRC" >/dev/null <<SQL
SET client_min_messages = warning;
DROP TABLE IF EXISTS public.$SEED_TABLE;
CREATE TABLE public.$SEED_TABLE (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sku text NOT NULL, local text NOT NULL,
  qty numeric(18,4), obs text, criado_em timestamp NOT NULL DEFAULT now());
INSERT INTO public.$SEED_TABLE (sku, local, qty, obs)
SELECT CASE g % 3 WHEN 0 THEN '0010' WHEN 1 THEN '010' ELSE lpad(g::text, 5, '0') END,
       '0001',
       CASE g % 4 WHEN 0 THEN NULL WHEN 1 THEN 0 WHEN 2 THEN 1.23456 ELSE g * 0.0001 END,
       CASE g % 3 WHEN 0 THEN NULL WHEN 1 THEN '' ELSE 'linha ' || g END
  FROM generate_series(1, 1000) g;
SQL
  SEEDED=1
fi

BEFORE="$(counts "$SRC")"
[ -n "$BEFORE" ] || die "a origem $SRC não tem nenhuma tabela: o ensaio não provaria nada (use DRILL_SEED=1)"

DUMP="$("$SCRIPTS/db_backup.sh" "$SRC" | tail -1)"
DROP_EXISTING=1 "$SCRIPTS/db_restore.sh" "$DUMP" "$TARGET"
AFTER="$(counts "$TARGET")"

echo
printf '%-45s %12s %12s  %s\n' "tabela" "origem" "restaurado" "conteúdo"
FAILS=0
while IFS='|' read -r t n h; do
  line_after="$(grep -F -- "$t|" <<<"$AFTER" | head -1 || true)"
  IFS='|' read -r _ n2 h2 <<<"$line_after"
  status="igual"
  if [ -z "$line_after" ]; then status="AUSENTE no restaurado"; n2="-"; FAILS=$((FAILS+1))
  elif [ "$n" != "$n2" ]; then status="CONTAGEM DIVERGENTE"; FAILS=$((FAILS+1))
  elif [ "$h" != "$h2" ]; then status="HASH DIVERGENTE"; FAILS=$((FAILS+1)); fi
  printf '%-45s %12s %12s  %s\n' "$t" "$n" "$n2" "$status"
done <<<"$BEFORE"

extra="$(comm -13 <(cut -d'|' -f1 <<<"$BEFORE" | sort) <(cut -d'|' -f1 <<<"$AFTER" | sort) || true)"
if [ -n "$extra" ]; then echo "tabelas só no restaurado: $extra"; FAILS=$((FAILS+1)); fi

echo
if [ "$FAILS" -eq 0 ]; then
  echo "drill: OK, $(wc -l <<<"$BEFORE" | tr -d ' ') tabela(s) com contagem e conteúdo iguais."
else
  echo "drill: FALHOU, $FAILS divergência(s)."
  exit 1
fi
