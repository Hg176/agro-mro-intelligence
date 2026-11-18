# Mapa de porte do protótipo para o backend de produção

> B1, 18/11/2026. **Só leitura do protótipo**: nenhum arquivo foi copiado, o pytest e o app
> do protótipo não foram executados e nada foi alterado na pasta dele.
> A ordem da seção 3 é **PROPOSTA para o Hugo aprovar**.

## 0. Origem conferida

| Item | Valor |
|---|---|
| Pasta | `../Ambiente de Teste/prototipo-sander` |
| Branch | `codex/agro-mro-ate-p7-e64-2026-11-16` (conferida com `git -C ... rev-parse --abbrev-ref HEAD`) |
| Commit | `6b83059` (conferido com `git -C ... rev-parse --short HEAD`) |
| Estado | limpo, exceto `backend/agro_mro.db.p2-migration.json` não versionado (já existia; não foi lido) |
| Como foi lido | contagem de linhas, `ast` dos imports (sem executar o código) e leitura de trechos |

Não foram lidos: `backend/agro_mro.db` e o `.bak` (podem conter dado real), `uploads/`.

**Linhas** = linhas físicas do arquivo (`wc -l` equivalente). **Depende de** = imports
internos de `app.*`. **Testes** = arquivos de `backend/tests/` que importam o módulo
diretamente (busca estática; cobertura transitiva não está somada).

## 1. Oráculos e fixtures

| Arquivo | Linhas | sha256 (conferido em 18/11/2026) | Quem usa |
|---|---|---|---|
| `backend/tests/fixtures/golden_master_sio_12.json` | 1534 | `3389337652c81f087d47148779225d2a57cb0ec8430e20fc4ea4edc8a6c386ab` | `test_control_rules.py` (3 testes), via `golden_master.compare_case` contra `analytics.calculate_material_batch` |
| `backend/tests/fixtures/p3_controlled_e41.json` | 10474 | `b6bbc00fa16222c6e5e9f522a489177919fc7c5e9f2589dee94d4fb007b88fb8` | `test_p3_closure_e41.py` (12 funções; uma delas parametrizada nos 42 casos) |
| `backend/tests/fixtures/p3_controlled_e41.sha256` | 1 | contém só o hash do `.json` acima (sem nome de arquivo; não é formato `sha256sum`) | `test_p3_closure_e41.py:37` |
| `backend/app/data/approved_service_levels_v3.json` | 532 | — | `approved_service.py:10` (matriz NS 75 V3); hash também conferido por `lineage.py:236` |

Na entrada desses arquivos (tarefa de porte), as linhas do
`tools/db_parity/ORACLE_MANIFEST.sha256` passam a existir, no formato `sha256sum` e
com caminho relativo à raiz. O B1 **não** preencheu o manifesto porque não copiou nenhum
oráculo.

## 2. Módulos de `backend/app/` por camada

Total: 47 arquivos `.py` em `backend/app/` (8.003 linhas somando todos), mais
`app/data/approved_service_levels_v3.json`.

### (a) Motor puro: sem banco e sem FastAPI (núcleo V3)

Nenhum destes importa SQLAlchemy, FastAPI ou Pydantic.

| Módulo | Linhas | Depende de | Libs externas | Testes do protótipo | Oráculos |
|---|---|---|---|---|---|
| `analysis_context.py` | 195 | — | dataclasses, datetime, decimal, hashlib, json, math | `test_analysis_context.py` (8), `test_p3b_frequency_coverage.py` (1), `test_p3_closure_e41.py`, `test_material_sheet_i03_equivalence.py` (este usa banco/API) | E41 |
| `approved_quantity.py` | 48 | — | decimal | `test_approved_math_p3.py` (19) | E41 (indireto) |
| `classifications.py` | 102 | — | datetime | `test_classifications.py` (4) | — |
| `approved_classifications.py` | 115 | analysis_context, approved_quantity, **classifications** | collections, datetime, decimal, fractions | `test_approved_math_p3.py`, `test_p3_closure_e41.py`, `test_p3b_frequency_coverage.py` | E41 |
| `approved_service.py` | 45 | approved_quantity | json, pathlib | `test_approved_math_p3.py`, `test_p3_closure_e41.py` (`test_exact_75_service_keys_against_original_v3`) | matriz V3 + E41 |
| `approved_inventory.py` | 234 | approved_quantity | collections, datetime, decimal, math, statistics | `test_approved_math_p3.py`, `test_p3_closure_e41.py`, `test_p3b_frequency_coverage.py`, `test_legacy_boundaries_i08.py`, `test_material_sheet_i03_equivalence.py` | E41 |
| `data/approved_service_levels_v3.json` | 532 | — | — | via `approved_service.py` | é o próprio dado de referência |

