# D07 — Simulação, comparação e validação

V02 / lote 4 / 03-11-2026. Referências Plano 1.36/E64 e Contrato Matemático 0.4/E63. Inspeção estática atual; testes não executados. Implementação encontrada não equivale a disponibilidade operacional ao cliente. P4-I04 e P6 conservam aceites técnicos delimitados; P7/E64 mantém reteste humano pendente.

Diagramas em ../diagramas/; contratos e indicadores em ../MAPA_INDICADORES_E_CONTRATOS_LOTE_04.md. Cada atividade abaixo possui vinte campos. Campos sem ensaio específico são identificados; testes citados sem descrição de asserção foram apenas localizados.

## D07-A01 — Resolver capacidade e consultar plano

| Campo | Conteúdo |
|---|---|
| 1. ID | D07-A01 |
| 2. Nome técnico e funcional | Resolver capacidade e consultar plano |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Frontend e backend |
| 5. Evento inicial | Abrir Planejamento ou painel Da história do estoque à decisão. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Capabilities enabled/schema_available; material_id; caso, simulações e eventos; ciclo corrente se existente. |
| 8. Validações | Sessão/workspace; caso e material próprios; ficha estruturalmente válida para contexto do rascunho. |
| 9. Regras de negócio | RB-PLA-01: modo legado quando disabled; P6 somente enabled e schema disponível; erro de capacidade não autoriza fallback silencioso. |
| 10. Algoritmo ou transformação | Página usa useWorkCapability. Painel carrega plano/capacidade/ficha em paralelo; consulta work detail se P6 e caso; compõe contexto com material, fingerprint, revisão de decisão, ID/revisão do ciclo. |
| 11. Arquivo, classe e função | PlanningWorkflow.tsx:PlanningPage; PlanningWork.tsx:useWorkCapability; ApprovedPlanning.tsx:load,planningContext; main.py:planning_for_material |
| 12. Endpoint e contrato | GET /api/v1/planning-work/capabilities; GET /api/v1/planning/materials/{id}; GET /api/v1/planning-work/cases/{case_id}; GET sheet. |
| 13. Tabelas lidas ou modificadas | planning_cases/simulations/events, work heads/cycles/events, fontes P2; SELECT e inspeção de esquema. |
| 14. Saídas e eventos | Caso ou null, histórico, can_validate, stale, revisão; capacidade do ambiente. |
| 15. Decisões e ramificações | enabled+sem esquema: indisponível; disabled: legado. Caso com WorkHead não pode receber comandos legados mesmo com P6 desligada. |
| 16. Falhas e exceções | 503 p6_disabled/p6_migration_required em rotas P6; 409 p6_command_required no bypass legado; erro de load conserva aviso. |
| 17. Pós-condições | Nenhuma decisão criada por consulta. Disponibilidade produtiva NÃO CONFIRMADA sem ambiente inspecionado. |
| 18. Logs, recibos e evidências | Contrato P6, revisions e evidence_origin; comandos permanecem explícitos. |
| 19. Dependências | D03/D04/D05 e D11; continuidade indicada no diagrama. |
| 20. Testes e aceite | backend/tests/test_planning_work_p6.py:test_T08_same_revision_rejected_and_old_commands_guarded — localizado; guardas confirmadas em planning_work. Aceite delimitado E58/E59. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D07-A02 — Iniciar análise ou adotar caso legado

