# D11 — Segurança e rastreabilidade

V02, lote 2, 03/11/2026. Inspeção estática de código e leitura das evidências indicadas. Sem execução de testes nesta rodada. Fontes e hashes em FONTES_LOTE_02.md.

Cada ficha contém os vinte campos do prompt mestre. Os diagramas usam os mesmos IDs. Relações com o motor são detalhadas posteriormente em D04/D05. Aceites históricos P2/P3/P4/P6 conservam seus escopos.

## D11-A01 — current_user / resolver acesso autenticado

| Campo | Especificação |
|---|---|
| 1. Identificador | D11-A01 |
| 2. Nome técnico e funcional | current_user / resolver acesso autenticado |
| 3. Objetivo | Identificar usuário e workspace da credencial. |
| 4. Executor | Backend Python |
| 5. Evento inicial | Chamada Rotas com Depends(current_user) |
| 6. Pré-condições e permissões | Requisição HTTP; APP_SECRET configurado no processo. |
| 7. Entradas e tipos | Authorization string Bearer; token assinado; user_id sub. |
| 8. Validações | Prefixo Bearer, HMAC, expiração, usuário existente e workspace_id presente. |
| 9. Regras de negócio | Token inválido/ausente ou usuário sem workspace resulta em401. |
| 10. Algoritmo ou transformação | decode_token → db.get(User) → verificar workspace → entregar User ao handler. |
| 11. Arquivo e função | backend/app/main.py:73 — current_user |
| 12. Endpoint e contrato | Rotas com Depends(current_user) |
| 13. Tabelas | users. |
| 14. Saídas e eventos | Usuário para o handler ou401. |
| 15. Decisões | Falha de assinatura/expiração/estrutura → None; usuário inexistente →401. |
| 16. Falhas e exceções | 401 Autenticação necessária ou Sessão inválida ou expirada. |
| 17. Pós-condições | Handler protegido recebe a identidade validada. |
| 18. Logs, recibos e evidências | security.py e current_user; auditoria de cada login não comprovada. |
| 19. Dependências | Dependências de código e subprocessos indicados no algoritmo e na fonte. |
| 20. Testes e aceite | test_security_configuration:test_tokens_use_configured_secret_and_reject_tampering — asserção lida. |

## D11-A02 — read_content / validar conteúdo preservado

| Campo | Especificação |
|---|---|
| 1. Identificador | D11-A02 |
| 2. Nome técnico e funcional | read_content / validar conteúdo preservado |
| 3. Objetivo | Autorizar leitura de conteúdo e conferir sua integridade. |
| 4. Executor | Backend Python |
| 5. Evento inicial | Chamada Consumidores lineage; download e leitura histórica |
| 6. Pré-condições e permissões | Usuário autenticado e workspace válido; esquema P2 exigido nas operações de evidência. |
| 7. Entradas e tipos | workspace_id, identifier e tipo esperado binary/json. |
| 8. Validações | Busca por id+workspace; SHA-256 recalculado; kind deve coincidir. |
| 9. Regras de negócio | Conteúdo inexistente ou adulterado resulta409 neste helper; handlers podem rejeitar antes com404. |
| 10. Algoritmo ou transformação | Select TraceContent → comparar hash → comparar tipo → bytes ou json.loads. |
| 11. Arquivo e função | backend/app/lineage.py:75 — read_content |
| 12. Endpoint e contrato | Consumidores lineage; download e leitura histórica |
| 13. Tabelas | trace_contents. |
| 14. Saídas e eventos | Bytes originais ou JSON preservado. |
| 15. Decisões | Ausente/hash divergente →409; tipo divergente →409. |
| 16. Falhas e exceções | Falhas de decodificação JSON adicionais dependem do conteúdo; abrangência não ensaiada. |
| 17. Pós-condições | Conteúdo devolvido apenas após conferência de escopo/hash/tipo. |
| 18. Logs, recibos e evidências | Hash armazenado versus recalculado; teste mostra bloqueio de conteúdo adulterado por SQL direto. |
| 19. Dependências | Dependências de código e subprocessos indicados no algoritmo e na fonte. |
| 20. Testes e aceite | backend/tests/test_lineage_p2.py:test_history_integrity_and_immutable_rows — asserções lidas. |

