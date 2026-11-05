# D06 — Dashboard, catálogo e ficha

V02 / lote 4 / 03-11-2026. Referências Plano 1.36/E64 e Contrato Matemático 0.4/E63. Inspeção estática atual; testes não executados. Implementação encontrada não equivale a disponibilidade operacional ao cliente. P4-I04 e P6 conservam aceites técnicos delimitados; P7/E64 mantém reteste humano pendente.

Diagramas em ../diagramas/; contratos e indicadores em ../MAPA_INDICADORES_E_CONTRATOS_LOTE_04.md. Cada atividade abaixo possui vinte campos. Campos sem ensaio específico são identificados; testes citados sem descrição de asserção foram apenas localizados.

## D06-A01 — Consultar e filtrar Visão geral

| Campo | Conteúdo |
|---|---|
| 1. ID | D06-A01 |
| 2. Nome técnico e funcional | Consultar e filtrar Visão geral |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente → ApprovedDashboard → backend |
| 5. Evento inicial | Abrir Visão geral, Atualizar leitura ou Filtrar leitura. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | DashboardQuery: search, location, unit, abc, pqr, xyz, purchasability, xyz_origin, closing_date, page/limit, months ou datas visuais, tree_path; strings, inteiros e datas. |
| 8. Validações | extra=forbid; filtros duplicados rejeitados; page≥1, limit 1–200, months 1–12; datas não invertidas; datas e months explícitos mutuamente exclusivos. Sessão limpa e snapshot consistente. |
| 9. Regras de negócio | RB-LEI-01: classificar a população integral antes do filtro de apresentação; preservar SKU + Local e ausências. |
| 10. Algoritmo ou transformação | dashboard_read → project_sheets(project_dashboard_input) → projected_rows → read_context → matches → build_dashboard. Contexto deriva população/dependências/preferências; view_hash inclui filtros e exclui paginação. |
| 11. Arquivo, classe e função | backend/app/approved_dashboard.py:DashboardQuery,require_read_snapshot,dashboard_read,build_dashboard; frontend/src/ApprovedDashboard.tsx:refresh |
| 12. Endpoint e contrato | GET /api/v1/approved-math/dashboard; retorno context/scope/metrics/distributions/visuals/positions_page/priorities/suggestions. |
| 13. Tabelas lidas ou modificadas | Leitura de materiais, MD, movimentos, parâmetros, regras e control_case_preferences; nenhuma escrita de evidência. |
| 14. Saídas e eventos | DTO compacto, total filtrado, páginas e referências de membros. |
| 15. Decisões e ramificações | Resposta da geração corrente publica dados; página removida ajusta para página válida. Erro mantém leitura anterior explicitamente identificada. |
| 16. Falhas e exceções | 422 invalid_dashboard_filter/duplicate_dashboard_filter; 409 context_changed; 503 snapshot_isolation_required. Falha inesperada não deve eliminar silenciosamente uma posição. |
| 17. Pós-condições | Somente consulta. Resultado parcial não equivale a zero nem comprova normalidade. |
| 18. Logs, recibos e evidências | context_hash, view_hash, calculated_at, versões e campos de cobertura; analysis_id=None. |
| 19. Dependências | D03/D04/D05 e D11; continuidade indicada no diagrama. |
| 20. Testes e aceite | backend/tests/test_approved_dashboard_i06.py:test_filters_pages_preserve_cohort_and_totals e test_context_changed_after_source_update_and_query_guards — asserções lidas: coorte/hash preservados pelo filtro; 409 após mudança; 422 para filtros inválidos. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D06-A02 — Interpretar indicadores, populações e sinais

