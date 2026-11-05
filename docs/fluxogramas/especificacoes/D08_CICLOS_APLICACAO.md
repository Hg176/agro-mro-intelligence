# D08 — Gestão dos ciclos, emissão e aplicação declarada

V02 / lote 5 / 03-11-2026. Plano 1.36/E64; matemática 0.4/E63 preservada. P6 tecnicamente aceita no alcance E58/E59 registrado E60; não é homologação operacional. P7/E64 conserva reteste humano pendente. Inspeção estática nesta rodada, sem testes ou migração.

D07 cobre início/adoção, simulação e validação. D08 continua a organização e execução do trabalho. Consulte [estados e contratos](../ESTADOS_E_CONTRATOS_D08.md). As fichas abaixo identificam testes lidos versus apenas localizados.

## D08-A01 — Consultar fila e progresso estrutural

| Campo | Conteúdo |
|---|---|
| 1. ID | D08-A01 |
| 2. Nome técnico e funcional | Consultar fila e progresso estrutural |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/WorkPage/Backend |
| 5. Evento inicial | Abrir meu plano, Atualizar fila, filtrar ou paginar. |
| 6. Pré-condições e permissões | Usuário autenticado, workspace próprio, P6 habilitada e esquema disponível para rotas P6; ciclo/revisão conforme atividade. Não executar migração ou habilitação nesta documentação. |
| 7. Entradas, tipos e origem | page≥1, limit 1–100 (UI25), status, assignee opcional, overdue booleano. Workspace da sessão. |
| 8. Validações | require: flag P6 e esquema; estado permitido; população limitada ao workspace; snapshot de leitura SQLite. |
| 9. Regras de negócio | RB-CIC-01: resumo global, filtrado e página são universos distintos; elegibilidade matemática não é recalculada. |
| 10. Algoritmo ou transformação | population faz joins caso/material/head/ciclo corrente; summarize conta C/D/A/V/I/L; consultas estruturais antes de OFFSET/LIMIT; frontend limpa seleção ao atualizar/filtro/página. |
| 11. Arquivo, classe e função | backend/app/planning_work.py:population,summarize,listing,begin_read; frontend/src/PlanningWork.tsx:WorkPage,WorkProgress |
| 12. Endpoint e contrato | GET /api/v1/planning-work; GET /api/v1/planning-work/assignees. |
| 13. Tabelas lidas ou modificadas | SELECT planning_cases/materials/work heads/cycles e users; sem cálculo/record/capture. |
| 14. Saídas e eventos | global_summary,filtered_summary,items,total,civil_day,read_only; eligibility=not_evaluated. |
| 15. Decisões e ramificações | Ciclo ausente conta L; denominador zero retorna null. A inclui completed e exclui somente discarded: não confundir com atividade operacional. |
| 16. Falhas e exceções | 401/422/503; fuso ausente work_timezone_unavailable. Erro limpa fila, não repete comando. |
| 17. Pós-condições | Consulta não altera ciclo, matemática ou histórico. |
| 18. Logs, recibos e evidências | Arrays de membros do resumo; contract; dia civil America/Cuiaba. Histórico completo sob demanda, sem paginação própria. |
| 19. Dependências | D07 para início/adoção/simulação/validação; D11 para isolamento/evidência; D09 para modelo; D10/D12 completarão integração/recuperação. |
| 20. Testes e aceite | backend/tests/test_planning_work_p6.py:test_T13_T14_literal_counts_independent_and_legacy e test_T18_T19_readonly_pagination — asserções lidas: 60/33,3%, null sem base e nenhuma DML/DDL. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D08-A02 — Salvar responsável, prazo e próxima ação