## D11-A03 — capture_dataset / versionar conjunto

| Campo | Especificação |
|---|---|
| 1. Identificador | D11-A03 |
| 2. Nome técnico e funcional | capture_dataset / versionar conjunto |
| 3. Objetivo | Preservar versões por posição e apontar versão ativa. |
| 4. Executor | Backend Python |
| 5. Evento inicial | Chamada Operações de captura P2 |
| 6. Pré-condições e permissões | Usuário autenticado e workspace válido; esquema P2 exigido nas operações de evidência. |
| 7. Entradas e tipos | Dataset, User, operação, origem, receipt_id opcional. |
| 8. Validações | require_schema; lock antes de capturar; consultas por workspace. |
| 9. Regras de negócio | Conteúdo idêntico reutiliza versão ativa; alteração incrementa revision e liga previous_id. |
| 10. Algoritmo ou transformação | live_dataset → content por posição → manifest → comparar head → criar DatasetVersion → atualizar DatasetHead. |
| 11. Arquivo e função | backend/app/lineage.py:117 — capture_dataset |
| 12. Endpoint e contrato | Operações de captura P2 |
| 13. Tabelas | Tabelas vivas do dataset; trace_contents, trace_dataset_versions e trace_dataset_heads. |
| 14. Saídas e eventos | DatasetVersion com referência ao conjunto e revisão. |
| 15. Decisões | Manifesto igual mantém versão; diferente cria sucessora. |
| 16. Falhas e exceções | P2 ausente503; conflitos de banco propagam para chamador/transação. |
| 17. Pós-condições | Versão acessível por contexto e posição. |
| 18. Logs, recibos e evidências | origin, retention_policy, captured_by e encadeamento previous_id. |
| 19. Dependências | Dependências de código e subprocessos indicados no algoritmo e na fonte. |
| 20. Testes e aceite | backend/tests/test_lineage_p2.py:test_first_append_duplicate_replace_and_historical_receipt — versões e histórico conferidos nas asserções. |

## D11-A04 — receipt_payload / consultar recibo

| Campo | Especificação |
|---|---|
| 1. Identificador | D11-A04 |
| 2. Nome técnico e funcional | receipt_payload / consultar recibo |
| 3. Objetivo | Permitir leitura das evidências recebidas e aplicadas. |
| 4. Executor | Backend Python |
| 5. Evento inicial | Chamada GET /api/v1/lineage/receipts/{identifier} e /download |
| 6. Pré-condições e permissões | Usuário autenticado e workspace válido; esquema P2 exigido nas operações de evidência. |
| 7. Entradas e tipos | Identifier, offset, limit; include_payload interno para download. |
| 8. Validações | Receipt pertence ao workspace; linhas filtradas também pelo workspace. |
| 9. Regras de negócio | Recibo traz identidade histórica e valores da ocasião. |
| 10. Algoritmo ou transformação | Select receipt → linhas ordenadas/limitadas → desserializar raw/normalized/persisted → retorno. |
| 11. Arquivo e função | backend/app/lineage.py:206 — receipt_payload |
| 12. Endpoint e contrato | GET /api/v1/lineage/receipts/{identifier} e /download |
| 13. Tabelas | trace_import_receipts, trace_import_rows e trace_contents quando inclui payload. |
| 14. Saídas e eventos | Resumo, versões, origem, comparação com prévia e linhas. |
| 15. Decisões | Recibo inexistente neste espaço →404; download inclui payload preservado. |
| 16. Falhas e exceções | read_content pode produzir409 no download; fonte original tem rota e verificação próprias. |
| 17. Pós-condições | Usuário acessa somente o recibo localizado em seu workspace. |
| 18. Logs, recibos e evidências | ImportLineagePanel oferece Ver evidência, Baixar conteúdo recebido e Baixar arquivo original. |
| 19. Dependências | Dependências de código e subprocessos indicados no algoritmo e na fonte. |
| 20. Testes e aceite | backend/tests/test_lineage_p2.py:test_source_binary_link_edits_and_scope_isolation — isolamento e arquivo original conferidos. |

