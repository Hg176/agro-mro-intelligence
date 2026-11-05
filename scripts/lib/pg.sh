# shellcheck shell=bash
# Funções comuns dos scripts de banco. Use com: source "$(dirname "$0")/lib/pg.sh"
#
# Como os comandos chegam ao Postgres:
#   - padrão: "docker exec" no container do serviço postgres
#     (local: descoberto pelo compose; CI: PG_CONTAINER=<id do service container>).
#     Assim psql/pg_dump/pg_restore têm sempre a mesma versão do servidor e o
#     Hugo não precisa instalar cliente Postgres no Windows.
#   - PG_MODE=local: usa psql/pg_dump do PATH, com PGHOST/PGPORT.
#
# Senhas: lidas do ambiente; o que faltar é lido do .env da raiz (sem eval).

set -euo pipefail

# Git Bash (MSYS) converte argumentos que parecem caminho ("/tmp", "/var/...")
# em caminhos do Windows antes de chegar ao docker. Desliga isso.
export MSYS_NO_PATHCONV=1
export MSYS2_ARG_CONV_EXCL='*'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# Caminho que o docker.exe entende: no Git Bash, "E:/..." (pwd -W); no Linux, o mesmo.
REPO_ROOT_NATIVE="$(cd "$REPO_ROOT" && { pwd -W 2>/dev/null || pwd; })"
COMPOSE_FILE="${COMPOSE_FILE_DEV:-$REPO_ROOT_NATIVE/infra/docker-compose.dev.yml}"
PG_MODE="${PG_MODE:-docker}"

log()  { printf '%s\n' "$*" >&2; }
die()  { printf 'ERRO: %s\n' "$*" >&2; exit 1; }

# Carrega KEY=VALUE do .env sem sobrescrever o que já está no ambiente.
load_env_file() {
  local file="$REPO_ROOT/.env" line key val
  [ -f "$file" ] || return 0
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    case "$line" in ''|'#'*) continue ;; esac
    [[ "$line" == *=* ]] || continue
    key="${line%%=*}"; val="${line#*=}"
    key="${key//[[:space:]]/}"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    if [[ "$val" =~ ^\"(.*)\"$ ]] || [[ "$val" =~ ^\'(.*)\'$ ]]; then val="${BASH_REMATCH[1]}"; fi
    if [ -z "${!key+x}" ]; then export "$key=$val"; fi
  done < "$file"
}
load_env_file

PG_SUPERUSER="${POSTGRES_USER:-postgres}"

password_for() {
  case "$1" in
    "$PG_SUPERUSER") printf '%s' "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD não definida}" ;;
    agro_owner)      printf '%s' "${AGRO_OWNER_PASSWORD:?AGRO_OWNER_PASSWORD não definida}" ;;
    agro_app)        printf '%s' "${AGRO_APP_PASSWORD:?AGRO_APP_PASSWORD não definida}" ;;
    *) die "papel desconhecido: $1" ;;
  esac
}

pg_container() {
  if [ -n "${PG_CONTAINER:-}" ]; then printf '%s' "$PG_CONTAINER"; return; fi
  local id
  id="$(docker compose -f "$COMPOSE_FILE" ps -q postgres 2>/dev/null || true)"
  [ -n "$id" ] || die "container do postgres não encontrado. Rode: docker compose -f infra/docker-compose.dev.yml up -d"
  printf '%s' "$id"
}

# pg_tool <papel> <programa> [args...]  -> roda psql/pg_dump/pg_restore como <papel>.
# stdin e stdout passam direto (binário seguro: docker exec -i sem -t).
pg_tool() {
  local role="$1" prog="$2"; shift 2
  local pw; pw="$(password_for "$role")"
  if [ "$PG_MODE" = "local" ]; then
    PGPASSWORD="$pw" "$prog" -h "${PGHOST:-127.0.0.1}" -p "${PGPORT:-${POSTGRES_PORT:-5432}}" -U "$role" "$@"
  else
    # -e PGPASSWORD sem valor: o docker copia do ambiente; a senha não vai na linha de comando.
    PGPASSWORD="$pw" docker exec -i -e PGPASSWORD "$(pg_container)" \
      "$prog" -h 127.0.0.1 -p 5432 -U "$role" "$@"
  fi
}

# psql_as <papel> <banco> [args...] -> psql com ON_ERROR_STOP, sem psqlrc.
psql_as() {
  local role="$1" db="$2"; shift 2
  pg_tool "$role" psql -X -q --no-psqlrc -v ON_ERROR_STOP=1 -d "$db" "$@"
}

# psql_val <papel> <banco> <sql> -> uma linha, sem cabeçalho, separador "|".
psql_val() {
  local role="$1" db="$2" sql="$3"
  psql_as "$role" "$db" -At -F '|' -c "$sql"
}
