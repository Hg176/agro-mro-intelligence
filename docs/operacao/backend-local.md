# Backend local (FastAPI + Alembic + PostgreSQL)

> B1: esqueleto do backend de produção, sem regra de negócio. Python 3.12.
> Pré-requisito: o PostgreSQL local da Fase A no ar e `healthy`
> ([postgres-local.md](postgres-local.md)).
> Comandos para o Git Bash do Windows; no Linux troque `.venv/Scripts/` por `.venv/bin/`.

## 1. Variáveis de ambiente

O backend **só lê o ambiente do processo**, nunca um arquivo por conta própria. As
variáveis ficam no `.env` da raiz (modelo: `.env.example`) e são entregues ao processo
pelo `uvicorn --env-file` ou pelo `dotenv run` (seções 3 e 4).

| Variável | Quem usa | Valor local |
|---|---|---|
| `APP_ENV` | API e Alembic | `dev` (`test` nos testes, `prod` em produção). Obrigatória. |
| `DATABASE_URL` | API | `postgresql+psycopg://agro_app:troque-me@127.0.0.1:55432/agro_mro` |
| `DATABASE_URL_MIGRATIONS` | Alembic | `postgresql+psycopg://agro_owner:troque-me@127.0.0.1:55432/agro_mro` |
| `APP_DISPLAY_TIMEZONE` | API | `America/Cuiaba` (só apresentação; banco e API gravam em UTC) |
| `TEST_DATABASE_URL` | testes | igual a `DATABASE_URL`, mas no banco `agro_mro_test` |
| `TEST_DATABASE_URL_MIGRATIONS` | testes | igual a `DATABASE_URL_MIGRATIONS`, mas no banco `agro_mro_test` |

Regras:

- As URLs **não têm valor padrão**. Faltou uma, o processo não sobe e a mensagem diz
  qual variável falta (`ConfigError: ... variável de ambiente ausente: DATABASE_URL`),
  sem mostrar URL, usuário ou senha.
- Só `postgresql+psycopg://` é aceito. Não existe modo SQLite.
- A API conecta como **agro_app** (só DML). O Alembic conecta como **agro_owner**
  (dono do schema). A API não recebe a senha do dono.
- Senhas só com letras, números, `-` e `_` (vão dentro da URL). A mesma senha aparece
  em `AGRO_APP_PASSWORD` e dentro de `DATABASE_URL`: trocou uma, troque a outra.

## 2. Instalar

```bash
py -3.12 -m venv .venv                                   # se ainda não existir
.venv/Scripts/python.exe -m pip install -r backend/requirements-dev.txt
```

`scripts/test_backend.sh` faz isso sozinho quando falta (seção 5).

## 3. Migrar o banco

O esquema nasce **só pelo Alembic**. A aplicação nunca cria tabela.

```bash
cd backend
../.venv/Scripts/dotenv.exe -f ../.env run -- ../.venv/Scripts/alembic.exe upgrade head
../.venv/Scripts/dotenv.exe -f ../.env run -- ../.venv/Scripts/alembic.exe current    # 0001 (head)
```

Outros comandos úteis (sempre com o mesmo prefixo `dotenv ... run --`):

| Comando | Para quê |
|---|---|
| `alembic history` | lista as revisões |
| `alembic check` | falha se o modelo (`app/models`) e o banco divergirem |
| `alembic upgrade head --sql` | mostra o SQL sem executar |
| `alembic revision --autogenerate -m "..."` | rascunho de migração nova (revise antes de commitar) |

As tabelas criadas pelo `agro_owner` recebem SELECT/INSERT/UPDATE/DELETE para o
`agro_app` pelo `DEFAULT PRIVILEGES` da Fase A. **Migração não faz GRANT.**

## 4. Subir a API

```bash
cd backend
../.venv/Scripts/python.exe -m uvicorn --factory app.main:create_app --env-file ../.env --reload
```

| URL | Resposta esperada |
|---|---|
| `http://127.0.0.1:8000/api/v1/health` | `200 {"status":"ok"}` (não toca no banco) |
| `http://127.0.0.1:8000/api/v1/health/db` | `200 {"status":"ok","schema":"0001"}` |
| `http://127.0.0.1:8000/api/v1/docs` | documentação interativa (desligada com `APP_ENV=prod`) |