| Campo | Conteúdo |
|---|---|
| 1. ID | D06-A02 |
| 2. Nome técnico e funcional | Interpretar indicadores, populações e sinais |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Backend agrega; frontend apresenta |
| 5. Evento inicial | Dashboard válido recebido. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Posições aprovadas, fields com state/value, período MD, classes e preferências dos casos de controle. |
| 8. Validações | available exige estado available/zero e número finito; grupos financeiros qualificados por data final; denominadores próprios. |
| 9. Regras de negócio | RB-LEI-02: não somar quantidades heterogêneas; abaixo do PP é comparação, não diagnóstico de ruptura; ABC estoque indisponível. |
| 10. Algoritmo ou transformação | Contar positivos/zero/negativos; agrupar valor R05 por data/BRL; Top5 apenas positivos; classificar distribuições com base elegível; matriz ABC×PQR conta posições. Prioridade: gravidade, depois código/Local/id. Árvore filtra seus caminhos, não o scope global. |
| 11. Arquivo, classe e função | backend/app/approved_dashboard.py:signals,build_dashboard,build_event_groups; frontend/src/ApprovedDashboard.tsx |
| 12. Endpoint e contrato | Mesmo GET de D06-A01; campos e fórmulas agregadas no MAPA_INDICADORES_E_CONTRATOS_LOTE_04.md. |
| 13. Tabelas lidas ou modificadas | Mesmas leituras de D06-A01; sem persistência. |
| 14. Saídas e eventos | Cobertura, membros, grupos financeiros, distribuições, árvore, sinais e eventos mensais. |
| 15. Decisões e ramificações | Classe ausente sai do denominador de percentuais da classe; ND declarado é categoria própria. AM-DAD-001/002 ficam não avaliados. Capital por alerta adiado. |
| 16. Falhas e exceções | Sem base: percentuais/valores ausentes. Múltiplas datas: sem total financeiro único. Campos sem contrato não recebem estimativa oculta. |
| 17. Pós-condições | Pergunta gerencial acompanhada de unidade, data, população e limite. |
| 18. Logs, recibos e evidências | Cada conjunto possui count/key/digest. Estimativa de movimento usa custo MD vigente e não preço transacional. |
| 19. Dependências | D03/D04/D05 e D11; continuidade indicada no diagrama. |
| 20. Testes e aceite | backend/tests/test_approved_dashboard_i06.py:test_estimate_uses_md_not_transaction_price_and_keeps_zero_missing_separate — asserções lidas: preço transacional 999 não substitui MD; zero valorizado difere de ausência. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D06-A03 — Conferir membros e abrir posição no mesmo contexto

| Campo | Conteúdo |
|---|---|
| 1. ID | D06-A03 |
| 2. Nome técnico e funcional | Conferir membros e abrir posição no mesmo contexto |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/Frontend/Backend |
| 5. Evento inicial | Conferir posições, Ver indisponíveis, célula da matriz ou abrir SKU + Local. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | members_key, expected_context SHA-256, page/limit; MemberRef count/digest; material_id e dependency_fingerprint. |
| 8. Validações | Contexto obrigatório para membros; frontend compara context_hash, key, digest, total e página. Ficha compara expected_dependency quando fornecido. |
| 9. Regras de negócio | RB-LEI-03: não trocar silenciosamente a base entre indicador, membros e ficha. |
| 10. Algoritmo ou transformação | Consultar membros do conjunto → conferir identidade da resposta → usuário abre posição → GET sheet com fingerprint → projetar ficha. |
| 11. Arquivo, classe e função | approved_dashboard.py:dashboard_read,position_members; approved_math_api.py:sheet; ApprovedDashboard.tsx:showMembers; App.tsx:MaterialDetail |
| 12. Endpoint e contrato | GET /api/v1/approved-math/dashboard?members_key=…&expected_context=…; GET /api/v1/approved-math/materials/{id}/sheet?expected_dependency=… |
| 13. Tabelas lidas ou modificadas | Leitura da população e dependências; nenhum registro de decisão. |
| 14. Saídas e eventos | Membros paginados com id/código/Local; eventos podem incluir movement_id/direction/date/estimated_value. |
| 15. Decisões e ramificações | 409: oferecer consulta atual explícita, sem fingir continuidade da leitura antiga. Retorno reconsulta e restaura intenção/foco quando possível. |
| 16. Falhas e exceções | 422 member_context_required; 404 conjunto/material; 409 context_changed; resposta obsoleta não publicada. |
| 17. Pós-condições | A posição correta conserva contexto ou informa divergência. |
| 18. Logs, recibos e evidências | Fingerprint por posição, digest de membros e intenção de navegação em memória. |
| 19. Dependências | D03/D04/D05 e D11; continuidade indicada no diagrama. |
| 20. Testes e aceite | backend/tests/test_approved_dashboard_i06.py:test_positions_reconcile_sheet_trail_and_stale_navigation_is_explicit — teste localizado e trecho de chamada com expected_dependency lido; cobertura completa de navegação depende de evidência P7. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D06-A04 — Consultar Materiais com métricas aprovadas