## D11-A05 — replay_analysis / reproduzir análise histórica

| Campo | Especificação |
|---|---|
| 1. Identificador | D11-A05 |
| 2. Nome técnico e funcional | replay_analysis / reproduzir análise histórica |
| 3. Objetivo | Comparar recálculo compatível com resultado preservado. |
| 4. Executor | Backend Python |
| 5. Evento inicial | Chamada POST /api/v1/lineage/analyses/{identifier}/replay |
| 6. Pré-condições e permissões | Usuário autenticado e workspace válido; esquema P2 exigido nas operações de evidência. |
| 7. Entradas e tipos | ID de AnalysisRun e entradas/versões preservadas. |
| 8. Validações | Escopo da análise; kind suportado; versão matemática e hash do software; IDs dos movimentos históricos. |
| 9. Regras de negócio | Versão incompatível mantém resultado histórico com state not_reproduced. |
| 10. Algoritmo ou transformação | analysis_payload → guardas → reconstruir movimentos elegíveis → despachar cálculo por kind → comparar canonical(result) com histórico. |
| 11. Arquivo e função | backend/app/lineage.py:277 — replay_analysis |
| 12. Endpoint e contrato | POST /api/v1/lineage/analyses/{identifier}/replay |
| 13. Tabelas | trace_analysis_runs, trace_contents, trace_dataset_versions; sem criação de análise neste corpo. |
| 14. Saídas e eventos | not_reproduced, unavailable, reproduced ou divergent; exact_match quando recalcula. |
| 15. Decisões | Kind/versão/hash incompatível; indisponibilidade original; igualdade ou divergência final. |
| 16. Falhas e exceções | Movimentos necessários ausentes409; leitura de conteúdo pode gerar409; escopo alheio404. |
| 17. Pós-condições | Resultado original permanece disponível; recálculo tem estado explícito. |
| 18. Logs, recibos e evidências | replay_dispatch_version em incompatibilidades de kind/versão; referências históricas. |
| 19. Dependências | Dependências de código e subprocessos indicados no algoritmo e na fonte. |
| 20. Testes e aceite | test_legacy_boundaries_i08.py e test_lineage_p2.py localizados; compatibilidade de todos os kinds exige matriz posterior. |

## D11-A06 — PrivateApiCachePolicy / restringir cache privado

| Campo | Especificação |
|---|---|
| 1. Identificador | D11-A06 |
| 2. Nome técnico e funcional | PrivateApiCachePolicy / restringir cache privado |
| 3. Objetivo | Aplicar política de cache nas respostas da API. |
| 4. Executor | ASGI middleware + Service Worker como controle complementar |
| 5. Evento inicial | Chamada Requisições ASGI /api e /api/* |
| 6. Pré-condições e permissões | Middleware incluído em main.py; SW registrado em build PROD. |
| 7. Entradas e tipos | scope, receive e send ASGI. |
| 8. Validações | Escopo HTTP e path da API. |
| 9. Regras de negócio | Resposta API recebe private,no-store; Pragma no-cache; Vary Authorization. |
| 10. Algoritmo ou transformação | Interceptar http.response.start e encaminhar corpo sem buffer. |
| 11. Arquivo e função | backend/app/private_cache.py:5 — PrivateApiCachePolicy |
| 12. Endpoint e contrato | Requisições ASGI /api e /api/* |
| 13. Tabelas | Sem tabela consultada por este middleware. |
| 14. Saídas e eventos | Cabeçalhos de resposta de API; fora da API passa direto. |
| 15. Decisões | HTTP API versus outro escopo/path. |
| 16. Falhas e exceções | Falhas da aplicação propagam; middleware não trata erros de negócio. |
| 17. Pós-condições | Resposta API marcada para não armazenar privadamente no cache do cliente. |
| 18. Logs, recibos e evidências | private_cache.py; sw.js busca API na rede e restringe cache ao shell público. |
| 19. Dependências | Dependências de código e subprocessos indicados no algoritmo e na fonte. |
| 20. Testes e aceite | test_dashboard_experience_e51.py localizado; cobertura específica a vincular. |