Soma: 739 linhas de Python + 532 de JSON. `classifications.py` não estava na lista
esperada, mas entra junto porque `approved_classifications.py` depende dele.

### (a') Também puros, mas fora do núcleo V3 (legado, apresentação ou experimental)

Sem banco e sem FastAPI. Entram só se uma tarefa pedir, porque vários são do caminho
legado (anterior ao motor aprovado) ou de itens que o Sander disse que vão sair.

| Módulo | Linhas | Depende de | Testes | Observação |
|---|---|---|---|---|
| `analytics.py` | 232 | — | `test_analytics.py` (4), `test_analysis_period_math.py`, `test_control_rules.py`, `test_analysis_context.py`, `test_legacy_boundaries_i08.py` | cálculo legado; é o que o Golden Master compara (seção 4.2) |
| `series.py` | 72 | analytics | `test_analysis_period_math.py`, `test_legacy_boundaries_i08.py`, `test_lineage_p2.py` | séries mensais |
| `workspace_rules.py` | 102 | analysis_context, classifications | `test_analysis_context.py`, `test_analysis_period_math.py` | classificação por workspace (legado) |
| `forecast.py` | 97 | — | `test_forecast_experimental.py`, `test_legacy_boundaries_i08.py` | experimental 0.1.0 (D-16, P8) |
| `control_rules.py` | 81 | — | `test_control_rules.py` | alertas AM-* (códigos vão ser renomeados) |
| `golden_master.py` | 34 | — | `test_control_rules.py` | comparação R x Python com tolerância (seção 4.2) |
| `stock_story.py` | 56 | — | — | Trilha do estoque |
| `dashboard_visuals.py` | 110 | — | `test_dashboard_visuals.py` | gráfico que o Sander pediu para refazer |
| `tmer_standard.py` | 34 | — | — | TMER: provável remoção (02/11) |
| `methodology.py` | 35 | approved_classifications, control_rules | — | textos de metodologia |
| `approved_material_sheet.py` | 128 | — | `test_material_sheet_i03.py`, `test_dashboard_experience_e51.py`, `test_approved_exports_i07.py` | montagem da ficha (só `copy`) |
| `approved_analysis_contract.py` | 54 | — | 8 arquivos (I01–I08) | contrato Pydantic de entrada da análise |
| `pdf_report.py` | 61 | — | — | texto do PDF |
| `exports.py` | 7 | — | `test_exports.py` | — |
| `__init__.py` | 1 | — | — | — |

### (b) Modelos, banco e schemas

| Módulo | Linhas | Depende de | Testes | Observação |
|---|---|---|---|---|
| `database.py` | 23 | — | 25 arquivos | `DATABASE_URL` com padrão SQLite (`database.py:7`); substituído por `app/db/base.py` |
| `models.py` | 381 | database | 24 arquivos | 27 `__tablename__` (o D09 conta 37 tabelas no total; aqui são 27 + 8 + 3 = 38 declarações, conferir no P-7) |
| `lineage_models.py` | 164 | database, models | `test_lineage_p2.py`, `test_approved_planning_i04.py` | 8 `__tablename__` P2 (trace_*) |
| `planning_work_models.py` | 44 | database, models | 6 arquivos P6/E59 | 3 `__tablename__` P6 |
| `schemas.py` | 216 | approved_analysis_contract | `test_approved_planning_i04.py` | schemas Pydantic da API |

### (c) Serviços que usam banco

