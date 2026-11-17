# tools/db_parity

Ferramentas de prova para a troca SQLite → PostgreSQL (Fase A). Genéricas: recebem
**URL** e **MetaData** por parâmetro e não conhecem o modelo do produto. Python 3.12,
SQLAlchemy 2.0, psycopg 3 (`tools/requirements-dev.txt`, versões exatas).

| Módulo | Para quê |
|---|---|
| `safety.py` | `assert_safe_test_database(url)`: recusa banco que não termine em `_test` ou host que não seja `localhost`/`127.0.0.1`/`::1`/`postgres`; SQLite só no diretório temporário. Sem "liberação" por variável de ambiente. |
| `audit_types.py` | Lista Float/REAL, String sem tamanho, Numeric (precisão/escala), DateTime sem fuso, `server_default` com `now()`/`CURRENT_TIMESTAMP`, `*_json` em texto e `code/sku/location/local` que não são texto. Markdown ou JSON. |
| `canonical_dump.py` | Uma `.jsonl` por tabela, ordenada pela PK, `Decimal` como string sem perder casas, datas ISO, `null`/`0`/`""` distintos. Modo tipado (o que a aplicação lê) e `--cru` (o que está gravado). |
| `compare.py` | Compara dois dumps byte a byte; imprime a primeira divergência (arquivo, chave, coluna, A, B) e o total. **Sem opção de tolerância**: diferença numérica é bug. |
| `ORACLE_MANIFEST.sha256` | Hash dos oráculos (Golden Master etc.). Vazio até o B1. Conferido por `scripts/check_oracle_manifest.sh`. |

```bash
python -m tools.db_parity.audit_types --metadata pacote.modulo:Base --format md
python -m tools.db_parity.canonical_dump --url "$URL_A" --metadata pacote.modulo:Base --out dump_a
python -m tools.db_parity.canonical_dump --url "$URL_B" --metadata pacote.modulo:Base --out dump_b
python -m tools.db_parity.compare dump_a dump_b      # 0 = iguais, 1 = divergentes
```

## Testes

`tests/` usa um **mini-modelo sintético** (`tests/modelo_sintetico.py`, tabela
`sint_posicao`) que não é modelo do produto. O fixture `db` roda cada teste em SQLite e em
PostgreSQL. Local: `scripts/test_tools_docker.sh` (veja `docs/operacao/postgres-local.md`).

`tests/out/numeric_report.md` (gerado, fora do git) mostra tipo e valor devolvidos por cada
banco para `Numeric(18,4)`: ORM, SELECT direto, SUM/AVG em SQL e `WHERE qty = 1.2346`.
O teste afirma o comportamento observado em cada banco e falha se ele mudar.
