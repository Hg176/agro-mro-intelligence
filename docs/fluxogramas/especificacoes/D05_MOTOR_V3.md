# D05 — Motor matemático V3

V02, lote 3, 03/11/2026. Referência Contrato Matemático0.4/E63 e Plano1.36/E64. Código e asserções dos testes foram inspecionados; não houve execução do motor nem dos testes nesta rodada. Aceite técnico P3/E41–E42 e incrementos P4 mantêm seus limites. Aplicabilidade estatística por cliente permanece not_evaluated.

As funções matemáticas operam em memória. Persistência e resolução da população pertencem ao serviço compartilhado. Consulte MEMORIA_MATEMATICA_V3.md para fórmulas e guardas. A classificação segue approved_classifications; a função legada abc_consumption em classifications.py não é a autoridade da coorte V3.

## D05-A01 — Montar parâmetros efetivos

| Campo | Conteúdo |
|---|---|
| 1. ID | D05-A01 |
| 2. Nome técnico e funcional | Montar parâmetros efetivos |
| 3. Objetivo e responsabilidade | Executar montar parâmetros efetivos com dados qualificados e proveniência. |
| 4. Executor | Serviço Python e fornecedor especificado na fonte. |
| 5. Evento inicial | Consulta ou análise solicitada a um consumidor do serviço aprovado. |
| 6. Pré-condições e permissões | Acesso ao material no workspace; estado e guardas indicados na ficha. |
| 7. Entradas, tipos e origem | Payload com campos omitidos, null ou zero; parâmetros ativos; material e MD. |
| 8. Validações | LT/cenário efetivo None rejeitado no caminho estrito. Ficha admite physical_only só para ausências fundamentais elegíveis. 422 analysis_unavailable/required_parameter_missing; extra=forbid e validadores Pydantic rejeitam domínio inválido. |
| 9. Regras de negócio | Payload usa exclude_unset=True. Omissão mantém armazenado; null explícito pode remover insumo. Serviço manual zero é preservado. |
| 10. Algoritmo/fórmula | Preparar P1 com parâmetros exigidos → sobrepor somente campos enviados → resolver NS → aplicar datas/saldo/custo dos MD → chamar motor. |
| 11. Arquivo/classe/função | backend/app/approved_analysis_service.py:ApprovedAnalysisService._prepare/_sheet_from_population; approved_analysis_contract.py:ApprovedAnalysisIn |
| 12. Endpoint/contrato | ApprovedAnalysisIn; GET/POST de ficha e POST de análise em /api/v1/approved-math. Classificações em /classifications e /materials/{id}/classifications. Cada fornecedor é chamado internamente. |
| 13. Tabelas | Serviço lê materials, material_master_data, movements, planning_parameters, regras e evidências P2 conforme necessidade. Funções puras não consultam banco; registro é operação distinta D01-A03. |
| 14. Saídas/eventos | Parâmetros efetivos, simulation_overrides, effective_parameter_origins e resultado. |
| 15. Decisões e ramificações | LT/cenário efetivo None rejeitado no caminho estrito. Ficha admite physical_only só para ausências fundamentais elegíveis. |
| 16. Falhas/exceções | 422 analysis_unavailable/required_parameter_missing; extra=forbid e validadores Pydantic rejeitam domínio inválido. |
| 17. Pós-condições | Resultado conserva estado, valores disponíveis, origem e motivos; não aplica automaticamente política ao cadastro. |
| 18. Logs e evidências | Metadados de contexto, versão e dependências; preservação em AnalysisRun somente no caminho de registro/simulação. |
| 19. Dependências | P1 → classificação/serviço → cálculo → projeção; detalhes por fonte e diagrama. |
| 20. Testes e aceite | test_p3_closure_e41.py:test_api_invalid_parameter_domains_do_not_create_analysis; test_approved_math_p3.py:test_absent_review_preserves_only_methods_with_sufficient_inputs. Asserções inspecionadas quando indicado no texto; execução atual não realizada. Autoridade documental §7 e §11.3 / R26. |