| Módulo | Linhas | Depende de | Testes |
|---|---|---|---|
| `approved_analysis_service.py` | 425 | analysis_context, approved_analysis_contract, approved_classifications, approved_inventory, approved_quantity, approved_service, classifications, lineage, lineage_models, models, service_matrix | 11 arquivos (I01–I08, E51/E52, P6) |
| `approved_dashboard.py` | 537 | approved_analysis_service, approved_material_sheet, control_rules, lineage, models | `test_approved_dashboard_i06.py`, `test_approved_exports_i07.py`, `test_dashboard_closure_e52.py`, `test_dashboard_experience_e51.py` |
| `approved_exports.py` | 127 | approved_analysis_service, approved_dashboard, approved_inventory, approved_material_sheet, **approved_math_api**, approved_temporal, lineage, models | `test_approved_exports_i07.py` |
| `approved_planning.py` | 247 | analysis_context, approved_analysis_contract, approved_analysis_service, approved_material_sheet, **approved_math_api**, lineage, models, planning_work | `test_approved_planning_i04.py`, `test_planning_work_p6_extended.py` |
| `approved_temporal.py` | 134 | **approved_math_api**, lineage | `test_approved_temporal_i05.py` |
| `lineage.py` | 329 | analysis_context, analytics, approved_inventory, classifications, control_rules, forecast, lineage_models, models, series | 10 arquivos |
| `service_matrix.py` | 140 | approved_service, lineage, lineage_models, models | `test_service_classifications_i02.py` |
| `planning_work.py` | 185 | approved_planning, lineage, models, planning_work_models, schemas | 5 arquivos P6/E59 |
| `master_lead_time.py` | 70 | lineage_models | — (coberto por `test_master_lead_time_p3b.py` via API) |
| `report_periods.py` | 129 | models | `test_report_periods.py` (legado, substituído pela janela do MD, D-03) |
| `reference_data.py` | 59 | models | — (semeia unidades/grupos no startup) |
| `export_renderers.py` | 269 | approved_exports | `test_approved_exports_i07.py` (openpyxl, reportlab) |
| `security.py` | 54 | — | `test_security_configuration.py` e 3 outros (token HMAC próprio, PBKDF2) |
| `notifications.py` | 43 | — | — (SMTP) |

### (d) Rotas e HTTP

| Módulo | Linhas | Depende de | Testes |
|---|---|---|---|
| `main.py` | 2211 | 41 módulos internos (quase todos) | 11 arquivos importam `app.main`; a maioria dos testes de API passa por ele |
| `approved_math_api.py` | 102 | approved_analysis_contract, approved_analysis_service, approved_dashboard, approved_material_sheet, approved_service, approved_temporal, lineage, models | via `main` (`test_approved_math_api_p3.py`) |
| `planning_work_api.py` | 99 | models, planning_work | via `main` |
| `lineage_api.py` | 80 | approved_planning, lineage, lineage_models | via `main` |
| `approved_exports_api.py` | 40 | approved_dashboard, approved_exports, export_renderers | via `main` |
| `legacy_transition.py` | 30 | — | via `main` |
| `private_cache.py` | 22 | — (starlette) | via `main` (D11-A06) |

## 3. Ordem de porte — PROPOSTA (aguarda aprovação do Hugo)

Cada passo é um PR próprio, com os testes do protótipo correspondentes portados junto e
rodando no PostgreSQL quando tocarem banco. Oráculo entra byte a byte e com linha no
`ORACLE_MANIFEST.sha256` antes do código que ele testa.

| Passo | O que entra | Testes/oráculos que entram junto | Pronto quando |
|---|---|---|---|
| P-1 | `approved_quantity.py` (48) | casos de quantum de `test_approved_math_p3.py` | testes de quantum verdes, sem float novo |
| P-2 | `analysis_context.py` (195) | `test_analysis_context.py` (só os testes do contexto; ver 4.4) | janela/série/saldos idênticos |
| P-3 | `classifications.py` (102) + `approved_classifications.py` (115) | `test_classifications.py`, `test_p3b_frequency_coverage.py`, testes ABC/PQR/N de `test_approved_math_p3.py` | cortes exatos (80/95, 3/12, N 180) |
| P-4 | `approved_service.py` (45) + `data/approved_service_levels_v3.json` | `test_exact_75_service_keys_against_original_v3` e testes de NS de `test_approved_math_p3.py` | 75 chaves iguais à V3 |
| P-5 | `approved_inventory.py` (234) | restante de `test_approved_math_p3.py`; `p3_controlled_e41.json` + `.sha256` e a parte **pura** de `test_p3_closure_e41.py` (`test_frozen_independent_motor_oracles` nos 42 casos e os testes sem `client`) | 42 casos E41 verdes, sem mudar o fixture |
| P-6 | Golden Master: `golden_master_sio_12.json` + `golden_master.py` + o que o teste exigir (`analytics.py`, `control_rules.py`) | `test_control_rules.py` | só depois da decisão da seção 4.2 |
| P-7 | Camada (b): modelos novos a partir de `models.py`, `lineage_models.py`, `planning_work_models.py`, com `WorkspaceScoped`, migrações Alembic e as correções da seção 4 | guarda de workspace, `alembic check`, teste de acesso cruzado por tabela | esquema por migração, sem create_all |
| P-8 | Camada (c) começando por `approved_analysis_service.py` e `lineage.py` | I01, P2 e a parte com banco do E41 (`test_synthetic_import_engine_api_database_and_replay`) | mesmos números do passo P-5, agora lendo do PostgreSQL |
| P-9 | Camada (d): rotas por domínio (matemática aprovada, linhagem, planejamento, exportação), já com auth/tenant de produção | testes de API + acesso cruzado (404) em toda rota | `main.py` de 2211 linhas **não** é portado inteiro |

