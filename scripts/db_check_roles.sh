#!/usr/bin/env bash
# Confere papéis, privilégios, fuso e collation do Postgres do Agro MRO.
# Sai com código != 0 se qualquer verificação falhar.
#
#   scripts/db_check_roles.sh                  # agro_mro e agro_mro_test
#   CHECK_DBS="agro_mro_test" scripts/db_check_roles.sh
#
# (a) agro_app existe, não é superuser, sem BYPASSRLS, sem CREATEDB (e sem CREATEROLE)
# (b) agro_app não é dono de banco, schema, tabela, sequência, view nem função
# (c) tabela de prova criada pelo agro_owner: agro_app faz INSERT/SELECT/UPDATE/DELETE
#     (prova do DEFAULT PRIVILEGES, inclusive da sequência) e NÃO faz DROP, ALTER
#     nem CREATE TABLE
# (d) SHOW timezone = UTC na conexão do agro_app
# (e) collation e ctype do banco = C.UTF-8, encoding UTF8
# A tabela de prova é apagada no fim, mesmo se algo falhar.
set -euo pipefail
source "$(dirname "$0")/lib/pg.sh"

DBS="${CHECK_DBS:-agro_mro agro_mro_test}"
PROBE="_db_check_prova_privilegios"
FAILS=0
PASSES=0

ok()   { PASSES=$((PASSES + 1)); printf '  [ok]    %s\n' "$*"; }
fail() { FAILS=$((FAILS + 1));   printf '  [FALHA] %s\n' "$*"; }

expect_eq() { # descrição, obtido, esperado
  if [ "$2" = "$3" ]; then ok "$1 = $2"; else fail "$1: obtido '$2', esperado '$3'"; fi
}

# Executa como agro_app e exige que FALHE por falta de privilégio.
expect_denied() { # descrição, banco, sql
  local out status=0
  out="$(psql_as agro_app "$2" -c "$3" 2>&1)" || status=$?
  if [ "$status" -ne 0 ] && grep -Eqi 'permission denied|must be owner|permissão negada|deve ser o dono' <<<"$out"; then
    ok "$1 negado ($(grep -Eoi 'permission denied[^"]*|must be owner[^"]*' <<<"$out" | head -1))"
  elif [ "$status" -eq 0 ]; then
    fail "$1: o agro_app CONSEGUIU (deveria ser negado)"
  else
    fail "$1: falhou por outro motivo: $(tr '\n' ' ' <<<"$out")"
  fi
}

# Executa como agro_app e exige sucesso; devolve a saída.
expect_allowed() { # descrição, banco, sql, saída esperada
  local out status=0
  out="$(psql_as agro_app "$2" -At -c "$3" 2>&1)" || status=$?
  out="$(tr -d '\r' <<<"$out")"
  if [ "$status" -eq 0 ] && [ "$out" = "$4" ]; then ok "$1 -> $out"
  else fail "$1: status $status, saída '$(tr '\n' ' ' <<<"$out")', esperado '$4'"; fi
}

cleanup() {
  for db in $DBS; do
    psql_as agro_owner "$db" -c "DROP TABLE IF EXISTS public.$PROBE" >/dev/null 2>&1 || true
  done
}
trap cleanup EXIT

echo "== Papel agro_app (cluster)"
row="$(psql_val "$PG_SUPERUSER" postgres \
  "SELECT rolcanlogin, rolsuper, rolbypassrls, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname = 'agro_app'" | tr -d '\r')"
if [ -z "$row" ]; then
  fail "(a) agro_app não existe"
else
  IFS='|' read -r login super bypass createdb createrole <<<"$row"
  expect_eq "(a) agro_app LOGIN" "$login" "t"
  expect_eq "(a) agro_app SUPERUSER" "$super" "f"
  expect_eq "(a) agro_app BYPASSRLS" "$bypass" "f"
  expect_eq "(a) agro_app CREATEDB" "$createdb" "f"
  expect_eq "(a) agro_app CREATEROLE" "$createrole" "f"
fi
owner_login="$(psql_val "$PG_SUPERUSER" postgres "SELECT rolcanlogin FROM pg_roles WHERE rolname = 'agro_owner'" | tr -d '\r')"
expect_eq "agro_owner existe com LOGIN" "$owner_login" "t"
dbs_app="$(psql_val "$PG_SUPERUSER" postgres \
  "SELECT count(*) FROM pg_database WHERE datdba = 'agro_app'::regrole" | tr -d '\r')"
expect_eq "(b) bancos cujo dono é agro_app" "$dbs_app" "0"

