# D12 — Erros e recuperação

V02 / lote6 / 03-11-2026. Referência Plano1.36/E64, contrato0.4/E63. Integração documental dos lotes anteriores, sem nova execução, gravação operacional ou homologação. P7/E64 conserva reteste humano pendente na referência documental. Diagramas são modelos inspecionados, não traces de execução.

## D12-A01 — Sessão, autorização e resposta obsoleta

| Campo | Conteúdo |
|---|---|
| 1. ID | D12-A01 |
| 2. Nome técnico e funcional | Sessão, autorização e resposta obsoleta |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/Frontend/Backend conforme origem |
| 5. Evento inicial | Falha ou resultado indisponível identificado. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Token inválido/expirado ou identidade fora do workspace; resposta de geração anterior. |
| 8. Validações | Conferir status, code quando exposto, identidade, recibo/versão e fronteira de commit. |
| 9. Regras de negócio | RB-REC-01: conservar evidência e incerteza; nenhuma recuperação implícita altera matemática ou dados. |
| 10. Algoritmo ou transformação | 401 pelo api.ts limpa token e emite eventos; nova autenticação.404 não autoriza procurar em outro workspace. Resposta obsoleta não publica DTO. |
| 11. Arquivo, classe e função | api.ts; security.py; main.py:current_user; requestGeneration.ts |
| 12. Endpoint e contrato | 401 /404 /troca de sessão |
| 13. Tabelas lidas ou modificadas | Tabelas/objetos do subprocesso D11; D02-A01; ação de consulta não autoriza reparo. |
| 14. Saídas e eventos | Mensagem, motivo e caminho de retomada delimitado. |
| 15. Decisões e ramificações | 401 pelo api.ts limpa token e emite eventos; nova autenticação.404 não autoriza procurar em outro workspace. Resposta obsoleta não publica DTO. |
| 16. Falhas e exceções | Não repetir gravação ao recuperar sessão. Upload/download diretos não herdam todas as guardas de api.ts. |
| 17. Pós-condições | Retomar somente após resolver a causa e revisar o contexto; quando não confirmado, registrar lacuna. |
| 18. Logs, recibos e evidências | Distinguir código inspecionado, teste existente, execução histórica e observação atual. |
| 19. Dependências | Subprocessos referidos nos campos; consultar índice V02 e manual de transferência. Estados/fórmulas são os das respectivas autoridades. |
| 20. Testes e aceite | Cobertura associada nos subprocessos D11; D02-A01; cenários integrados não reexecutados nesta rodada. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D12-A02 — Carga bloqueada, falha e recibo ausente

| Campo | Conteúdo |
|---|---|
| 1. ID | D12-A02 |
| 2. Nome técnico e funcional | Carga bloqueada, falha e recibo ausente |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/Frontend/Backend conforme origem |
| 5. Evento inicial | Falha ou resultado indisponível identificado. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Arquivo grande, linhas inválidas, P2 ausente ou exceção durante aplicação. |
| 8. Validações | Conferir status, code quando exposto, identidade, recibo/versão e fronteira de commit. |
| 9. Regras de negócio | RB-REC-02: conservar evidência e incerteza; nenhuma recuperação implícita altera matemática ou dados. |
| 10. Algoritmo ou transformação | blocked: corrigir origem e reenviar após revisão; failed: aplicação revertida no try e tentativa preservada; not_persisted: recibo secundário ausente. Consultar histórico quando resultado da rede for incerto. |
| 11. Arquivo, classe e função | main.py:import_with_receipt/_table_import; lineage.py; ImportLineagePanel.tsx |
| 12. Endpoint e contrato | 413/422/500/503 e recibos |
| 13. Tabelas lidas ou modificadas | Tabelas/objetos do subprocesso D03; D10-A01; ação de consulta não autoriza reparo. |
| 14. Saídas e eventos | Mensagem, motivo e caminho de retomada delimitado. |
| 15. Decisões e ramificações | blocked: corrigir origem e reenviar após revisão; failed: aplicação revertida no try e tentativa preservada; not_persisted: recibo secundário ausente. Consultar histórico quando resultado da rede for incerto. |
| 16. Falhas e exceções | Prévia de arquivo não é confirmação. Não declarar rollback de uma operação só porque a rede falhou; lock/capture iniciais têm fronteira própria. |
| 17. Pós-condições | Retomar somente após resolver a causa e revisar o contexto; quando não confirmado, registrar lacuna. |
| 18. Logs, recibos e evidências | Distinguir código inspecionado, teste existente, execução histórica e observação atual. |
| 19. Dependências | Subprocessos referidos nos campos; consultar índice V02 e manual de transferência. Estados/fórmulas são os das respectivas autoridades. |
| 20. Testes e aceite | Cobertura associada nos subprocessos D03; D10-A01; cenários integrados não reexecutados nesta rodada. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D12-A03 — Dados insuficientes e política não calculável