| Campo | Conteúdo |
|---|---|
| 1. ID | D07-A02 |
| 2. Nome técnico e funcional | Iniciar análise ou adotar caso legado |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente → backend |
| 5. Evento inicial | Iniciar análise deste SKU + Local ou Adotar caso legado em novo ciclo. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | material_id, reason; P6 exige expected_case_revision=absent ou hash. |
| 8. Validações | P6 require; material próprio; sem ciclo corrente existente; revisão esperada do caso legado. |
| 9. Regras de negócio | RB-PLA-02: adoção P6 inicia trabalho vazio e não herda validação/aplicação anteriores. |
| 10. Algoritmo ou transformação | Legado cria todo/evento created se ausente. P6 inicia transação, cria/adota caso, limpa seleção/validação/emissão atuais na adoção, cria WorkCycle sequência1 e WorkHead; preserva legacy_before no evento. |
| 11. Arquivo, classe e função | main.py:planning_create; planning_work.py:start; planning_work_api.py:Start; ApprovedPlanning.tsx:begin |
| 12. Endpoint e contrato | POST /api/v1/planning (legado); POST /api/v1/planning-work/cycles (P6), ambos 201. |
| 13. Tabelas lidas ou modificadas | Escreve planning_cases/events no legado; P6 escreve caso, work cycle/head/event; históricos anteriores preservados. |
| 14. Saídas e eventos | Caso todo, ciclo/revisão e evento cycle_started na P6. |
| 15. Decisões e ramificações | Caso existente com ciclo: consultar trabalho; caso legado mudou: atualizar; retomada de ciclo existente é D08, não adoção duplicada. |
| 16. Falhas e exceções | 404 posição; 409 cycle_exists/planning_revision_changed/case_context_changed; rollback em exceção P6. |
| 17. Pós-condições | Caso aberto sem proposta validada; não modifica parâmetros ativos. |
| 18. Logs, recibos e evidências | Motivo/ator; previous snapshot na adoção; no_historical_validation_inherited=True. |
| 19. Dependências | D03/D04/D05 e D11; continuidade indicada no diagrama. |
| 20. Testes e aceite | backend/tests/test_planning_work_p6.py:test_T01_T02_T04_workspace_and_actor — localizado. Código start rastreado; ensaio de adoção não executado nesta rodada. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D07-A03 — Editar proposta sem alterar parâmetros ativos

| Campo | Conteúdo |
|---|---|
| 1. ID | D07-A03 |
| 2. Nome técnico e funcional | Editar proposta sem alterar parâmetros ativos |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/OverrideField/planningPayload |
| 5. Evento inicial | Testar uma alternativa; escolher Usar referência, Definir proposta ou Ausente explicitamente. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | PlanningEdits: campo→{mode,value}; 17 campos do formulário, inclusive NS%, LT/R, manuais, quantum, proteção e completude. |
| 8. Validações | Texto não vazio em value; dias somente dígitos; quantidade decimal com vírgula normalizada; NS por serviceFraction; completude true/false. |
| 9. Regras de negócio | RB-PLA-03: inherit omite campo; absent envia null; value conserva zero. Overrides são hipotéticos. |
| 10. Algoritmo ou transformação | planningPayload converte intenção para objeto; backend valida ApprovedAnalysisIn. Rascunho vinculado ao material/contexto, separado das intenções de navegação. |
| 11. Arquivo, classe e função | frontend/src/planningInput.ts:planningPayload; ApprovedPlanning.tsx:OverrideField; AnalysisNavigation.tsx:useAnalysisDraft; approved_analysis_contract.py:ApprovedAnalysisIn |
| 12. Endpoint e contrato | Payload futuro simulate; nenhum HTTP enquanto digita. Exemplo fictício no mapa de contratos. |
| 13. Tabelas lidas ou modificadas | Nenhuma escrita em banco durante edição. |
| 14. Saídas e eventos | Objeto de overrides e rascunho em memória. |
| 15. Decisões e ramificações | Campo omitido herda; null não é zero; source_complete usa escolha explícita, não opção absent no formulário. Mudança de contexto exige reconciliação. |
| 16. Falhas e exceções | Validação local impede envio; backend pode rejeitar domínio, campo extra ou completude sem referência com 422. |
| 17. Pós-condições | Proposta não enviada permanece distinguível da referência ativa. |
| 18. Logs, recibos e evidências | Contexto de origem e intenção explícita; sem evidência P2 antes de simular. |
| 19. Dependências | D03/D04/D05 e D11; continuidade indicada no diagrama. |
| 20. Testes e aceite | backend/tests/test_approved_planning_i04.py:test_override_absence_zero_and_no_active_update — localizado; sem execução. planningInput.ts conferido estaticamente. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D07-A04 — Reconferir contexto antes do comando