for db in $DBS; do
  echo "== Banco $db"

  dbowner="$(psql_val "$PG_SUPERUSER" postgres "SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = '$db'" | tr -d '\r')"
  expect_eq "dono do banco" "$dbowner" "agro_owner"
  schowner="$(psql_val "$PG_SUPERUSER" "$db" "SELECT pg_get_userbyid(nspowner) FROM pg_namespace WHERE nspname = 'public'" | tr -d '\r')"
  expect_eq "dono do schema public" "$schowner" "agro_owner"
  pubcreate="$(psql_val "$PG_SUPERUSER" "$db" "SELECT has_schema_privilege('public', 'public', 'CREATE')" | tr -d '\r')"
  expect_eq "PUBLIC tem CREATE em public" "$pubcreate" "f"

  owned="$(psql_val "$PG_SUPERUSER" "$db" "
    SELECT (SELECT count(*) FROM pg_class     WHERE relowner = 'agro_app'::regrole)
         + (SELECT count(*) FROM pg_namespace WHERE nspowner = 'agro_app'::regrole)
         + (SELECT count(*) FROM pg_proc      WHERE proowner = 'agro_app'::regrole)
         + (SELECT count(*) FROM pg_type      WHERE typowner = 'agro_app'::regrole)" | tr -d '\r')"
  expect_eq "(b) objetos (tabela/sequência/view/schema/função/tipo) cujo dono é agro_app" "$owned" "0"

  # (c) prova do DEFAULT PRIVILEGES: a tabela nasce do agro_owner, sem GRANT explícito.
  psql_as agro_owner "$db" -c "SET client_min_messages = warning; DROP TABLE IF EXISTS public.$PROBE" >/dev/null
  psql_as agro_owner "$db" -c "CREATE TABLE public.$PROBE (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, sku text NOT NULL)" >/dev/null
  probeowner="$(psql_val "$PG_SUPERUSER" "$db" "SELECT pg_get_userbyid(relowner) FROM pg_class WHERE oid = 'public.$PROBE'::regclass" | tr -d '\r')"
  expect_eq "(c) dono da tabela de prova" "$probeowner" "agro_owner"

  expect_allowed "(c) agro_app INSERT (usa a sequência)" "$db" \
    "INSERT INTO public.$PROBE (sku) VALUES ('0010') RETURNING sku" "0010"
  expect_allowed "(c) agro_app SELECT" "$db" "SELECT sku FROM public.$PROBE" "0010"
  expect_allowed "(c) agro_app UPDATE" "$db" "UPDATE public.$PROBE SET sku = '010' RETURNING sku" "010"
  expect_allowed "(c) agro_app DELETE" "$db" "DELETE FROM public.$PROBE RETURNING sku" "010"
  expect_denied  "(c) agro_app DROP TABLE" "$db" "DROP TABLE public.$PROBE"
  expect_denied  "(c) agro_app ALTER TABLE" "$db" "ALTER TABLE public.$PROBE ADD COLUMN x int"
  expect_denied  "(c) agro_app TRUNCATE" "$db" "TRUNCATE public.$PROBE"
  expect_denied  "(c) agro_app CREATE TABLE" "$db" "CREATE TABLE public._db_check_nao_pode (id int)"
  expect_denied  "(c) agro_app CREATE SCHEMA" "$db" "CREATE SCHEMA _db_check_nao_pode"

  psql_as agro_owner "$db" -c "DROP TABLE public.$PROBE" >/dev/null
  left="$(psql_val "$PG_SUPERUSER" "$db" "SELECT count(*) FROM pg_class WHERE relname LIKE '\_db\_check\_%'" | tr -d '\r')"
  expect_eq "(c) tabela de prova apagada" "$left" "0"

  tz="$(psql_val agro_app "$db" "SHOW timezone" | tr -d '\r')"
  expect_eq "(d) SHOW timezone (agro_app)" "$tz" "UTC"
  now_off="$(psql_val agro_app "$db" "SELECT to_char(now(), 'OF')" | tr -d '\r')"
  expect_eq "(d) deslocamento de now() (agro_app)" "$now_off" "+00"

  IFS='|' read -r coll ctype enc <<<"$(psql_val "$PG_SUPERUSER" postgres \
    "SELECT datcollate, datctype, pg_encoding_to_char(encoding) FROM pg_database WHERE datname = '$db'" | tr -d '\r')"
  expect_eq "(e) collation do banco" "$coll" "C.UTF-8"
  expect_eq "(e) ctype do banco" "$ctype" "C.UTF-8"
  expect_eq "(e) encoding do banco" "$enc" "UTF8"
done

echo
echo "Resultado: $PASSES ok, $FAILS falha(s)."
[ "$FAILS" -eq 0 ] || exit 1
