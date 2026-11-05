# D03 — Importação e validação

V02, lote 2, 03/11/2026. Inspeção estática de código e leitura das evidências indicadas. Sem execução de testes nesta rodada. Fontes e hashes em FONTES_LOTE_02.md.

Cada ficha contém os vinte campos do prompt mestre. Os diagramas usam os mesmos IDs. Relações com o motor são detalhadas posteriormente em D04/D05. Aceites históricos P2/P3/P4/P6 conservam seus escopos.

## D03-A01 — file_import_preview / receber arquivo

| Campo | Especificação |
|---|---|
| 1. Identificador | D03-A01 |
| 2. Nome técnico e funcional | file_import_preview / receber arquivo |
| 3. Objetivo | Preservar o arquivo recebido e apresentar sua leitura. |
| 4. Executor | Backend Python |
| 5. Evento inicial | Chamada POST /api/v1/imports/file?import_type=movements / master_data / pipeline |
| 6. Pré-condições e permissões | Usuário autenticado e workspace válido; esquema P2 exigido nas operações de evidência. |
| 7. Entradas e tipos | Multipart UploadFile; import_type em query. |
| 8. Validações | Tipo por pattern; tamanho máximo 15 MiB antes da transação; cabeçalhos reconhecidos e não ambíguos. |
| 9. Regras de negócio | A prévia de arquivo grava fonte e conteúdo, inclusive rejeição do parser dentro do try. |
| 10. Algoritmo ou transformação | file.read → begin_transaction → read_import_file → preserve_file → audit no sucesso → commit. |
| 11. Arquivo e função | backend/app/main.py:963 — file_import_preview |
| 12. Endpoint e contrato | POST /api/v1/imports/file?import_type=movements / master_data / pipeline |
| 13. Tabelas | trace_contents, trace_import_sources, audit_logs; consulta esquema P2. |
| 14. Saídas e eventos | filename, rows, row_count, recognized_columns, source_hash SHA-256 e source_file_id. |
| 15. Decisões | Acima do limite retorna 413 antes de preservar; erro HTTP do parser preserva fonte com preview rejected. |
| 16. Falhas e exceções | 422 com source_file_id quando falha de leitura/cabeçalho é preservada; falhas fora do except HTTPException exigem análise específica. |
| 17. Pós-condições | Fonte binária preservada e prévia entregue, ou rejeição documentada. |
| 18. Logs, recibos e evidências | ImportSource.parser_version e conteúdo hash; auditoria preview no sucesso. |
| 19. Dependências | Dependências de código e subprocessos indicados no algoritmo e na fonte. |
| 20. Testes e aceite | backend/tests/test_lineage_p2.py:test_source_binary_link_edits_and_scope_isolation e test_rejected_file_preserved_and_analysis_history_cross_workspace_blocked — asserções lidas. |

## D03-A02 — _table_import / validar tabela

| Campo | Especificação |
|---|---|
| 1. Identificador | D03-A02 |
| 2. Nome técnico e funcional | _table_import / validar tabela |
| 3. Objetivo | Normalizar e mostrar inconsistências antes da confirmação. |
| 4. Executor | Backend Python |
| 5. Evento inicial | Chamada POST /api/v1/imports/table; TableImportIn; confirm=false |
| 6. Pré-condições e permissões | Usuário autenticado; leitura conforme dataset. Prévia de tabela não chama begin_transaction do wrapper. |
| 7. Entradas e tipos | rows list[dict[str,str]], import_type, movement_system, movement_import_mode, source_hash/source_file_id opcionais. |
| 8. Validações | Movimentos exigem direção mapeada, data e quantidade positiva. MD exige código/descrição, domínios XYZ/comprabilidade e datas coerentes. Pipeline exige chegada, quantidade positiva, valor finito não negativo e fornecedor até160 caracteres. |
| 9. Regras de negócio | Local vazio vira GERAL. XYZ ausente vira X e comprabilidade ausente vira3, com origem agro_mro_default. |
| 10. Algoritmo ou transformação | Normalizar chaves/valores → preparar valid/errors e ordinais → calcular fingerprints → consultar repetidos → retornar preview. |
| 11. Arquivo e função | backend/app/main.py:1473 — _table_import |
| 12. Endpoint e contrato | POST /api/v1/imports/table; TableImportIn; confirm=false |
| 13. Tabelas | Leitura de movement_type_mappings e movements quando aplicável. |
| 14. Saídas e eventos | Até30 linhas de prévia, até100 erros, valid_rows/invalid_rows, defaults_applied, contagens de repetição e movimentos a substituir. |
| 15. Decisões | replace permitido somente para movements; confirm=false retorna antes de criar recibo. |
| 16. Falhas e exceções | 422 para replace em outro dataset; erros de linha KeyError/ValueError/InvalidOperation viram coleção errors. |
| 17. Pós-condições | Prévia de tabela disponível; confirmação é nova requisição. |
| 18. Logs, recibos e evidências | Fonte hash declarada ou calculada; contrato TableImportIn em schemas.py. |
| 19. Dependências | Dependências de código e subprocessos indicados no algoritmo e na fonte. |
| 20. Testes e aceite | backend/tests/test_api.py:test_structured_movement_and_master_data_imports localizado; cobertura por validador pendente. |

