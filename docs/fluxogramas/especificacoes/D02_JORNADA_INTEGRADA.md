# D02 — Jornada integrada do cliente

V02 / lote6 / 03-11-2026. Referência Plano1.36/E64, contrato0.4/E63. Integração documental dos lotes anteriores, sem nova execução, gravação operacional ou homologação. P7/E64 conserva reteste humano pendente na referência documental. Diagramas são modelos inspecionados, não traces de execução.

## D02-A01 — Acessar ambiente e resolver sessão

| Campo | Conteúdo |
|---|---|
| 1. ID | D02-A01 |
| 2. Nome técnico e funcional | Acessar ambiente e resolver sessão |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/Frontend/API |
| 5. Evento inicial | Entrar com conta existente. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | LoginIn email/password; token retornado, sem reproduzir credenciais nos documentos. |
| 8. Validações | Senha verificada por PBKDF2; token assinado/expiração; usuário existente. APP_SECRET obrigatório no ambiente. |
| 9. Regras de negócio | RB-INT-01: sessão e workspace governam consultas; trocar sessão invalida estado privado de navegação. |
| 10. Algoritmo ou transformação | Login → verificar usuário/senha → token → setToken → consultas autenticadas. Demo é fluxo separado que cria dados demonstrativos. |
| 11. Arquivo, classe e função | frontend/src/App.tsx e api.ts; backend/app/main.py:login,current_user; security.py:verify_password,create_token,decode_token |
| 12. Endpoint e contrato | POST /api/v1/auth/login; GET /api/v1/me; chamadas privadas Bearer. |
| 13. Tabelas lidas ou modificadas | users/workspaces lidos no login/me; demo/register escrevem e não são necessários para entrar. |
| 14. Saídas e eventos | Sessão e menu Visão geral/Materiais/Importar dados/Planejamento. |
| 15. Decisões e ramificações | 401: autenticar novamente; não restaurar resultado privado antigo como atual. |
| 16. Falhas e exceções | api.ts limpa token em401 e emite eventos; upload/download por fetch direto têm comportamento próprio D11/D12. |
| 17. Pós-condições | Ambiente acessível não significa operação ou dados homologados. |
| 18. Logs, recibos e evidências | Nenhuma senha/token em exemplos; estado técnico de sessão, não evidência P2. |
| 19. Dependências | Subprocessos referidos nos campos; consultar índice V02 e manual de transferência. Estados/fórmulas são os das respectivas autoridades. |
| 20. Testes e aceite | backend/tests/test_security_configuration.py:test_tokens_use_configured_secret_and_reject_tampering — localizado; fluxo current_user/security inspecionado. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D02-A02 — Carregar dados e revisar resultado

| Campo | Conteúdo |
|---|---|
| 1. ID | D02-A02 |
| 2. Nome técnico e funcional | Carregar dados e revisar resultado |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/ImportPage/API |
| 5. Evento inicial | Importar dados: selecionar tipo e arquivo ou tabela. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Cadastro Mestre/Extrato/pedidos conforme tipo; linhas, Local, source_file_id/hash; append/replace; confirm. |
| 8. Validações | Prévia e confirmação revalidam. SKU + Local textual dentro do workspace. Regras completas D03. |
| 9. Regras de negócio | RB-INT-02: prévia de arquivo preserva fonte; prévia de tabela não aplica dataset; confirmação é decisão explícita. |
| 10. Algoritmo ou transformação | Carregar → revisar linhas/colunas/padrões → corrigir se necessário → confirmar → conferir recibo completed/blocked/failed. |
| 11. Arquivo, classe e função | frontend/src/App.tsx:ImportPage; ImportLineagePanel.tsx; backend/app/main.py:file_import_preview,table_import,import_with_receipt |
| 12. Endpoint e contrato | POST /imports/file; POST /imports/table; GET /lineage/receipts (prefixo /api/v1). |
| 13. Tabelas lidas ou modificadas | Fontes/recibos/versões P2 e tabelas do dataset conforme D03; fonte original preservada. |
| 14. Saídas e eventos | Resultado por linha e versões; dados ativos somente conforme confirmação bem-sucedida. |
| 15. Decisões e ramificações | Pendência: corrigir origem e reenviar; replace explícito conserva histórico. preview_matches=false informa diferença sem rejeição automática. |
| 16. Falhas e exceções | 413/422/503; failed pode gerar recibo separado; not_persisted não é sucesso; rede incerta exige consulta. |
| 17. Pós-condições | Carga válida encaminha D06; bloqueio não autoriza fabricar valores. |
| 18. Logs, recibos e evidências | Recibo, fonte e histórico consultáveis; limites no contrato de importação. |
| 19. Dependências | Subprocessos referidos nos campos; consultar índice V02 e manual de transferência. Estados/fórmulas são os das respectivas autoridades. |
| 20. Testes e aceite | backend/tests/test_lineage_p2.py:test_blocked_import_retains_raw_rejected_and_not_applied_rows — localizado; wrapper relido nesta rodada, asserções específicas remetem ao lote2. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D02-A03 — Consultar indicadores e aprofundar posição