| Campo | Conteúdo |
|---|---|
| 1. ID | D08-A02 |
| 2. Nome técnico e funcional | Salvar responsável, prazo e próxima ação |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/WorkEditor/Backend |
| 5. Evento inicial | Salvar organização. |
| 6. Pré-condições e permissões | Usuário autenticado, workspace próprio, P6 habilitada e esquema disponível para rotas P6; ciclo/revisão conforme atividade. Não executar migração ou habilitação nesta documentação. |
| 7. Entradas, tipos e origem | Command metadata: cycle_id,expected_revision, ao menos um de assignee_id:int / null,due_on:date / null,next_action:str / null≤500. |
| 8. Validações | Ciclo corrente coerente com caso; revisão após lock; status não completed/discarded; responsável no workspace; allowlist por ação. |
| 9. Regras de negócio | RB-CIC-02: organização não altera revisão de decisão, fingerprint, parâmetros ativos nem permissões. |
| 10. Algoritmo ou transformação | begin_transaction → own_case/current/check → atualizar somente campos enviados; string trim ou None → incrementar revisão de ciclo → WorkEvent com before/after → commit. |
| 11. Arquivo, classe e função | planning_work.py:command,check,event; planning_work_api.py:Command; PlanningWork.tsx:WorkEditor.act |
| 12. Endpoint e contrato | POST /api/v1/planning-work/cases/{id}/commands action=metadata; 200 ciclo+decision_revision. |
| 13. Tabelas lidas ou modificadas | Lê caso/head/ciclo/users; atualiza WorkCycle e insere WorkEvent. Não atualiza PlanningCase neste ramo. |
| 14. Saídas e eventos | Nova revisão organizacional; assignee opcional, sem fallback para criador. |
| 15. Decisões e ramificações | Omitido conserva; null limpa; prazo hoje não vencido. UI bloqueia rascunho com contexto divergente e oferece revisão explícita. |
| 16. Falhas e exceções | 404 responsável/caso; 409 work_revision_changed/cycle_changed/work_integrity_mismatch/ciclo encerrado; 422 domínio; rollback em falha. |
| 17. Pós-condições | Metadados salvos, decisão e snapshots preservados. |
| 18. Logs, recibos e evidências | WorkEvent metadata, ator autorizado ID/nome e horário UTC; UI apresenta America/Cuiaba. |
| 19. Dependências | D07 para início/adoção/simulação/validação; D11 para isolamento/evidência; D09 para modelo; D10/D12 completarão integração/recuperação. |
| 20. Testes e aceite | backend/tests/test_planning_work_p6.py:test_T03_T06_metadata_zero_absence_deadline_and_unchanged_math e test_T09_atomic_metadata_event_failure — asserções lidas de prazo e preservação/rollback. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D08-A03 — Mover etapa ou descartar com motivo

| Campo | Conteúdo |
|---|---|
| 1. ID | D08-A03 |
| 2. Nome técnico e funcional | Mover etapa ou descartar com motivo |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/WorkEditor/Backend |
| 5. Evento inicial | Mover para… ou Descartar com motivo. |
| 6. Pré-condições e permissões | Usuário autenticado, workspace próprio, P6 habilitada e esquema disponível para rotas P6; ciclo/revisão conforme atividade. Não executar migração ou habilitação nesta documentação. |
| 7. Entradas, tipos e origem | Command status, target status e note opcional≤2000; revisão/ciclo obrigatórios. |
| 8. Validações | Pares exatos de transição; ready exige selected_simulation_id; discarded exige note não vazia após trim. |
| 9. Regras de negócio | RB-CIC-03: mudar etapa não valida proposta; somente comando validate de D07 produz decisão validada. |
| 10. Algoritmo ou transformação | Conferir par na tabela allowed → atualizar caso.status → PlanningEvent status_changed → sincronizar ciclo.status/revisão → WorkEvent status → commit. |
| 11. Arquivo, classe e função | planning_work.py:command ramo status; PlanningWork.tsx:transitions |
| 12. Endpoint e contrato | POST /api/v1/planning-work/cases/{id}/commands action=status. |
| 13. Tabelas lidas ou modificadas | PlanningCase,WorkCycle,PlanningEvent,WorkEvent; fontes e parâmetros intactos. |
| 14. Saídas e eventos | Etapa atualizada; motivo preservado nos eventos. |
| 15. Decisões e ramificações | todo→analysis/discarded; analysis→testing/discarded; testing→analysis/ready/discarded; ready→analysis/testing/discarded; applied→monitoring. |
| 16. Falhas e exceções | 409 transição proibida ou ready sem seleção; 422 descarte sem motivo; demais guardas de revisão/ciclo. |
| 17. Pós-condições | ready não garante elegibilidade; descarte não apaga caso ou evidência. |
| 18. Logs, recibos e evidências | Eventos before/after e note; simular/validar são comandos próprios D07. |
| 19. Dependências | D07 para início/adoção/simulação/validação; D11 para isolamento/evidência; D09 para modelo; D10/D12 completarão integração/recuperação. |
| 20. Testes e aceite | backend/tests/test_planning_work_p6_extended.py:test_T07_state_pairs — tabela parametrizada de pares lida; execução não realizada. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D08-A04 — Selecionar membros para emissão

