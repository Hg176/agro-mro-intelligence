# D01 — Arquitetura e responsabilidades

V02, lote 1, 03/11/2026. Referência Plano 1.36/E64. Inspeção estática da implementação e leitura de testes existentes. Diagramas relacionados em `../diagramas/D01_ARQUITETURA.drawio`.

## Fronteiras e decisões confirmadas

O frontend é React/TypeScript com entrada em `frontend/src/main.tsx`. AnalysisNavigation envolve App. A seleção de páginas ocorre no estado de App; o menu aparece em App.tsx:51. O cliente HTTP de api.ts acrescenta `/api/v1`, Content-Type e Bearer quando há credencial, usa cache no-store, confere geração de sessão antes de aceitar a resposta e dispara eventos ao expirar ou trocar a sessão.

A API FastAPI concentra rotas em main.py e inclui routers de linhagem, matemática aprovada, exportações e trabalho. A camada SQLAlchemy recebe DATABASE_URL; SQLite é o default local e PostgreSQL consta do Compose. Isso descreve configurações encontradas, com implantação ativa NÃO CONFIRMADA. Nginx encaminha `/api/` ao serviço api:8000 e usa index.html para navegação web.

O startup em main.py cria as tabelas fora de LINEAGE_TABLES e WORK_TABLES, verifica a chave antiga de material, executa ajustes declarados de colunas e semeia referências/aulas. Inicialização da aplicação tem efeitos sobre persistência. Tabelas P2/P6 dependem da preparação própria. A capacidade de P6 determina a escolha entre WorkPage, LegacyPlanningPage e apresentação de indisponibilidade.

O token implementado em security.py contém um corpo JSON codificado em base64url e assinatura HMAC-SHA256. A assinatura e a expiração são verificadas em decode_token. Senhas usam PBKDF2-HMAC-SHA256, salt aleatório e 200.000 iterações. Os controles detalhados de autorização por recurso serão percorridos em D11.

## D01-A01 — Abrir sessão e enviar consulta

| Campo obrigatório | Especificação |
|---|---|
| 1. ID | D01-A01 |
| 2. Nome técnico e funcional | api / comunicação autenticada da interface |
| 3. Objetivo e responsabilidade | Enviar requisição e entregar resposta pertencente à sessão atual |
| 4. Executor | Navegador, api.ts, FastAPI |
| 5. Evento inicial | Componente chama api(path, options) |
| 6. Pré-condições e permissões | A rota protegida exige current_user; o cliente inclui token se presente |
| 7. Entradas | path string; RequestInit; agro-token do localStorage; VITE_API_URL opcional |
| 8. Validações | Geração da sessão antes de consumir resposta; response.ok; autorização no servidor |
| 9. Regras | Mudança de sessão invalida retorno; 401 remove credencial e informa expiração |
| 10. Transformação | Prefixar base e /api/v1; serialização do corpo é responsabilidade do chamador |
| 11. Arquivo/função | frontend/src/api.ts, api, sessionKey, setToken; main.py, current_user |
| 12. Endpoint/contrato | Contrato genérico; rotas efetivas no CATALOGO_APIS.md |
| 13. Tabelas | current_user lê users; leituras adicionais dependem da rota |
| 14. Saídas | Objeto JSON tipado pelo chamador; undefined em 204; ApiError ou AbortError |
| 15. Decisões | HTTP sem sucesso; 401; sessão alterada; resposta 204 |
| 16. Falhas | JSON de erro pode falhar e usar mensagem genérica; falha de fetch propaga |
| 17. Pós-condições | Resposta entregue se a sessão ainda coincide; evento de sessão/expiração quando aplicável |
| 18. Evidências | api.ts e security.py; logging específico dessa função NÃO CONFIRMADO |
| 19. Dependências | localStorage, fetch, eventos window; current_user/decode_token no backend |
| 20. Testes e aceite | test_security_configuration.test_tokens_use_configured_secret_and_reject_tampering verifica adulteração de assinatura. Não cobre sozinho a navegação ou todos os recursos; execução nesta rodada não realizada |

## D01-A02 — Consultar análise compartilhada

