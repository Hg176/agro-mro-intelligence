# Agro MRO Intelligence — documentação V02

A revisão visual foi concluída pelo responsável, que considerou o resultado aderente. As cópias salvas dos 12 diagramas V02 e dos dois fluxos resumidos coincidem com os arquivos do projeto por SHA-256. O alcance da revisão está registrado em [Cobertura e pendências](COBERTURA_E_PENDENCIAS.md).

## Lote 1 entregue para revisão documental

- [Diagnóstico e plano](00_DIAGNOSTICO_E_PLANO.md)
- [D01 — arquitetura editável](diagramas/D01_ARQUITETURA.drawio), três páginas C4.
- [D01 — especificação](especificacoes/D01_ARQUITETURA.md), responsabilidades, três atividades detalhadas e decisão de capacidade do planejamento.
- [D09 — modelo de dados editável](diagramas/D09_MODELO_DADOS.drawio), 37 páginas, uma por entidade.
- [D09 — especificação](especificacoes/D09_MODELO_DADOS.md), domínios, cardinalidades, identidade e limites de persistência.
- [Dicionário de dados](DICIONARIO_DADOS.md), 345 campos dos modelos declarados.
- [Catálogo inicial de APIs](CATALOGO_APIS.md), 102 declarações de rotas extraídas estaticamente.
- [Fontes e hashes](FONTES_LOTE_01.md)
- [Rastreabilidade](MATRIZ_RASTREABILIDADE.md)
- [Cobertura e pendências](COBERTURA_E_PENDENCIAS.md)

Percurso recomendado de leitura — D01 contexto, contêineres e componentes; especificação D01; D09 por domínio; dicionário; APIs correspondentes; matriz de rastreabilidade. O catálogo de APIs é inicial e será aprofundado a cada processo.

## Lote 2 — importação, segurança e rastreabilidade

- [D03 — importação editável](diagramas/D03_IMPORTACAO.drawio), cinco páginas.
- [D03 — especificação](especificacoes/D03_IMPORTACAO.md), oito atividades com vinte campos cada.
- [D11 — segurança e rastreabilidade editável](diagramas/D11_SEGURANCA_RASTREABILIDADE.drawio), três páginas.
- [D11 — especificação](especificacoes/D11_SEGURANCA.md), seis atividades com vinte campos cada.
- [Contratos de importação e linhagem](API_IMPORTACAO_E_LINHAGEM.md), exemplos fictícios, respostas e exceções.
- [Catálogo inicial de regras](CATALOGO_REGRAS_NEGOCIO.md)
- [Fontes e hashes do lote 2](FONTES_LOTE_02.md)

## Lote 3 — preparação, classificações e motor matemático

- [D04 — preparação e classificação editável](diagramas/D04_PREPARACAO_CLASSIFICACAO.drawio), quatro páginas: identidade/período, série diária, N/PQR e ABC.
- [D04 — especificação](especificacoes/D04_PREPARACAO.md), seis atividades com vinte campos cada.
- [D05 — motor V3 editável](diagramas/D05_MOTOR_MATEMATICO_V3.drawio), cinco páginas: parâmetros/NS, guardas/quantis, ES/PP, máximos e seleção/aplicação.
- [D05 — especificação](especificacoes/D05_MOTOR_V3.md), nove atividades com vinte campos cada.
- [Memória matemática V3](MEMORIA_MATEMATICA_V3.md), variáveis, unidades, fórmulas, guardas, precedências e exemplo fictício.
- [Fontes e hashes do lote 3](FONTES_LOTE_03.md).

Percurso sugerido: D04 → memória matemática → D05 → fichas das atividades e matriz de rastreabilidade. A execução atual de testes permanece pendente.

## Lote 4 — leitura, simulação e decisão

- [D06 — dashboard e ficha editáveis](diagramas/D06_DASHBOARD_FICHA.drawio), quatro páginas: consulta/agregados, membros/contexto, ficha/métodos e trajetória temporal.
- [D06 — especificação](especificacoes/D06_DASHBOARD_FICHA.md), oito atividades com vinte campos cada.
- [D07 — simulação e planejamento editáveis](diagramas/D07_SIMULACAO_PLANEJAMENTO.drawio), quatro páginas: capacidade/início, rascunho/reconferência, simulação/comparação e validação/continuidade.
- [D07 — especificação](especificacoes/D07_SIMULACAO_PLANEJAMENTO.md), oito atividades com vinte campos cada.
- [Mapa de indicadores e contratos](MAPA_INDICADORES_E_CONTRATOS_LOTE_04.md), populações, unidades, sinais, ações da interface, HTTP, transações e percursos alternativos.
- [Fontes e hashes do lote 4](FONTES_LOTE_04.md).

Percurso sugerido: D06.1–D06.4 → mapa de indicadores → D07.1–D07.4 → fichas das atividades. O lote distingue leitura atual, evidência P2, simulação preservada, decisão validada e alteração explícita de parâmetros ativos. Os diagramas têm verificação estrutural, com abertura nativa e roteamento visual ainda pendentes.

## Lote 5 — ciclos, emissão e aplicação declarada

- [D08 — diagrama editável](diagramas/D08_CICLOS_APLICACAO.drawio), sete páginas: fila/organização, seleção/emissão, entrega incerta, aplicação/acompanhamento, reabertura e duas vistas de estados.
- [D08 — especificação](especificacoes/D08_CICLOS_APLICACAO.md), nove atividades com vinte campos cada.
- [Estados e contratos D08](ESTADOS_E_CONTRATOS_D08.md), transições, revisões, contadores, prazos, API, quatro abas do Excel e recuperação da emissão incerta.
- [Fontes e hashes do lote 5](FONTES_LOTE_05.md).

Percurso sugerido: D07 decisão validada → D08.1–D08.5 → estados D08.6/D08.7 → contratos e fichas. Organização, decisão, emissão e aplicação declarada permanecem separadas. Conclusão administrativa e aplicação declarada não comprovam ganho ou integração ERP.

## Lote 6 — jornada integrada, chamadas e recuperação

- [D02 — jornada integrada editável](diagramas/D02_JORNADA_INTEGRADA.drawio), três páginas: acesso/carga, leitura/alternativa e decisão/acompanhamento.
- [D02 — especificação](especificacoes/D02_JORNADA_INTEGRADA.md), cinco atividades integradoras com vinte campos.
- [D10 — sequências editáveis](diagramas/D10_SEQUENCIAS.drawio), cinco páginas: confirmação de importação, dashboard/ficha, simulação, validação e emissão.
- [D10 — especificação](especificacoes/D10_SEQUENCIAS.md), cinco atividades com ordem das chamadas e fronteiras transacionais.
- [D12 — erros e recuperação editáveis](diagramas/D12_ERROS_RECUPERACAO.drawio), três páginas: classificação de falha, leitura/decisão bloqueada e escrita incerta.
- [D12 — especificação](especificacoes/D12_ERROS_RECUPERACAO.md), seis atividades com causas, bloqueios e retomadas.
- [Manual de transferência técnica](MANUAL_TRANSFERENCIA_TECNICA.md), roteiro de estudo, ambiente novo, testes isolados, manutenção e exercício de revisão independente.
- [Fontes e hashes do lote 6](FONTES_LOTE_06.md).

Os doze conjuntos D01–D12 somam 83 páginas editáveis e 74 fichas de vinte campos. O manual está disponível para o exercício de transferência pelo novo desenvolvedor. As verificações independentes e as lacunas de APIs, campos e execução constam na [matriz de cobertura atualizada](COBERTURA_E_PENDENCIAS.md).
