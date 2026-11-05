# D09 — Modelo de dados

O arquivo D09_MODELO_DADOS.drawio contém uma página por tabela declarada, para manter campos e relações legíveis. O dicionário contém os 345 campos das 37 tabelas, tipos resolvidos, nulabilidade, chaves, defaults Python, constraints compostas e índices.

## Organização por domínio

- Identidade e cadastro — workspaces, users, materials, units_of_measure, merchandise_groups e material_images.
- Entradas e parâmetros — movements, material_master_data, planning_parameters, pipeline_orders, report_periods e report_movements.
- Configuração — classification_settings, service_level_rules, tmer_rules, control_case_preferences, taxonomy_edges e movement_type_mappings.
- Planejamento — planning_cases, planning_simulations, planning_events e planning_export_batches.
- Gestão do trabalho — planning_work_heads, planning_work_cycles e planning_work_events.
- Linhagem — trace_contents, trace_import_sources, trace_import_receipts, trace_import_rows, trace_dataset_versions, trace_dataset_heads e trace_analysis_runs.
- Apoio — lessons, lesson_progress, support_tickets, ticket_notifications e audit_logs.

## Leitura das cardinalidades

Uma FK obrigatória aponta para um pai por linha filha. Uma FK anulável admite ausência do pai. O lado dos filhos é 0..N, salvo quando as colunas da FK contêm uma chave única ou primária, caso em que fica 0..1. Essa cardinalidade deriva do modelo declarado. Em FKs compostas com coluna anulável, a ausência de referência precisa respeitar a semântica do banco utilizado.

A unicidade workspace_id + code + location em materials preserva a posição SKU + Local. Unicidades compostas de parâmetros e Dados Mestres usam workspace_id + material_id. A ligação simples a materials.id não demonstra, sozinha, igualdade entre workspaces; a autorização e a validação dos serviços devem ser percorridas em D11.

## D09-A01 — Persistir e consultar sob o modelo declarado

| Campo obrigatório | Especificação |
|---|---|
| 1. ID | D09-A01 |
| 2. Nome técnico e funcional | Modelos declarativos / estrutura de persistência |
| 3. Objetivo e responsabilidade | Representar entidades e restrições usadas pelos serviços |
| 4. Executor | SQLAlchemy e banco configurado |
| 5. Evento inicial | Serviço consulta ou modifica uma entidade em Session |
| 6. Pré-condições e permissões | Esquema disponível; autorização na camada de aplicação |
| 7. Entradas | Atributos tipados descritos no DICIONARIO_DADOS.md |
| 8. Validações | PK, FK, UQ e nulabilidade declaradas; validadores de domínio ficam nos schemas/serviços |
| 9. Regras | Identidade por workspace + SKU + Local; proveniência e histórico em entidades próprias |
| 10. Transformação | Mapeamento de atributos Python para colunas e tipos ORM |
| 11. Arquivo/classe | models.py, lineage_models.py e planning_work_models.py; cada classe tem referência no dicionário |
| 12. Endpoint/contrato | Dependente do serviço; inventário inicial no catálogo de APIs |
| 13. Tabelas | 37 tabelas listadas nas páginas D09 |
| 14. Saídas | Objetos persistidos ou resultados de consulta, conforme comando |
| 15. Decisões | Campos opcionais; conflito de unicidade; associação física ou lógica |
| 16. Falhas | Tratamento de IntegrityError e rollback depende do chamador; detalhamento por comando pendente |
| 17. Pós-condições | Definidas pela transação do serviço; commit não é implícito em get_db |
| 18. Evidências | Hashes das fontes em FONTES_LOTE_01.md; trilhas audit_logs e P2/P6 dependem da operação |
| 19. Dependências | database.Base, Session, esquema e configuração de banco |
| 20. Testes e aceite | test_material_location_migration.py e test_lineage_p2.py localizados; cobertura por constraint ainda NÃO CONFIRMADA. Metadata validada por extração; banco físico não inspecionado |

## Pontos que exigem cuidado na manutenção

Defaults declarados em PlanningParameter incluem LT15, NS0,95 e revisão30. Esses defaults de persistência não autorizam preencher insumos ausentes no motor aprovado. O contrato e o fornecedor determinam a precedência efetiva.

As referências históricas em trace_import_rows e trace_analysis_runs preservam identidade lógica; seus material_id não têm FK para a linha viva. selected_simulation_id, export_batch_id e current_cycle_id também exigem verificação pelo fluxo. As notas de cada página indicam as referências lógicas encontradas.

Listeners de imutabilidade em lineage_models são controles ORM. A implementação de proteção equivalente no banco contra operações SQL diretas está NÃO CONFIRMADA. Aplicação das constraints e habilitação operacional das tabelas P2/P6 também estão NÃO CONFIRMADAS nesta rodada.
