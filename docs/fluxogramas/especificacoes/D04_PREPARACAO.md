# D04 — Preparação e classificação

V02, lote 3, 03/11/2026. Referência Contrato Matemático0.4/E63 e Plano1.36/E64. Código e asserções dos testes foram inspecionados; não houve execução do motor nem dos testes nesta rodada. Aceite técnico P3/E41–E42 e incrementos P4 mantêm seus limites. Aplicabilidade estatística por cliente permanece not_evaluated.

As funções matemáticas operam em memória. Persistência e resolução da população pertencem ao serviço compartilhado. Consulte MEMORIA_MATEMATICA_V3.md para fórmulas e guardas. A classificação segue approved_classifications; a função legada abc_consumption em classifications.py não é a autoridade da coorte V3.

## D04-A01 — Delimitar identidade e período

| Campo | Conteúdo |
|---|---|
| 1. ID | D04-A01 |
| 2. Nome técnico e funcional | Delimitar identidade e período |
| 3. Objetivo e responsabilidade | Executar delimitar identidade e período com dados qualificados e proveniência. |
| 4. Executor | Serviço Python e fornecedor especificado na fonte. |
| 5. Evento inicial | Consulta ou análise solicitada a um consumidor do serviço aprovado. |
| 6. Pré-condições e permissões | Acesso ao material no workspace; estado e guardas indicados na ficha. |
| 7. Entradas, tipos e origem | Material, MaterialMasterData, PlanningParameter opcional; workspace/id/code/location e datas MD. |
| 8. Validações | Data ausente/inválida/invertida ou cadastro/parâmetro de outra identidade torna contexto indisponível. Issues missing_date/invalid_date/inverted_dates/identity_mismatch; parâmetro obrigatório ausente gera missing_parameters. |
| 9. Regras de negócio | R01; período inclusivo exclusivamente initial_stock_date/final_stock_date. |
| 10. Algoritmo/fórmula | Conferir identidade → validar ambas as datas → conferir início≤fim → construir AnalysisContext. |
| 11. Arquivo/classe/função | backend/app/analysis_context.py:prepare_analysis/period_validation |
| 12. Endpoint/contrato | ApprovedAnalysisIn; GET/POST de ficha e POST de análise em /api/v1/approved-math. Classificações em /classifications e /materials/{id}/classifications. Cada fornecedor é chamado internamente. |
| 13. Tabelas | Serviço lê materials, material_master_data, movements, planning_parameters, regras e evidências P2 conforme necessidade. Funções puras não consultam banco; registro é operação distinta D01-A03. |
| 14. Saídas/eventos | identity, period, issues, parâmetros/origens, source_version. |
| 15. Decisões e ramificações | Data ausente/inválida/invertida ou cadastro/parâmetro de outra identidade torna contexto indisponível. |
| 16. Falhas/exceções | Issues missing_date/invalid_date/inverted_dates/identity_mismatch; parâmetro obrigatório ausente gera missing_parameters. |
| 17. Pós-condições | Resultado conserva estado, valores disponíveis, origem e motivos; não aplica automaticamente política ao cadastro. |
| 18. Logs e evidências | Metadados de contexto, versão e dependências; preservação em AnalysisRun somente no caminho de registro/simulação. |
| 19. Dependências | P1 → classificação/serviço → cálculo → projeção; detalhes por fonte e diagrama. |
| 20. Testes e aceite | test_analysis_context.py:test_invalid_dates_never_infer_period_or_classification; test_identity_isolation_provenance_and_fingerprint. Asserções inspecionadas quando indicado no texto; execução atual não realizada. Autoridade documental §3 / R01. |

## D04-A02 — Selecionar movimentos elegíveis