## D05-A02 — Resolver NS e habilitar política

| Campo | Conteúdo |
|---|---|
| 1. ID | D05-A02 |
| 2. Nome técnico e funcional | Resolver NS e habilitar política |
| 3. Objetivo e responsabilidade | Executar resolver ns e habilitar política com dados qualificados e proveniência. |
| 4. Executor | Serviço Python e fornecedor especificado na fonte. |
| 5. Evento inicial | Consulta ou análise solicitada a um consumidor do serviço aprovado. |
| 6. Pré-condições e permissões | Acesso ao material no workspace; estado e guardas indicados na ficha. |
| 7. Entradas, tipos e origem | NS/origem armazenados ou override; ABC/PQR/XYZ; matriz privada/padrão; LT e n. |
| 8. Validações | NS=0 válido mas sem inversa normal; NS=0,5 admite Z=0. Chave privada ausente não recebe padrão. service_origin_unconfirmed, classification_missing_or_invalid, matrix_key_missing, service_level_invalid, service_level_zero. |
| 9. Regras de negócio | R09; manual explícito > matriz privada existente > padrão. Fonte legada None retorna indisponível antes da matriz. |
| 10. Algoritmo/fórmula | Resolver chave PQR+ABC+XYZ → validar NS=0 ou 0,5≤NS<1 → exigir série, n≥max(2,LT), NS>0 e modo estrito. |
| 11. Arquivo/classe/função | backend/app/approved_service.py:resolve_approved_service; approved_inventory.py:calculate_approved |
| 12. Endpoint/contrato | ApprovedAnalysisIn; GET/POST de ficha e POST de análise em /api/v1/approved-math. Classificações em /classifications e /materials/{id}/classifications. Cada fornecedor é chamado internamente. |
| 13. Tabelas | Serviço lê materials, material_master_data, movements, planning_parameters, regras e evidências P2 conforme necessidade. Funções puras não consultam banco; registro é operação distinta D01-A03. |
| 14. Saídas/eventos | service_level_resolution; policy_ready; service_factor Z quando habilitado. |
| 15. Decisões e ramificações | NS=0 válido mas sem inversa normal; NS=0,5 admite Z=0. Chave privada ausente não recebe padrão. |
| 16. Falhas/exceções | service_origin_unconfirmed, classification_missing_or_invalid, matrix_key_missing, service_level_invalid, service_level_zero. |
| 17. Pós-condições | Resultado conserva estado, valores disponíveis, origem e motivos; não aplica automaticamente política ao cadastro. |
| 18. Logs e evidências | Metadados de contexto, versão e dependências; preservação em AnalysisRun somente no caminho de registro/simulação. |
| 19. Dependências | P1 → classificação/serviço → cálculo → projeção; detalhes por fonte e diagrama. |
| 20. Testes e aceite | test_approved_math_p3.py:test_service_manual_zero_legacy_unknown_and_private_matrix_missing; test_zero_service_preserves_manual_and_physical_without_inverse_normal; test_half_service_is_legitimate_zero_z_and_deviation_missing_differs_from_zero. Asserções inspecionadas quando indicado no texto; execução atual não realizada. Autoridade documental §6–7 / R09,R26. |

## D05-A03 — Calcular quantis e TMEA da demanda

