# CONTEXTO — Agro MRO Intelligence

> Arquivo de contexto para agentes de IA (Antigravity, Claude Code, Codex) que vão trabalhar no Agro MRO Intelligence.
> Leia este arquivo inteiro antes de propor arquitetura, mexer em fórmula ou mudar uma tela.
>
> - **Versão deste contexto:** 1.0, 04/11/2026.
> - **Fontes usadas:** Plano Único de Execução 1.36 (E64, 20/10/2026), Contrato Matemático 0.3, pasta **Fluxograma** (documentação técnica V02 de 03/11/2026: diagramas D01–D12 com 83 páginas, guias resumidos 01/02 e índices), transcrição da reunião Hugo x Sander de 02/11/2026 (demonstração do protótipo) e decisões registradas no projeto do Hugo.
> - Os diagramas V02 foram gerados por **inspeção estática do código** (`backend/app/models.py`, `lineage_models.py`, `planning_work_models.py` etc.), então os nomes de tabelas e campos da seção 9 refletem o código real. Mesmo assim, "banco aplicado NÃO CONFIRMADO": confira as migrações.
> - **Fuso de referência do projeto:** America/Cuiaba.
> - **Atenção:** o código do protótipo ainda está com o Sander. Os nomes de arquivos, rotas, tabelas e funções citados aqui vêm do plano e dos diagramas (que foram extraídos do código), não de uma leitura direta nossa. Confira no repositório antes de afirmar que algo existe.

---

## Sumário

