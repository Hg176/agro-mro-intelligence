# PostgreSQL local (desenvolvimento)

> Fase A da base de produção. Só o banco: backend, motor e frontend chegam com o código do Sander.
> Ambiente-alvo: Windows + Git Bash + Docker Desktop (e Linux no CI).

## 1. Primeira subida

```bash
cp .env.example .env        # na RAIZ do repositório
# edite o .env e troque TODOS os "troque-me" (só letras, números, - e _)
docker compose -f infra/docker-compose.dev.yml up -d
docker compose -f infra/docker-compose.dev.yml ps      # espere "(healthy)"
scripts/db_check_roles.sh                              # tem de terminar com "0 falha(s)"
```

O que sobe:

| Item | Valor |
|---|---|
| Imagem | `postgres:17.11` (tag exata; a mesma do CI) |
| Porta | `127.0.0.1:5432` (só na máquina local, nunca em 0.0.0.0) |
| Volume | `agro-mro-dev_agro_pgdata` (nomeado) |
| Encoding / collation | `UTF8` / `C.UTF-8` (ordem binária, igual ao SQLite) |
| Fuso do servidor | `UTC` (`-c timezone=UTC -c log_timezone=UTC`) |
| Bancos | `agro_mro`, `agro_mro_test` (dono `agro_owner`) |
| Papéis | `agro_owner` (dono, migrações), `agro_app` (só DML, não é dono de nada) |

**Por que UTC:** o SQLite devolve `CURRENT_TIMESTAMP` em UTC e o D08 grava eventos em UTC.
`America/Cuiaba` é só apresentação (frontend/relatório), nunca o fuso da gravação.

### Porta 5432 ocupada

Se já houver um PostgreSQL instalado no Windows (é o caso na máquina do Hugo: um serviço
`postgres` nativo escuta em 5432), o `up` falha com `ports are not available`. Não
desinstale nada; publique em outra porta **pelo shell** (o Compose não lê o `.env` da
raiz para interpolação, só para as variáveis do container):

```bash
export POSTGRES_PORT=55432
docker compose -f infra/docker-compose.dev.yml up -d
```

Os scripts de `scripts/` não usam a porta publicada (falam com o banco por `docker exec`),
então funcionam com qualquer porta.

## 2. O init só roda com volume vazio

`infra/postgres/init/01-roles.sh` é executado pelo entrypoint do Postgres **apenas na
primeira subida, quando o volume está vazio**. Depois disso ele é ignorado.

Mudou o `01-roles.sh` ou alguma senha do `.env`? Recrie o volume:

```bash
docker compose -f infra/docker-compose.dev.yml down -v   # -v APAGA OS DADOS LOCAIS
docker compose -f infra/docker-compose.dev.yml up -d
scripts/db_check_roles.sh
```

> `down -v` apaga o volume `agro_pgdata` inteiro. Se houver algo local que importe,
> faça antes `scripts/db_backup.sh` (veja `backup-restauracao.md`).

Alternativa sem apagar dados (o script é idempotente):

```bash
source scripts/lib/pg.sh
docker exec -i -e AGRO_OWNER_PASSWORD -e AGRO_APP_PASSWORD "$(pg_container)" \
  bash -s < infra/postgres/init/01-roles.sh
```

## 3. Git Bash e `docker exec`: `MSYS_NO_PATHCONV=1`

O Git Bash (MSYS) converte argumentos que parecem caminho Unix em caminho do Windows
antes de chamar o `docker.exe`. Exemplo: `/var/lib/postgresql/data` vira
`C:/Program Files/Git/var/lib/postgresql/data` e o comando quebra dentro do container.

```bash
# errado no Git Bash (o caminho é reescrito):
docker exec agro-mro-dev-postgres-1 ls /var/lib/postgresql/data
# certo:
MSYS_NO_PATHCONV=1 docker exec agro-mro-dev-postgres-1 ls /var/lib/postgresql/data
```