| Campo | Conteúdo |
|---|---|
| 1. ID | D02-A03 |
| 2. Nome técnico e funcional | Consultar indicadores e aprofundar posição |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/Frontend/serviço/motor |
| 5. Evento inicial | Abrir Visão geral ou Materiais após carga. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Filtros, identidade, fingerprint e recorte visual. |
| 8. Validações | Coorte integral antes do filtro; mesmo contexto dos membros/ficha; requireReviewedSheet antes da publicação. |
| 9. Regras de negócio | RB-INT-03: NC não é zero; consulta não grava proposta; trajetória atual não é replay histórico. |
| 10. Algoritmo ou transformação | Indicador → membros → ficha → métodos/estatística → Trilha do Estoque → avaliar alternativa D07. |
| 11. Arquivo, classe e função | ApprovedDashboard.tsx; App.tsx:MaterialsPage/MaterialDetail; approved_dashboard.py; approved_material_sheet.py; approved_temporal.py |
| 12. Endpoint e contrato | GET /approved-math/dashboard; GET /approved-math/materials/{id}/sheet e /temporal. |
| 13. Tabelas lidas ou modificadas | Somente leitura das fontes; sem AnalysisRun por abrir ficha. |
| 14. Saídas e eventos | Indicadores disponíveis com unidade/base/data/origem e motivos dos ausentes. |
| 15. Decisões e ramificações | Dados insuficientes: física consultável quando permitida; política NC; retorno para correção de fonte/parâmetros apropriados. |
| 16. Falhas e exceções | 409 contexto mudou;422 fonte/recorte; ficha inválida recusada; não usar dado obsoleto como atual. |
| 17. Pós-condições | Cliente compreende base e limite da decisão. |
| 18. Logs, recibos e evidências | context_hash/dependency_fingerprint; versões e memória D06. |
| 19. Dependências | Subprocessos referidos nos campos; consultar índice V02 e manual de transferência. Estados/fórmulas são os das respectivas autoridades. |
| 20. Testes e aceite | Testes de dashboard/ficha/temporal ligados em D06; não reexecutados nem nova navegação nesta rodada. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D02-A04 — Simular e validar decisão

| Campo | Conteúdo |
|---|---|
| 1. ID | D02-A04 |
| 2. Nome técnico e funcional | Simular e validar decisão |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/MaterialPlanningPanel/I04/P6 |
| 5. Evento inicial | Testar uma alternativa. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Overrides omitido/null/valor; revisões, ciclo, simulação selecionada, fingerprint e justificativa. |
| 8. Validações | Contexto do rascunho; reconferência frontend; guardas transacionais backend; elegibilidade matemática. |
| 9. Regras de negócio | RB-INT-04: referência/proposta preservadas; validar não aplica no ERP nem salva parâmetros ativos. |
| 10. Algoritmo ou transformação | Iniciar/adotar caso → editar → reconferir → calcular e guardar → comparar → justificar → validar selecionada. |
| 11. Arquivo, classe e função | ApprovedPlanning.tsx; planningInput.ts; analysisCommand.ts; approved_planning.py; planning_work.py |
| 12. Endpoint e contrato | GET plano/capacidade; POST simulate ou commands simulate; POST validate ou commands validate. |
| 13. Tabelas lidas ou modificadas | Caso, simulação, P2, eventos e ciclo conforme modo; ativo preservado. |
| 14. Saídas e eventos | Decisão validada ou proposta preservada inelegível com motivo. |
| 15. Decisões e ramificações | stale/conflito/NC: revisar e simular novamente; legado/P6 dependem de capacidade. |
| 16. Falhas e exceções | 409 revisão/seleção/evidência;422 domínio;503 capacidade; resposta perdida consultar. |
| 17. Pós-condições | Validação humana separada de aplicabilidade estatística. |
| 18. Logs, recibos e evidências | IDs P2 referência/proposta, fingerprint e eventos; D07. |
| 19. Dependências | Subprocessos referidos nos campos; consultar índice V02 e manual de transferência. Estados/fórmulas são os das respectivas autoridades. |
| 20. Testes e aceite | test_approved_planning_i04.py e testes P6 rastreados em D07/D08; nenhuma execução nesta rodada. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D02-A05 — Emitir e acompanhar aplicação declarada

| Campo | Conteúdo |
|---|---|
| 1. ID | D02-A05 |
| 2. Nome técnico e funcional | Emitir e acompanhar aplicação declarada |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/WorkPage/API/navegador |
| 5. Evento inicial | Decisão validada disponível na fila. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Seleção da página, revisões; referência externa opcional; motivo de reabertura. |
| 8. Validações | Todos os membros elegíveis/atuais; ciclo validado; declaração após export; conclusão após monitoring e applied_at. |
| 9. Regras de negócio | RB-INT-05: emissão, recepção, aplicação declarada e ganho real são diferentes. |
| 10. Algoritmo ou transformação | Selecionar → emitir atomicamente → conferir recepção → declarar aplicação → acompanhar → concluir/reabrir. |
| 11. Arquivo, classe e função | PlanningWork.tsx; ExportDownload.tsx; planning_work_api.py; planning_work.py; main.py:emit_planning_export |
| 12. Endpoint e contrato | POST /planning-work/export.xlsx; POST commands applied/status/close/reopen. |
| 13. Tabelas lidas ou modificadas | Lote/casos/ciclos/eventos; binário não armazenado de forma durável; sem PUT ativo. |
| 14. Saídas e eventos | Excel contextual, histórico e estados D08. |
| 15. Decisões e ramificações | Falha de entrega: consulta do estado; não reenviar automaticamente. Reabertura cria ciclo novo e preserva anterior. |
| 16. Falhas e exceções | 409 conjunto/revisão/stale;422 entrada;uncertain bloqueia novo POST no componente. |
| 17. Pós-condições | Registro administrativo não comprova integração externa. |
| 18. Logs, recibos e evidências | batch_id/metadados congelados/eventos UTC; D08. |
| 19. Dependências | Subprocessos referidos nos campos; consultar índice V02 e manual de transferência. Estados/fórmulas são os das respectivas autoridades. |
| 20. Testes e aceite | test_planning_work_e59.py e test_T17_T24_full_i04_emission_frozen_application_and_reopen rastreados no lote5. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