| Campo | Conteúdo |
|---|---|
| 1. ID | D05-A03 |
| 2. Nome técnico e funcional | Calcular quantis e TMEA da demanda |
| 3. Objetivo e responsabilidade | Executar calcular quantis e tmea da demanda com dados qualificados e proveniência. |
| 4. Executor | Serviço Python e fornecedor especificado na fonte. |
| 5. Evento inicial | Consulta ou análise solicitada a um consumidor do serviço aprovado. |
| 6. Pré-condições e permissões | Acesso ao material no workspace; estado e guardas indicados na ficha. |
| 7. Entradas, tipos e origem | Série diária Decimal, W inteiro, NS positivo; janelas LT e R. |
| 8. Validações | n<W dá quantil ausente; nenhum dia positivo dá TMEA ausente; LT e R têm guardas independentes. Ausência de R afeta métodos dependentes de R; sobreposição não prova independência estatística. |
| 9. Regras de negócio | Quantil sem interpolação; janelas móveis sobrepostas. TMEA ES usa dias positivos k. |
| 10. Algoritmo/fórmula | Somar janelas W → ordenar m=n−W+1 somas → posição ceil(NS×m), limitada à amostra. TMEA=n/k. |
| 11. Arquivo/classe/função | backend/app/approved_inventory.py:window_quantile/calculate_approved |
| 12. Endpoint/contrato | ApprovedAnalysisIn; GET/POST de ficha e POST de análise em /api/v1/approved-math. Classificações em /classifications e /materials/{id}/classifications. Cada fornecedor é chamado internamente. |
| 13. Tabelas | Serviço lê materials, material_master_data, movements, planning_parameters, regras e evidências P2 conforme necessidade. Funções puras não consultam banco; registro é operação distinta D01-A03. |
| 14. Saídas/eventos | Q_NS(LT), Q_NS(R) e TMEA_dias. |
| 15. Decisões e ramificações | n<W dá quantil ausente; nenhum dia positivo dá TMEA ausente; LT e R têm guardas independentes. |
| 16. Falhas/exceções | Ausência de R afeta métodos dependentes de R; sobreposição não prova independência estatística. |
| 17. Pós-condições | Resultado conserva estado, valores disponíveis, origem e motivos; não aplica automaticamente política ao cadastro. |
| 18. Logs e evidências | Metadados de contexto, versão e dependências; preservação em AnalysisRun somente no caminho de registro/simulação. |
| 19. Dependências | P1 → classificação/serviço → cálculo → projeção; detalhes por fonte e diagrama. |
| 20. Testes e aceite | test_approved_math_p3.py:test_fractional_windows_do_not_round_binary_residue_to_extra_lot; test_short_history_and_review_window_are_distinct_guards. Asserções inspecionadas quando indicado no texto; execução atual não realizada. Autoridade documental §7 / R10–R16,R26. |

## D05-A04 — Calcular e selecionar ES

| Campo | Conteúdo |
|---|---|
| 1. ID | D05-A04 |
| 2. Nome técnico e funcional | Calcular e selecionar ES |
| 3. Objetivo e responsabilidade | Executar calcular e selecionar es com dados qualificados e proveniência. |
| 4. Executor | Serviço Python e fornecedor especificado na fonte. |
| 5. Evento inicial | Consulta ou análise solicitada a um consumidor do serviço aprovado. |
| 6. Pré-condições e permissões | Acesso ao material no workspace; estado e guardas indicados na ficha. |
| 7. Entradas, tipos e origem | μ,σ,Z,LT,σLT,TMEA,Q(LT),quantum,cenário e manual. |
| 8. Validações | TMEA exige denominador positivo e σLT; Raiz exige σLT declarado; Motor exige janela LT completa. Método ausente conserva reason; manual exato pode permanecer visível sem habilitar política automática. |
| 9. Regras de negócio | R10–R14; cinco métodos automáticos e manual separado. Brutos, aplicados e escolhido são distintos. |
| 10. Algoritmo/fórmula | Gerar inverse_normal/tmea/root_traditional/factor_traditional/engine → aplicar quantum → cenários → escolher ES. |
| 11. Arquivo/classe/função | backend/app/approved_inventory.py:calculate_approved |
| 12. Endpoint/contrato | ApprovedAnalysisIn; GET/POST de ficha e POST de análise em /api/v1/approved-math. Classificações em /classifications e /materials/{id}/classifications. Cada fornecedor é chamado internamente. |
| 13. Tabelas | Serviço lê materials, material_master_data, movements, planning_parameters, regras e evidências P2 conforme necessidade. Funções puras não consultam banco; registro é operação distinta D01-A03. |
| 14. Saídas/eventos | calculation_methods.safety_stock; safety_stock; selected_sources.safety_stock. |
| 15. Decisões e ramificações | TMEA exige denominador positivo e σLT; Raiz exige σLT declarado; Motor exige janela LT completa. |
| 16. Falhas/exceções | Método ausente conserva reason; manual exato pode permanecer visível sem habilitar política automática. |
| 17. Pós-condições | Resultado conserva estado, valores disponíveis, origem e motivos; não aplica automaticamente política ao cadastro. |
| 18. Logs e evidências | Metadados de contexto, versão e dependências; preservação em AnalysisRun somente no caminho de registro/simulação. |
| 19. Dependências | P1 → classificação/serviço → cálculo → projeção; detalhes por fonte e diagrama. |
| 20. Testes e aceite | test_approved_math_p3.py:test_independent_formula_oracles; test_half_service_is_legitimate_zero_z_and_deviation_missing_differs_from_zero. Asserções inspecionadas quando indicado no texto; execução atual não realizada. Autoridade documental §8 / R10–R14. |