| Campo | Conteúdo |
|---|---|
| 1. ID | D07-A04 |
| 2. Nome técnico e funcional | Reconferir contexto antes do comando |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Frontend/submitReviewed |
| 5. Evento inicial | Clique em Calcular e guardar simulação ou Validar proposta selecionada. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Contexto esperado do rascunho, nova leitura, identidade/sessão atual e callback de envio. |
| 8. Validações | current() após leitura; expected e actual não vazios e iguais; requireReviewedSheet antes de publicar ficha. |
| 9. Regras de negócio | RB-PLA-04: reconferência frontend não é bloqueio transacional; revisões backend continuam autoridade atômica. |
| 10. Algoritmo ou transformação | await read → se sessão obsoleta retornar obsolete; se contexto ausente/divergente retornar changed; senão enviar uma vez. Sucesso reconsulta/limpa rascunho; erro conserva rascunho e tenta consultar estado. |
| 11. Arquivo, classe e função | frontend/src/analysisCommand.ts:submitReviewed; ApprovedPlanning.tsx:act; reviewedSheet.ts:requireReviewedSheet |
| 12. Endpoint e contrato | GETs de D07-A01 antes do POST; rota escolhida por ciclo corrente. |
| 13. Tabelas lidas ou modificadas | Leitura prévia; escrita somente após envio explícito aceito pelo backend. |
| 14. Saídas e eventos | sent/changed/obsolete ou exceção; aviso de revisão e rascunho preservado. |
| 15. Decisões e ramificações | Contexto alterado: reconciliação explícita e novo clique. Falha de leitura: zero envio. Resposta de escrita perdida: estado incerto, consultar antes de repetir. |
| 16. Falhas e exceções | 503/rede/ficha inválida não autorizam envio. Não há retry automático do comando. |
| 17. Pós-condições | Não afirmar que mensagem de erro prova ausência de commit. |
| 18. Logs, recibos e evidências | E64 A5: correção técnica entregue; reteste humano na nova candidata pendente. |
| 19. Dependências | D03/D04/D05 e D11; continuidade indicada no diagrama. |
| 20. Testes e aceite | frontend/tests/analysisCommand.test.mjs:F7-C01–C07 — asserções lidas: ordem read/send, bloqueio de divergência/ausência/sessão, falha sem retry e uma tentativa quando resposta se perde. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D07-A05 — Calcular e preservar referência e proposta

| Campo | Conteúdo |
|---|---|
| 1. ID | D07-A05 |
| 2. Nome técnico e funcional | Calcular e preservar referência e proposta |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Backend/serviço aprovado/motor/P2 |
| 5. Evento inicial | POST simulate após ação humana. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Caso, overrides ApprovedAnalysisIn e expected_revision; P6 adiciona cycle_id, revisão de trabalho e expected_decision_revision. |
| 8. Validações | Caso próprio em todo/analysis/testing/ready; revisão compatível; P1 válido; P6 verifica ciclo corrente/revisão antes de delegar. |
| 9. Regras de negócio | RB-PLA-05: mesma dependência para referência e proposta; dois snapshots P2 e simulação imutável na mesma transação. |
| 10. Algoritmo ou transformação | begin_transaction → conferir estado/revisão → read_material_analysis(stored=True) e leitura com overrides → conferir dependências iguais → capture_all → _preserve reference/proposal → PlanningSimulation → selecionar nova simulação/testing → evento. P6 usa commit=False interno e commit externo único. |
| 11. Arquivo, classe e função | backend/app/approved_planning.py:simulate,_preserve; planning_work.py:command; main.py:planning_simulate |
| 12. Endpoint e contrato | POST /api/v1/planning/{case_id}/simulate (201); ou POST /api/v1/planning-work/cases/{case_id}/commands action=simulate (200). |
| 13. Tabelas lidas ou modificadas | Lê fontes; escreve versões/conteúdos/AnalysisRun P2, planning_simulations, caso e eventos. P6 também ciclo/revisão/WorkEvent. |
| 14. Saídas e eventos | Simulação selecionada, baseline/result, analysis IDs, fingerprint, validation state; resposta P6 retorna ciclo/decision_revision e frontend reconsulta detalhe. |
| 15. Decisões e ramificações | Proposta matematicamente NC pode ser preservada para inspeção; elegibilidade é decidida separadamente. Erro de fonte/parâmetro pode impedir cálculo. |
| 16. Falhas e exceções | 409 estado/revisão/ciclo; 422 planning_input_invalid/invalid_planning_proposal; rollback de snapshots e eventos em exceção. |
| 17. Pós-condições | Parâmetros ativos intactos; nenhuma validação ou aplicação implícita. |
| 18. Logs, recibos e evidências | inputs._i04 com overrides, active_parameters_before, case_revision_before, identidade e IDs P2; evento simulated. |
| 19. Dependências | D03/D04/D05 e D11; continuidade indicada no diagrama. |
| 20. Testes e aceite | backend/tests/test_approved_planning_i04.py:test_two_concurrent_simulations_compare_revision — asserções lidas: 201/409 e uma simulação/dois AnalysisRun. Não certifica concorrência produtiva. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D07-A06 — Comparar proposta e consultar histórico preservado