| Campo | Conteúdo |
|---|---|
| 1. ID | D04-A02 |
| 2. Nome técnico e funcional | Selecionar movimentos elegíveis |
| 3. Objetivo e responsabilidade | Executar selecionar movimentos elegíveis com dados qualificados e proveniência. |
| 4. Executor | Serviço Python e fornecedor especificado na fonte. |
| 5. Evento inicial | Consulta ou análise solicitada a um consumidor do serviço aprovado. |
| 6. Pré-condições e permissões | Acesso ao material no workspace; estado e guardas indicados na ficha. |
| 7. Entradas, tipos e origem | Movimentos da posição; source, data, direction, quantity, external_system. |
| 8. Validações | Antes do período pode produzir evidência OUT histórica; depois do período só exclui. Quantidade deve ser finita positiva no P1. Data/direção/semântica/quantidade inválida agrega issue; nenhum movimento é corrigido ou apagado. |
| 9. Regras de negócio | Identidade antecede exposição de dados. Fonte sintética de abertura é excluída. Semântica externa diferente de standard/None bloqueia análise dependente. |
| 10. Algoritmo/fórmula | Ordenar por data/ID → verificar identidade → excluir abertura sintética → janela → direção/sistema/quantidade. |
| 11. Arquivo/classe/função | backend/app/analysis_context.py:prepare_analysis |
| 12. Endpoint/contrato | ApprovedAnalysisIn; GET/POST de ficha e POST de análise em /api/v1/approved-math. Classificações em /classifications e /materials/{id}/classifications. Cada fornecedor é chamado internamente. |
| 13. Tabelas | Serviço lê materials, material_master_data, movements, planning_parameters, regras e evidências P2 conforme necessidade. Funções puras não consultam banco; registro é operação distinta D01-A03. |
| 14. Saídas/eventos | movements, exclusions, prior_outputs; IDs externos ao escopo são ocultados como id=None. |
| 15. Decisões e ramificações | Antes do período pode produzir evidência OUT histórica; depois do período só exclui. Quantidade deve ser finita positiva no P1. |
| 16. Falhas/exceções | Data/direção/semântica/quantidade inválida agrega issue; nenhum movimento é corrigido ou apagado. |
| 17. Pós-condições | Resultado conserva estado, valores disponíveis, origem e motivos; não aplica automaticamente política ao cadastro. |
| 18. Logs e evidências | Metadados de contexto, versão e dependências; preservação em AnalysisRun somente no caminho de registro/simulação. |
| 19. Dependências | P1 → classificação/serviço → cálculo → projeção; detalhes por fonte e diagrama. |
| 20. Testes e aceite | test_analysis_context.py:test_unknown_erp_semantics_not_promoted_to_consumption; test_classifier_rejects_mixed_workspaces_and_synthetic_opening_is_not_supply. Asserções inspecionadas quando indicado no texto; execução atual não realizada. Autoridade documental §3 / R01. |

## D04-A03 — Construir série, saldos e indicadores físicos

| Campo | Conteúdo |
|---|---|
| 1. ID | D04-A03 |
| 2. Nome técnico e funcional | Construir série, saldos e indicadores físicos |
| 3. Objetivo e responsabilidade | Executar construir série, saldos e indicadores físicos com dados qualificados e proveniência. |
| 4. Executor | Serviço Python e fornecedor especificado na fonte. |
| 5. Evento inicial | Consulta ou análise solicitada a um consumidor do serviço aprovado. |
| 6. Pré-condições e permissões | Acesso ao material no workspace; estado e guardas indicados na ficha. |
| 7. Entradas, tipos e origem | Movimentos P1, período n dias, saldo declarado/oficial, custo MD e declaração de completude. |
| 8. Validações | Série existe quando há movimento elegível ou source_complete=True. Sem série, estatísticas dependentes ficam ausentes; zero oficial continua válido. Falta de abertura impede fechamentos/média; falta de custo ou saldo impede valor; fonte vazia não prova demanda zero. |
| 9. Regras de negócio | R02–R05; saldo oficial determina stock_quantity; abertura inferida tem precedência para reconstrução. |
| 10. Algoritmo/fórmula | I=ΣIN; O=ΣOUT; S0 inferido=Sf−I+O; Sd=S0+acumulado líquido; μ=O/n; σ amostral; média de fechamentos e valor Sf×C_MD. |
| 11. Arquivo/classe/função | backend/app/approved_inventory.py:calculate_approved |
| 12. Endpoint/contrato | ApprovedAnalysisIn; GET/POST de ficha e POST de análise em /api/v1/approved-math. Classificações em /classifications e /materials/{id}/classifications. Cada fornecedor é chamado internamente. |
| 13. Tabelas | Serviço lê materials, material_master_data, movements, planning_parameters, regras e evidências P2 conforme necessidade. Funções puras não consultam banco; registro é operação distinta D01-A03. |
| 14. Saídas/eventos | Entradas/saídas, μ, σ, S̄, giro, cobertura, valor e delta de conciliação. |
| 15. Decisões e ramificações | Série existe quando há movimento elegível ou source_complete=True. Sem série, estatísticas dependentes ficam ausentes; zero oficial continua válido. |
| 16. Falhas/exceções | Falta de abertura impede fechamentos/média; falta de custo ou saldo impede valor; fonte vazia não prova demanda zero. |
| 17. Pós-condições | Resultado conserva estado, valores disponíveis, origem e motivos; não aplica automaticamente política ao cadastro. |
| 18. Logs e evidências | Metadados de contexto, versão e dependências; preservação em AnalysisRun somente no caminho de registro/simulação. |
| 19. Dependências | P1 → classificação/serviço → cálculo → projeção; detalhes por fonte e diagrama. |
| 20. Testes e aceite | test_approved_math_p3.py:test_official_balance_accounting_price_daily_mean_and_annual_turnover; test_empty_unknown_source_is_not_zero_demand_but_declared_complete_can_be. Asserções inspecionadas quando indicado no texto; execução atual não realizada. Autoridade documental §4 / R02–R05. |