## D05-A05 — Calcular e selecionar PP

| Campo | Conteúdo |
|---|---|
| 1. ID | D05-A05 |
| 2. Nome técnico e funcional | Calcular e selecionar PP |
| 3. Objetivo e responsabilidade | Executar calcular e selecionar pp com dados qualificados e proveniência. |
| 4. Executor | Serviço Python e fornecedor especificado na fonte. |
| 5. Evento inicial | Consulta ou análise solicitada a um consumidor do serviço aprovado. |
| 6. Pré-condições e permissões | Acesso ao material no workspace; estado e guardas indicados na ficha. |
| 7. Entradas, tipos e origem | μ,LT,ES escolhido,Q(LT),quantum,cenário e manual PP. |
| 8. Validações | Manual explícito prevalece; ES indisponível bloqueia o tradicional, mas cada método tem sua própria disponibilidade. ES ausente não vira zero; quantum ausente impede aplicado automático. |
| 9. Regras de negócio | R15/R16; Tradicional usa ES escolhido/aplicado ou manual, não ES bruto arbitrário. |
| 10. Algoritmo/fórmula | Tradicional=μLT+ES escolhido; Motor=Q(LT) → aplicar quantum → cenários → escolher PP. |
| 11. Arquivo/classe/função | backend/app/approved_inventory.py:calculate_approved |
| 12. Endpoint/contrato | ApprovedAnalysisIn; GET/POST de ficha e POST de análise em /api/v1/approved-math. Classificações em /classifications e /materials/{id}/classifications. Cada fornecedor é chamado internamente. |
| 13. Tabelas | Serviço lê materials, material_master_data, movements, planning_parameters, regras e evidências P2 conforme necessidade. Funções puras não consultam banco; registro é operação distinta D01-A03. |
| 14. Saídas/eventos | calculation_methods.reorder_point; reorder_point e origem. |
| 15. Decisões e ramificações | Manual explícito prevalece; ES indisponível bloqueia o tradicional, mas cada método tem sua própria disponibilidade. |
| 16. Falhas/exceções | ES ausente não vira zero; quantum ausente impede aplicado automático. |
| 17. Pós-condições | Resultado conserva estado, valores disponíveis, origem e motivos; não aplica automaticamente política ao cadastro. |
| 18. Logs e evidências | Metadados de contexto, versão e dependências; preservação em AnalysisRun somente no caminho de registro/simulação. |
| 19. Dependências | P1 → classificação/serviço → cálculo → projeção; detalhes por fonte e diagrama. |
| 20. Testes e aceite | test_approved_math_p3.py:test_independent_formula_oracles. Asserções inspecionadas quando indicado no texto; execução atual não realizada. Autoridade documental §9 / R15–R16. |

## D05-A06 — Calcular três máximos da seleção