| Campo | Conteúdo |
|---|---|
| 1. ID | D06-A04 |
| 2. Nome técnico e funcional | Consultar Materiais com métricas aprovadas |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | MaterialsPage |
| 5. Evento inicial | Abrir Materiais, buscar ou paginar. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Catálogo Material[] e busca textual; consulta dashboard com limit=100/page. |
| 8. Validações | Relacionar métrica por material_id; encaminhar fingerprint somente se código e Local coincidirem. |
| 9. Regras de negócio | RB-LEI-04: falha de métricas não torna o catálogo indisponível e não transforma saldo ausente em zero. |
| 10. Algoritmo ou transformação | Debounce 250 ms → consultar dashboard → mapear página ao catálogo; sem métricas usar filtro local do catálogo e saldo indisponível. Página retirada é ajustada. |
| 11. Arquivo, classe e função | frontend/src/App.tsx:MaterialsPage; backend/app/approved_dashboard.py:matches |
| 12. Endpoint e contrato | GET /api/v1/approved-math/dashboard?search=…&page=…&limit=100; catálogo carregado por App. |
| 13. Tabelas lidas ou modificadas | Leituras D06-A01 e catálogo; criação de material é ação separada, fora desta ficha. |
| 14. Saídas e eventos | Cards SKU + Local, saldo oficial, ABC estoque NC, total e paginação; abrir ficha. |
| 15. Decisões e ramificações | Com métricas: página do backend; falha: catálogo consultável com aviso. Exportação usa conjunto filtrado completo, não só cards visíveis. |
| 16. Falhas e exceções | Erro de métricas exibido; requisições anteriores abortadas/ignoradas. |
| 17. Pós-condições | Consulta preserva identificadores textuais e unidade do catálogo. |
| 18. Logs, recibos e evidências | Contexto da métrica e fingerprint; nenhuma gravação ao abrir card. |
| 19. Dependências | D03/D04/D05 e D11; continuidade indicada no diagrama. |
| 20. Testes e aceite | NÃO CONFIRMADO ensaio isolado do fallback de MaterialsPage nesta rodada; inspeção de código. Testes do dashboard cobrem o fornecedor, não comprovam toda a interação do card. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D06-A05 — Abrir ficha e explicar resultados disponíveis

| Campo | Conteúdo |
|---|---|
| 1. ID | D06-A05 |
| 2. Nome técnico e funcional | Abrir ficha e explicar resultados disponíveis |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | MaterialDetail → serviço → project_sheet |
| 5. Evento inicial | Selecionar posição pelo dashboard, catálogo ou planejamento. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | material_id, expected_dependency opcional; parâmetros armazenados e unidade real do catálogo. |
| 8. Validações | Autorização por material/workspace; prepare_analysis; requireReviewedSheet valida estrutura, identidade, campos, métodos e fingerprint antes da publicação. |
| 9. Regras de negócio | RB-LEI-05: consulta sem gravação; estado available/zero/unavailable/conflict; física parcial limitada a ausências fundamentais elegíveis. |
| 10. Algoritmo ou transformação | read_material_analysis(stored=True) → calculate_sheet → project_sheet; copiar resultados/campos/métodos com fontes. Não recalcular fórmulas no React. |
| 11. Arquivo, classe e função | approved_math_api.py:sheet_read,read_material_analysis; approved_material_sheet.py:project_fields,project_sheet; frontend/src/reviewedSheet.ts:requireReviewedSheet; App.tsx:MaterialDetail |
| 12. Endpoint e contrato | GET /api/v1/approved-math/materials/{id}/sheet; POST …/sheet/read aceita ApprovedAnalysisIn somente para leitura com overrides. |
| 13. Tabelas lidas ou modificadas | Leitura material/MD/movimentos/parâmetros/coorte/regras; sem AnalysisRun nesta consulta. |
| 14. Saídas e eventos | 24 campos com regra/versão/fonte/estado, métodos, classification_view, thermometer, memory. |
| 15. Decisões e ramificações | Política NC pode manter estatística física; período/semântica inválidos bloqueiam a análise. Ficha incompleta HTTP200 é recusada no frontend. |
| 16. Falhas e exceções | 404 material; 409 contexto; 422 fonte/entrada; erro estrutural do consumidor impede novo envio dependente. |
| 17. Pós-condições | Termômetro não certifica diagnóstico gerencial; availability parcial não elimina campos válidos. |
| 18. Logs, recibos e evidências | memory.analysis_id=None; read_only; fingerprints; E64 corrigiu A5, com reteste humano pendente. |
| 19. Dependências | D03/D04/D05 e D11; continuidade indicada no diagrama. |
| 20. Testes e aceite | backend/tests/test_material_sheet_i03.py:test_42_oracles_api_and_every_sheet_field — asserções lidas: campos e métodos iguais ao fornecedor, estados distintos e EM01–03 automáticos. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D06-A06 — Explorar Trilha do Estoque