## D03-A03 — import_with_receipt / confirmar carga

| Campo | Especificação |
|---|---|
| 1. Identificador | D03-A03 |
| 2. Nome técnico e funcional | import_with_receipt / confirmar carga |
| 3. Objetivo | Envolver a aplicação em transação e preservar antes/depois. |
| 4. Executor | Backend Python |
| 5. Evento inicial | Chamada POST /api/v1/imports/table ou /imports/paste; confirm=true |
| 6. Pré-condições e permissões | Usuário autenticado e workspace válido; esquema P2 exigido nas operações de evidência. |
| 7. Entradas e tipos | Payload confirmado e função execute específica. |
| 8. Validações | P2 disponível; fonte vinculada pertence ao mesmo workspace e dataset; validação das linhas é refeita. |
| 9. Regras de negócio | preview_matches é registro de comparação, não bloqueio automático da edição. |
| 10. Algoritmo ou transformação | begin_transaction → capture_all antes → execute → begin_receipt → aplicar ou bloquear → finish_receipt → commit. |
| 11. Arquivo e função | backend/app/main.py:2163 — import_with_receipt |
| 12. Endpoint e contrato | POST /api/v1/imports/table ou /imports/paste; confirm=true |
| 13. Tabelas | Datasets ativos e trace_contents/sources/receipts/rows/dataset_versions/heads. |
| 14. Saídas e eventos | Recibo completed ou blocked; erro com recibo para falhas tratadas. |
| 15. Decisões | Linhas inválidas bloqueiam todo o conjunto; recibo blocked é committed com p2_receipt_committed. |
| 16. Falhas e exceções | Exceção antes do commit segue D03-A07; begin_transaction/capture_all ocorrem antes do try do wrapper. |
| 17. Pós-condições | Somente linhas aceitas são aplicadas no caminho de sucesso; bloqueio mantém versões antes/depois iguais. |
| 18. Logs, recibos e evidências | Resumo received = applied + duplicates + rejected + not_applied. |
| 19. Dependências | Dependências de código e subprocessos indicados no algoritmo e na fonte. |
| 20. Testes e aceite | backend/tests/test_lineage_p2.py:test_blocked_import_retains_raw_rejected_and_not_applied_rows — asserções lidas. |

## D03-A04 — _table_import / aplicar movimentos

| Campo | Especificação |
|---|---|
| 1. Identificador | D03-A04 |
| 2. Nome técnico e funcional | _table_import / aplicar movimentos |
| 3. Objetivo | Acrescentar ou substituir movimentos do workspace com rastreabilidade. |
| 4. Executor | Backend Python |
| 5. Evento inicial | Chamada POST /api/v1/imports/table; movements; confirm=true |
| 6. Pré-condições e permissões | Usuário autenticado e workspace válido; esquema P2 exigido nas operações de evidência. |
| 7. Entradas e tipos | Linhas normalizadas; modo append/replace; sistema e hash de origem. |
| 8. Validações | Tipo mapeado no sistema escolhido; capacidade comercial de SKUs quando cria material; replace exige ao menos uma linha válida. |
| 9. Regras de negócio | Fingerprint table-v3 inclui workspace, hash, posição da linha, SKU, Local, data, sistema, tipo externo e quantidade. Igualdade aparente de linhas não elimina eventos distintos. |
| 10. Algoritmo ou transformação | replace remove ReportMovement dos relatórios do workspace e os Movement ativos; insere nova base. append consulta fingerprints; duplicados são vinculados ao recibo. |
| 11. Arquivo e função | backend/app/main.py:1473 — _table_import |
| 12. Endpoint e contrato | POST /api/v1/imports/table; movements; confirm=true |
| 13. Tabelas | materials, planning_parameters, movements, report_periods, report_movements e P2. |
| 14. Saídas e eventos | inserted, updated, movements_replaced, report_period e receipt. |
| 15. Decisões | Fingerprint já existente marca duplicate; material ausente cria cadastro provisório UN e parâmetro. |
| 16. Falhas e exceções | Capacidade, persistência ou auditoria podem falhar; rollback e tentativa de recibo failed via wrapper. |
| 17. Pós-condições | Tabela ativa e versões refletem o resultado confirmado; evidências anteriores preservadas. |
| 18. Logs, recibos e evidências | raw, normalized e persisted por ordinal; versão antes/depois. |
| 19. Dependências | Dependências de código e subprocessos indicados no algoritmo e na fonte. |
| 20. Testes e aceite | backend/tests/test_lineage_p2.py:test_first_append_duplicate_replace_and_historical_receipt — asserções lidas. |