## 5. Rodar os testes

```bash
bash scripts/test_backend.sh              # todos
bash scripts/test_backend.sh -k health    # argumentos extras vão para o pytest
```

O script cria o `.venv` e instala `backend/requirements-dev.txt` se faltar, confere que
o container do Postgres está `healthy`, monta `TEST_DATABASE_URL*` a partir das senhas
do `.env` (se ainda não estiverem definidas) e roda `pytest backend/tests`. Saída em
`reports/junit-backend.xml`.

- Os testes rodam **só** em `agro_mro_test` (a trava `assert_safe_test_database` recusa
  qualquer banco que não termine em `_test` ou que não seja local).
- A sessão começa com `alembic downgrade base` + `upgrade head` como `agro_owner`. Antes de
  cada teste, `TRUNCATE ... RESTART IDENTITY CASCADE` em todas as tabelas menos
  `alembic_version`. O banco de desenvolvimento `agro_mro` não é tocado.
- **Teste pulado é falha**: o conftest marca a sessão como falha e
  `scripts/check_no_pg_skips.py --todos` confere o junit.
- No Windows o teste de "banco fora do ar" leva cerca de 5 s (o `connect_timeout`); no
  Linux, menos de 1 s.

## 6. `/api/v1/health/db` respondeu 503

A resposta diz o motivo, sem dado de conexão. O log da API traz o detalhe (tipo da
exceção, revisão do banco e do código).

### `{"status":"schema_out_of_date"}`

A revisão gravada no banco (`alembic_version`) é diferente do head do código, ou a
tabela `alembic_version` não existe (banco nunca migrado).

1. Veja onde o banco está: `alembic current` (seção 3).
2. Veja o head do código: `alembic heads`.
3. Banco **atrás** do código (caso comum depois de `git pull`): `alembic upgrade head`.
4. Banco **à frente** do código ou com revisão desconhecida (você está numa branch mais
   velha que a última migração aplicada): volte para a branch certa. **Não** rode
   `downgrade` no banco de desenvolvimento para "fazer o health passar" sem saber o que a
   migração apaga.
5. A API não migra sozinha, de propósito: migração é passo explícito.

### `{"status":"database_unavailable"}`

A API não conseguiu conectar em até 5 s.

1. `docker compose -f infra/docker-compose.dev.yml ps`: o Postgres está `healthy`?
2. `DATABASE_URL` aponta para `127.0.0.1:55432` e o banco `agro_mro`?
3. A senha dentro da URL é a mesma de `AGRO_APP_PASSWORD`? Se a senha mudou depois do
   primeiro `up`, veja "O init só roda com volume vazio" em
   [postgres-local.md](postgres-local.md).
4. `scripts/db_check_roles.sh` termina com "0 falha(s)"?

## 7. Estrutura

```
backend/
  requirements.txt / requirements-dev.txt   versões exatas (pip freeze em ambiente limpo)
  alembic.ini, alembic/                     migrações (env.py usa DATABASE_URL_MIGRATIONS)
  pytest.ini
  app/
    main.py              create_app() + lifespan; prefixo /api/v1
    core/config.py       AppSettings (API) e MigrationSettings (Alembic)
    db/base.py           Base (naming_convention), make_engine, get_db
    db/types.py          Quantidade = Numeric(18,4), Percentual = Numeric(5,4), DataHoraUTC, utcnow()
    db/mixins.py         WorkspaceScoped, Timestamps
    db/migrations.py     head do código x revisão do banco
    models/workspace.py  tabela workspaces
    api/health.py        /health e /health/db
  tests/                 sempre PostgreSQL agro_mro_test
```

Tabela nova de dado de cliente: herde `WorkspaceScoped` (workspace_id NOT NULL, FK
RESTRICT, índice) e gere a migração pelo Alembic. O guarda
`tests/test_workspace_scope_guard.py` reprova qualquer tabela fora da allowlist sem isso.