| Campo | Conteúdo |
|---|---|
| 1. ID | D06-A06 |
| 2. Nome técnico e funcional | Explorar Trilha do Estoque |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente → TemporalPanel → approved_temporal |
| 5. Evento inicial | Explorar Trilha do Estoque ou Aplicar recorte visual. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Datas visuais opcionais dentro do período MD; identidade e movimentos elegíveis P1. |
| 8. Validações | start≤visual_start≤visual_end≤end; fontes finitas, identidade e quantidade positiva; todas as IDs elegíveis devem existir. |
| 9. Regras de negócio | RB-LEI-06: construir trajetória completa antes de recortar; reconstrução atual não é replay histórico. |
| 10. Algoritmo ou transformação | Reconstituir abertura pela precedência R02 em Decimal → fechar todos os dias → filtrar visualmente → agrupar meses. Mensal soma IN/OUT e usa último fechamento; saldo oficial só na data final MD. |
| 11. Arquivo, classe e função | backend/app/approved_temporal.py:build_temporal,temporal_read; frontend/src/TemporalPanel.tsx; StockTrail.tsx; IndicatorHistory.tsx |
| 12. Endpoint e contrato | GET /api/v1/approved-math/materials/{id}/temporal?visual_start=…&visual_end=…; POST …/temporal/read para overrides de leitura. |
| 13. Tabelas lidas ou modificadas | Fontes já consultadas no serviço; sem gravação. |
| 14. Saídas e eventos | daily, rows mensais, analysis_period, visual_period, reconciliação e memória; quantidades canônicas em strings decimais. |
| 15. Decisões e ramificações | Sem abertura: fluxos possíveis e saldo NC; sem movimentos nem completude: série indisponível. Histórico de políticas/preços/giro não é fabricado. |
| 16. Falhas e exceções | 422 temporal_projection_unavailable ou falha P1; filtro inválido mantém última leitura válida com aviso. Fonte divergente da ficha pede atualização. |
| 17. Pós-condições | Recorte não altera estatísticas integrais nem ABC. Granularidade é apresentação. |
| 18. Logs, recibos e evidências | source_version, dependency_fingerprint, IDs incluídos/excluídos; mode read_only. |
| 19. Dependências | D03/D04/D05 e D11; continuidade indicada no diagrama. |
| 20. Testes e aceite | backend/tests/test_approved_temporal_i05.py:test_visual_filter_only_and_sql_no_side_effects e test_bad_visual_dates_and_recovery — asserções lidas: SELECT somente, estatística/fingerprint iguais e recuperação após 422. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D06-A07 — Examinar métodos e encaminhar alternativa