## D03-A05 — _table_import / aplicar Dados Mestres

| Campo | Especificação |
|---|---|
| 1. Identificador | D03-A05 |
| 2. Nome técnico e funcional | _table_import / aplicar Dados Mestres |
| 3. Objetivo | Atualizar a posição e declarar os dados de planejamento. |
| 4. Executor | Backend Python |
| 5. Evento inicial | Chamada POST /api/v1/imports/table; master_data; confirm=true |
| 6. Pré-condições e permissões | Usuário autenticado e workspace válido; esquema P2 exigido nas operações de evidência. |
| 7. Entradas e tipos | Código ERP, descrição, Local, datas/saldos, custo, classes declaradas, lead_time_days opcional. |
| 8. Validações | Saldo inicial declarado exige referência before/after; data final não anterior à inicial; LT inteiro1–365 ou ausente. |
| 9. Regras de negócio | LT manual comprovado prevalece; origem desconhecida é preservada; nova declaração atualiza origem MD/default comprovada. |
| 10. Algoritmo ou transformação | Upsert Material/MD → load_history → propagate LT → link_receipt_row → preservar lead_time_propagation. |
| 11. Arquivo e função | backend/app/main.py:1473 — _table_import |
| 12. Endpoint e contrato | POST /api/v1/imports/table; master_data; confirm=true |
| 13. Tabelas | materials, material_master_data, planning_parameters e recibos P2. |
| 14. Saídas e eventos | Descrição/MD atualizados e contagem por motivo de propagação LT. |
| 15. Decisões | Novo parâmetro com LT ausente recebe default15 no importador; existente mantém valor conforme proveniência. |
| 16. Falhas e exceções | Erro de linha bloqueia conjunto; erro de escrita segue rollback. |
| 17. Pós-condições | Recebido, persistido e LT efetivo ficam distinguíveis no recibo. |
| 18. Logs, recibos e evidências | Versão md-planning-lt-1, received/before/effective/source/reason e previous_evidence_receipt_id. |
| 19. Dependências | Dependências de código e subprocessos indicados no algoritmo e na fonte. |
| 20. Testes e aceite | backend/tests/test_master_lead_time_p3b.py:test_first_import_received_persisted_and_effective — asserção lida; demais casos de precedência localizados. |

## D03-A06 — _table_import / aplicar pedidos pendentes

| Campo | Especificação |
|---|---|
| 1. Identificador | D03-A06 |
| 2. Nome técnico e funcional | _table_import / aplicar pedidos pendentes |
| 3. Objetivo | Registrar pedidos sem incorporá-los ao saldo físico. |
| 4. Executor | Backend Python |
| 5. Evento inicial | Chamada POST /api/v1/imports/table; pipeline; confirm=true |
| 6. Pré-condições e permissões | Usuário autenticado e workspace válido; esquema P2 exigido nas operações de evidência. |
| 7. Entradas e tipos | SKU, Local, expected_on, quantity, reference, supply_value e supplier. |
| 8. Validações | Quantidade positiva, data válida, valor finito não negativo e fornecedor até160 caracteres. |
| 9. Regras de negócio | Fingerprint considera workspace, SKU, Local, data, quantidade e referência; valor e fornecedor são atualizáveis. |
| 10. Algoritmo ou transformação | Localiza/cria material → calcula fingerprint → insere ou atualiza campos informados → vincula recibo. |
| 11. Arquivo e função | backend/app/main.py:1473 — _table_import |
| 12. Endpoint e contrato | POST /api/v1/imports/table; pipeline; confirm=true |
| 13. Tabelas | pipeline_orders, materials, planning_parameters e P2. |
| 14. Saídas e eventos | inserted/updated e resultado do recibo. |
| 15. Decisões | Pedido existente: atualiza supply_value/supplier quando informados; sem ambos registra duplicate. |
| 16. Falhas e exceções | Falha de persistência segue D03-A07. |
| 17. Pós-condições | Pedido preservado em pipeline; movimentos ativos não são criados por esta ramificação. |
| 18. Logs, recibos e evidências | Valores persistidos e identidade por linha no recibo. |
| 19. Dependências | Dependências de código e subprocessos indicados no algoritmo e na fonte. |
| 20. Testes e aceite | backend/tests/test_lineage_p2.py:test_md_pipeline_versions_and_analysis_replay_types localizado; asserções específicas a aprofundar. |

