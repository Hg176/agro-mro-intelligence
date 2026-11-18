#!/usr/bin/env bash
# Testes do backend (pytest backend/tests) no PostgreSQL agro_mro_test local.
# Funciona no Git Bash do Windows e no Linux. Sem sudo.
#
#   docker compose -f infra/docker-compose.dev.yml up -d
#   bash scripts/test_backend.sh                  # todos os testes
#   bash scripts/test_backend.sh -k health        # argumentos extras vão para o pytest
#
# O que faz:
#   1. cria o .venv (Python 3.12) se não existir e instala backend/requirements-dev.txt
#      quando faltar ou quando os requirements mudarem (carimbo em .venv/);
#   2. confere que o container do Postgres está "healthy";
#   3. monta TEST_DATABASE_URL (agro_app) e TEST_DATABASE_URL_MIGRATIONS (agro_owner)
#      a partir das senhas do .env, se ainda não estiverem no ambiente;
#   4. roda o pytest com junit e falha se algum teste foi pulado.
# Saída: reports/junit-backend.xml
set -euo pipefail
source "$(dirname "$0")/lib/pg.sh"
cd "$REPO_ROOT"

# --- 1. venv -------------------------------------------------------------------------
if [ -x .venv/Scripts/python.exe ]; then PY=.venv/Scripts/python.exe
elif [ -x .venv/bin/python ]; then PY=.venv/bin/python
else
  log "criando .venv (Python 3.12)"
  if command -v py >/dev/null 2>&1; then py -3.12 -m venv .venv
  elif command -v python3.12 >/dev/null 2>&1; then python3.12 -m venv .venv
  else python3 -m venv .venv
  fi
  if [ -x .venv/Scripts/python.exe ]; then PY=.venv/Scripts/python.exe; else PY=.venv/bin/python; fi
fi
"$PY" -c 'import sys; sys.exit(0 if sys.version_info[:2] == (3, 12) else 1)' \
  || die ".venv não é Python 3.12 ($("$PY" --version 2>&1)). Apague o .venv e rode de novo."

STAMP=.venv/.backend-requirements.sha256
WANT="$(cat backend/requirements.txt backend/requirements-dev.txt | sha256sum | awk '{print $1}')"
if [ "$(cat "$STAMP" 2>/dev/null || true)" != "$WANT" ]; then
  log "instalando backend/requirements-dev.txt no .venv"
  "$PY" -m pip install -q --disable-pip-version-check -r backend/requirements-dev.txt
  printf '%s\n' "$WANT" > "$STAMP"
fi

# --- 2. Postgres healthy -------------------------------------------------------------
# PG_MODE=local (Postgres fora do Docker): não há container para conferir.
if [ "$PG_MODE" = "docker" ]; then
  CTR="$(pg_container)"
  STATUS="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}sem-healthcheck{{end}}' "$CTR")"
  [ "$STATUS" = "healthy" ] || die "Postgres não está healthy (estado: $STATUS). Veja docs/operacao/postgres-local.md"
  log "postgres: healthy"
fi

# --- 3. URLs de teste ----------------------------------------------------------------
# A senha é codificada dentro do Python e não aparece na linha de comando.
enc() { "$PY" -c 'import os,sys,urllib.parse as u; print(u.quote(os.environ[sys.argv[1]], safe=""))' "$1"; }
PORT="${POSTGRES_PORT:-55432}"
if [ -z "${TEST_DATABASE_URL:-}" ]; then
  : "${AGRO_APP_PASSWORD:?AGRO_APP_PASSWORD não definida (veja .env.example)}"
  TEST_DATABASE_URL="postgresql+psycopg://agro_app:$(enc AGRO_APP_PASSWORD)@127.0.0.1:${PORT}/agro_mro_test"
  export TEST_DATABASE_URL
fi
if [ -z "${TEST_DATABASE_URL_MIGRATIONS:-}" ]; then
  : "${AGRO_OWNER_PASSWORD:?AGRO_OWNER_PASSWORD não definida (veja .env.example)}"
  TEST_DATABASE_URL_MIGRATIONS="postgresql+psycopg://agro_owner:$(enc AGRO_OWNER_PASSWORD)@127.0.0.1:${PORT}/agro_mro_test"
  export TEST_DATABASE_URL_MIGRATIONS
fi
# O pytest não precisa das senhas soltas nem das URLs de desenvolvimento.
unset AGRO_APP_PASSWORD AGRO_OWNER_PASSWORD POSTGRES_PASSWORD DATABASE_URL DATABASE_URL_MIGRATIONS

# --- 4. pytest -----------------------------------------------------------------------
mkdir -p reports
rc=0
"$PY" -m pytest backend/tests --junitxml=reports/junit-backend.xml "$@" || rc=$?
"$PY" scripts/check_no_pg_skips.py --todos reports/junit-backend.xml || rc=1
exit "$rc"