| Campo | Conteúdo |
|---|---|
| 1. ID | D12-A03 |
| 2. Nome técnico e funcional | Dados insuficientes e política não calculável |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/Frontend/Backend conforme origem |
| 5. Evento inicial | Falha ou resultado indisponível identificado. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Datas/semântica inválidas; ausência de parâmetros/série/NS/quantum; conflito manual. |
| 8. Validações | Conferir status, code quando exposto, identidade, recibo/versão e fronteira de commit. |
| 9. Regras de negócio | RB-REC-03: conservar evidência e incerteza; nenhuma recuperação implícita altera matemática ou dados. |
| 10. Algoritmo ou transformação | P1 inválido bloqueia; recuperação física interna só nas ausências permitidas; manter valor disponível e motivo do NC. Revisar fonte/parâmetro conforme origem; nova simulação para decidir. |
| 11. Arquivo, classe e função | analysis_context.py; approved_analysis_service.py; approved_inventory.py; approved_material_sheet.py |
| 12. Endpoint e contrato | 422 de fonte ou campos NC |
| 13. Tabelas lidas ou modificadas | Tabelas/objetos do subprocesso D04/D05/D06/D07; ação de consulta não autoriza reparo. |
| 14. Saídas e eventos | Mensagem, motivo e caminho de retomada delimitado. |
| 15. Decisões e ramificações | P1 inválido bloqueia; recuperação física interna só nas ausências permitidas; manter valor disponível e motivo do NC. Revisar fonte/parâmetro conforme origem; nova simulação para decidir. |
| 16. Falhas e exceções | Zero não é ausência; não preencher LT/R/desvio, mudar corte ou usar resultado legado para contornar guarda. |
| 17. Pós-condições | Retomar somente após resolver a causa e revisar o contexto; quando não confirmado, registrar lacuna. |
| 18. Logs, recibos e evidências | Distinguir código inspecionado, teste existente, execução histórica e observação atual. |
| 19. Dependências | Subprocessos referidos nos campos; consultar índice V02 e manual de transferência. Estados/fórmulas são os das respectivas autoridades. |
| 20. Testes e aceite | Cobertura associada nos subprocessos D04/D05/D06/D07; cenários integrados não reexecutados nesta rodada. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D12-A04 — Revisão, contexto e evidência divergentes

| Campo | Conteúdo |
|---|---|
| 1. ID | D12-A04 |
| 2. Nome técnico e funcional | Revisão, contexto e evidência divergentes |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/Frontend/Backend conforme origem |
| 5. Evento inicial | Falha ou resultado indisponível identificado. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Fonte/caso/ciclo/seleção mudou; ficha sem estrutura/fingerprint; integridade divergente. |
| 8. Validações | Conferir status, code quando exposto, identidade, recibo/versão e fronteira de commit. |
| 9. Regras de negócio | RB-REC-04: conservar evidência e incerteza; nenhuma recuperação implícita altera matemática ou dados. |
| 10. Algoritmo ou transformação | Reconsultar; conservar rascunho; conferir contexto e reconciliar explicitamente antes de novo clique. Stale exige nova simulação. Integridade divergente bloqueia uso; preservar original para investigação. |
| 11. Arquivo, classe e função | analysisCommand.ts; reviewedSheet.ts; approved_planning.py; planning_work.py |
| 12. Endpoint e contrato | 409 ou DTO HTTP200 incompleto |
| 13. Tabelas lidas ou modificadas | Tabelas/objetos do subprocesso D07/D08/D11; E64 A5; ação de consulta não autoriza reparo. |
| 14. Saídas e eventos | Mensagem, motivo e caminho de retomada delimitado. |
| 15. Decisões e ramificações | Reconsultar; conservar rascunho; conferir contexto e reconciliar explicitamente antes de novo clique. Stale exige nova simulação. Integridade divergente bloqueia uso; preservar original para investigação. |
| 16. Falhas e exceções | Não modificar snapshot/hashes nem reinterpretar legado; revisão backend não pode ser substituída pela reconferência frontend. |
| 17. Pós-condições | Retomar somente após resolver a causa e revisar o contexto; quando não confirmado, registrar lacuna. |
| 18. Logs, recibos e evidências | Distinguir código inspecionado, teste existente, execução histórica e observação atual. |
| 19. Dependências | Subprocessos referidos nos campos; consultar índice V02 e manual de transferência. Estados/fórmulas são os das respectivas autoridades. |
| 20. Testes e aceite | Cobertura associada nos subprocessos D07/D08/D11; E64 A5; cenários integrados não reexecutados nesta rodada. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D12-A05 — Emissão incerta e tentativa de aplicação