## D03-A07 — import_with_receipt / recuperar falha

| Campo | Especificação |
|---|---|
| 1. Identificador | D03-A07 |
| 2. Nome técnico e funcional | import_with_receipt / recuperar falha |
| 3. Objetivo | Reverter a mutação e tentar registrar a tentativa fracassada. |
| 4. Executor | Backend Python |
| 5. Evento inicial | Chamada Wrapper das confirmações table/paste |
| 6. Pré-condições e permissões | Usuário autenticado e workspace válido; esquema P2 exigido nas operações de evidência. |
| 7. Entradas e tipos | Exception antes de p2_receipt_committed. |
| 8. Validações | Se recibo já committed, propaga exceção sem refazer tentativa; do contrário rollback e db.info.clear. |
| 9. Regras de negócio | Registro de falha ocorre em transação separada e também pode falhar. |
| 10. Algoritmo ou transformação | rollback → begin_receipt operation=failed_attempt → finish_receipt failed → commit; se falhar, rollback e not_persisted. |
| 11. Arquivo e função | backend/app/main.py:2163 — import_with_receipt |
| 12. Endpoint e contrato | Wrapper das confirmações table/paste |
| 13. Tabelas | Dados ativos revertidos; novas evidências P2 da tentativa quando graváveis. |
| 14. Saídas e eventos | HTTP original se HTTPException; 500 caso contrário; detail.receipt com failed ou not_persisted. |
| 15. Decisões | Falha secundária produz evidência apenas no retorno, sem recibo persistido. |
| 16. Falhas e exceções | begin_transaction/capture_all anteriores ao try não percorrem este tratamento. Erro de rede após commit não tem reconciliação automática comprovada. |
| 17. Pós-condições | Estado anterior recuperado no cenário ensaiado pelo teste; tentativa failed pode ser consultada se gravada. |
| 18. Logs, recibos e evidências | Motivo Transação revertida + classe da exceção; payload/raw preservados na tentativa. |
| 19. Dependências | Dependências de código e subprocessos indicados no algoritmo e na fonte. |
| 20. Testes e aceite | backend/tests/test_lineage_p2.py:test_processing_failure_rolls_back_replacement_and_keeps_failed_attempt — injeção após mutação e asserções lidas. |

## D03-A08 — _paste_import / importar colagem

| Campo | Especificação |
|---|---|
| 1. Identificador | D03-A08 |
| 2. Nome técnico e funcional | _paste_import / importar colagem |
| 3. Objetivo | Validar e acrescentar movimentos fornecidos como texto. |
| 4. Executor | Backend Python |
| 5. Evento inicial | Chamada POST /api/v1/imports/paste; PasteImportIn |
| 6. Pré-condições e permissões | Usuário autenticado e workspace válido; esquema P2 exigido nas operações de evidência. |
| 7. Entradas e tipos | content string mínimo3; delimiter default ponto e vírgula; confirm defaultfalse. |
| 8. Validações | Cabeçalho reconhecido ou posição fixa; direção IN/OUT e aliases; código não vazio e quantidade positiva. |
| 9. Regras de negócio | Sem Local usa GERAL; unidade passa por normalize_unit_symbol; data flexível aceita serial Excel e formatos declarados. |
| 10. Algoritmo ou transformação | parse_import → prévia até20 linhas ou begin_receipt → inserir/vincular duplicados → record_report → finish_receipt → commit. |
| 11. Arquivo e função | backend/app/main.py:1007 — _paste_import |
| 12. Endpoint e contrato | POST /api/v1/imports/paste; PasteImportIn |
| 13. Tabelas | materials, planning_parameters, movements, relatórios e P2. |
| 14. Saídas e eventos | Prévia com erros/source_hash ou completed com inserted/duplicates/receipt. |
| 15. Decisões | confirm=false retorna prévia; erros confirmados geram blocked; fingerprint paste-v2 evita reimportação do mesmo conteúdo/posição. |
| 16. Falhas e exceções | Erros de linha tratados em parse_import; demais falhas confirmadas passam pelo wrapper. |
| 17. Pós-condições | Movimentos acrescentados e histórico preservado. |
| 18. Logs, recibos e evidências | Ordinal físico e valores recebidos/normalizados/persistidos. |
| 19. Dependências | Dependências de código e subprocessos indicados no algoritmo e na fonte. |
| 20. Testes e aceite | backend/tests/test_api.py:test_paste_preview_and_idempotent_commit localizado; teste atual não executado. |