| Campo obrigatório | Especificação |
|---|---|
| 1. ID | D01-A02 |
| 2. Nome técnico e funcional | ApprovedAnalysisService / preparar cálculo compartilhado |
| 3. Objetivo e responsabilidade | Calcular com identidade, coorte e dependências consistentes |
| 4. Executor | Serviço Python e fornecedores matemáticos |
| 5. Evento inicial | Adaptador ou consumidor chama calculate_many, calculate_sheet ou project_sheets |
| 6. Pré-condições e permissões | Usuário do workspace, sessão adequada e entradas do contrato aprovado |
| 7. Entradas | material_id, ApprovedAnalysisIn, dados persistidos, configuração do workspace |
| 8. Validações | Identidade, período e guardas de cada fornecedor; detalhamento em D04/D05 |
| 9. Regras | Coorte de classificação completa; contexto por SKU + Local |
| 10. Transformação | Preparação → classificação/NS → calculate_approved → projeção |
| 11. Arquivo/função | approved_analysis_service.py, load_population, _prepare, _calculate_many, calculate_sheet, project_sheets |
| 12. Endpoint/contrato | approved_math_api.py, dashboard e sheet; ApprovedAnalysisIn |
| 13. Tabelas | Material, MaterialMasterData, Movement, ClassificationSettings e matrizes/parâmetros conforme caminho; lista transitiva completa pendente |
| 14. Saídas | Resultado, identidade, contexto, versões e informações para consumidores |
| 15. Decisões | Solicitação individual/lote; insumos calculáveis; disponibilidade parcial da projeção |
| 16. Falhas | Exceções/NC conforme fornecedor; catálogo completo em D12 pendente |
| 17. Pós-condições | Consumidor recebe o resultado do contexto selecionado |
| 18. Evidências | Contrato I01 e aceite P4-I01/E43; valores calculados não implicam novo registro de análise |
| 19. Dependências | P1, classificações aprovadas, NS, inventário e projeções |
| 20. Testes e aceite | test_batch_full_cohort_identity_readonly_and_query_counts verifica SELECT, igualdade do lote, identidade de locais e mesma coorte. Leitura da asserção realizada; execução atual pendente |

## D01-A03 — Registrar análises com atomicidade

| Campo obrigatório | Especificação |
|---|---|
| 1. ID | D01-A03 |
| 2. Nome técnico e funcional | record_many / preservar resultado auditável |
| 3. Objetivo e responsabilidade | Registrar o conjunto com versões e rollback diante de falha |
| 4. Executor | ApprovedAnalysisService e lineage |
| 5. Evento inicial | record ou record_many recebe pedidos |
| 6. Pré-condições e permissões | _clean e usuário do workspace; lote passa pelos validadores de análise |
| 7. Entradas | Sequência de pares material_id e payload |
| 8. Validações | _clean; preparação/cálculo e verificações da linhagem |
| 9. Regras | Evidência preservada por análise e versões capturadas no contexto transacional |
| 10. Algoritmo | begin_transaction → _calculate_many → capture_all → preserve_analysis por item → commit |
| 11. Arquivo/função | approved_analysis_service.py, record_many e record |
| 12. Endpoint/contrato | POST /api/v1/approved-math/materials/{material_id}/analysis; ApprovedAnalysisIn |
| 13. Tabelas | trace_analysis_runs, trace_contents e tabelas de captura de versões via lineage; detalhe transitivo em D11 |
| 14. Saídas | Resultados com bloco lineage; record devolve o primeiro resultado do lote unitário |
| 15. Decisões | Lote vazio retorna []; exceção aciona rollback |
| 16. Falhas | except Exception executa rollback e propaga; finally remove p2_locked |
| 17. Pós-condições | Commit do conjunto ou rollback; marcador de lock removido da Session |
| 18. Evidências | analysis_id, versões e dados de preservação devolvidos pela linhagem |
| 19. Dependências | Cálculo compartilhado, capture_all, preserve_analysis, sessão SQLAlchemy |
| 20. Testes e aceite | test_record_many_atomic_rollback_and_recovery injeta falha na segunda análise, verifica igualdade do snapshot após rollback e recuperação. Teste lido; não executado nesta rodada |

## D01-G01 — Escolher a experiência de planejamento

PlanningWorkflow.tsx chama useWorkCapability. Com estado enabled, renderiza WorkPage/WorkProgress. Com legacy, renderiza LegacyPlanningPage/LegacyPlanningProgress. Nos demais estados, informa consulta/erro de disponibilidade. A consulta usa GET /api/v1/planning-work/capabilities. O backend informa enabled, schema_available e contract. As ações e transições de cada caminho serão detalhadas em D07/D08.

## Limites de validação

Os componentes e chamadas deste lote foram conferidos estaticamente. As páginas C4 sintetizam dependências; a ordem temporal completa pertence a D10. A execução do sistema e a aplicabilidade operacional dos aceites permanecem fora da evidência desta rodada.