| Campo | Conteúdo |
|---|---|
| 1. ID | D12-A05 |
| 2. Nome técnico e funcional | Emissão incerta e tentativa de aplicação |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/Frontend/Backend conforme origem |
| 5. Evento inicial | Falha ou resultado indisponível identificado. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Membro inválido, falha transacional, erro de blob/rede ou evidência stale após emissão. |
| 8. Validações | Conferir status, code quando exposto, identidade, recibo/versão e fronteira de commit. |
| 9. Regras de negócio | RB-REC-05: conservar evidência e incerteza; nenhuma recuperação implícita altera matemática ou dados. |
| 10. Algoritmo ou transformação | Antes do commit: rollback; depois: consultar lote/eventos/estado. uncertain bloqueia nova emissão no componente. Aplicação stale: revisar, não declarar. Recuperação binária garantida não existe neste fluxo. |
| 11. Arquivo, classe e função | ExportDownload.tsx; planning_work_api.py:export; planning_work.py:command |
| 12. Endpoint e contrato | POST export /applied com resposta falha |
| 13. Tabelas lidas ou modificadas | Tabelas/objetos do subprocesso D08; D10-A05; ação de consulta não autoriza reparo. |
| 14. Saídas e eventos | Mensagem, motivo e caminho de retomada delimitado. |
| 15. Decisões e ramificações | Antes do commit: rollback; depois: consultar lote/eventos/estado. uncertain bloqueia nova emissão no componente. Aplicação stale: revisar, não declarar. Recuperação binária garantida não existe neste fluxo. |
| 16. Falhas e exceções | Entrega ao navegador não prova arquivo salvo; declarar aplicação não prova ERP; não há retry automático/idempotência durável. |
| 17. Pós-condições | Retomar somente após resolver a causa e revisar o contexto; quando não confirmado, registrar lacuna. |
| 18. Logs, recibos e evidências | Distinguir código inspecionado, teste existente, execução histórica e observação atual. |
| 19. Dependências | Subprocessos referidos nos campos; consultar índice V02 e manual de transferência. Estados/fórmulas são os das respectivas autoridades. |
| 20. Testes e aceite | Cobertura associada nos subprocessos D08; D10-A05; cenários integrados não reexecutados nesta rodada. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

## D12-A06 — Capacidade, ambiente e replay incompatível

| Campo | Conteúdo |
|---|---|
| 1. ID | D12-A06 |
| 2. Nome técnico e funcional | Capacidade, ambiente e replay incompatível |
| 3. Objetivo e responsabilidade | Documentar e executar o comportamento delimitado abaixo, preservando identidade e proveniência. |
| 4. Executor | Cliente/Frontend/Backend conforme origem |
| 5. Evento inicial | Falha ou resultado indisponível identificado. |
| 6. Pré-condições e permissões | Sessão autenticada; material/caso pertencente ao workspace. Guardas adicionais descritas nos campos 8 e 15. |
| 7. Entradas, tipos e origem | Esquema P2/P6 ausente, flag desligada, fuso indisponível, isolamento insuficiente ou versão de software incompatível. |
| 8. Validações | Conferir status, code quando exposto, identidade, recibo/versão e fronteira de commit. |
| 9. Regras de negócio | RB-REC-06: conservar evidência e incerteza; nenhuma recuperação implícita altera matemática ou dados. |
| 10. Algoritmo ou transformação | Exibir indisponibilidade e encaminhar diagnóstico de ambiente. Não migrar/habilitar implicitamente. Replay incompatível conserva original e informa motivo; não recalcular atual como substituto histórico. |
| 11. Arquivo, classe e função | planning_work.py:require/today; approved_dashboard.py:require_read_snapshot; lineage.py; lineage_api.py |
| 12. Endpoint e contrato | 503 /409 /not_reproduced |
| 13. Tabelas lidas ou modificadas | Tabelas/objetos do subprocesso D01/D09/D11; manual de transferência; ação de consulta não autoriza reparo. |
| 14. Saídas e eventos | Mensagem, motivo e caminho de retomada delimitado. |
| 15. Decisões e ramificações | Exibir indisponibilidade e encaminhar diagnóstico de ambiente. Não migrar/habilitar implicitamente. Replay incompatível conserva original e informa motivo; não recalcular atual como substituto histórico. |
| 16. Falhas e exceções | Desligar P6 mantém bloqueio legado para casos adotados. Esquema declarado não certifica banco físico; operação demanda qualificação própria. |
| 17. Pós-condições | Retomar somente após resolver a causa e revisar o contexto; quando não confirmado, registrar lacuna. |
| 18. Logs, recibos e evidências | Distinguir código inspecionado, teste existente, execução histórica e observação atual. |
| 19. Dependências | Subprocessos referidos nos campos; consultar índice V02 e manual de transferência. Estados/fórmulas são os das respectivas autoridades. |
| 20. Testes e aceite | Cobertura associada nos subprocessos D01/D09/D11; manual de transferência; cenários integrados não reexecutados nesta rodada. Teste existente, não executado nesta rodada; alcance do aceite histórico separado abaixo. |

