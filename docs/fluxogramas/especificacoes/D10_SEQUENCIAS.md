# D10 — Sequências de chamadas

V02 / lote6 / 03-11-2026. Referência Plano1.36/E64, contrato0.4/E63. Integração documental dos lotes anteriores, sem nova execução, gravação operacional ou homologação. P7/E64 conserva reteste humano pendente na referência documental. Diagramas são modelos inspecionados, não traces de execução.

## D10-A01 — Confirmar importação

| Campo | Conteúdo |
|---|---|
| 1. ID | D10-A01 |
| 2. Nome técnico e funcional | Confirmar importação |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Participantes nomeados na sequência |
| 5. Evento inicial | POST /api/v1/imports/table |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Contratos detalhados no subprocesso D03; API_IMPORTACAO_E_LINHAGEM.md. Identidades/revisões são provenientes da consulta, não fabricadas. |
| 8. Validações | Autenticação/workspace e guardas específicas nas mensagens/alternativas. |
| 9. Regras de negócio | RB-SEQ-01: preservar a ordem observada e a fronteira de commit; retorno não é uma segunda ação de negócio. |
| 10. Algoritmo ou transformação | confirm=true + linhas e origem → begin_transaction; capture_all ANTES do try → execute(payload,user,db) → validar / preservar recibo e aplicar conforme D03 → resultado e versões / commit do caminho → completed ou HTTPException bloqueante → resposta/recibo |
| 11. Arquivo, classe e função | main.py:table_import/import_with_receipt/_table_import; lineage.py |
| 12. Endpoint e contrato | POST /api/v1/imports/table |
| 13. Tabelas lidas ou modificadas | Fontes e tabelas dos subprocessos referidos; setas de persistência distinguem leitura/escrita. |
| 14. Saídas e eventos | Retorno da rota com estado/evidência do subprocesso. |
| 15. Decisões e ramificações | ALT: exceção dentro do try e sem recibo committed → rollback; begin_receipt failed_attempt + finish_receipt + commit separados. Falha secundária → not_persisted. Exceção inicial de lock/capture não passa por esse wrapper. |
| 16. Falhas e exceções | ALT: exceção dentro do try e sem recibo committed → rollback; begin_receipt failed_attempt + finish_receipt + commit separados. Falha secundária → not_persisted. Exceção inicial de lock/capture não passa por esse wrapper. |
| 17. Pós-condições | Estado resultante do subprocesso, sem efeitos adicionais pela documentação. |
| 18. Logs, recibos e evidências | Sequência derivada das funções locais; fontes e hashes no manifesto. |
| 19. Dependências | Subprocessos referidos nos campos; consultar índice V02 e manual de transferência. Estados/fórmulas são os das respectivas autoridades. |
| 20. Testes e aceite | Referências de teste e asserções nos subprocessos D03; API_IMPORTACAO_E_LINHAGEM.md. Diagrama não é uma captura de tráfego; não houve execução nesta rodada. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D10-A02 — Ler dashboard e abrir ficha

| Campo | Conteúdo |
|---|---|
| 1. ID | D10-A02 |
| 2. Nome técnico e funcional | Ler dashboard e abrir ficha |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Participantes nomeados na sequência |
| 5. Evento inicial | GET dashboard; GET sheet com expected_dependency |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Contratos detalhados no subprocesso D04–D06; fontes SQL inspecionadas nos lotes anteriores. Identidades/revisões são provenientes da consulta, não fabricadas. |
| 8. Validações | Autenticação/workspace e guardas específicas nas mensagens/alternativas. |
| 9. Regras de negócio | RB-SEQ-02: preservar a ordem observada e a fronteira de commit; retorno não é uma segunda ação de negócio. |
| 10. Algoritmo ou transformação | GET dashboard com filtros → abrir snapshot consistente → project_sheets(project_dashboard_input) → carregar população/dependências → resultados por posição / projeção compacta → ler preferências dos casos de controle → DTO agregado + fingerprints → GET sheet(id, expected_dependency) → read_material_analysis(stored=True) → leitura → project_sheet + fingerprint → 200 ficha ou409 contexto mudou |
| 11. Arquivo, classe e função | approved_math_api.py:dashboard/sheet; approved_dashboard.py:dashboard_read; approved_analysis_service.py:project_sheets; approved_material_sheet.py:project_sheet |
| 12. Endpoint e contrato | GET dashboard; GET sheet com expected_dependency |
| 13. Tabelas lidas ou modificadas | Fontes e tabelas dos subprocessos referidos; setas de persistência distinguem leitura/escrita. |
| 14. Saídas e eventos | Retorno da rota com estado/evidência do subprocesso. |
| 15. Decisões e ramificações | Consultas sem record/capture. Filtro visual ocorre após classificação integral. requireReviewedSheet no frontend recusa DTO incompleto;422 P1 pode impedir ficha; nenhuma escrita por consulta. |
| 16. Falhas e exceções | Consultas sem record/capture. Filtro visual ocorre após classificação integral. requireReviewedSheet no frontend recusa DTO incompleto;422 P1 pode impedir ficha; nenhuma escrita por consulta. |
| 17. Pós-condições | Estado resultante do subprocesso, sem efeitos adicionais pela documentação. |
| 18. Logs, recibos e evidências | Sequência derivada das funções locais; fontes e hashes no manifesto. |
| 19. Dependências | Subprocessos referidos nos campos; consultar índice V02 e manual de transferência. Estados/fórmulas são os das respectivas autoridades. |
| 20. Testes e aceite | Referências de teste e asserções nos subprocessos D04–D06; fontes SQL inspecionadas nos lotes anteriores. Diagrama não é uma captura de tráfego; não houve execução nesta rodada. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D10-A03 — Preservar simulação P6

