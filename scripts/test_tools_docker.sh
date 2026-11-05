#!/usr/bin/env bash
# Roda os testes de tools/ num container python:3.12, ligado à rede do compose
# de desenvolvimento (SQLite + PostgreSQL). Não precisa de Python 3.12 no Windows.
#
#   docker compose -f infra/docker-compose.dev.yml up -d
#   scripts/test_tools_docker.sh                 # todos os testes
#   scripts/test_tools_docker.sh -k numeric      # argumentos extras vão para o pytest
#
# Saídas: reports/junit-tools.xml e tools/db_parity/tests/out/numeric_report.md
set -euo pipefail
source "$(dirname "$0")/lib/pg.sh"

: "${AGRO_APP_PASSWORD:?}" "${AGRO_OWNER_PASSWORD:?}"
CTR="$(pg_container)"
NET="$(docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$CTR" | awk '{print $1}')"
[ -n "$NET" ] || die "rede do container do postgres não encontrada"
PY_IMAGE="${PY_IMAGE:-python:3.12-slim}"

mkdir -p "$REPO_ROOT/reports"
# A URL é montada DENTRO do container, com a senha codificada; nada de senha na linha de comando.
AGRO_APP_PASSWORD="$AGRO_APP_PASSWORD" AGRO_OWNER_PASSWORD="$AGRO_OWNER_PASSWORD" \
docker run --rm -i \
  --network "$NET" \
  -e AGRO_APP_PASSWORD -e AGRO_OWNER_PASSWORD \
  -e PIP_DISABLE_PIP_VERSION_CHECK=1 -e PIP_ROOT_USER_ACTION=ignore -e PYTHONDONTWRITEBYTECODE=1 \
  -v "$REPO_ROOT_NATIVE:/repo" -w /repo \
  -v agro-mro-pip-cache:/root/.cache/pip \
  "$PY_IMAGE" bash -s -- "$@" <<'IN_CONTAINER'
set -euo pipefail
pip install -q -r tools/requirements-dev.txt
enc() { python -c 'import os,sys,urllib.parse as u; print(u.quote(os.environ[sys.argv[1]], safe=""))' "$1"; }
export TEST_POSTGRES_URL="postgresql+psycopg://agro_app:$(enc AGRO_APP_PASSWORD)@postgres:5432/agro_mro_test"
export TEST_POSTGRES_OWNER_URL="postgresql+psycopg://agro_owner:$(enc AGRO_OWNER_PASSWORD)@postgres:5432/agro_mro_test"
unset AGRO_APP_PASSWORD AGRO_OWNER_PASSWORD
python -m pytest tools -p no:cacheprovider -rs --junitxml=reports/junit-tools.xml "$@"
python scripts/check_no_pg_skips.py reports/junit-tools.xml
IN_CONTAINER