| Campo | Conteúdo |
|---|---|
| 1. ID | D07-A06 |
| 2. Nome técnico e funcional | Comparar proposta e consultar histórico preservado |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Backend view → SimulationComparison |
| 5. Evento inicial | Simulação criada ou Consultar resultados preservados da simulação. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | PlanningSimulation inputs/baseline/result, AnalysisRun de referência/proposta e dependências atuais. |
| 8. Validações | Versão I04; hash/identidade/role/case/request e conteúdo dos snapshots; comparação com dependências atuais. |
| 9. Regras de negócio | RB-PLA-06: histórico não é reescrito pelo cálculo atual; diferença é proposta−referência, não economia realizada. |
| 10. Algoritmo ou transformação | simulation_state verifica integridade/stale; view projeta sheets dos resultados preservados, calcula diferenças e parameter_changes; interface alterna métodos e permite consultar evidências. |
| 11. Arquivo, classe e função | approved_planning.py:simulation_state,view,difference; ApprovedPlanning.tsx:SimulationComparison |
| 12. Endpoint e contrato | GET /api/v1/planning/materials/{material_id}; consultas P2 em HistoricalAnalysis. Replay é caminho separado D11. |
| 13. Tabelas lidas ou modificadas | SELECT planning_simulations, AnalysisRun/conteúdos, fontes atuais e eventos; nenhuma escrita no histórico ao abrir. |
| 14. Saídas e eventos | reference_sheet/proposal_sheet, nove diferenças, origens, stale_reasons, validation e fingerprint. |
| 15. Decisões e ramificações | Legado retorna legacy_results_only, stale e inelegível. Fonte alterada mantém valores antigos identificados; criar nova simulação para decidir. |
| 16. Falhas e exceções | Inconsistência P2 bloqueia uso; software incompatível impede alegação de replay; ausência em um lado produz delta NC. |
| 17. Pós-condições | Histórico permanece auditável sem ser promovido a política atual. |
| 18. Logs, recibos e evidências | analysis IDs por papel, evidence_origin, versão contratual e eventos humanos ligados ao simulation_id. |
| 19. Dependências | D03/D04/D05 e D11; continuidade indicada no diagrama. |
| 20. Testes e aceite | backend/tests/test_approved_planning_i04.py:test_dependence_stale_precise_and_history_preserved e test_proposal_intent_cannot_reuse_another_snapshot_fingerprint — asserções lidas de preservação e bloqueio de JSON adulterado. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D07-A07 — Validar proposta selecionada com justificativa