| Campo | Conteúdo |
|---|---|
| 1. ID | D10-A03 |
| 2. Nome técnico e funcional | Preservar simulação P6 |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Participantes nomeados na sequência |
| 5. Evento inicial | POST /planning-work/cases/{id}/commands action=simulate |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Contratos detalhados no subprocesso D07-A04/A05; matemática exclusivamente D05. Identidades/revisões são provenientes da consulta, não fabricadas. |
| 8. Validações | Autenticação/workspace e guardas específicas nas mensagens/alternativas. |
| 9. Regras de negócio | RB-SEQ-03: preservar a ordem observada e a fronteira de commit; retorno não é uma segunda ação de negócio. |
| 10. Algoritmo ou transformação | POST após reconferência; ciclo +2revisões → lock; current/check revisão de trabalho → simulate(commit=False; revisão de decisão) → conferir caso/estado/revisão; ler fontes → calcular referência e proposta; dependências iguais → capture_all; preservar2AnalysisRun + simulação → selecionar teste; testing; evento simulated; flush → simulação preservada, sem commit interno → sincronizar ciclo/revisão/evento; commit → 200; UI reconsulta detalhe |
| 11. Arquivo, classe e função | planning_work.py:command; approved_planning.py:simulate/_preserve; approved_math_api.py:read_material_analysis |
| 12. Endpoint e contrato | POST /planning-work/cases/{id}/commands action=simulate |
| 13. Tabelas lidas ou modificadas | Fontes e tabelas dos subprocessos referidos; setas de persistência distinguem leitura/escrita. |
| 14. Saídas e eventos | Retorno da rota com estado/evidência do subprocesso. |
| 15. Decisões e ramificações | ALT erro → rollback externo; ValidationError do comando vira422 invalid_planning_proposal. Caminho legado usa simulate(commit=True) após legacy_guard e retorna201; não duplicar commits. |
| 16. Falhas e exceções | ALT erro → rollback externo; ValidationError do comando vira422 invalid_planning_proposal. Caminho legado usa simulate(commit=True) após legacy_guard e retorna201; não duplicar commits. |
| 17. Pós-condições | Estado resultante do subprocesso, sem efeitos adicionais pela documentação. |
| 18. Logs, recibos e evidências | Sequência derivada das funções locais; fontes e hashes no manifesto. |
| 19. Dependências | Subprocessos referidos nos campos; consultar índice V02 e manual de transferência. Estados/fórmulas são os das respectivas autoridades. |
| 20. Testes e aceite | Referências de teste e asserções nos subprocessos D07-A04/A05; matemática exclusivamente D05. Diagrama não é uma captura de tráfego; não houve execução nesta rodada. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D10-A04 — Validar proposta P6