| Campo | Conteúdo |
|---|---|
| 1. ID | D05-A06 |
| 2. Nome técnico e funcional | Calcular três máximos da seleção |
| 3. Objetivo e responsabilidade | Executar calcular três máximos da seleção com dados qualificados e proveniência. |
| 4. Executor | Serviço Python e fornecedor especificado na fonte. |
| 5. Evento inicial | Consulta ou análise solicitada a um consumidor do serviço aprovado. |
| 6. Pré-condições e permissões | Acesso ao material no workspace; estado e guardas indicados na ficha. |
| 7. Entradas, tipos e origem | ES/PP escolhidos,μ,LT,R,Z,σLT,Q(LT),Q(R),q e cenário. |
| 8. Validações | R/σLT ausentes bloqueiam Agro MRO; janela R curta bloqueia Motor; Tradicional pode continuar. review_period_missing, lead_time_deviation_missing, complete_lead_or_review_window_missing. |
| 9. Regras de negócio | R17–R19; somente traditional, agro_mro e engine compõem cenários de máximo. |
| 10. Algoritmo/fórmula | Tradicional=ES+PP; Agro MRO=ES+μ(LT+R+B), B=max(Z,0)σLT; Motor=Q(LT)+Q(R). |
| 11. Arquivo/classe/função | backend/app/approved_inventory.py:calculate_approved |
| 12. Endpoint/contrato | ApprovedAnalysisIn; GET/POST de ficha e POST de análise em /api/v1/approved-math. Classificações em /classifications e /materials/{id}/classifications. Cada fornecedor é chamado internamente. |
| 13. Tabelas | Serviço lê materials, material_master_data, movements, planning_parameters, regras e evidências P2 conforme necessidade. Funções puras não consultam banco; registro é operação distinta D01-A03. |
| 14. Saídas/eventos | calculation_methods.maximum_stock, maximum_selected e selected_sources. |
| 15. Decisões e ramificações | R/σLT ausentes bloqueiam Agro MRO; janela R curta bloqueia Motor; Tradicional pode continuar. |
| 16. Falhas/exceções | review_period_missing, lead_time_deviation_missing, complete_lead_or_review_window_missing. |
| 17. Pós-condições | Resultado conserva estado, valores disponíveis, origem e motivos; não aplica automaticamente política ao cadastro. |
| 18. Logs e evidências | Metadados de contexto, versão e dependências; preservação em AnalysisRun somente no caminho de registro/simulação. |
| 19. Dependências | P1 → classificação/serviço → cálculo → projeção; detalhes por fonte e diagrama. |
| 20. Testes e aceite | test_approved_math_p3.py:test_absent_review_preserves_only_methods_with_sufficient_inputs; test_short_history_and_review_window_are_distinct_guards. Asserções inspecionadas quando indicado no texto; execução atual não realizada. Autoridade documental §10.1 / R17–R19. |

## D05-A07 — Calcular quatro máximos comparativos