1. [Resumo em 30 segundos](#1-resumo-em-30-segundos)
2. [O produto: o que é, para quem e qual valor entrega](#2-o-produto)
3. [Pessoas e papéis](#3-pessoas-e-papéis)
4. [Glossário rápido](#4-glossário-rápido)
5. [Domínio: MRO e gestão de estoque](#5-domínio-mro-e-gestão-de-estoque)
6. [Classificações: ABC, PQR, XYZ, Comprabilidade e N](#6-classificações)
7. [Nível de serviço e matriz de 75 casos](#7-nível-de-serviço)
8. [Motor matemático V3: ES, PP, EM e cenários](#8-motor-matemático-v3)
9. [Modelo de dados](#9-modelo-de-dados)
10. [Telas e fluxos](#10-telas-e-fluxos)
11. [Stack e arquitetura do protótipo](#11-stack-e-arquitetura-do-protótipo)
12. [Estado do plano P0–P13](#12-estado-do-plano-p0p13)
13. [Decisões registradas (D-01 a D-21 e outras)](#13-decisões-registradas)
14. [Pendências de homologação](#14-pendências-de-homologação)
15. [Riscos técnicos: segurança, multi-tenant e banco](#15-riscos-técnicos)
16. [Cobrança e gateway de pagamento](#16-cobrança-e-gateway-de-pagamento)
17. [Front-end e UX: referência obrigatória](#17-front-end-e-ux)
18. [Feedback da demonstração de 02/11/2026](#18-feedback-da-demonstração-de-02112026)
19. [Regras de trabalho para agentes](#19-regras-de-trabalho-para-agentes)
20. [Perguntas em aberto](#20-perguntas-em-aberto)
21. [Pasta Fluxograma (documentação técnica V02)](#21-pasta-fluxograma-documentação-técnica-v02)

---

## 1. Resumo em 30 segundos

- **Agro MRO Intelligence** é uma plataforma web de **análise e parametrização de estoque de materiais MRO** (Manutenção, Reparo e Operação), pensada primeiro para usinas, indústrias e o agro.
- O cliente sobe três planilhas (**Dados Mestres**, **Movimentos** e **Pedidos pendentes**). A plataforma classifica cada item (ABC, PQR, XYZ, Comprabilidade), calcula **Estoque de Segurança (ES)**, **Ponto de Pedido (PP)** e **Estoque Máximo (EM)** por vários métodos, oferece **cenários** e deixa o usuário **simular, validar e exportar** a decisão para aplicar no ERP dele.
- A unidade de tudo é o par **SKU + Local** dentro do **espaço de trabalho (workspace)** do cliente.
- O motor nasceu em **R** (referência externa "SIO", também chamada de "Panorama"), foi **portado para Python** pelo Codex e é o **motor V3** que roda hoje no protótipo.
- O protótipo é **FastAPI + SQLAlchemy** no backend, **React + TypeScript + Vite** no frontend e **SQLite local** (PostgreSQL já configurável). Foi construído pelo Sander com o Codex, por etapas P0–P13, com aceites formais.
- Modelo comercial previsto: **R$ 100/mês** por assinatura (CPF), com **demonstração gratuita de até 10 itens**. Meta: **no ar até o fim de janeiro de 2027**.
- **Sander** é o dono do domínio e das regras. **Hugo** lidera o desenvolvimento e vai levar o protótipo para produção.

---

## 2. O produto

### 2.1 O que é

Textos da tela de acesso do protótipo:

> **"Inteligência para materiais."**
> **"Seu estoque tem uma história. Nós ajudamos a entendê-la."**
> "Transforme movimentações em decisões claras, parâmetros explicáveis e evolução profissional."

O produto lê o histórico de movimentações de cada material em cada local e responde, de forma **explicável e rastreável**:

- quanto o item gira, quanto custa ter, quanto tempo o saldo cobre;
- qual a importância do item (ABC de consumo), a frequência de uso (PQR) e a criticidade (XYZ);
- qual o **nível de serviço** adequado ao perfil do item;
- quanto manter de **estoque de segurança**, quando **pedir** e até quanto **estocar**, por diferentes métodos, lado a lado;
- quais itens pedem ação agora (saldo abaixo do ponto de pedido, estoque acima do limite, item sem giro, preço ausente etc.).

E depois acompanha a **decisão humana**: simular uma alternativa, validar a proposta com justificativa, emitir uma planilha de mudanças e declarar que aplicou no ERP.

### 2.2 Para quem

- **Usuário principal:** analista ou gestor de almoxarifado/suprimentos, planejador de materiais, comprador técnico. Pessoa que entende de estoque, mas **não é estatístico** ("um cara leigo não vai conseguir", disse o Sander sobre a memória de cálculo exposta).
- **Mercados iniciais:** usinas (o Zé vai abrir portas na Brasbille, Piauí), indústrias com almoxarifado MRO, agro. O cliente usa ERPs como **SAP, Senior, Datasul/TOTVS**.
- **Assinante da versão Intelligence:** pessoa física (CPF), R$ 100/mês. Planos para empresa ficam para depois.

### 2.3 Valor entregue

1. **Parâmetros explicáveis:** cada número tem fórmula, insumos, origem e versão. Nada de caixa-preta.
2. **Comparação de métodos:** em vez de um único ES/PP/EM, o usuário vê vários métodos e escolhe um cenário (Motor Agro MRO, Conservador, Maior proteção, Com risco).
3. **Priorização:** a Visão geral e a fila de trabalho mostram onde agir primeiro.
4. **Rastreabilidade:** cada análise guarda a base usada, a proposta, quem validou e por quê.
5. **Evolução profissional:** a "Academia" (20 a 40 horas-aula previstas) ensina os conceitos que a ferramenta usa.

### 2.4 Frentes do negócio (contexto, não escopo deste produto)

O Agro MRO tem outras frentes planejadas (Supply, Especialista, Peças). **Este contexto trata só do Intelligence.** Não misture escopo.

---

## 3. Pessoas e papéis

| Pessoa | Papel no projeto | O que decide |
|---|---|---|
| **Sander Gandolfi** | Idealizador e dono do domínio. Construiu o protótipo com o Codex. No plano aparece como "proprietário". | Regras de negócio, fórmulas, classificações, homologação matemática, o que fica e o que sai das telas. |
| **Hugo dos Santos Ferreira** | **Líder do desenvolvimento** (definido na reunião de 02/11/2026). Dev full-stack. | Arquitetura, stack de produção, segurança, banco, deploy, organização do trabalho técnico e de quem faz o quê. |
| **José Oliveira (Zé)** | Sócio financiador e comercial. Abre portas em usinas. | Negócio, captação, clientes. |
| **Codex** | Agente que executou P0–P7 sob autorização do Sander. | Nada sozinho. Executava só o que era autorizado. |

Como o Sander descreveu a divisão: Hugo conduz ("Sander, agora me passa as tabelas... agora as fórmulas... agora testa isso") e Sander responde com domínio, regra e teste. Sander trabalha no projeto à noite (seg, ter, qui) e nos fins de semana; dúvidas vão por WhatsApp.

**Para agentes:** decisão de regra ou fórmula é do **Sander**. Decisão técnica é do **Hugo**. Se uma tarefa exigir as duas, separe e diga qual parte precisa de quem.

---

## 4. Glossário rápido

| Sigla / termo | Significado |
|---|---|
| **MRO** | Maintenance, Repair and Operations: peças e materiais de manutenção (rolamento, selo mecânico, mangueira, redutor...). |
| **SKU** | Código do material. **Texto**, preserva zeros à esquerda (`00150` ≠ `150`). |
| **Local** | Depósito/centro/localização do estoque (ex.: `1001`). Texto. |
| **SKU + Local** | Unidade de análise. O mesmo SKU em dois locais são duas posições independentes. |
| **Workspace / espaço** | O ambiente isolado de um cliente. Tudo é delimitado por ele. |
| **MD** | Dados Mestres: cadastro por SKU + Local (datas, saldos, custo, parâmetros). |
| **Movimento / extrato** | Evento `IN` (entrada) ou `OUT` (saída) com data e quantidade positiva. |
| **Pedido pendente** | Compra ainda não entregue. **Não entra no saldo físico.** |
| **μ (mi)** | Consumo médio diário (saídas/dia). |
| **σ (sigma)** | Desvio-padrão amostral da demanda diária. |
| **LT** | Lead time, prazo de reposição em dias. |
| **σLT** | Desvio-padrão do prazo de reposição. **Ausente não é zero.** |
| **R / TR** | Período de revisão em dias. |
| **H** | Horizonte = LT + R. |
| **NS** | Nível de serviço (probabilidade de não faltar). |
| **Z** | Quantil da normal padrão para o NS: `Z = Φ⁻¹(NS)`. |
| **ES** | Estoque de segurança. |
| **PP** | Ponto de pedido. |
| **EM** | Estoque máximo. |
| **TMEA** | Tempo médio entre dias com saída (dias). Não confundir com TMER. |
| **TMER** | Tempo médio entre reposições (matriz de 75 casos). **Não ativado** e o Sander disse em 02/11 que deve sair. |
| **Quantum / múltiplo** | Múltiplo de embalagem/lote para arredondar ES/PP/EM. |
| **NC** | Não calculável. Estado explícito com motivo. Nunca vira zero. |
| **ND** | Não declarado (ex.: ABC do cliente vazia). |
| **SIO / Panorama** | Motor original em R. Referência externa e comparativa, **não é dependência de produção**. |
| **Golden Master** | Conjunto congelado de casos de referência (`golden_master_sio_12.json`). Não se altera. |
| **V2 / V3** | Rodadas de homologação matemática do Sander (planilhas de 10/10/2026). V3 é a vigente. |
| **R01–R28** | As 28 regras matemáticas aprovadas e integradas na P3. |
| **AM-xx** | Achados de auditoria (AM-01 a AM-08) e também códigos dos alertas de controle (AM-001, AM-COB-001...). Os códigos de alerta vão ser renomeados. |
| **E-xx / Exx** | IDs de evidência e de rodadas de trabalho do plano (E-01 até E64). |
| **D-xx** | Decisões registradas. |

---

## 5. Domínio: MRO e gestão de estoque

### 5.1 Unidade e janela de análise

- A análise é sempre por **workspace + SKU + Local**.
- Cada SKU + Local tem uma **janela própria** definida pelas datas do MD: **Data inicial do saldo (t0)** e **Data final do saldo (t1)**, **inclusivas**.
- Saídas são agregadas por dia. **Dias sem saída dentro da janela entram como demanda zero** e contam no denominador.
- Movimentos fora da janela **não entram no cálculo**, mas o extrato completo é preservado (não se apaga nem encurta).
- **Sem uma das datas, ou com datas invertidas, não há resultado definitivo** (D-04). Os dados brutos continuam consultáveis, mas ficam bloqueados: classificação definitiva, Forecast e validação de cenário. Não inferir a data pela primeira/última linha nem por "hoje".
- O arquivo importado não define o período matemático. A tabela de movimentos é uma **fonte viva**: importações podem acrescentar linhas ou substituir tudo, sempre com prévia e confirmação.

### 5.2 Saldos (D-05)

- **Abertura** = posição antes dos movimentos do primeiro dia. **Fechamento** = posição depois dos movimentos do último dia.
- O **saldo final informado no MD é o oficial.**
- Abertura inferida: `S0 = Sf oficial − Σ IN + Σ OUT` dentro do corte.
- Se o cliente declarou a abertura, ela fica **separada** da inferida e a diferença é registrada (`delta = S0 declarado + I − O − Sf oficial`).
- Saldo final ausente não vira zero nem saldo reconstruído.
- Na importação, o cliente diz se o saldo inicial é **antes** ou **depois** dos movimentos da data inicial (vale para a carga inteira, com override por linha). Sem essa escolha, a linha é inválida.
  - Antes: `saldo = saldo inicial + entradas − saídas`
  - Depois: `saldo = saldo inicial + entradas − saídas − movimento líquido da primeira data`

### 5.3 Indicadores físicos

| Indicador | Fórmula | Observação |
|---|---|---|
| Consumo médio diário | `μ = Σ OUT / n` | n = dias da janela |
| Desvio diário | `σ = √[Σ(Dd − μ)² / (n − 1)]` | n = 1 dá σ = 0 se a série existe |
| Estoque médio | média dos fechamentos diários, incluindo dias sem movimento | D-06 |
| Giro anualizado | `365 × μ / estoque médio` | só se média > 0 |
| Cobertura (dias) | `saldo final oficial / μ` | só se μ > 0 |
| Valor do estoque | `saldo final oficial × preço contábil do MD` (BRL) | não substituir por média das entradas |
| TMEA | `n / k`, k = dias com OUT > 0 | |

Denominador zero deixa o indicador **sem valor**. O sistema não cria substitutos.

### 5.4 Trilha do Estoque

Gráfico da trajetória diária do saldo de um SKU + Local, até 365 dias mais recentes, só com movimentos reais. Mostra entradas, saídas, menor saldo, dias negativos e eventos recentes. Pedidos pendentes não entram. É leitura histórica, não cria fórmula de reposição.

### 5.5 Qualidade do extrato

O Sander insiste: **extrato poluído gera resultado ruim**. Entrada válida: NF, devolução de requisição, retorno de conserto. Saída inválida: estorno de NF. Por isso existe a ideia de **tipos de movimento** pré-cadastrados por ERP (SAP, Senior, Datasul/TOTVS) e "sistema próprio" (o cliente cadastra o código dele, ex.: `12 = saída, nota fiscal`). O próprio Sander acha que isso pode "complicar o simples" e **não decidiu se fica**.

---

## 6. Classificações

Todas as classificações são calculadas **na coorte do workspace com as mesmas datas**. Filtros e paginação **não recalculam** ABC para um subconjunto.

### 6.1 ABC de consumo (D-07)

- Peso: `wᵢ = μᵢ × custo MD`.
- Ordena por w decrescente e acumula `pᵢ = Σ(j ≤ i) wⱼ / Σ wⱼ`.
- **A** até 80%, **B** acima de 80% até 95%, **C** acima de 95%, **D** quando w = 0, **N** item novo.
- Fronteira de 95% comparada exatamente (correção P3-E41-ABC95).
- Coorte incompleta bloqueia a ABC.
- **ABC do cliente** (declarada) fica separada da calculada. Vazia, `-`, `ND`, `N/D` = **ND · Não declarado**.
- **ABC de estoque** existe no código mas **não foi ativada** (decisão D-P4-04).

### 6.2 PQR (popularidade / frequência)

- Frequência anualizada: `f = 365 × nº de transações / n`.
- **P** ≥ 12/ano, **Q** ≥ 3 e < 12, **R** > 0 e < 3, **S** sem transação, **N** novo.
- **Maiúsculas = saídas (PQR OUT). Minúsculas = entradas (pqr IN).**
- É a PQR de **saídas** que entra na chave do nível de serviço.

### 6.3 Classe N (item novo) — D-08

- Prazo padrão **180 dias**, compartilhado por ABC, PQR de entradas e PQR de saídas.
- Item com idade conhecida < prazo e **sem OUT comprovado até t1** é N.
- Consumo OUT comprovado até o fim do corte libera o N (consumo anterior ao início serve só para elegibilidade, não compõe a série). Só entrada não libera. Consumo futuro não é usado.

### 6.4 XYZ (criticidade)

- **Declarada pelo cliente**, não calculada. X = mais crítico.
- Ausente na importação vira **X** com origem `agro_mro_default`, persistida e contada na prévia (D-09).

### 6.5 Comprabilidade (1, 2, 3)

- 1 = encontrado em muitos fornecedores; 2 = número reduzido de fornecedores; 3 = exclusividade ou prazo longo.
- Ausente vira **3** com origem `agro_mro_default`.
- Atenção: a matriz TMER usa "X123" com escala que pode estar invertida em relação a essa definição. **Não confirmado** (D-15). Não presumir equivalência.

### 6.6 Cortes configuráveis

O cliente pode mudar no seu espaço: os dois cortes acumulados da ABC, os limites P e Q (separados para entradas e saídas) e o prazo do N. A mudança é **privada, versionada e auditada**, vale para a próxima classificação, não altera dados de origem nem o Golden Master. "Restaurar regras da Agro MRO" volta ao padrão e cria nova versão. Os cortes devem ser crescentes.

**UVW** existia no legado e **não será oferecida** (D-18). Não reintroduzir.

---

## 7. Nível de serviço

### 7.1 Precedência (D-10)

1. **Manual** por SKU + Local (o usuário escolhe, ex.: 95% só para esse material). Sempre prevalece.
2. Sem manual: **matriz** pela chave **PQR de saídas + ABC de consumo + XYZ efetivo**.
   - Matriz **privada** do cliente, se houver. Chave ausente na privada dá **NC**, sem fallback silencioso (D-P4-02).
   - Senão, **matriz padrão V3 da Agro MRO com 75 casos** (P/Q/R/N/S × A/B/C/D/N × X/Y/Z).
3. Registra valor, origem (`cliente` ou proposta Agro MRO), código do caso e versão.
4. Registro legado sem origem é marcado como **não confirmado**. A matriz não sobrescreve.

### 7.2 Domínio

- NS válido: **NS = 0** (estado explícito) ou **0,50 ≤ NS < 1**.
- NS = 0 é legítimo: deixa os métodos automáticos indisponíveis, sem `invnorm(0)` e sem trocar por 5%.
- Na tela, cada caso tem explicação. Exemplo mostrado: "PAX: saídas frequentes, alto valor de consumo, criticidade X. Objetivo: equilibrar disponibilidade e capital. Mais serviço eleva a proteção; menos serviço amplia a exposição à falta."
- Os números da proposta Agro MRO ainda estão sujeitos à **homologação comercial**.

---

## 8. Motor matemático V3

> Fonte principal: Contrato Matemático (temos a **versão 0.3**; a vigente no repositório é a **0.4/E63**, só documental) + seção 3.1 do Plano 1.36 + guia drawio "Dados e fórmulas". Onde o 0.3 diverge das decisões D-10 a D-14, **valem as decisões**. As divergências estão marcadas.

### 8.1 Pré-condições

- Fonte diária válida, `n ≥ max(2, LT)`, NS positivo e cenário válido para política.
- Histórico menor que o LT ou sem movimento: `insufficient_data` com motivo.
- Quantil empírico `Q(W)`: ordene as somas das `m = n − W + 1` janelas móveis de W dias e pegue a posição `ceil(NS × m)`, **sem interpolação**. `n < W` dá NC.

### 8.2 Estoque de segurança (ES)

Calculados **em paralelo** e mostrados lado a lado:

| # | Método | Fórmula | Requer |
|---|---|---|---|
| 1 | Inversa Normal | `ES = μ + Z × σ` | |
| 2 | TMEA | `ES = (μ + Zσ) × TMEA / (LT + Z × σLT)` | TMEA, σLT declarado, denominador > 0 |
| 3 | Raiz tradicional | `ES = Z × √(σ² × LT + σLT² × μ²)` | σLT |
| 4 | Fator tradicional | `ES = Z × σ × √LT` | |
| 5 | Motor Agro MRO | `ES = max(Q(LT) − μ × LT, 0)` | janelas completas |
| 6 | Valor do cliente | declarado | |

As fórmulas 1 e 2 são as homologadas pelo Sander. **Não "corrija" fórmula por achar que está fora do livro.** Divergência teórica vira pergunta para o Sander, não mudança de código.

### 8.3 Ponto de pedido (PP)

| Método | Fórmula |
|---|---|
| Tradicional | `PP = μ × LT + ES escolhido` |
| Motor Agro MRO | `PP = Q(LT)` |
| Valor do cliente | declarado |

### 8.4 Estoque máximo (EM) — D-12 / D-13

**Participam da seleção (automáticos):**

| ID | Método | Fórmula | Condição |
|---|---|---|---|
| EM-01 | Tradicional | `ES selecionado + PP selecionado` | preservar origem de ES/PP |
| EM-02 | Agro MRO | `ES selecionado + μ × (LT + R + B)`, `B = max(Z, 0) × σLT` | σLT informado e NS resolvido |
| EM-03 | Motor empírico | `Q(LT) + Q(R)` | janelas completas |

**Só comparação (não entram em cenário, média nem troca automática):**

| ID | Método | Fórmula |
|---|---|---|
| EM-04 | Periódico + ES | `μ × H + ES_H` (exige ES do horizonte H com referência) |
| EM-05 | Normal prazo fixo | `μ × H + Z × σ × √H` |
| EM-06 | Normal prazo variável | `μ × H + Z × √(H × σ² + μ² × σLT²)` |
| EM-07 | Poisson | menor inteiro s com `F_Poisson(μH)(s) ≥ NS`; busca até 1000; senão NC |

> **Divergência no contrato 0.3:** ele ainda lista "Tradicional 2 = consumo máximo diário × LT + ES" como opção de EM. Isso foi **substituído** (S-06): fica só como referência histórica.

### 8.5 Arredondamento por quantum (D-14)

- `A(x) = q × ceil(max(x, 0) / q)`.
- q = múltiplo positivo informado. Sem múltiplo: natureza inteira (UN, PC, PECA, PEÇA) usa q = 1; fracionável exige passo explícito.
- Sem q válido: o **bruto** existe e o **aplicado** fica NC.
- Manual é exato (inclusive zero) e não é arredondado nem entra em agregados.
- **EM automático abaixo do PP:** efetivo = A(PP), guardando o selecionado.
- **EM manual abaixo do PP:** conflito. Manual preservado, efetivo NC. Nunca corrigir em silêncio.

> **Divergência no contrato 0.3:** "duas casas decimais sem múltiplo" e "piso EM ≥ PP também para o manual" foram substituídos por D-14 (S-07).

### 8.6 Cenários de decisão

Valores declarados pelo cliente têm precedência. Sem manual, o usuário escolhe um cenário, calculado sobre os **aplicados disponíveis**:

| Cenário | Regra |
|---|---|
| **Motor Agro MRO** | usa diretamente o método estatístico Agro MRO |
| **Conservador** | média aritmética dos métodos calculáveis (sem o manual), reaplicada pelo quantum |
| **Maior proteção** | maior resultado calculável (substitui o rótulo informal "sem risco nenhum") |
| **Com risco** | menor resultado **estritamente positivo** |

Ordem de resolução: **manual exato > cenário pedido disponível > Motor > primeiro disponível**, sempre registrando a origem efetivamente usada.

Pendência: o objetivo comercial falava em "três resultados" e o contrato tem quatro cenários. **Nenhum cenário pode ser removido em silêncio.**

### 8.7 Exemplo real da demonstração (02/11/2026)

Valores lidos da transcrição, servem para entender a ordem de grandeza:

- Item de amostra: saldo final oficial **30 un** (R$ 6.600), preço contábil **R$ 220**, μ ≈ **0,3516 un/dia**, σ ≈ **0,9592**, TMEA **7 dias**, janela **273 dias**, estoque médio diário **79**, giro **1,61/ano**, cobertura **85 dias**.
- Resultado: ES 2, PP 4, EM 18. Cenário Conservador: ES 4 (Fator tradicional 4,17 arredondado), PP 5, EM 14.
- EM: tradicional 6, Agro MRO 17, Motor 18; comparativos 23, NC (faltou insumo) e Poisson 19.
- Selo mecânico 0130 (classe B, P/p, X, Comprabilidade 1, NS 82,1%): saldo 0, ES 2, PP 9, EM 21. Simulando "Com risco", LT 12, R 21, NS 92%: ES 1, PP 6, EM 7. Validado com a justificativa "seguirei com o modelo de risco" e exportado.

### 8.8 Forecast

- **Experimental 0.1.0** (D-16). Sob demanda na ficha, seis meses de calendário após o fim do MD, treino/backtest sem futuro.
- Dois candidatos experimentais, biblioteca com 32 registros de modelos (não são 32 modelos adotados). Carteira indicada pelo Sander: FP01–FP05 prioritários e FG01–FG08 graduais.
- **Não entra nos cenários nem na política.** O Sander disse em 02/11 que "ainda não está pronto". É a P8.

### 8.9 Fora do motor ativo

- **TMER (75 casos)** e **GR1–GR7**: tabela cadastrada e editável, mas **nenhum valor é aplicado**. Em 02/11 o Sander disse que "vai sair fora, a gente não vai seguir com isso". Confirmar com ele antes de apagar código.
- **Regras de lotes** (lote de compra pelo TMER): o Sander disse que vai tirar.

---

## 9. Modelo de dados

> Entidades citadas no plano e nos diagramas. A modelagem final de produção é responsabilidade do Hugo. O Sander pediu cuidado especial com as tabelas ("as tabelas precisam ser bem feitas para a gente poder mesclar depois").

### 9.1 Visão conceitual

```
Workspace (espaço do cliente)
 ├── Usuários / membros
 ├── Configuração de regras (cortes ABC/PQR, prazo N, matriz NS privada, TMER) — versionada
 ├── Material (SKU texto)
 │    └── MaterialMasterData (MD) por SKU + Local
 │         ├── datas t0/t1, saldo inicial (+ antes/depois), saldo final oficial
 │         ├── preço contábil, unidade, múltiplo/quantum, natureza (inteiro/fracionável)
 │         ├── LT, σLT, R, NS manual, ES/PP/EM manuais
 │         ├── ABC cliente, XYZ, Comprabilidade (+ origem: customer | agro_mro_default)
 │         ├── grupo de mercadoria, descrição, foto (catálogo)
 │         └── parâmetros de planejamento ativos (com origem/versão)
 ├── Movement (extrato IN/OUT) por SKU + Local
 ├── PurchaseOrder (pedidos pendentes) por SKU + Local
 ├── Tipos de movimento (SAP/Senior/Datasul/sistema próprio) — em discussão
 ├── Cargas / recibos / versões (rastreabilidade P2)
 ├── AnalysisRun (execuções de análise, replay)
 └── Ciclos de planejamento (simulações, validações, emissões, declarações de aplicação) — P6
```

### 9.1.1 Tabelas reais do protótipo (D09, 37 entidades)

Extraído do diagrama D09 (inspeção de `models.py`, `lineage_models.py` e `planning_work_models.py`). Tipos: `INTEGER`, `VARCHAR`, `NUMERIC(18,4)` para quantidades e preços, `DATE`/`DATETIME`, `TEXT` para JSON.

**Núcleo de identidade e conta**

| Tabela | Campos principais | Unicidade |
|---|---|---|
| `users` | id, email, name, **cpf**, password_hash, workspace_id (**NULL permitido**), created_at | cpf; email |
| `workspaces` | id, name, **plan**, **sku_limit**, created_at | — |
| `audit_logs` | workspace_id, user_id, action, entity, entity_id, details | — |

Hoje é **um usuário → um workspace** (FK direta em `users`). Não existe tabela de membros nem papéis. O limite da demonstração/plano vive em `workspaces.sku_limit`.

**Cadastro e dados do cliente**

| Tabela | Campos principais | Unicidade |
|---|---|---|
| `materials` | code, short/long_description, unit, application, group_1, group_2, **location**, notes, replacement_code, criticality, obsolete, confirmed, **is_demo** | workspace + code + location |
| `material_master_data` (MD) | material_id, registered_on, initial_stock, initial_stock_date, **opening_balance_timing**, final_stock, final_stock_date, maximum_stock, average_price, customer_abc, xyz_criticality + xyz_source, purchasability + purchasability_source, lead_time_days | workspace + material |
| `planning_parameters` | lead_time_days, service_level + service_level_source, review_period_days, package_multiple, lead_time_std_dev, manual_safety_stock, manual_reorder_point, manual_maximum_stock, selected_scenario | workspace + material |
| `movements` | material_id, occurred_on, direction (`IN`/`OUT`), quantity, unit_price, source, external_system, external_type, mapping_version, fingerprint | — |
| `pipeline_orders` (pedidos pendentes) | material_id, expected_on, quantity, reference, supply_value, supplier, fingerprint | workspace + fingerprint |
| `material_images` | material_id, storage_name, original_name, mime_type, size_bytes | storage_name |
| `units_of_measure` | name, symbol, category, is_standard (workspace NULL = padrão global) | workspace + symbol |
| `merchandise_groups` | level, parent_id, name, normalized_name, is_standard (hierárquico) | workspace + level + parent + nome |

> Repare: **`materials` já é SKU + Local** (`code` + `location` na mesma linha). O "material" do sistema é a posição, não o SKU puro.

**Regras configuráveis por workspace (todas versionadas)**

| Tabela | Para quê |
|---|---|
| `classification_settings` | cortes abc_a, abc_b, pqr_output_q/p, pqr_entry_q/p, new_item_days |
| `service_level_rules` | matriz NS privada: case_code, pqr, abc, xyz, service_level, source |
| `tmer_rules` | matriz TMER: pqr, abc, purchasability, replenishment_days (não aplicada) |
| `control_case_preferences` | ação e nota por alerta de controle (AM-*) |
| `taxonomy_edges` | arestas da árvore de decisão (source_node → target_node) |
| `movement_type_mappings` | system, external_code → direction (tipos de movimento por ERP) |

**Rastreabilidade P2 (linhagem)**

| Tabela | Para quê |
|---|---|
| `trace_contents` | blobs imutáveis por sha256 (arquivo original, payload, JSON de análise) |
| `trace_import_sources` | arquivo recebido: dataset, filename, preview, parser_version |
| `trace_import_receipts` | **recibo** de cada importação: operation, origin, status (`completed`/`blocked`/`failed`), before/after versions, contract_version, retention_policy |
| `trace_import_rows` | cada linha: ordinal, status, reason, raw/normalized/persisted_json |
| `trace_dataset_versions` / `trace_dataset_heads` | versões encadeadas de cada dataset por workspace e a versão atual |
| `trace_analysis_runs` | análise preservada: material, code, location, kind, inputs/result/dependencies (em trace_contents), fingerprint, contract_version |
| `report_periods` / `report_movements` | legado de períodos por relatório (substituído pela janela do MD, D-03) |

**Planejamento e gestão do trabalho (I04/P6)**

| Tabela | Para quê |
|---|---|
| `planning_cases` | um caso por SKU + Local: status, reason, selected_simulation_id, validated_evidence_hash/at, export_batch_id, exported_at, applied_at, external_reference |
| `planning_simulations` | inputs_json, baseline_json, result_json, evidence_hash |
| `planning_events` | eventos do caso |
| `planning_export_batches` | lote emitido (id UUID, positions) |
| `planning_work_heads` | ciclo atual do caso |
| `planning_work_cycles` | sequence, status, revision, assignee_id, due_on, next_action, validated_at, applied_at, administrative_closed_at, ended_at |
| `planning_work_events` | actor, action, details por ciclo |

**Academia e suporte**

`lessons` (slug, title, summary, indicator, order), `lesson_progress` (user × lesson), `support_tickets` e `ticket_notifications` (envio por SMTP condicionado à configuração).

Segundo o índice V02, existem um **dicionário de dados com 345 campos** e um **catálogo com 102 rotas de API**, mas esses arquivos não vieram na pasta enviada (seção 21).

### 9.2 Dados Mestres (MD)

Uma linha por **SKU + Local**. Campos relevantes (nomes de negócio):

- **Identidade:** código do material (texto, zeros à esquerda), Local (texto), descrição, unidade de medida, grupo de mercadoria.
- **Período:** Data inicial do saldo, Data final do saldo, referência do saldo inicial (antes/depois).
- **Saldos e valor:** saldo inicial (opcional), saldo final oficial, preço contábil (BRL).
- **Classificações declaradas:** ABC do cliente, XYZ (criticidade), Comprabilidade 1/2/3, cada uma com **origem**.
- **Parâmetros:** LT (1–365 dias; zero e fora da faixa são rejeitados), σLT, período de revisão R, NS manual, múltiplo de embalagem, natureza.
- **Manuais:** ES, PP e EM declarados pelo cliente.

Regras: o MD é a autoridade do período. Valores originais e padrões efetivos ficam **separados**. Ausência ≠ zero ≠ padrão.

### 9.3 Movimentos

- Campos: SKU, Local, data, sentido `IN`/`OUT`, quantidade **positiva finita**, tipo de movimento (opcional), documento.
- Validação: identidade, direção, data e quantidade. Erros voltam por linha antes de confirmar.
- Importação: **acrescentar** ou **substituir** a tabela, com prévia e confirmação. Reimportação idêntica não duplica.
- Substituir não pode apagar a capacidade de reproduzir análises antigas (AM-05, resolvido na P2 com recibos e versões).

### 9.4 Pedidos pendentes

- Pedidos de compra ainda não entregues, com nome, fornecedor e valor.
- **Não entram no saldo físico** nem na Trilha. Aparecem como aviso na ficha.
- Análise de fornecedores e lead time observado é a P10.

### 9.5 Rastreabilidade (P2)

- Recibo de cada carga, versão dos dados, origem dos parâmetros (recebido / anterior / efetivo / origem / motivo / ID).
- AnalysisRun guarda referência e proposta. Replay só com o software correspondente (D-P4-05).
- Retenção: **preservar até revisão explícita**, sem exclusão automática (E-26).

### 9.6 Massas de teste conhecidas

- **Golden Master SIO 12:** `backend/tests/fixtures/golden_master_sio_12.json`. Congelado.
- **42 cenários sintéticos** E41 com oráculos.
- **Cliente Alfa** (dados reais, privados): base de 5.283 SKU + Local, 46.947 movimentos, 198 pedidos (Local 1001); amostra derivada de **3.344** posições, 6.897 movimentos e 32 pedidos. Tem limitações registradas (1.939 trajetórias negativas na base completa, 430 códigos sem MD). **Dado de cliente: nunca copiar para fora do ambiente autorizado.**

---

## 10. Telas e fluxos

### 10.1 Mapa de telas do protótipo

O Sander resumiu o que deve ficar: **Visão geral, Materiais (catálogo), Planejamento com fila de atendimento, Importação de dados e Regras de negócio**. "O restante precisa ficar em pastas guardadas para consulta, tipo PDF."

| Tela | O que tem hoje |
|---|---|
| **Acesso** | E-mail e senha, cadastro, botão de **demonstração** (até 10 itens). |
| **Importar dados** | Três abas: Movimentos, Dados mestres, Pedidos. Validação por linha, prévia, "Confirmar importação". Histórico das cargas. Acrescentar ou substituir. Tipos de movimento por ERP. Botão para ver o primeiro plano após a carga. Excel de consulta. |
| **Visão geral** | KPIs: valor, nº de posições, saldo abaixo do PP, eventos (ex.: 156 IN / 520 OUT), saldo positivo/zerado/negativo (cada um abre "conferência" com a lista). Gráfico (Sander não gostou). Fila de prioridades. Distribuições ABC consumo, ABC estoque (não calculada), PQR, XYZ, Comprabilidade. Cruzamento PQR × ABC. **Encaminhamentos** (alertas). **Árvore de decisão** PQR → XYZ → Comprabilidade → ABC que filtra o grupo. Busca por código, filtros, Excel do conjunto filtrado. |
| **Materiais** | Catálogo com foto do produto (quebrado na demo), cadastro de material, acesso à ficha. |
| **Ficha do SKU + Local** | Classes e NS com origem (editável), saldo, ES/PP/EM efetivos, estatística física, "Como chegamos aos parâmetros" com memória de cálculo de cada método, cenários, pedidos pendentes, **Trilha do estoque** (diário, mensal, recorte de período), Forecast (experimental), "Testar uma alternativa". |
| **Planejamento** | "Meu plano de estoque": carteira/fila de trabalho (em análise, aplicação, descartados), ciclos com responsável, motivo, próxima revisão, simulações, validação, seleção para emissão, Baixar Excel, declarar aplicação. |
| **Regras** | Explicação de ABC/PQR/XYZ/Comprabilidade/N com cortes editáveis e "restaurar padrão", matriz NS 75, matriz TMER, regras de lotes, fórmulas do motor (falhou ao carregar na demo), pontos de controle (alertas AM-*) com ação e observação interna por grupo, "regras em estudo". |
| **Academia / Suporte** | Placeholder. Academia = 20 a 40 horas-aula. |

### 10.2 Alertas de controle (encaminhamentos)

Cada item analisado recebe um ou mais sinais para agrupar o trabalho: **saldo negativo, reposição indicada, estoque acima do limite, histórico insuficiente, preço ausente, cobertura elevada, item sem giro, parâmetro definido pelo cliente.** Códigos atuais (AM-001, AM-COB-001...) vão ser renomeados. Não equivalem aos controles GR1–GR7.

### 10.3 Jornada do cliente (guia drawio 02)

| Etapa | Cliente faz | Ferramenta processa | Cliente recebe / decide |
|---|---|---|---|
| 01 Acessar | Entra com e-mail e senha | Confere o acesso e carrega a Visão geral do espaço | Abre Importar dados |
| 02 Enviar e conferir | Valida primeiro o MD, depois Movimentos; Confirmar importação | Verifica campos, identidade, data, quantidade; registra carga e origem | Confere o resultado e o Histórico das cargas |
| 03 Priorizar | Visão geral ou Materiais por código + Local | Usa o período de cada posição; avisa o que está indisponível | Escolhe o que investigar |
| 04 Ler a ficha | Confere saldo, histórico, classes e parâmetros | Mostra indicadores, método, origem; indica quando a política não pôde ser calculada | Base pronta → etapa 05; faltando dados → corrigir na origem |
| 05 Simular | "Iniciar análise deste SKU + Local" → "Testar uma alternativa" → "Calcular e guardar simulação" | Guarda referência e proposta; **simular não muda parâmetros ativos** | Compara ES, PP, EM e premissas |
| 06 Validar | Seleciona o teste, justifica e valida; organiza a fila | Confere atualidade e elegibilidade; registra decisão humana | Prepara a emissão (se a base mudou, volta à 05) |
| 07 Emitir e baixar | Seleciona casos elegíveis → Baixar Excel | Reconfere e registra a emissão | Usa o **Excel de mudanças** para aplicar no ERP (o Excel de consulta é outro) |
| 08 Registrar | Declara aplicação no sistema do cliente com referência externa | Vincula a declaração ao ciclo e à emissão | Acompanha histórico e status |

Desvios: **carga com pendências** → localizar linha e motivo, corrigir a fonte, reenviar. **Dados insuficientes** → usar o que é calculável, corrigir a origem e voltar antes de validar.

Princípio de D-17: **testar não aplica; validar conserva evidência; exportar não confirma aplicação.** Cada passo é um estado diferente.

### 10.4 Fluxo técnico de uma requisição (guia drawio 01)

```
React (App.tsx → api.ts → ApprovedDashboard.tsx)
   │  GET /api/v1/approved-math/dashboard
   ▼
FastAPI (approved_math_api.py → dashboard_read)
   │  current_user delimita o workspace; DashboardQuery valida filtros
   ▼
ApprovedAnalysisService.project_sheets (approved_analysis_service.py)
   │  prepara contexto P1 → classes → NS → calculate_approved
   │  analysis_context.py → approved_classifications.py / approved_service.py
   │  → approved_inventory.py / approved_quantity.py
   ▼
SQLAlchemy (database.py): Material, MaterialMasterData, Movement, parâmetros
   │  SQLite local; PostgreSQL configurável
   ▼
dashboard_read monta agregados, membros e página → frontend mostra contexto, período e estados
```

Ficha e relatórios consomem o mesmo caminho aprovado. Planejamento usa comandos próprios (simular, validar, emitir, declarar aplicação).

### 10.5 Importação em detalhe (D03 / D10.1)

1. Cliente escolhe arquivo e dataset (MD, movimentos ou pedidos). Upload multipart com limite de **15 MiB** (acima: 413).
2. Lê **XLSX, CSV ou TXT**. O arquivo original é **preservado mesmo se o parser rejeitar**.
3. `confirm=false`: normaliza e valida por dataset, consulta mapeamentos (tipos de movimento) e fingerprints, devolve prévia com erros por linha, contagens, padrões aplicados e o que será substituído. O cliente edita linhas e escolhe **append** ou **replace**.
4. `confirm=true`: trava P2, captura versões "antes", revalida o payload. Linha inválida → recibo `blocked` + HTTP 422, **nenhuma linha aplicada** (tudo ou nada). Sucesso → aplica, vincula linhas, versões "depois", recibo `completed`, auditoria, commit.
5. Falha no meio: rollback, cria `failed_attempt` numa transação nova e devolve `failed` com `receipt_id`; se nem isso gravar, `not_persisted`.
6. **Colagem de movimentos** (rota paste, sempre append): texto + delimitador, cabeçalho ou posição fixa, prévia de até 20 linhas, fingerprint `paste-v2`.

### 10.6 Leitura do dashboard e da ficha (D06 / D10.2)

- Consultas **não gravam nada**. Snapshot consistente, população integral classificada, filtro visual aplicado depois.
- Conferência de membros de um indicador envia `members_key` + `expected_context`; se a base mudou, **409** e a tela pede para atualizar.
- Ficha: `GET sheet` com fingerprint opcional; 409 se o contexto mudou; o frontend (`requireReviewedSheet`) **recusa DTO incompleto** (correção A5).
- Cada campo mostra zero, NC ou conflito explicitamente. "Registrar evidência" é um **comando separado** que recalcula e preserva em P2.
- Trilha: `visual_start`/`visual_end`; recorte inválido dá 422; trajetória é construída inteira e só depois recortada; política histórica sem contrato temporal fica NC.

### 10.7 Simulação, validação e ciclos (D07, D08, D10.3–D10.5)

- **Capacidade:** a tela de Planejamento consulta `capabilities`. Com P6 habilitada usa ciclos; sem P6, caminho legado. Sem esquema P6, mostra indisponível (sem migração implícita).
- **Rascunho** de proposta não é parâmetro ativo. O payload distingue omitido / valor (inclusive zero) / null.
- **Simular** (uma transação): lock, confere caso/estado/revisões, calcula referência e proposta com as mesmas dependências, preserva **dois AnalysisRun** + simulação, seleciona, estado `testing`, evento, commit. Resposta perdida: consultar, **sem retry automático**.
- **Validar:** simulação selecionada atual + **justificativa com no mínimo 10 caracteres** + revisões/fingerprint. Bloqueios: stale → simular de novo; NC/conflito → rever proposta. Grava `validated`, hash, data, nota. **Não altera parâmetros ativos e não chama o ERP** (PUT de parâmetro ativo é outro comando).
- **Emitir:** seleção explícita de casos (até 25 na UI, 1–100 na API), todos atuais e elegíveis ou **nada é emitido**. Gera o Excel de mudança com **4 abas** antes do commit, grava lote/eventos/`exported` num commit único. Header `X-Planning-Batch`. Se o download falhar depois do commit, o lote existe e a recepção fica **incerta**: bloqueia novo POST, o usuário confere o estado. Não há binário durável para baixar de novo.
- **Declarar aplicação:** referência externa opcional → `applied`; depois `monitoring`; concluir exige `monitoring` e `applied_at`.
- **Reabrir:** novo ciclo com motivo ≥ 3 caracteres; o anterior ganha `ended_at`; histórico preservado; o novo ciclo **não herda validação**.

Máquina de estados do caso/ciclo:

```
todo → analysis → testing → ready → validated → exported → applied → monitoring → completed
                     ↘ discarded (reopen → novo analysis)
completed/qualquer → reabrir → novo ciclo (analysis), anterior com ended_at
```

### 10.8 Erros e recuperação (D12)

- Sessão/autorização (401): autenticar de novo, **nunca repetir escrita automaticamente**.
- Carga: `blocked`/`failed`/`not_persisted` → revisar histórico e origem.
- Capacidade 503: flag, esquema, fuso ou isolamento; diagnosticar sem migrar.
- Leitura bloqueada: manter só campos qualificados, não inventar valor; contexto mudou → conservar rascunho e reconsultar.
- Integridade/replay: preservar original, bloquear uso, diagnosticar versão/hash. Replay histórico só se kind, versão e hash forem compatíveis (`reproduced`, `divergent`, `not_reproduced`, `unavailable`).
- Gravação incerta: se o commit pode ter acontecido, consultar caso, ciclo, lote, eventos e recibos antes de qualquer nova ação.

---

## 11. Stack e arquitetura do protótipo

### 11.1 O que existe hoje (protótipo do Sander)

| Camada | Tecnologia | Observação |
|---|---|---|
| Backend | **Python + FastAPI** | APIs, importações, regras e cálculos |
| ORM / dados | **SQLAlchemy** | |
| Banco | **SQLite local** (padrão) | PostgreSQL já aparece no Docker Compose, mas não foi provado (P2-OP05: "SQLite não prova PostgreSQL") |
| Frontend | **React + TypeScript** | Sem runner de testes configurado no início (AM-07) |
| Build/dev | **Vite** | site local na porta 5173; laboratório P7 na 8814 |
| Motor | **Python V3**, portado do R pelo Codex | R (SIO/Panorama) e Golden Master ficam como referência externa |
| Exportação | Excel (XLSX) e PDF | Excel N100 certificado; N1000 perto dos limites; N3344 não certificado |
| Testes | pytest com bancos descartáveis; checks no Edge | limites de 120 s e 1 GiB por processo |
| Infra preparada | Perfil AWS us-east-2 / Toolkit | **nunca operado** (P12) |
| Docker | `docker-compose.yml` com **PostgreSQL**, API em `api:8000` e **Nginx** servindo o build e fazendo proxy de `/api/` | implantação ativa não confirmada |
| Auth | Bearer token; **token guardado em `localStorage`** no frontend; `VITE_API_URL` | ver riscos (15.1) |
| Arquivos | imagens em `UPLOAD_DIR` / volume `material_images`; conteúdos de linhagem P2 no banco | |
| E-mail | SMTP externo para notificação de suporte (`notifications.py`), condicionado à configuração | |
| Startup | `create_all` exclui as tabelas P2/P6; a navegação depende de capacidade e esquema habilitados | |
| Governança | `AGENTS.md`, skills do Sander, `docs/` com o Plano Único | o repositório já tem um AGENTS.md próprio |

Arquivos citados (conferir no repo):

- Backend: `backend/app/main.py`, `approved_math_api.py`, `approved_dashboard.py`, `approved_analysis_service.py`, `analysis_context.py`, `approved_classifications.py`, `approved_service.py`, `approved_inventory.py`, `approved_quantity.py`, `database.py`, `models`, `schemas`, `workspace_rules`, `classifications`, `analytics`, `series`, `stock_story`, `forecast`, `control_rules`, `tmer_standard.py`, `dashboard_visuals`, `exports`, `golden_master`.
- Frontend: `frontend/src/App.tsx`, `api.ts`, `ApprovedDashboard.tsx`, `StockTrail`, `PlanningWorkflow`, `DashboardVisuals`, `IndicatorHistory`, `ForecastPreview`, `TmerRules`.
- Serviço: `agro-mro-approved-analysis-service` (1.0.0 em I01, 1.2.0 em I03/I04).
- Git de preservação: branch `preservacao/agro-mro-ate-e56-2026-10-17`, HEAD `7e6cb98`; main `1912071`.

### 11.2 Como o protótipo foi construído

- O Sander leu o código R, pediu ao Codex para portar para Python, treinou e testou modelos, e construiu as telas por etapas autorizadas.
- **"A fonte do projeto são os dois códigos"** (o R e o Python). O Python é o principal para entender o que foi feito.
- Cada etapa tem relatório, matriz de testes, manifesto com hashes e aceite formal. É muita documentação: use o Plano Único como índice.

### 11.3 Para onde vai (decisão técnica do Hugo, ainda em aberto)

- **Trocar o banco é inevitável** (Hugo, 02/11): SQLite é para sistema pequeno. Destino natural: **PostgreSQL**. O Hugo está estudando PostgreSQL.
- Produção precisa de **multi-tenant real, autenticação segura, segredos fora do código, backups e deploy**.
- Stack de conforto do Hugo: Python + Django REST Framework + JWT, React + Vite + Tailwind. Ele também já usou Supabase (RLS) e Laravel em estudos. **Manter FastAPI ou migrar é decisão do Hugo**; o motor Python deve ser reaproveitado como biblioteca, não reescrito.
- Primeiro passo combinado: Hugo lê o R e o Python e entende como o Codex fez **antes** de começar a produção, porque "às vezes funciona no protótipo, mas em produção alguma informação vaza, alguma variável fica exposta".

---

## 12. Estado do plano P0–P13

> Documento mestre: **Plano Único de Execução 1.36 (E64, 20/10/2026)**. O plano é acumulativo: cada versão nova entra no topo e preserva as antigas "byte a byte" abaixo. **Leia o topo para saber o estado atual.**
>
> Estados independentes: aprovação de negócio, integração de código, teste executado e aceite de entrega. "Testado" não é "aceito". "Aceito tecnicamente" não é "homologado para operação".

| Etapa | Entrega | Estado em 20/10/2026 |
|---|---|---|
| **P0** | Consolidar referências, fontes, decisões e lacunas | ✅ Concluída documentalmente |
| **P1** | Preparação compartilhada de dados e períodos por SKU + Local (janela MD, bloqueio sem datas) | ✅ Aceita para continuidade (E-24). AM-01/02 resolvidos |
| **P2** | Rastreabilidade: originais, recibos, versões, replay | ✅ Aceita tecnicamente **em desenvolvimento** (E-28). Migração operacional **não autorizada** |
| **P3** | Integrar a matemática aprovada (R01–R28, V3) | ✅ **Tecnicamente aprovada — E41/E42.** 230 testes, 42 cenários, 4.284 comparações |
| **P4** | Conectar consumidores (I01 serviço comum, I02 classes/NS, I03 ficha/cards/métodos, I04 simulação/histórico, I05 Trilha/séries, I06 dashboard/agregados, I07 PDF/Excel, I08 chamadas legadas) | ✅ I01–I08 encerrados no escopo registrado (E43–E55) |
| **P5** | Validação integrada (instalação limpa + regressão) | ✅ Aprovada **no escopo sintético, com ressalvas** (E56). 703 IDs / 672 aprovados / 31 falhas preservadas |
| **P6** | Gestão do trabalho: ciclos, fila, contadores, emissão por seleção | ✅ Tecnicamente aprovada no escopo E58/E59/E60. **T06-B adiada** (grupos/tags/pivô/PDF executivo) |
| **P7** | Experiência de análise: contexto, explicação, comparação, seleção, diário/mensal, filtros, handoff para P6 | 🟡 **Candidata E64 build01 em reteste.** Sem aceite integral |
| **P8** | Forecast ampliado | ⚪ Planejada, não autorizada |
| **P9** | Resultados após implantação (ganho observado x potencial) | ⚪ Planejada; depende de P6 e histórico pós-aplicação |
| **P10** | Fornecedores e reposição (LT declarado x observado, pedidos, recebimentos) | ⚪ Planejada |
| **P11** | TMER, GR1–GR7 e decisões estratégicas | ⚪ Planejada. **Sander indicou em 02/11 que TMER/GR vão sair** |
| **P12** | Persistência e operação (AWS) | ⚪ Planejada. Perfil preparado, nada operado |
| **P13** | IA/agentes e integração ERP | ⚪ Planejada. Regra: IA propõe, usuário decide |

### 12.1 Situação da P7 (onde o Sander está)

- Núcleo implementado (T01–T07, exceto T06-B). D-P7-01 a 08 aprovadas.
- Resultados humanos A1–A5 recebidos (E62/E64). **A5 confirmou tela branca / TypeError** ao abrir ficha inválida; correção entregue na E64 build01 (ficha inválida recusada antes de publicar/enviar, último DTO válido e rascunho preservados). **Aguarda reteste humano.**
- Pendentes: A6, blocos B/C/D, zoom nativo 200% e NVDA (leitor de tela) nesta candidata, recepção do Excel pelo navegador (Q04), integração visual dos últimos ajustes (filtros, membros, temporal, envio).
- O Sander disse em 02/11 que queria fechar os testes da P7 naquela semana e depois **parar para arrumar a tela de interação** antes de seguir para P8+.

### 12.2 Ressalvas herdadas que continuam abertas

Meta de 25% de redução de tempo do resumo I06 (não atingida, não bloqueante), capacidade/concorrência/escala não certificadas, custo do Excel I07, N3344 não certificado, instalação limpa, QA-01, glifos, recuperação durável, segurança e acessibilidade produtivas.

---

## 13. Decisões registradas

### 13.1 Decisões do Plano Único (resumo)

| ID | Decisão vigente |
|---|---|
| D-01 | SKU + Local isolado; SIO externo; fixture preservada; Python/React |
| D-02 | Autorização por etapa; nada avança sem autorização |
| D-03 | Janela = datas inicial/final do MD por SKU + Local, inclusivas; extrato vivo preservado |
| D-04 | Falta de data exige corrigir o MD; bloqueia resultados definitivos, Forecast e validação; datas invertidas inválidas |
| D-05 | Saldos: abertura antes do 1º dia, fechamento após o último; final informado é oficial |
| D-06 | Valor = saldo final × preço MD; estoque médio = média dos fechamentos diários; giro = 365μ / média |
| D-07 | ABC = μ × custo, 80/95%, D para zero; PQR anualizado 3/12; cortes configuráveis |
| D-08 | N: prazo 180 dias compartilhado; liberação por OUT comprovado |
| D-09 | ND separado; XYZ ausente = X, Comprabilidade ausente = 3, com origem de padrão |
| D-10 | NS: 75 chaves V3; manual prevalece; NS zero legítimo; sem fallback genérico |
| D-11 | ES/PP aprovados preservados com origem; PP trad = μLT + ES; PP empírico = Q_NS(LT) |
| D-12 | Só EM-01/02/03 na seleção |
| D-13 | EM-04 a 07 só comparação |
| D-14 | Quantum e manual: regras da seção 8.5 |
| D-15 | TMER é referência, não aplicada; TMEA ≠ TMER; X123/Comprabilidade não confirmado |
| D-16 | Forecast experimental, sob demanda, 6 meses; não entra em cenário |
| D-17 | Testar ≠ validar ≠ exportar ≠ aplicar; decisão humana |
| D-18 | Frontend consome o motor, não recalcula; UVW não será oferecida |
| D-19 | Sem migração/publicação implícita; **IA propõe, usuário decide** |
| D-20 | P3 aprovada; limitações do cliente Alfa ficam como limitação de aplicabilidade, não bloqueio |
| D-21 | Cada etapa tem autorização própria |
| D-P4-01 | Sem parâmetros ativos ou schema novos na integração |
| D-P4-02 | Matriz NS 75 intacta; privada parcial sem fallback; adoção explícita com prévia |
| D-P4-03 | Política histórica sem contrato vira NC; atual não vira passada |
| D-P4-04 | Dashboard: subtotais por data/BRL, Top5/membros, estimativa MD aprovada; **ABC estoque não ativada**, capital por alerta adiado |
| D-P4-05 | Histórico preservado; replay depende do software correspondente |

### 13.2 Decisões de produto e negócio fora do plano

| Data | Decisão |
|---|---|
| 23/10/2026 | **Sem agentes de IA no MVP.** Se houver LLM, ele só chama funções determinísticas. |
| 25/10/2026 | Intelligence a **R$ 100/mês** (CPF), no ar até **fim de janeiro de 2027**. |
| 28/10/2026 | Guia de Leis de UX é a **referência oficial do front-end**. |
| 30/10–02/11/2026 | Gateway **Asaas** em teste no sandbox (ver seção 16). |
| 02/11/2026 | **Hugo lidera o desenvolvimento**; Sander cuida do domínio e das regras. |
| 02/11/2026 | Inadimplente fica **somente leitura**, não perde o acesso. |
| 02/11/2026 | TMER, GR1–GR7 e regras de lote devem sair (confirmar antes de apagar). |
| 02/11/2026 | Banco precisa trocar (SQLite → produção). |

---

## 14. Pendências de homologação

O que ainda depende do Sander ou de dados reais antes de recomendação comercial definitiva:

1. **Motor Agro MRO:** definido como método empírico para poder testar; precisa ser homologado com as planilhas estatísticas e massas reais.
2. **"Três resultados" x quatro cenários:** reconciliar sem remover cenário em silêncio.
3. **Contrato temporal:** preço de referência para movimentos sem preço, data do saldo final e valorização mensal ainda pedem exemplos.
4. **Números da matriz NS 75:** sujeitos à homologação comercial.
5. **X123 x Comprabilidade:** relação de escalas não confirmada.
6. **TMER e GR1–GR7:** não ativados; provável remoção.
7. **Forecast:** protocolo, backtest e homologação por método (P8).
8. **Cliente Alfa:** insumos por método incompletos (quantum, unidade, R, σLT, ES_H), semântica e identidade das transações, oráculos. Amostra com só 10 itens P de saídas e zero p de entradas.
9. **Defaults do sistema:** LT 15, R 30 e UN padrão **não são declaração do cliente** e não podem aparecer como se fossem.
10. **P7:** reteste A5, blocos A6/B/C/D, zoom 200%, NVDA, download do Excel.
11. **Operação (P2-OP01 a OP09):** banco operacional, backup, migração aditiva, PostgreSQL, E2E, desempenho/concorrência, restauração, retenção definitiva. **Todas pendentes.**

---

## 15. Riscos técnicos

### 15.1 Segurança

- O protótipo foi feito por IA e **nunca passou por revisão de segurança de produção**. O próprio plano lista "segurança e acessibilidade produtivas" como ressalva aberta.
- Pontos a revisar antes de qualquer cliente real: autenticação (hoje e-mail e senha), sessão, CORS, CSP, rate limit, segredos e variáveis de ambiente, uploads de planilha (tamanho, tipo, fórmulas maliciosas em XLSX/CSV), injeção em exportações (CSV/Excel injection), logs sem dado sensível, dependências.
- **Cache autenticado** foi apontado como risco na E50 (service worker / modo offline). Política offline autenticada ainda é decisão pendente.
- Histórico do Hugo: no laboratório de pagamento, **uma chave de sandbox vazou no histórico do git**. Regra: nenhum segredo em commit, nunca.
- Estorno no gateway exige confirmação por código no celular do administrador.
- **Token Bearer em `localStorage`** (D01.2): vulnerável a XSS. Para produção, avaliar cookie `HttpOnly` + `Secure` + `SameSite` ou token curto com refresh, e CSP rígida.
- `users.cpf` e e-mail são dados pessoais (LGPD): definir base legal, retenção e a exclusão em cascata no cancelamento.
- Upload aceita até 15 MiB de XLSX/CSV/TXT e preserva o original: validar tipo real, limitar linhas e tratar o arquivo como não confiável.
- Imagens de material em disco local (`UPLOAD_DIR`): em produção, storage privado com URL assinada e checagem de workspace.
- O padrão atual já é bom e deve ser mantido (D11.1): token → usuário → recurso buscado **por ID + workspace**; recurso de outro espaço responde **404** (não 403, para não revelar que existe).

### 15.2 Multi-tenant

- Hoje o isolamento é por **workspace**, com `current_user` delimitando o espaço nas rotas. Quase toda tabela tem `workspace_id`, e as chaves compostas de linhagem (`id + workspace_id`) reforçam o vínculo. Mas é **um usuário por workspace** (`users.workspace_id`, que aceita NULL): convidar colegas para o mesmo espaço, papéis (admin, analista, leitura) e o estado "somente leitura" por inadimplência **não existem no modelo** e terão de ser criados. Funciona no protótipo, mas **não está certificado para operação** (D-01: "estrutura inspecionada; não é certificação de isolamento operacional").
- Riscos: rota nova que esquece o filtro de workspace, consulta agregada que cruza espaços, cache compartilhado, arquivos exportados acessíveis por URL previsível, jobs em background sem contexto de tenant.
- Recomendação: isolamento **no banco** (PostgreSQL com `workspace_id` em todas as tabelas + Row Level Security, ou schema por tenant), testes automatizados de "usuário A não vê dado de B" em toda rota, e o tenant vindo do token, nunca do corpo da requisição.
- O Hugo estudou isso no repositório `estudo-multitenant-laravel` (laboratório com bloqueio de acesso cruzado). Reaproveitar os testes de bloqueio como padrão.

### 15.3 Troca do banco

- SQLite local → PostgreSQL (ou outro destino que o Hugo definir).
- Cuidados: tipos (datas, decimais de quantidade e preço em BRL, texto com zeros à esquerda), concorrência (P2-OP07), migrações aditivas versionadas, **backup e ensaio de restauração antes de migrar**, `conftest` que sobrescreve `DATABASE_URL` e faz `drop_all` (AM-07: risco de apagar banco errado em teste).
- O motor e os testes de oráculo (42 cenários, Golden Master) devem passar **idênticos** no banco novo. Diferença numérica é bug, não "tolerância".
- Desempenho: o dashboard projeta a população inteira; N3344 já passou dos limites em alguns ensaios. Em produção isso precisa de índices, paginação no servidor e possivelmente pré-cálculo por carga.

### 15.4 Outros riscos

- **Volume de documentação**: o plano tem centenas de relatórios. Risco de seguir instrução histórica superada (AM-06). Sempre resolva vigência pela seção 3 do plano e pelo topo do documento.
- **Telas com informação demais** para o público leigo.
- **Dependência de uma pessoa** para regras (Sander), com disponibilidade à noite e fins de semana.

---

## 16. Cobrança e gateway de pagamento

- **Gateway em teste: Asaas, em sandbox.** Recebimento, por enquanto, no CNPJ do Hugo (Simples Nacional).
- Taxas conferidas em 30/10/2026: Pix e boleto R$ 1,99; cartão 2,99% + R$ 0,49; NFS-e R$ 0,49.
- Roteiro com **14 cenários**. Em 02/11/2026: **9 de 14 passaram** (1, 2, 3, 6, 7, 8, 9, 12, 14), nenhum falhou, abertos 4, 5, 10, 11 e 13. Webhook funcionando (URL do túnel, eventos SUBSCRIPTION, reiniciar fila após mudar `.env`).
- Bug conhecido: evento de assinatura antiga rebaixa cliente para Gratuito. Botão "Recomeçar" do laboratório deixava assinaturas órfãs.
- **Ainda não é para desenvolver a cobrança no produto** sem decisão do Hugo; primeiro fechar os testes.

### 16.1 Estados do tenant (assinatura)

| Estado | Quando | Acesso |
|---|---|---|
| **Gratuito** | cadastro / demonstração | até **10 itens** (demonstração) |
| **Ativo** | pagamento confirmado pelo webhook (Pix, boleto, cartão) | completo |
| **Somente leitura** | fatura vencida | **vê tudo, não altera** (decisão do Sander em 02/11: "não precisa perder, continua tendo acesso, mas leitura") |
| **Bloqueado** | estorno | sem acesso; desbloqueio manual |
| **Cancelado** | cancelamento da assinatura | exclusão em cascata dos dados pessoais, com proposta de **30 dias de carência** (LGPD) caso o cliente volte |

Regras:

- Pagou a vencida → volta para Ativo.
- **Duas faturas vencidas: precisa pagar as duas** para voltar a Ativo (pagou uma, segue em leitura).
- Cartão recusado não libera; continua Gratuito.
- Troca de plano (ex.: 100 → 120) recomeça o ciclo na próxima fatura.
- O estado do tenant vem **só do webhook validado** (token do webhook), nunca do front.

---

## 17. Front-end e UX

### 17.1 Referência obrigatória

**Toda decisão de interface deve seguir o guia "Leis de UX no Agro MRO"** do Hugo:

- Página: https://claude.ai/artifact/CMjH18AnbAeLvDsVvqj6wJ
- Cópia local: `/mnt/project-files/referencias/leis-ux-agro-mro.html`

São 18 leis (Hick, Fitts, Jakob, Proximidade, Semelhança, Miller, Doherty, Von Restorff, Posição serial, Pico-fim, Zeigarnik, Prägnanz, Conectividade uniforme, Tesler, Postel, Parkinson, Occam, Pareto), cada uma com quando usar, exemplo no Agro MRO e erro comum, mais um guia "situação → leis". **Ao propor ou revisar uma tela, diga quais leis se aplicam.**

Caderno de design complementar: `/mnt/project-files/referencias/ideias-design-agro-mro.html`.

- Ideia central: **cada tela abre com uma frase de conclusão gerada por regras (sem LLM)**, depois o gráfico ou a tabela.
- Direção visual recomendada para o produto: **"Prancheta do almoxarifado"** (branco, azul tinta, âmbar). Ainda não escolhida formalmente pelo Hugo.
- Componentes base: badge de status, selo de classe, card de destaque, KPI com variação, chip de filtro, gaveta lateral, stepper, skeleton/estado vazio.
- Esboços: painel com KPIs (Dinheiro/Saúde), matriz ABC × XYZ 3×3, "O que resolver"; tabela com chips; importação em 4 passos com auto-mapeamento de colunas; ficha com consumo x safra e forecast com faixa.

### 17.2 Princípios que já valem

- **Frontend não recalcula matemática** (D-18). Ele mostra o que o motor devolve, com contexto, período e estado.
- **NC e ND são estados visíveis com motivo**, nunca zero nem traço silencioso.
- **Origem sempre visível**: cliente, padrão Agro MRO, manual, calculado.
- **Memória de cálculo atrás de um botão** ("ver como calculamos"), não exposta por padrão.
- Linguagem humana: o Sander quer os textos "mais humanos".
- Acessibilidade: o plano já testa 390 px, zoom 200%, foco e leitor de tela. Manter.

---

## 18. Feedback da demonstração de 02/11/2026

O Sander mostrou o protótipo ao Hugo. Pontos que viram backlog de UX/produto:

**Simplificar**
- Ficha com informação demais: memória de cálculo, parâmetros de teste e "memória de análise" devem sair ou ir para um botão.
- Visão geral: tirar partes, deixar só o essencial. Gráfico principal será refeito.
- Filtros: tirar unidade de medida e data do MD (confundem).
- Textos de explicação: reescrever de forma humana. Códigos AM-* renomeados.
- Possivelmente sair: regras de lotes, matriz TMER, tela de NS em Regras, tipos de movimento por ERP, pontos de controle editáveis (Hugo sugeriu deixar mais automático).

**Sugestão do Hugo**
- Seleção por PQR, criticidade etc. como **chips de filtro** (não botões que navegam), com um **gráfico de movimentação e uma tabela logo abaixo** reagindo ao filtro.

**Indefinido**
- Item validado deve **sair da fila** ou ficar com **marcação de OK**? Hugo sugeriu a marcação (atende os dois perfis). Decidir com o Sander.

**Bugs vistos na demo**
- NS de um caso (QCX) não calculou quando deveria.
- Clique na árvore de decisão não filtrou só o grupo escolhido.
- Encaminhamento levava a tela para cima em vez de para a lista.
- Falta botão de voltar ao fechar "conferência".
- Corte ABC não aceitou 70% (limite indevido).
- Item validado continuou na fila (no laboratório).
- Cadastro de material falhou ("Não foi possível concluir").
- Fotos do catálogo sumiram.
- Fórmulas do motor em Regras não carregaram ("falha inesperada").
- Simulação "se perde" ao recalcular (Sander: "dor de cabeça para arrumar").
- Forecast ainda simplificado.

---

## 19. Regras de trabalho para agentes

1. **Não altere fórmula, corte, classificação, matriz NS ou cenário** sem decisão explícita do Sander registrada. Se achar erro matemático, escreva a dúvida com exemplo numérico e pare.
2. **Não altere o Golden Master, as fixtures nem os oráculos** para fazer teste passar. Teste vermelho em oráculo é bug no código.
3. **Ausente ≠ zero ≠ padrão.** Preserve os três estados em banco, API e tela.
4. **SKU e Local são texto.** Nunca converter para número.
5. **Todo dado é do workspace.** Toda query, rota, job, cache e arquivo exportado filtra pelo tenant do usuário autenticado. Escreva o teste de acesso cruzado junto com a rota.
6. **Pedido pendente não entra no saldo.** Simular não aplica. Validar não aplica. Exportar não confirma aplicação.
7. **Frontend não calcula.** Se a tela precisa de um número novo, ele nasce no backend com origem e versão.
8. **Sem segredo em código ou commit.** `.env` fora do git; chaves de gateway só em variável de ambiente.
9. **Sem dado real de cliente** (Alfa ou qualquer outro) em teste, print, log, issue ou prompt externo. Use massa sintética.
10. **Sem agente de IA no MVP.** LLM, se houver, só chama funções determinísticas e cita dados/período/versão.
11. **Leia o topo do Plano Único** para saber o estado; o corpo é histórico preservado.
12. **Interface segue as Leis de UX** (seção 17) e cita as leis aplicadas.
13. **Não sobrescreva o `AGENTS.md` do repositório do Sander.** Este arquivo deve ficar ao lado (ex.: `docs/CONTEXTO.md`) e ser referenciado.
14. Ao terminar uma tarefa, diga **o que foi testado, o que não foi e o que depende de quem**, no mesmo espírito do plano: entregue não é aceito.

---

## 20. Perguntas em aberto

Para o **Sander** (domínio):
- Quais telas e blocos ficam no MVP de janeiro? O fluxo de navegação que ele prometeu desenhar responde isso.
- TMER, GR1–GR7, regras de lote e tipos de movimento: remover de vez?
- Item validado sai da fila ou fica marcado?
- "Três resultados" ou quatro cenários?
- Valores finais da matriz NS 75 para venda.
- Relação X123 x Comprabilidade.

Para o **Hugo** (técnico):
- Manter FastAPI ou migrar o backend? Onde hospedar? PostgreSQL gerenciado ou próprio?
- Estratégia de multi-tenant (RLS, schema por tenant, coluna + filtro obrigatório).
- Autenticação de produção (e-mail e senha + verificação, magic link, OAuth?).
- Limite técnico da demonstração (10 itens) e do plano pago (volume de SKU + Local por espaço).
- Quando trazer a cobrança Asaas para o produto.
- Organização do repositório: o Hugo trabalha num fork/clone próprio e sincroniza com o do Sander, ou um repositório único com branches?

### 20.1 Recomendações técnicas propostas (04/11/2026, aguardando decisão do Hugo)

1. **Backend:** manter **FastAPI**. O motor V3, os oráculos e as centenas de testes são Python/FastAPI; migrar para Django custaria semanas e arriscaria o Golden Master. Trocar só o que for preciso: banco, auth e camada de tenant.
2. **Hospedagem e banco:** **PostgreSQL gerenciado** (backup automático e restauração ponto a ponto resolvem P2-OP02/OP08) + API e Nginx num **VPS com o Docker Compose que já existe**. AWS fica para quando houver escala.
3. **Multi-tenant:** **schema compartilhado com `workspace_id`** (já existe em quase todas as tabelas) + filtro obrigatório numa camada de repositório + **RLS do PostgreSQL** como segunda trava (`SET LOCAL app.workspace_id` por transação) + teste de acesso cruzado em toda rota. Não usar schema por tenant (muitos clientes pequenos, migração multiplicada).
4. **Autenticação:** e-mail e senha com **verificação de e-mail e recuperação**, hash argon2/bcrypt, access token curto em memória e refresh em **cookie HttpOnly/Secure/SameSite** (tirar do `localStorage`). Criar já a tabela de **membros com papel** (dono, analista, leitura). Código por e-mail/OAuth Google depois do lançamento.
5. **Limites:** demonstração = **10 posições SKU + Local** (`is_demo`), sem emissão de Excel de mudança. Plano pago com `sku_limit` definido **por medição** (N1000 já chega perto de 120 s/1 GiB; N3344 não certificado): ponto de partida ~1.000 posições até medir no PostgreSQL. Checar o limite no backend na confirmação da importação.
6. **Cobrança Asaas:** entrar **depois** de PostgreSQL + tenant + auth no ar e **antes** do primeiro cliente pagante (dezembro). Antes, fechar os 5 cenários abertos e o bug de evento antigo. "Somente leitura" vira middleware que bloqueia escrita (não-GET) pelo estado do workspace vindo do webhook.
7. **Repositório:** **um repositório de produção novo, com o Hugo como dono/admin**, iniciado a partir do código do Sander. O repositório do Sander vira laboratório/referência. O Sander (e o Codex dele) contribui por **branch + pull request** revisado pelo Hugo; `main` protegida e CI rodando os testes de oráculo. Evitar dois repositórios divergindo com sincronização manual.

---

---

## 21. Pasta Fluxograma (documentação técnica V02)

Documentação visual gerada em 03/11/2026 sobre o código E64, por inspeção estática. O responsável revisou e considerou aderente. Os diagramas são **draw.io editáveis** (abrir em diagrams.net ou na extensão do VS Code). Convenções: BPMN simplificado (círculo = evento, retângulo = tarefa, losango = decisão), C4 para arquitetura, ERD para dados, diagramas de sequência numerados.

| Arquivo | Páginas | Conteúdo | Onde está resumido aqui |
|---|---|---|---|
| `RESUMIDO/01-fluxo-interno-desenvolvedor.drawio` | 2 | Marcos P0–P7, chamada real da Visão geral até o banco, memória do motor V3 (01–06) | 8, 10.4, 12 |
| `RESUMIDO/02-jornada-cliente.drawio` | 2 | Jornada do cliente em 8 etapas (cliente faz / ferramenta processa / cliente decide) | 10.3 |
| `D01_ARQUITETURA` | 3 | C4: contexto (usuário, SMTP, arquivos, SIO, ERP), contêineres (React, FastAPI, banco, Nginx, imagens), componentes | 11.1 |
| `D02_JORNADA_INTEGRADA` | 3 | Acesso e carga → indicador e alternativa → proposta, decisão e acompanhamento | 10.3 |
| `D03_IMPORTACAO` | 5 | Receber arquivo, validar/prévia, confirmar, falha, colagem | 10.5 |
| `D04_PREPARACAO_CLASSIFICACAO` | 4 | Identidade/janela, série diária e saldos, N/PQR, ABC e proveniência | 5, 6 |
| `D05_MOTOR_MATEMATICO_V3` | 5 | Parâmetros e NS, guardas e quantis, ES/PP, máximos, quantum e precedência | 7, 8 |
| `D06_DASHBOARD_FICHA` | 4 | Consulta e agregados, membros, ficha e métodos, Trilha | 10.6 |
| `D07_SIMULACAO_PLANEJAMENTO` | 4 | Capacidade, rascunho, simulação, validação | 10.7 |
| `D08_CICLOS_APLICACAO` | 7 | Fila, emissão, entrega incerta, aplicação, reabertura, estados | 10.7 |
| `D09_MODELO_DADOS` | 37 | Uma página por tabela | 9.1.1 |
| `D10_SEQUENCIAS` | 5 | Ordem das chamadas: importação, dashboard/ficha, simulação, validação, emissão | 10.5–10.7 |
| `D11_SEGURANCA_RASTREABILIDADE` | 3 | Autenticar e delimitar acesso, ler evidência com hash, replay | 15.1, 10.8 |
| `D12_ERROS_RECUPERACAO` | 3 | Classificar falha, leitura/decisão bloqueada, escrita incerta | 10.8 |
| `INDICE/01_INDICE_TECNICO*.md` | — | Versões do índice (lotes 1 a 6); a mais completa é `01_INDICE_TECNICO.COMPLETO.md` | esta seção |

**Especificações recebidas em 05/11/2026:** `docs/fluxogramas/especificacoes/D01…D12.md`, 74 fichas de 20 campos por atividade (ID, executor, entradas, validações, regras, algoritmo, arquivo/função, endpoint, tabelas, saídas, falhas etc.). São o detalhe de cada caixa dos diagramas. Ressalva: inspeção estática do código E64, sem execução de testes.

**Arquivos citados no índice que AINDA NÃO vieram** (pedir ao Sander, junto com o repositório): `DICIONARIO_DADOS.md` (345 campos), `CATALOGO_APIS.md` (102 rotas), `API_IMPORTACAO_E_LINHAGEM.md`, `CATALOGO_REGRAS_NEGOCIO.md`, `MEMORIA_MATEMATICA_V3.md` (com exemplo fictício), `MAPA_INDICADORES_E_CONTRATOS_LOTE_04.md`, `ESTADOS_E_CONTRATOS_D08.md`, `MANUAL_TRANSFERENCIA_TECNICA.md` (roteiro de estudo, ambiente novo, testes isolados, feito justamente para o novo desenvolvedor), `MATRIZ_RASTREABILIDADE.md` e `COBERTURA_E_PENDENCIAS.md`.

**Percurso de leitura sugerido pelo índice:** D01 → D09 → dicionário → APIs; depois D03/D11; D04 → memória matemática → D05; D06 → D07; D08; por fim D02, D10, D12 e o manual de transferência.

**Ressalvas dos próprios diagramas:** evidência estática (não houve execução de testes nesta rodada), banco aplicado e implantação ativa não confirmados, SMTP e integração ERP não confirmados, P7 em reteste.

---

*Fim do contexto. Atualize este arquivo sempre que uma decisão mudar, com data e quem decidiu.*