| Campo | Conteúdo |
|---|---|
| 1. ID | D08-A04 |
| 2. Nome técnico e funcional | Selecionar membros para emissão |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/WorkPage |
| 5. Evento inicial | Selecionar para emissão · SKU + Local. |
| 6. Pré-condições e permissões | Usuário autenticado, workspace próprio, P6 habilitada e esquema disponível para rotas P6; ciclo/revisão conforme atividade. Não executar migração ou habilitação nesta documentação. |
| 7. Entradas, tipos e origem | Items da página corrente: case_id,cycle.id,cycle.revision; estado validated e ciclo presente. |
| 8. Validações | UI oferece checkbox somente para validated com ciclo. Seleção não comprova evidência atual; backend revalida. |
| 9. Regras de negócio | RB-CIC-04: conjunto de emissão é seleção explícita da página; não é todo o filtro, workspace ou conjunto de sugestões. |
| 10. Algoritmo ou transformação | Adicionar/remover item da seleção local → construir members → Emitir Excel de mudança. Atualizar fila/filtros/página limpa seleção. |
| 11. Arquivo, classe e função | frontend/src/PlanningWork.tsx:WorkPage; ExportDownload.tsx; planning_work_api.py:Member,Emit |
| 12. Endpoint e contrato | POST /api/v1/planning-work/export.xlsx; body members entre1 e100, sem case_id repetido. |
| 13. Tabelas lidas ou modificadas | Nenhuma escrita durante seleção; consulta anterior fornece revisões. |
| 14. Saídas e eventos | Lista de membros com revisões; count e scope exibidos no botão. |
| 15. Decisões e ramificações | Sem seleção: botão POST desabilitado. UI25 por página; máximo100 da API não certifica desempenho100. |
| 16. Falhas e exceções | Seleção antiga pode receber409; não eliminar automaticamente membro rejeitado para emitir resto. |
| 17. Pós-condições | Intenção de emissão pronta, sem lote criado ainda. |
| 18. Logs, recibos e evidências | JSON members identificável; lote e congelamento só em D08-A05. |
| 19. Dependências | D07 para início/adoção/simulação/validação; D11 para isolamento/evidência; D09 para modelo; D10/D12 completarão integração/recuperação. |
| 20. Testes e aceite | backend/tests/test_planning_work_e59.py:test_E59_A09_mixed_members_rejected_atomically — asserções lidas: duplicado422; stale/revisão/não validado409 e snapshot intacto. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D08-A05 — Revalidar e emitir Excel atomicamente