| Campo | Conteúdo |
|---|---|
| 1. ID | D05-A07 |
| 2. Nome técnico e funcional | Calcular quatro máximos comparativos |
| 3. Objetivo e responsabilidade | Executar calcular quatro máximos comparativos com dados qualificados e proveniência. |
| 4. Executor | Serviço Python e fornecedor especificado na fonte. |
| 5. Evento inicial | Consulta ou análise solicitada a um consumidor do serviço aprovado. |
| 6. Pré-condições e permissões | Acesso ao material no workspace; estado e guardas indicados na ficha. |
| 7. Entradas, tipos e origem | H=LT+R, ES_H e referência,μ,σ,Z,σLT,natureza inteira e quantidades OUT. |
| 8. Validações | ES_H exige horizonte igual a H e referência; Poisson exige natureza/OUT inteiros; alvo além da capacidade retorna None. Insumos ausentes/capacidade indisponível dão NC; comparativos não entram em médias ou política selecionada. |
| 9. Regras de negócio | R20–R23; selection_scope comparison_only e applicability not_evaluated. |
| 10. Algoritmo/fórmula | Revisão+ES, normal fixa, normal variável, Poisson unitária conforme memória de fórmulas. Poisson acumula probabilidade para s=0..1000. |
| 11. Arquivo/classe/função | backend/app/approved_inventory.py:calculate_approved/poisson_quantile |
| 12. Endpoint/contrato | ApprovedAnalysisIn; GET/POST de ficha e POST de análise em /api/v1/approved-math. Classificações em /classifications e /materials/{id}/classifications. Cada fornecedor é chamado internamente. |
| 13. Tabelas | Serviço lê materials, material_master_data, movements, planning_parameters, regras e evidências P2 conforme necessidade. Funções puras não consultam banco; registro é operação distinta D01-A03. |
| 14. Saídas/eventos | additional_maximum_methods e effective_if_selected hipotético. |
| 15. Decisões e ramificações | ES_H exige horizonte igual a H e referência; Poisson exige natureza/OUT inteiros; alvo além da capacidade retorna None. |
| 16. Falhas/exceções | Insumos ausentes/capacidade indisponível dão NC; comparativos não entram em médias ou política selecionada. |
| 17. Pós-condições | Resultado conserva estado, valores disponíveis, origem e motivos; não aplica automaticamente política ao cadastro. |
| 18. Logs e evidências | Metadados de contexto, versão e dependências; preservação em AnalysisRun somente no caminho de registro/simulação. |
| 19. Dependências | P1 → classificação/serviço → cálculo → projeção; detalhes por fonte e diagrama. |
| 20. Testes e aceite | test_approved_math_p3.py:test_periodic_es_requires_matching_horizon_and_reference; test_poisson_count_guard_capacity_and_zero_without_capping; test_manual_exact_conflict_and_scenarios_exclude_comparison_and_manual. Asserções inspecionadas quando indicado no texto; execução atual não realizada. Autoridade documental §10.2 / R20–R23. |

## D05-A08 — Aplicar quantum e preservar manuais

| Campo | Conteúdo |
|---|---|
| 1. ID | D05-A08 |
| 2. Nome técnico e funcional | Aplicar quantum e preservar manuais |
| 3. Objetivo e responsabilidade | Executar aplicar quantum e preservar manuais com dados qualificados e proveniência. |
| 4. Executor | Serviço Python e fornecedor especificado na fonte. |
| 5. Evento inicial | Consulta ou análise solicitada a um consumidor do serviço aprovado. |
| 6. Pré-condições e permissões | Acesso ao material no workspace; estado e guardas indicados na ficha. |
| 7. Entradas, tipos e origem | Natureza, unidade declarada, múltiplo, passo fracionário e bruto. |
| 8. Validações | q ausente conserva bruto calculável, aplicado None; q presente arredonda para cima. quantity_quantum_missing; manual_preserved_quantum_missing/incompatible. Zero manual é declaração válida. |
| 9. Regras de negócio | R24; múltiplo positivo > inteiro q=1 > passo fracionário declarado. Mapeamento UN/PC/PECA/PEÇA permite inteiro com origem. |
| 10. Algoritmo/fórmula | A(x)=q×ceil(max(x,0)/q); manual mantido exato com aviso se incompatível. |
| 11. Arquivo/classe/função | backend/app/approved_quantity.py:quantity_policy/apply_quantity/manual_warning |
| 12. Endpoint/contrato | ApprovedAnalysisIn; GET/POST de ficha e POST de análise em /api/v1/approved-math. Classificações em /classifications e /materials/{id}/classifications. Cada fornecedor é chamado internamente. |
| 13. Tabelas | Serviço lê materials, material_master_data, movements, planning_parameters, regras e evidências P2 conforme necessidade. Funções puras não consultam banco; registro é operação distinta D01-A03. |
| 14. Saídas/eventos | quantity_policy; raw_value/value; avisos de manual. |
| 15. Decisões e ramificações | q ausente conserva bruto calculável, aplicado None; q presente arredonda para cima. |
| 16. Falhas/exceções | quantity_quantum_missing; manual_preserved_quantum_missing/incompatible. Zero manual é declaração válida. |
| 17. Pós-condições | Resultado conserva estado, valores disponíveis, origem e motivos; não aplica automaticamente política ao cadastro. |
| 18. Logs e evidências | Metadados de contexto, versão e dependências; preservação em AnalysisRun somente no caminho de registro/simulação. |
| 19. Dependências | P1 → classificação/serviço → cálculo → projeção; detalhes por fonte e diagrama. |
| 20. Testes e aceite | test_approved_math_p3.py:test_quantity_priority_and_exact_upward_application; test_unknown_quantity_keeps_raw_and_does_not_assume_material_unit. Asserções inspecionadas quando indicado no texto; execução atual não realizada. Autoridade documental §11.1 / R24. |

