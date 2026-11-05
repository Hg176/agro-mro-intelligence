#!/usr/bin/env bash
# Papéis e bancos do Agro MRO Intelligence.
#
# Roda de dois jeitos, com o MESMO conteúdo:
#   1) automático, pelo entrypoint do postgres, na primeira subida (volume vazio);
#   2) no CI, por "docker exec -i <container> bash -s < 01-roles.sh".
# É idempotente: rodar de novo só reaplica senhas, atributos e privilégios.
#
# Nenhuma senha aqui. Variáveis exigidas (vêm do .env / ambiente do CI):
#   POSTGRES_USER        superusuário do cluster (padrão: postgres)
#   AGRO_OWNER_PASSWORD  senha do agro_owner
#   AGRO_APP_PASSWORD    senha do agro_app
#
# Papéis:
#   agro_owner  LOGIN; dono dos bancos e do schema public (migrações).
#   agro_app    LOGIN, NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE;
#               não é dono de nada; recebe DML por DEFAULT PRIVILEGES.
set -euo pipefail

: "${AGRO_OWNER_PASSWORD:?AGRO_OWNER_PASSWORD não definida (veja .env.example)}"
: "${AGRO_APP_PASSWORD:?AGRO_APP_PASSWORD não definida (veja .env.example)}"
SUPERUSER="${POSTGRES_USER:-postgres}"

for v in AGRO_OWNER_PASSWORD AGRO_APP_PASSWORD; do
  if [ "${!v}" = "troque-me" ]; then
    echo "AVISO: $v ainda é o placeholder 'troque-me'. Aceitável só em máquina local." >&2
  fi
done

DATABASES=(agro_mro agro_mro_test)

psql_su() {
  # Sem -h: usa o socket local (init) ou PGHOST/PGPORT se definidos.
  psql -v ON_ERROR_STOP=1 -X -q --no-psqlrc --username "$SUPERUSER" --no-password "$@"
}

echo "01-roles: papéis agro_owner e agro_app"
psql_su --dbname postgres \
  -v owner_pw="$AGRO_OWNER_PASSWORD" \
  -v app_pw="$AGRO_APP_PASSWORD" <<'SQL'
SELECT 'CREATE ROLE agro_owner'
 WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'agro_owner') \gexec
ALTER ROLE agro_owner WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
  NOREPLICATION NOBYPASSRLS INHERIT PASSWORD :'owner_pw';
ALTER ROLE agro_owner SET timezone = 'UTC';

SELECT 'CREATE ROLE agro_app'
 WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'agro_app') \gexec
ALTER ROLE agro_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
  NOREPLICATION NOBYPASSRLS INHERIT PASSWORD :'app_pw';
ALTER ROLE agro_app SET timezone = 'UTC';
SQL

for db in "${DATABASES[@]}"; do
  echo "01-roles: banco $db"
  psql_su --dbname postgres -v db="$db" <<'SQL'
SELECT format(
  'CREATE DATABASE %I OWNER agro_owner TEMPLATE template0 ENCODING %L LC_COLLATE %L LC_CTYPE %L',
  :'db', 'UTF8', 'C.UTF-8', 'C.UTF-8')
 WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db') \gexec
SELECT format('ALTER DATABASE %I OWNER TO agro_owner', :'db') \gexec
SELECT format('ALTER DATABASE %I SET timezone = %L', :'db', 'UTC') \gexec
SELECT format('REVOKE ALL ON DATABASE %I FROM PUBLIC', :'db') \gexec
SELECT format('GRANT CONNECT ON DATABASE %I TO agro_app', :'db') \gexec
SQL

  psql_su --dbname "$db" <<'SQL'
ALTER SCHEMA public OWNER TO agro_owner;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO agro_app;

-- Tudo que o agro_owner criar daqui em diante já nasce com DML para o agro_app.
ALTER DEFAULT PRIVILEGES FOR ROLE agro_owner
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO agro_app;
ALTER DEFAULT PRIVILEGES FOR ROLE agro_owner
  GRANT USAGE, SELECT ON SEQUENCES TO agro_app;

-- Reexecução: objetos que já existam recebem o mesmo privilégio.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO agro_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO agro_app;
SQL
done

echo "01-roles: concluído"