| Campo | Conteúdo |
|---|---|
| 1. ID | D08-A05 |
| 2. Nome técnico e funcional | Revalidar e emitir Excel atomicamente |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Backend P6/I07 |
| 5. Evento inicial | POST de emissão com seleção explícita. |
| 6. Pré-condições e permissões | Usuário autenticado, workspace próprio, P6 habilitada e esquema disponível para rotas P6; ciclo/revisão conforme atividade. Não executar migração ou habilitação nesta documentação. |
| 7. Entradas, tipos e origem | members; ciclo/revisão por caso; proposta selecionada e dependências atuais. |
| 8. Validações | Flag/esquema; lock workspace; own_case/current/check; status validated e c.validated_at; simulation_state não stale e elegível; ready do emissor deve coincidir exatamente com selected_ids. |
| 9. Regras de negócio | RB-CIC-05: qualquer membro inválido bloqueia o conjunto; bytes são preparados antes do commit; não há emissão parcial. |
| 10. Algoritmo ou transformação | freeze metadados → emit_planning_export(commit=False) → gerar quatro abas e bytes → criar PlanningExportBatch/atualizar casos/exported/eventos → sincronizar ciclos/revisões/WorkEvent emitted → flush/commit externo único. |
| 11. Arquivo, classe e função | planning_work_api.py:build_router.export; planning_work.py:freeze; main.py:emit_planning_export; export_renderers.py:cell,workbook_bytes,file_response |
| 12. Endpoint e contrato | POST /api/v1/planning-work/export.xlsx → XLSX200 + X-Planning-Batch; layout agro-mro-export-1.1-P6. |
| 13. Tabelas lidas ou modificadas | Lê todos os casos do workspace para Pendências; fontes e simulações. Escreve PlanningExportBatch, casos/eventos e ciclos/WorkEvents. |
| 14. Saídas e eventos | Arquivo alvo31colunas; quatro abas; lote; estados exported; metadados congelados. |
| 15. Decisões e ramificações | Pendências contém casos do workspace fora de ready. Colunas-base mantêm layout1.0.0 e extensão identifica1.1-P6. Não armazenar binário durável neste fluxo. |
| 16. Falhas e exceções | 409 conjunto/evidência/revisão; 422 membro/texto/número; exceção em qualquer evento causa rollback externo. Falha de transporte pós-commit não desfaz lote. |
| 17. Pós-condições | Emissão registrada; download e aplicação não comprovados. |
| 18. Logs, recibos e evidências | batch_id, eventos exported/emitted, metadata_frozen com revisão pré-emissão, ciclo e identidade; cabeçalho X-Planning-Batch. |
| 19. Dependências | D07 para início/adoção/simulação/validação; D11 para isolamento/evidência; D09 para modelo; D10/D12 completarão integração/recuperação. |
| 20. Testes e aceite | backend/tests/test_planning_work_e59.py:test_E59_A04_second_emission_event_failure_rolls_back_all e test_E59_B01_long_text_snapshot_event_excel_and_old_emission — asserções lidas: rollback segundo evento,31colunas,zeros/texto/metadados preservados. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D08-A06 — Receber arquivo e tratar emissão incerta

| Campo | Conteúdo |
|---|---|
| 1. ID | D08-A06 |
| 2. Nome técnico e funcional | Receber arquivo e tratar emissão incerta |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | ExportDownload/navegador/cliente |
| 5. Evento inicial | Resposta do POST de emissão ou falha de entrega. |
| 6. Pré-condições e permissões | Usuário autenticado, workspace próprio, P6 habilitada e esquema disponível para rotas P6; ciclo/revisão conforme atividade. Não executar migração ou habilitação nesta documentação. |
| 7. Entradas, tipos e origem | Response, X-Planning-Batch, blob, sessão atual e assinatura path/count/scope/body. |
| 8. Validações | Somente resposta da geração/sessão/contexto corrente; HTTP não OK gera erro;401 limpa token. |
| 9. Regras de negócio | RB-CIC-06: entrega ao navegador não prova download concluído; erro não prova ausência de commit; não há retry automático nem recuperação binária garantida. |
| 10. Algoritmo ou transformação | fetch no-store → header de lote marca confirmed → blob → ObjectURL/link.click → revogar URL → consultar estado. Em catch POST: uncertain=true e reconsultar se callback existe. |
| 11. Arquivo, classe e função | frontend/src/ExportDownload.tsx:download; PlanningWork.tsx:refresh |
| 12. Endpoint e contrato | POST export; GET de fila/detalhe via onStateCheck. Consultar estado da emissão não chama novamente o POST. |
| 13. Tabelas lidas ou modificadas | Frontend não grava banco; GETs consultam lote/estado por projeções existentes. |
| 14. Saídas e eventos | Aviso lote emitido ou emissão possível/recepção incerta; botão de consultar estado. |
| 15. Decisões e ramificações | Se header recebido e blob falhar: lote confirmado, recepção não confirmada. Sem confirmação: emissão pode ter ocorrido. Sessão alterada invalida resposta. |
| 16. Falhas e exceções | Rede/blob/refresh falhos conservam incerteza; uncertain desabilita emissão. Botão de consulta não limpa uncertain neste componente. |
| 17. Pós-condições | Cliente deve conferir recepção e estado; não prometer re-download de bytes antigos. |
| 18. Logs, recibos e evidências | Estado exported e eventos no histórico ajudam conferir; ausência de arquivo não desfaz esses registros. |
| 19. Dependências | D07 para início/adoção/simulação/validação; D11 para isolamento/evidência; D09 para modelo; D10/D12 completarão integração/recuperação. |
| 20. Testes e aceite | backend/tests/test_planning_work_p6_extended.py:test_T10_committed_response_lost_requires_read_no_repeat — localizado; comportamento frontend conferido estaticamente, sem ensaio de transporte nesta rodada. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D08-A07 — Declarar aplicação no sistema do cliente