## D04-A04 — Resolver N/n e frequência PQR

| Campo | Conteúdo |
|---|---|
| 1. ID | D04-A04 |
| 2. Nome técnico e funcional | Resolver N/n e frequência PQR |
| 3. Objetivo e responsabilidade | Executar resolver n/n e frequência pqr com dados qualificados e proveniência. |
| 4. Executor | Serviço Python e fornecedor especificado na fonte. |
| 5. Evento inicial | Consulta ou análise solicitada a um consumidor do serviço aprovado. |
| 6. Pré-condições e permissões | Acesso ao material no workspace; estado e guardas indicados na ficha. |
| 7. Entradas, tipos e origem | Data de cadastro, fim MD, contagens IN/OUT, evidência OUT válida atual/anterior ou preservada P2. |
| 8. Validações | P≥12; Q≥3 e<12; R>0 e<3; S=0 calculável; N/n enquanto 0≤idade<180 sem consumo comprovado. Contexto sem movimento elegível não recebe S/D automaticamente; sem histórico qualificado não inventar evidência. |
| 9. Regras de negócio | R07/R08; padrão180 dias; OUT comprovado até t1 libera N/n. Entrada apenas não libera. Intervalos por evento são distintos do TMEA do ES. |
| 10. Algoritmo/fórmula | Se evidência válida, retirar restrição N/n → contar eventos → comparar 365×contagem com corte×n. |
| 11. Arquivo/classe/função | backend/app/approved_classifications.py:classify_approved/consumption_evidence; classifications.py:pqr_frequency; approved_analysis_service.py:preserved_consumption |
| 12. Endpoint/contrato | ApprovedAnalysisIn; GET/POST de ficha e POST de análise em /api/v1/approved-math. Classificações em /classifications e /materials/{id}/classifications. Cada fornecedor é chamado internamente. |
| 13. Tabelas | Serviço lê materials, material_master_data, movements, planning_parameters, regras e evidências P2 conforme necessidade. Funções puras não consultam banco; registro é operação distinta D01-A03. |
| 14. Saídas/eventos | output_grade P/Q/R/S/N; entry_grade minúscula; frequências anualizadas e evidências de liberação. |
| 15. Decisões e ramificações | P≥12; Q≥3 e<12; R>0 e<3; S=0 calculável; N/n enquanto 0≤idade<180 sem consumo comprovado. |
| 16. Falhas/exceções | Contexto sem movimento elegível não recebe S/D automaticamente; sem histórico qualificado não inventar evidência. |
| 17. Pós-condições | Resultado conserva estado, valores disponíveis, origem e motivos; não aplica automaticamente política ao cadastro. |
| 18. Logs e evidências | Metadados de contexto, versão e dependências; preservação em AnalysisRun somente no caminho de registro/simulação. |
| 19. Dependências | P1 → classificação/serviço → cálculo → projeção; detalhes por fonte e diagrama. |
| 20. Testes e aceite | test_p3_closure_e41.py:test_all_frequency_boundaries_no_event_dedup; test_n_boundary_precedence_and_release. Asserções inspecionadas quando indicado no texto; execução atual não realizada. Autoridade documental §5.2–5.3 / R07–R08. |

## D04-A05 — Classificar ABC na coorte completa