| Campo | Conteúdo |
|---|---|
| 1. ID | D10-A04 |
| 2. Nome técnico e funcional | Validar proposta P6 |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Participantes nomeados na sequência |
| 5. Evento inicial | POST commands action=validate |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Contratos detalhados no subprocesso D07-A07; API e guardas do laboratório. Identidades/revisões são provenientes da consulta, não fabricadas. |
| 8. Validações | Autenticação/workspace e guardas específicas nas mensagens/alternativas. |
| 9. Regras de negócio | RB-SEQ-04: preservar a ordem observada e a fronteira de commit; retorno não é uma segunda ação de negócio. |
| 10. Algoritmo ou transformação | simulação/fingerprint/justificativa + revisões → lock; caso/ciclo/revisão de trabalho → validate(commit=False) → seleção vigente + revisão decisão; fontes P1 → ler snapshots; integridade e dependências atuais → stale? elegível? justificativa trim≥10? → validated/hash/data/nota; evento; flush → caso validado sem commit interno → ciclo.validated_at/revisão/evento; commit → 200; nova consulta |
| 11. Arquivo, classe e função | planning_work.py:command; approved_planning.py:validate/simulation_state |
| 12. Endpoint e contrato | POST commands action=validate |
| 13. Tabelas lidas ou modificadas | Fontes e tabelas dos subprocessos referidos; setas de persistência distinguem leitura/escrita. |
| 14. Saídas e eventos | Retorno da rota com estado/evidência do subprocesso. |
| 15. Decisões e ramificações | ALT409 seleção/fingerprint/stale/NC;422 P1/justificativa; falha de evento → rollback. Validação não modifica parâmetros ativos e não chama ERP. |
| 16. Falhas e exceções | ALT409 seleção/fingerprint/stale/NC;422 P1/justificativa; falha de evento → rollback. Validação não modifica parâmetros ativos e não chama ERP. |
| 17. Pós-condições | Estado resultante do subprocesso, sem efeitos adicionais pela documentação. |
| 18. Logs, recibos e evidências | Sequência derivada das funções locais; fontes e hashes no manifesto. |
| 19. Dependências | Subprocessos referidos nos campos; consultar índice V02 e manual de transferência. Estados/fórmulas são os das respectivas autoridades. |
| 20. Testes e aceite | Referências de teste e asserções nos subprocessos D07-A07; API e guardas do laboratório. Diagrama não é uma captura de tráfego; não houve execução nesta rodada. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D10-A05 — Emitir lote e entregar arquivo

| Campo | Conteúdo |
|---|---|
| 1. ID | D10-A05 |
| 2. Nome técnico e funcional | Emitir lote e entregar arquivo |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Participantes nomeados na sequência |
| 5. Evento inicial | POST /planning-work/export.xlsx |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Contratos detalhados no subprocesso D08-A04–A06; contrato de emissão. Identidades/revisões são provenientes da consulta, não fabricadas. |
| 8. Validações | Autenticação/workspace e guardas específicas nas mensagens/alternativas. |
| 9. Regras de negócio | RB-SEQ-05: preservar a ordem observada e a fronteira de commit; retorno não é uma segunda ação de negócio. |
| 10. Algoritmo ou transformação | members explícitos com revisões → lock; conferir todos; freeze metadados → emit_export(selected_ids,commit=False) → ler casos workspace e evidências; conjunto exato → montar4abas; gerar bytes antes do commit → lote/casos exported/eventos; flush → Response pronta, sem commit interno → ciclos/revisões/emitted; commit → X-Planning-Batch + XLSX → blob/link; consultar estado; sem retry |
| 11. Arquivo, classe e função | planning_work_api.py:export; main.py:emit_planning_export; ExportDownload.tsx |
| 12. Endpoint e contrato | POST /planning-work/export.xlsx |
| 13. Tabelas lidas ou modificadas | Fontes e tabelas dos subprocessos referidos; setas de persistência distinguem leitura/escrita. |
| 14. Saídas e eventos | Retorno da rota com estado/evidência do subprocesso. |
| 15. Decisões e ramificações | ALT erro anterior ao commit → rollback integral. Transporte pós-commit pode falhar: lote existente, recepção incerta. Pendências usa workspace; não há binário durável garantido. |
| 16. Falhas e exceções | ALT erro anterior ao commit → rollback integral. Transporte pós-commit pode falhar: lote existente, recepção incerta. Pendências usa workspace; não há binário durável garantido. |
| 17. Pós-condições | Estado resultante do subprocesso, sem efeitos adicionais pela documentação. |
| 18. Logs, recibos e evidências | Sequência derivada das funções locais; fontes e hashes no manifesto. |
| 19. Dependências | Subprocessos referidos nos campos; consultar índice V02 e manual de transferência. Estados/fórmulas são os das respectivas autoridades. |
| 20. Testes e aceite | Referências de teste e asserções nos subprocessos D08-A04–A06; contrato de emissão. Diagrama não é uma captura de tráfego; não houve execução nesta rodada. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