| Campo | Conteúdo |
|---|---|
| 1. ID | D08-A07 |
| 2. Nome técnico e funcional | Declarar aplicação no sistema do cliente |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/WorkEditor/Backend |
| 5. Evento inicial | Declarar aplicação no sistema do cliente. |
| 6. Pré-condições e permissões | Usuário autenticado, workspace próprio, P6 habilitada e esquema disponível para rotas P6; ciclo/revisão conforme atividade. Não executar migração ou habilitação nesta documentação. |
| 7. Entradas, tipos e origem | Command applied, external_reference opcional≤120; cycle_id/revisão. |
| 8. Validações | row.status exported e c.validated_at; simulação selecionada existente; íntegra, não stale, elegível; validated_evidence_hash igual ao hash da simulação. |
| 9. Regras de negócio | RB-CIC-07: declaração humana não integra ERP, não atualiza parâmetros ativos e não comprova ganho. |
| 10. Algoritmo ou transformação | Lock/guardas → revalidar evidência → row.status=applied e applied_at → external_reference trim ou None → c.applied_at → eventos PlanningEvent/WorkEvent e revisão → commit. |
| 11. Arquivo, classe e função | planning_work.py:command ramo applied; PlanningWork.tsx:WorkEditor |
| 12. Endpoint e contrato | POST /api/v1/planning-work/cases/{id}/commands action=applied. |
| 13. Tabelas lidas ou modificadas | Atualiza PlanningCase/WorkCycle e insere ambos eventos; parâmetros ativos permanecem iguais. |
| 14. Saídas e eventos | Aplicação declarada com data e referência externa opcional. |
| 15. Decisões e ramificações | Fonte mudou após emissão: bloquear e revisar evidência, não marcar aplicado automaticamente. |
| 16. Falhas e exceções | 409 estado/evidência/revisão/ciclo; rollback na falha de evento. |
| 17. Pós-condições | Status applied habilita caminho monitoring; não há confirmação de integração externa. |
| 18. Logs, recibos e evidências | PlanningEvent applied com batch_id,cycle_id,declaration_only=True; WorkEvent com antes/depois. |
| 19. Dependências | D07 para início/adoção/simulação/validação; D11 para isolamento/evidência; D09 para modelo; D10/D12 completarão integração/recuperação. |
| 20. Testes e aceite | backend/tests/test_planning_work_p6.py:test_T17_T24_full_i04_emission_frozen_application_and_reopen — asserções lidas: emissão→declaração→acompanhamento→conclusão. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D08-A08 — Concluir acompanhamento administrativo

| Campo | Conteúdo |
|---|---|
| 1. ID | D08-A08 |
| 2. Nome técnico e funcional | Concluir acompanhamento administrativo |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/Backend |
| 5. Evento inicial | Mover para Em acompanhamento e Concluir acompanhamento administrativo. |
| 6. Pré-condições e permissões | Usuário autenticado, workspace próprio, P6 habilitada e esquema disponível para rotas P6; ciclo/revisão conforme atividade. Não executar migração ou habilitação nesta documentação. |
| 7. Entradas, tipos e origem | status monitoring a partir de applied; depois action close e note opcional. |
| 8. Validações | close exige row.status monitoring e c.applied_at; revisão/ciclo atuais. |
| 9. Regras de negócio | RB-CIC-08: conclusão administrativa não revalida matemática nem prova implantação ou benefício. |
| 10. Algoritmo ou transformação | Status applied→monitoring por comando status; close marca c.administrative_closed_at e row.status completed; callback status_changed administrative_only=True; WorkEvent administrative_closed; revisão e commit. |
| 11. Arquivo, classe e função | planning_work.py:command ramos status/close; PlanningWork.tsx:WorkEditor |
| 12. Endpoint e contrato | POST commands action=status,status=monitoring; depois POST commands action=close. |
| 13. Tabelas lidas ou modificadas | Caso, ciclo e eventos; nenhuma alteração de matemática, parâmetros ou histórico P2. |
| 14. Saídas e eventos | completed e data de conclusão administrativa; ciclo segue apontado pelo head até reabrir. |
| 15. Decisões e ramificações | completed não fica vencido; continua incluído na base A do resumo se não descartado. Motivo em close é opcional no contrato atual. |
| 16. Falhas e exceções | 409 se falta etapa/aplicação/revisão; não usar alteração genérica de status para pular para completed. |
| 17. Pós-condições | Acompanhamento encerrado administrativamente, sem apagar histórico. |
| 18. Logs, recibos e evidências | administrative_closed_at, applied_at, evento próprio e status_changed. |
| 19. Dependências | D07 para início/adoção/simulação/validação; D11 para isolamento/evidência; D09 para modelo; D10/D12 completarão integração/recuperação. |
| 20. Testes e aceite | backend/tests/test_planning_work_p6.py:test_T17_T24_full_i04_emission_frozen_application_and_reopen — verifica administrative_closed_at; código das guardas lido. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D08-A09 — Reabrir em novo ciclo e consultar histórico