Os módulos de (a') entram sob demanda, dentro do passo que precisar deles, ou ficam de
fora se o Sander confirmar a remoção (TMER, gráfico antigo, períodos de relatório).

## 4. Pontos a corrigir no porte e contradições encontradas

### 4.1 `PlanningParameter.review_period_days` com default 30 (corrigir no porte)

- `models.py:135`: `review_period_days: Mapped[int] = mapped_column(default=30)`.
- O motor já trata R ausente corretamente: `approved_inventory.py:55`, `:107`, `:155`,
  `:165` e `:180` deixam EM-02 (Agro MRO), EM-03 (empírico, `Q(R)`) e os comparativos
  EM-04 a EM-07 (horizonte `H = LT + R`) sem valor, com motivo `review_period_missing`.
- Mas, como a coluna nasce com 30, **R nunca chega ausente ao motor**: o EM é calculado
  com R = 30 sem o cliente ter informado. Isso contraria "ausente ≠ zero ≠ padrão"
  (regra 3) e a pendência 9 do CONTEXTO §14 ("LT 15, R 30 e UN padrão não são
  declaração do cliente").
- **No porte:** a coluna nasce anulável, sem default; ausente continua ausente e o motor
  devolve NC com motivo. Se deve existir um R padrão (e com que origem aparece na tela),
  **a regra é do Sander**.
- Mesmo caso, mesma tabela: `lead_time_days` com default 15 (`models.py:132`) e
  `selected_scenario` com default `"engine"` (`models.py:141`); e a assinatura
  `calculate_approved(..., lead_time_days=15, ...)` (`approved_inventory.py:44-45`). Vão
  para o Sander junto. O `service_level` default 0.95 com origem `"default"`
  (`models.py:133-134`) não chega ao cálculo: `resolve_approved_service` só usa valor
  gravado quando a origem é `customer` e, nos outros casos, vai para a matriz.

### 4.2 Golden Master compara com tolerância e em float

- `golden_master.py:21-30`: `compare_case(..., absolute_tolerance=0.01)` converte para
  `float` e aceita diferença de até 0,01.
- O único teste que usa o fixture (`test_control_rules.py`) compara o R com o cálculo
  **legado** (`analytics.calculate_material_batch`), não com o motor aprovado V3.
- CONTEXTO §15.3: "Diferença numérica é bug, não tolerância", e `tools/db_parity/compare.py`
  não tem opção de tolerância.
- **Decisão pendente (Hugo + Sander):** o Golden Master no produto é oráculo de qual
  motor, e com que critério de igualdade? Até lá, o passo P-6 não entra.

### 4.3 E41 também tem tolerância (com Decimal)

- `p3_controlled_e41.json` declara `tolerance: raw_absolute 1e-9, raw_relative 1e-12`
  (identidade exata só para aplicados, manuais e classes), e `test_p3_closure_e41.py:62-63`
  aplica isso em `Decimal`.
- É bem mais estreita que a do Golden Master, mas é tolerância. Portar como está não
  altera o oráculo. **Hugo/Sander confirmam** se a tolerância do bruto (antes do quantum)
  fica registrada como decisão, para não parecer exceção à regra do §15.3.

### 4.4 Testes do protótipo presos a SQLite e ao diretório de trabalho

- `tests/conftest.py:3` força `DATABASE_URL=sqlite:///./test_agro_mro.db` e
  `conftest.py:14-16` faz `drop_all` + `create_all` a cada teste (AM-07). Não se porta:
  o conftest de produção é o do B1 (Alembic + TRUNCATE em `agro_mro_test`).
- `test_p3_closure_e41.py:32-37` (`require_disposable`) exige SQLite e um `cwd` com
  `work/2026-10-12_E41`, e grava `e41-comparisons.jsonl` no `cwd`. No porte, a **trava**
  muda (vira `assert_safe_test_database` e saída em `reports/`), o **fixture não muda**.
  Mudança no harness de oráculo: registrar a decisão do Hugo no PR.
- `test_approved_math_p3.py:20` importa o helper `inputs` de `test_analysis_context.py`,
  que importa `analytics` e `workspace_rules` (legado). Para portar o P-1..P-5 sem trazer
  o legado, o helper vai para um módulo de apoio de teste. Não muda nenhum valor esperado.

### 4.5 O motor devolve float em alguns campos

- `approved_service.py:42` devolve `effective_value=float(level)`; `approved_inventory.py`
  tem 16 chamadas `float(` e `approved_classifications.py`, 2. Parte é cálculo interno
  (raiz, quantil normal), parte vai para o resultado.
- Regra do produto: quantidade e dinheiro em `Decimal`/`Numeric` no banco e na API.
- **No porte:** a matemática interna fica idêntica (é a homologada; mudar float por
  Decimal pode mudar resultado e quebrar E41). A conversão para `Decimal` acontece na
  fronteira (persistência/DTO), com regra de arredondamento a definir. A regra de
  arredondamento na fronteira é **decisão do Sander** se mudar algum número exibido.

### 4.6 `workspace_id` anulável no protótipo

- `models.py:23` (`users`): `workspace_id` anulável. Vira tabela de membros (tarefa de login).
- `models.py:56` (`units_of_measure`) e `models.py:67` (`merchandise_groups`):
  `workspace_id` NULL significa "padrão global". O guarda do B1 exige `workspace_id NOT NULL`.
  **Decisão técnica do Hugo no P-7:** tabela global separada (na allowlist, com motivo)
  + tabela do workspace, ou outra forma; não pode ficar NULL como "global" numa tabela
  escopada.
- As demais tabelas declaram `workspace_id` com FK sem `ON DELETE`; no porte, todas usam
  `WorkspaceScoped` (RESTRICT + índice).

### 4.7 Startup cria tabelas e usa `on_event`

- `main.py:230-232`: `@app.on_event("startup")` + `Base.metadata.create_all(...)` excluindo
  as tabelas P2/P6 (confirma D01). No produto: `lifespan`, esquema só por Alembic, e a API
  não semeia dados no startup (semeadura vira migração de dados ou comando explícito).

### 4.8 Serviço importando módulo de rota

- `approved_temporal.py:127`, `approved_exports.py:12` e `approved_planning.py:17`
  importam `read_material_analysis` de `approved_math_api.py` (camada de rota). No porte,
  essa função desce para a camada de serviço, para (c) não depender de (d).

### 4.9 Outros pontos já conhecidos, confirmados no código

- `database.py:7`: padrão `sqlite:///./agro_mro.db`. No produto não existe modo SQLite.
- `security.py`: token próprio (HMAC) e PBKDF2; auth de produção é tarefa futura (CONTEXTO §20.1).
- `tools/db_parity/ORACLE_MANIFEST.sha256` diz "será preenchido no B1", mas o B1 não copia
  oráculo: o preenchimento passa para os passos P-4 a P-6.

## 5. Depende de quem

| Item | Quem decide |
|---|---|
| Ordem de porte (seção 3) | Hugo |
| R/LT/cenário padrão (4.1) | Sander |
| Golden Master: oráculo de qual motor e com que igualdade (4.2) | Hugo + Sander |
| Tolerância do bruto no E41 (4.3) | Hugo + Sander |
| Adaptação do harness E41 (4.4) | Hugo |
| Arredondamento na fronteira Decimal (4.5) | Sander, se mudar número exibido |
| Tabelas globais de referência (4.6) | Hugo |