| Campo | Conteúdo |
|---|---|
| 1. ID | D07-A07 |
| 2. Nome técnico e funcional | Validar proposta selecionada com justificativa |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente → approved_planning.validate |
| 5. Evento inicial | Validar proposta selecionada. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | simulation_id, justification ≥10 após trim; expected_revision/fingerprint opcionais no legado, enviados pela UI; obrigatórios por contrato P6 apropriado. |
| 8. Validações | Estado testing/ready; seleção vigente; P1 disponível; integridade e dependências atuais; política status=calculated, ES/PP/EM não ausentes, sem physical_only/conflito manual. |
| 9. Regras de negócio | RB-PLA-07: zero legítimo é elegível como valor; ausência bloqueia. Adequação estatística por item permanece not_evaluated. |
| 10. Algoritmo ou transformação | Transação/guardas → verificar seleção → P1 → simulation_state → fingerprint/stale/eligible → gravar hash/data/nota/status validated → evento. P6 sincroniza ciclo e incrementa revisão. |
| 11. Arquivo, classe e função | approved_planning.py:validate,validation_state; schemas.py:PlanningValidationIn; planning_work_api.py:Command; planning_work.py:command |
| 12. Endpoint e contrato | POST /api/v1/planning/{case_id}/validate; ou POST …/planning-work/cases/{case_id}/commands action=validate. |
| 13. Tabelas lidas ou modificadas | Atualiza planning_cases, grava PlanningEvent; P6 atualiza ciclo e WorkEvent. Não altera PlanningParameter nem conteúdo dos snapshots. |
| 14. Saídas e eventos | Decisão validada, validated_evidence_hash/validated_at, justificativa e referência de evidência. |
| 15. Decisões e ramificações | stale: simular novamente; seleção substituída: revisar atual; NC/conflito: revisar proposta. R/σLT/ES_H ausentes bloqueiam somente métodos dependentes, sem guarda adicional inventada. |
| 16. Falhas e exceções | 409 simulation_not_selected/simulation_fingerprint_changed/simulation_stale/simulation_not_validatable; 422 justificativa/P1; rollback em falha de evento. |
| 17. Pós-condições | Decisão humana validada; exportação e declaração de aplicação em D08. Nenhuma chamada ao ERP. |
| 18. Logs, recibos e evidências | Evento validated com simulation_id, IDs P2, justificativa e meaning human_validation_only_not_ERP_application. |
| 19. Dependências | D03/D04/D05 e D11; continuidade indicada no diagrama. |
| 20. Testes e aceite | backend/tests/test_approved_planning_i04.py:test_pending_validation_stale_and_event_failure — asserções lidas: stale retorna409 e falha de evento não altera snapshot. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D07-A08 — Encaminhar decisão e delimitar ações independentes

| Campo | Conteúdo |
|---|---|
| 1. ID | D07-A08 |
| 2. Nome técnico e funcional | Encaminhar decisão e delimitar ações independentes |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/Frontend |
| 5. Evento inicial | Decisão validada ou necessidade de rever dados/alternativa. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Estado do caso, revisão/ciclo, proposta e dados ativos. |
| 8. Validações | Não converter consulta, registro P2, edição ativa, forecast, exportação e aplicação na mesma ação. |
| 9. Regras de negócio | RB-PLA-08: laboratório não salva parâmetros ativos; edição ativa usa PUT explícito; Forecast permanece experimental. |
| 10. Algoritmo ou transformação | Validado → Planejamento/D08 para emissão. Rever decisão fechada → reabrir conforme D08, preservando histórico. Editar parâmetro ativo → formulário separado em MaterialDetail, reconferência e PUT. Forecast abre componente próprio. |
| 11. Arquivo, classe e função | ApprovedPlanning.tsx:MaterialPlanningPanel; App.tsx:MaterialDetail.saveParams; ForecastPreview.tsx; PlanningWorkflow.tsx |
| 12. Endpoint e contrato | PUT /api/v1/materials/{id}/parameters é ação distinta; exportação/comandos de aplicação detalhados em D08. |
| 13. Tabelas lidas ou modificadas | PUT altera planning_parameters e fluxo de auditoria próprio; simulação/validação não fazem esse PUT. Efeitos completos do editor ativo remetem à integração D10. |
| 14. Saídas e eventos | Rotas de continuidade sem confusão entre resultado, proposta, decisão, emissão e aplicação declarada. |
| 15. Decisões e ramificações | Forecast não passa a selecionar ES/PP/EM; histórico não vira parâmetro ativo; decisão desatualizada requer nova avaliação. |
| 16. Falhas e exceções | Resposta de comando perdida: consultar estado antes de repetir. Reabertura não significa apagar evidências. |
| 17. Pós-condições | Entrega comercial e aplicação externa não confirmadas por estes estados técnicos. |
| 18. Logs, recibos e evidências | P4-I04 aceite E46; P6 aceite delimitado E58/E59; P7 E64 reteste humano pendente. |
| 19. Dependências | D03/D04/D05 e D11; continuidade indicada no diagrama. |
| 20. Testes e aceite | docs/RELATORIO_RESULTADOS_HUMANOS_P7_CORRECAO_A5_E64.md:A1/A5 — evidência humana histórica relatada distingue POST de simulação e PUT ativo, com limites de captura; não observada novamente nesta rodada. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