| Campo | Conteúdo |
|---|---|
| 1. ID | D06-A07 |
| 2. Nome técnico e funcional | Examinar métodos e encaminhar alternativa |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/ApprovedMaterialPresentation |
| 5. Evento inicial | Abrir família de métodos ou Comparar cenários calculados da mesma análise. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | sheet.methods, selected_sources, cenários e origens do backend. |
| 8. Validações | Preservar manual, bruto/aplicado, quantum, NC e selection_role; identificador desconhecido não deve receber significado inventado. |
| 9. Regras de negócio | RB-LEI-07: EM01–03 selecionáveis; EM04–07 comparativos. Examinar métodos não seleciona nem grava uma proposta. |
| 10. Algoritmo ou transformação | Alternar ES/PP/EM → conferir fórmula/insumos/origem → comparar cenários → usar laboratório D07 para proposta explícita. |
| 11. Arquivo, classe e função | frontend/src/ApprovedMaterialPresentation.tsx:MethodComparison,MethodRow,ScenarioPanel; backend/app/approved_material_sheet.py:project_sheet |
| 12. Endpoint e contrato | Sem chamada ao alternar família; dados da ficha D06-A05. |
| 13. Tabelas lidas ou modificadas | Nenhuma escrita ou consulta adicional nesta alternância. |
| 14. Saídas e eventos | Origem selecionada, cenários, métodos e condições de indisponibilidade. |
| 15. Decisões e ramificações | Composição/manual pode diferir do cenário solicitado; máximo escolhido e efetivo permanecem separados. |
| 16. Falhas e exceções | NC mantém motivo; adequação estatística continua not_evaluated. |
| 17. Pós-condições | Somente entendimento; prosseguir para D07-A02/A03 para simular. |
| 18. Logs, recibos e evidências | Regra R10–R26 e método/versionamento carregados no DTO. |
| 19. Dependências | D03/D04/D05 e D11; continuidade indicada no diagrama. |
| 20. Testes e aceite | backend/tests/test_material_sheet_i03.py:test_42_oracles_api_and_every_sheet_field — projeção conferida; interação visual atual inspecionada em código, sem novo ensaio browser. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D06-A08 — Registrar evidência por ação explícita

| Campo | Conteúdo |
|---|---|
| 1. ID | D06-A08 |
| 2. Nome técnico e funcional | Registrar evidência por ação explícita |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente → MethodMemory → backend |
| 5. Evento inicial | Registrar uma nova evidência P2. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | material_id e declared_unit da ficha; dados vigentes no instante da chamada. |
| 8. Validações | Modo físico parcial desabilita botão; backend mantém contrato estrito e autorização. |
| 9. Regras de negócio | RB-LEI-08: registrar recalcula; não congela necessariamente a consulta anteriormente exibida. |
| 10. Algoritmo ou transformação | POST analysis → ApprovedAnalysisService.record → preservação P2; mostrar analysis_id e HistoricalAnalysis. |
| 11. Arquivo, classe e função | frontend/src/ApprovedMaterialPresentation.tsx:MethodMemory; backend/app/approved_math_api.py:analysis; approved_analysis_service.py:record |
| 12. Endpoint e contrato | POST /api/v1/approved-math/materials/{id}/analysis; ApprovedAnalysisIn. |
| 13. Tabelas lidas ou modificadas | Fontes de análise e tabelas de linhagem/AnalysisRun conforme D01-A03/D11; parâmetros ativos preservados. |
| 14. Saídas e eventos | Nova evidência e analysis_id, sem simulação ou validação automática. |
| 15. Decisões e ramificações | Fonte pode ter mudado: UI avisa que registro pode diferir da leitura. Replay é operação própria. |
| 16. Falhas e exceções | Erro exibido e botão liberado; não alegar idempotência/retry automático ou proteção de revisão equivalente ao laboratório. |
| 17. Pós-condições | Evidência rastreável independente da decisão de planejamento. |
| 18. Logs, recibos e evidências | ID P2 e dependências preservadas; fluxo D11. |
| 19. Dependências | D03/D04/D05 e D11; continuidade indicada no diagrama. |
| 20. Testes e aceite | backend/tests/test_material_sheet_i03.py:test_record_and_replay_are_explicit_separate_from_read — localizado; fronteira confirmada no código, sem execução atual. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