| Campo | Conteúdo |
|---|---|
| 1. ID | D08-A09 |
| 2. Nome técnico e funcional | Reabrir em novo ciclo e consultar histórico |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/WorkEditor/Backend |
| 5. Evento inicial | Abrir novo ciclo com motivo; Histórico de ciclos e eventos. |
| 6. Pré-condições e permissões | Usuário autenticado, workspace próprio, P6 habilitada e esquema disponível para rotas P6; ciclo/revisão conforme atividade. Não executar migração ou habilitação nesta documentação. |
| 7. Entradas, tipos e origem | Command reopen note com trim≥3 e≤2000; ciclo/revisão atuais. GET detail para histórico. |
| 8. Validações | Origem validated/exported/applied/monitoring/completed/discarded; demais estados já abertos recusados. |
| 9. Regras de negócio | RB-CIC-09: reabertura encerra relação corrente anterior e cria novo ciclo analysis; nenhuma validação/aplicação é herdada. |
| 10. Algoritmo ou transformação | Anterior ended_at e revisão++; evento cycle_ended com snapshot → criar sequência+1 → trocar head → limpar seleção/hash/datas/lote/referência/nota do caso → estado analysis → evento reopen/revisão; commit. Histórico GET ordena ciclos por sequência, eventos por data/id. |
| 11. Arquivo, classe e função | planning_work.py:command ramo reopen,detail; planning_work_models.py:WorkHead/WorkCycle/WorkEvent; PlanningWork.tsx:WorkEditor |
| 12. Endpoint e contrato | POST commands action=reopen; GET /api/v1/planning-work/cases/{id}. |
| 13. Tabelas lidas ou modificadas | Atualiza ciclo anterior/head/caso; cria ciclo e eventos. Simulações, lotes e P2 anteriores permanecem. |
| 14. Saídas e eventos | Novo ciclo com responsável/prazo/próxima ação ausentes por defaults; validação/aplicação/conclusão ausentes; histórico intacto. |
| 15. Decisões e ramificações | Novo ciclo não desfaz declaração externa anterior. old.status é preservado no ciclo encerrado; ended_at indica fim da relação corrente. |
| 16. Falhas e exceções | 409 origem/revisão/ciclo;422 motivo curto; rollback integral em falha. |
| 17. Pós-condições | Trabalho retomado em analysis, com nova simulação/validação necessárias. |
| 18. Logs, recibos e evidências | cycle_ended e reopen; eventos UTC com ator; GUI converte para America/Cuiaba. current_cycle_id é ponteiro aplicativo, sem FK declarada no modelo. |
| 19. Dependências | D07 para início/adoção/simulação/validação; D11 para isolamento/evidência; D09 para modelo; D10/D12 completarão integração/recuperação. |
| 20. Testes e aceite | backend/tests/test_planning_work_p6.py:test_T17_T24_full_i04_emission_frozen_application_and_reopen e test_planning_work_e59.py:test_E59_B01_long_text_snapshot_event_excel_and_old_emission — preservação do emitido e datas vazias do novo ciclo conferidas em asserções. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

