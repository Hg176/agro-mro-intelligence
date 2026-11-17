# Backup e restauração (PostgreSQL)

> CONTEXTO §15.3: **backup e ensaio de restauração antes de migrar.** Estes scripts são a
> base local/CI. Em produção (PostgreSQL gerenciado, CONTEXTO §20.1 item 2) o backup do
> provedor não dispensa o ensaio: um backup só vale depois de restaurado e conferido.

Todos os scripts rodam `pg_dump`/`pg_restore`/`psql` **dentro do container** do Postgres
(`docker exec`), então a versão do cliente é sempre a do servidor (17.11) e o Windows não
precisa de cliente Postgres instalado. Senhas vêm do `.env` (ou do ambiente).

## Scripts

| Script | O que faz |
|---|---|
| `scripts/db_backup.sh [banco] [arquivo]` | `pg_dump -Fc` como `agro_owner`. Padrão: `agro_mro` → `backups/agro_mro_<UTC>.dump`. Confere o cabeçalho `PGDMP` e lê o índice com `pg_restore --list` antes de declarar sucesso. Escreve em `.partial` e só renomeia no fim. |
| `scripts/db_restore.sh <arquivo> [destino]` | Cria o banco de destino (dono `agro_owner`, UTF8, C.UTF-8) e roda `pg_restore --exit-on-error`. **O destino tem de terminar em `_restore_check`** (padrão `agro_mro_restore_check`): o script recusa `agro_mro`, `agro_mro_test` ou qualquer outro nome. Recusa destino existente, a não ser com `DROP_EXISTING=1`. |
| `scripts/db_restore_drill.sh [banco]` | Ensaio completo: backup → restaura em `agro_mro_restore_check` → compara **contagem de linhas e hash md5 do conteúdo** de cada tabela → apaga o banco de prova (também se algo falhar). Sai ≠ 0 em qualquer divergência. |

## Ensaio de restauração

```bash
scripts/db_restore_drill.sh                 # ensaia agro_mro
DRILL_SEED=1 scripts/db_restore_drill.sh    # cria antes uma tabela SINTÉTICA na origem
KEEP_DUMP=1 scripts/db_restore_drill.sh     # mantém o .dump em backups/
```

- **Banco sem tabelas:** o ensaio **falha de propósito** ("não provaria nada"). Enquanto
  o banco do produto não tiver tabelas (antes do código do Sander), use `DRILL_SEED=1`:
  o script cria `_drill_seed_sintetico` (1.000 linhas inventadas: SKU com zeros à
  esquerda, `numeric(18,4)`, NULL/0/"", timestamp) na origem e a apaga no fim.
- **Hash do conteúdo:** `md5` de todas as linhas como texto, ordenadas; pega diferença
  de valor que a contagem não pega (ex.: casa decimal perdida).
- O banco `agro_mro_restore_check` é sempre apagado no fim (`DROP DATABASE ... WITH (FORCE)`).
- Por padrão o `.dump` gerado pelo ensaio também é apagado.

Saída esperada (com `DRILL_SEED=1`):

```
tabela                                              origem   restaurado  conteúdo
public._drill_seed_sintetico                          1000         1000  igual

drill: OK, 1 tabela(s) com contagem e conteúdo iguais.
```

## Backup manual e restauração

```bash
f="$(scripts/db_backup.sh agro_mro | tail -1)"   # a última linha é o caminho do arquivo
scripts/db_restore.sh "$f"                       # -> agro_mro_restore_check
# conferir à vontade, depois apagar:
source scripts/lib/pg.sh && psql_as postgres postgres -c 'DROP DATABASE agro_mro_restore_check WITH (FORCE)'
```

**Restaurar por cima do banco real não é coberto por estes scripts, de propósito.** Isso é
um procedimento de incidente (parar a API, renomear o banco atual, restaurar num nome novo,
conferir, trocar) e precisa de um runbook próprio quando houver produção.

## Cuidados

- `backups/` está no `.gitignore`. **Um dump pode conter dado de cliente**: nunca anexe em
  issue, PR, chat ou e-mail, e não copie para fora do ambiente autorizado.
- O dump custom (`-Fc`) inclui donos, `GRANT`s e `ALTER DEFAULT PRIVILEGES`; os papéis
  (`agro_owner`, `agro_app`) têm de existir no servidor de destino antes da restauração.
- No CI o ensaio roda a cada push/PR (`DRILL_SEED=1`), contra o banco efêmero do job.

## Pendências (dependem do Hugo)

- Política de retenção, criptografia e local dos backups de produção (P2-OP02/OP08).
- Agendamento do backup e do ensaio periódico em produção.
- Runbook de restauração sobre o banco real (incidente).