Os scripts de `scripts/` já exportam `MSYS_NO_PATHCONV=1` (em `scripts/lib/pg.sh`) e
passam ao `docker` caminhos no formato `E:/...` (`pwd -W`).

Para abrir um `psql` interativo:

```bash
MSYS_NO_PATHCONV=1 docker exec -it agro-mro-dev-postgres-1 psql -U postgres -d agro_mro
```

## 4. Papéis e privilégios

| Papel | Atributos | Pode | Não pode |
|---|---|---|---|
| `postgres` | superusuário | tudo (só init/operação) | ser usado pela aplicação |
| `agro_owner` | LOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOBYPASSRLS | DDL nos bancos do produto (dono do banco e do schema `public`) | criar banco ou papel |
| `agro_app` | LOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOBYPASSRLS | `SELECT/INSERT/UPDATE/DELETE` em tabelas e `USAGE/SELECT` em sequências criadas pelo `agro_owner` (`ALTER DEFAULT PRIVILEGES`) | `CREATE`, `DROP`, `ALTER`, `TRUNCATE`; ser dono de qualquer objeto |

- `REVOKE CREATE ON SCHEMA public FROM PUBLIC` e `REVOKE ALL ON DATABASE ... FROM PUBLIC`
  (só `agro_app` recebe `CONNECT`).
- `ALTER ROLE agro_app SET timezone = 'UTC'` e `ALTER DATABASE ... SET timezone = 'UTC'`.
- `NOBYPASSRLS` no `agro_app` deixa o caminho aberto para RLS por `workspace_id`
  (CONTEXTO §20.1, item 3) — RLS ainda **não** foi criado.

## 5. O que o `scripts/db_check_roles.sh` confere

Em `agro_mro` e `agro_mro_test` (ou nos bancos de `CHECK_DBS`), sai com código ≠ 0 se algo falhar:

- (a) `agro_app` existe, com LOGIN, sem SUPERUSER, BYPASSRLS, CREATEDB, CREATEROLE;
- (b) `agro_app` não é dono de banco, schema, tabela, sequência, view, função nem tipo;
- (c) o `agro_owner` cria uma tabela de prova com sequência; o `agro_app` faz INSERT
  (usando a sequência), SELECT, UPDATE e DELETE nela **sem GRANT explícito**
  (prova do `DEFAULT PRIVILEGES`) e é negado em DROP, ALTER, TRUNCATE, CREATE TABLE e
  CREATE SCHEMA; a tabela é apagada no fim (também em caso de erro);
- (d) `SHOW timezone` = `UTC` e `now()` com deslocamento `+00` na conexão do `agro_app`;
- (e) collation e ctype `C.UTF-8`, encoding `UTF8`.

## 6. Testes de `tools/` contra este banco

```bash
scripts/test_tools_docker.sh        # python:3.12 em container, SQLite + PostgreSQL
```

O script monta `TEST_POSTGRES_URL` (como `agro_app`) e `TEST_POSTGRES_OWNER_URL` (como
`agro_owner`, para criar/apagar as tabelas do mini-modelo) apontando para `agro_mro_test`.
Gera `reports/junit-tools.xml` e `tools/db_parity/tests/out/numeric_report.md` (fora do git).

## 7. Variáveis usadas pelos scripts

| Variável | Uso |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD` | superusuário (lidos do `.env` se não estiverem no ambiente) |
| `AGRO_OWNER_PASSWORD`, `AGRO_APP_PASSWORD` | senhas dos papéis |
| `PG_CONTAINER` | id/nome do container; padrão: o serviço `postgres` do compose (o CI define o do service container) |
| `PG_MODE=local` | usa `psql`/`pg_dump` do PATH com `PGHOST`/`PGPORT` em vez de `docker exec` |
| `CHECK_DBS` | bancos conferidos por `db_check_roles.sh` |