## D05-A09 — Selecionar cenário, piso e estado final

| Campo | Conteúdo |
|---|---|
| 1. ID | D05-A09 |
| 2. Nome técnico e funcional | Selecionar cenário, piso e estado final |
| 3. Objetivo e responsabilidade | Executar selecionar cenário, piso e estado final com dados qualificados e proveniência. |
| 4. Executor | Serviço Python e fornecedor especificado na fonte. |
| 5. Evento inicial | Consulta ou análise solicitada a um consumidor do serviço aprovado. |
| 6. Pré-condições e permissões | Acesso ao material no workspace; estado e guardas indicados na ficha. |
| 7. Entradas, tipos e origem | Métodos aplicados por família, cenário, manuais, PP e máximo selecionado. |
| 8. Validações | Automático abaixo de PP eleva efetivo a A(PP). Manual abaixo de PP fica intacto, efetivo None e conflito. physical_only preserva física parcial. status insufficient_data por guardas/quantum/conflito manual; available de um manual não significa política pronta. |
| 9. Regras de negócio | R25/R26; manual > cenário disponível > engine disponível > primeiro disponível. Escolha ES antes de PP antes de EM. |
| 10. Algoritmo/fórmula | Conservador A(média); proteção A(maior); risco A(menor positivo). Comparar EM escolhido com PP e definir máximo efetivo. |
| 11. Arquivo/classe/função | backend/app/approved_inventory.py:calculate_approved; approved_analysis_service.py:_sheet_from_population |
| 12. Endpoint/contrato | ApprovedAnalysisIn; GET/POST de ficha e POST de análise em /api/v1/approved-math. Classificações em /classifications e /materials/{id}/classifications. Cada fornecedor é chamado internamente. |
| 13. Tabelas | Serviço lê materials, material_master_data, movements, planning_parameters, regras e evidências P2 conforme necessidade. Funções puras não consultam banco; registro é operação distinta D01-A03. |
| 14. Saídas/eventos | maximum_selected versus maximum_stock; manual_conflict; status/reason; versões e origens. |
| 15. Decisões e ramificações | Automático abaixo de PP eleva efetivo a A(PP). Manual abaixo de PP fica intacto, efetivo None e conflito. physical_only preserva física parcial. |
| 16. Falhas/exceções | status insufficient_data por guardas/quantum/conflito manual; available de um manual não significa política pronta. |
| 17. Pós-condições | Resultado conserva estado, valores disponíveis, origem e motivos; não aplica automaticamente política ao cadastro. |
| 18. Logs e evidências | Metadados de contexto, versão e dependências; preservação em AnalysisRun somente no caminho de registro/simulação. |
| 19. Dependências | P1 → classificação/serviço → cálculo → projeção; detalhes por fonte e diagrama. |
| 20. Testes e aceite | test_p3_closure_e41.py:test_automatic_maximum_floor_preserves_selected_and_manual_reorder; test_approved_math_p3.py:test_manual_exact_conflict_and_scenarios_exclude_comparison_and_manual. Asserções inspecionadas quando indicado no texto; execução atual não realizada. Autoridade documental §11.2–11.3 / R25–R26. |