| Campo | Conteúdo |
|---|---|
| 1. ID | D04-A05 |
| 2. Nome técnico e funcional | Classificar ABC na coorte completa |
| 3. Objetivo e responsabilidade | Executar classificar abc na coorte completa com dados qualificados e proveniência. |
| 4. Executor | Serviço Python e fornecedor especificado na fonte. |
| 5. Evento inicial | Consulta ou análise solicitada a um consumidor do serviço aprovado. |
| 6. Pré-condições e permissões | Acesso ao material no workspace; estado e guardas indicados na ficha. |
| 7. Entradas, tipos e origem | Posições do workspace, mesmos pares de datas MD, consumo elegível, custo MD e settings. |
| 8. Validações | Padrão A≤0,80; B>0,80 até0,95; C>0,95. Custo ausente/inválido bloqueia a coorte; PQR já calculado pode permanecer no resultado. abc_cohort_incomplete; custo ausente não vira D. Página/filtro de exibição não redefine a população. |
| 9. Regras de negócio | R06; w=μ×C_MD; acumulado inclui o próprio item; valor zero dá D antes da precedência N. |
| 10. Algoritmo/fórmula | Agrupar datas → exigir todos os membros elegíveis → ordenar w decrescente, SKU/Local/id → acumular usando Fraction → aplicar cortes. |
| 11. Arquivo/classe/função | backend/app/approved_classifications.py:classify_approved/approved_abc |
| 12. Endpoint/contrato | ApprovedAnalysisIn; GET/POST de ficha e POST de análise em /api/v1/approved-math. Classificações em /classifications e /materials/{id}/classifications. Cada fornecedor é chamado internamente. |
| 13. Tabelas | Serviço lê materials, material_master_data, movements, planning_parameters, regras e evidências P2 conforme necessidade. Funções puras não consultam banco; registro é operação distinta D01-A03. |
| 14. Saídas/eventos | abc_consumption, abc_daily_value, cumulative_share, cohort_period/members/status/version. |
| 15. Decisões e ramificações | Padrão A≤0,80; B>0,80 até0,95; C>0,95. Custo ausente/inválido bloqueia a coorte; PQR já calculado pode permanecer no resultado. |
| 16. Falhas/exceções | abc_cohort_incomplete; custo ausente não vira D. Página/filtro de exibição não redefine a população. |
| 17. Pós-condições | Resultado conserva estado, valores disponíveis, origem e motivos; não aplica automaticamente política ao cadastro. |
| 18. Logs e evidências | Metadados de contexto, versão e dependências; preservação em AnalysisRun somente no caminho de registro/simulação. |
| 19. Dependências | P1 → classificação/serviço → cálculo → projeção; detalhes por fonte e diagrama. |
| 20. Testes e aceite | test_p3_closure_e41.py:test_abc_ties_are_deterministic_and_thresholds_exact; test_approved_math_p3.py:test_abc_separates_declared_period_cohorts_and_missing_member_blocks_cohort. Asserções inspecionadas quando indicado no texto; execução atual não realizada. Autoridade documental §5.1 / R06. |

## D04-A06 — Expor declarações e proveniência

| Campo | Conteúdo |
|---|---|
| 1. ID | D04-A06 |
| 2. Nome técnico e funcional | Expor declarações e proveniência |
| 3. Objetivo e responsabilidade | Executar expor declarações e proveniência com dados qualificados e proveniência. |
| 4. Executor | Serviço Python e fornecedor especificado na fonte. |
| 5. Evento inicial | Consulta ou análise solicitada a um consumidor do serviço aprovado. |
| 6. Pré-condições e permissões | Acesso ao material no workspace; estado e guardas indicados na ficha. |
| 7. Entradas, tipos e origem | ABC cliente, XYZ, comprabilidade e suas origens persistidas. |
| 8. Validações | Importador pode persistir defaults X/3; parameter_origins apenas informa a proveniência encontrada. Origem não registrada permanece legacy_unconfirmed; categorias não são médias estatísticas. |
| 9. Regras de negócio | R28; ABC cliente independente da calculada; XYZ é criticidade declarada; comprabilidade é categoria1/2/3. |
| 10. Algoritmo/fórmula | Expor valor declarado e origem → indicar ND/ausência → usar X efetivo com aviso na resolução NS quando aplicável. |
| 11. Arquivo/classe/função | backend/app/analysis_context.py:parameter_origins; approved_service.py:resolve_approved_service |
| 12. Endpoint/contrato | ApprovedAnalysisIn; GET/POST de ficha e POST de análise em /api/v1/approved-math. Classificações em /classifications e /materials/{id}/classifications. Cada fornecedor é chamado internamente. |
| 13. Tabelas | Serviço lê materials, material_master_data, movements, planning_parameters, regras e evidências P2 conforme necessidade. Funções puras não consultam banco; registro é operação distinta D01-A03. |
| 14. Saídas/eventos | metadata de declaração, origem customer/agro_mro_default/legacy_unconfirmed; xyz_original/xyz_used. |
| 15. Decisões e ramificações | Importador pode persistir defaults X/3; parameter_origins apenas informa a proveniência encontrada. |
| 16. Falhas/exceções | Origem não registrada permanece legacy_unconfirmed; categorias não são médias estatísticas. |
| 17. Pós-condições | Resultado conserva estado, valores disponíveis, origem e motivos; não aplica automaticamente política ao cadastro. |
| 18. Logs e evidências | Metadados de contexto, versão e dependências; preservação em AnalysisRun somente no caminho de registro/simulação. |
| 19. Dependências | P1 → classificação/serviço → cálculo → projeção; detalhes por fonte e diagrama. |
| 20. Testes e aceite | test_service_classifications_i02.py:test_shared_read_api_filter_identity_and_declared_defaults localizado; cobertura detalhada pendente. Asserções inspecionadas quando indicado no texto; execução atual não realizada. Autoridade documental §5.4 / R28. |

