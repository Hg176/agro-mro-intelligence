# Agro MRO Intelligence: especificação das telas do protótipo

Nov 26, 2026 · @Hugo

## Resumo

O canvas **Agro MRO Intelligence: telas aprovadas** tem 19 pranchetas:
18 telas em 1440px e 1 componente compartilhado, a busca global. Todas
usam o sistema de design Agro MRO Intelligence (tokens instalados no
canvas) e seguem o código do repositório agro-mro-intelligence, ramo
preservacao/agro-mro-ate-e56-2026-10-17, onde ele existe.

Convenções comuns a todas as telas do app:

- **Menu lateral** verde-900 de 248px, em 4 grupos (Análise, Dados,
  Regras do cálculo, Aprender e ajuda), com o cartão do plano no rodapé
  e Sair por último.

- **Barra superior** com a busca global, chips de locais e período, a
  pílula "Atualizado há 2 dias", notificações e o avatar HS, que leva a
  Minha conta.

- **Cabeçalho** com rótulo dourado em caixa alta, título em Plus Jakarta
  e uma linha de contexto.

- **Frase de conclusão** em faixa verde-900 no topo de cada tela, gerada
  por regras.

- **Um único botão principal** por tela: verde-700 no produto, ouro-500
  só para comprar, assinar ou testar.

- **Status sempre com cor + ícone + texto**: ● Ruptura, ▲ Abaixo do PP,
  ■ Parado, ✓ Saudável, ○ Sem cálculo.

- **Dados ilustrativos coerentes** entre telas: 812 posições, 3 locais
  (Almox. central, Oficina campo, Posto combustível), R\$ 2,4 mi em
  estoque, R\$ 412 mil parados.

## Mapa das telas

16 das 19 pranchetas têm interação no Play; as que mostram estados
diferentes da mesma tela ficam lado a lado.

| \#  | Prancheta                  | Arquivo                     | Estados               | Interativa    | Base no código                            |
|-----|----------------------------|-----------------------------|-----------------------|---------------|-------------------------------------------|
| 1   | Landing comercial          | Main.dc.html                | 1                     | Sim (dúvidas) | Figma aprovado                            |
| 2a  | Login                      | Login.dc.html               | normal                | Não           | Figma aprovado                            |
| 2b  | Login com erro             | LoginErro.dc.html           | erro                  | Não           | Figma aprovado                            |
| 3   | Visão geral                | VisaoGeral.dc.html          | 1                     | Não           | Figma aprovado                            |
| 4   | Importar dados mestres     | ImportarDados.dc.html       | 4 passos (ajuste)     | Sim           | Roteiro de telas                          |
| 5a  | Plano · demonstração       | Planos.dc.html              | demonstração          | Sim           | Roteiro de telas                          |
| 5b  | Plano · Intelligence ativo | PlanosAtivo.dc.html         | ativo                 | Sim           | Roteiro de telas                          |
| 5c  | Plano · somente leitura    | PlanosLeitura.dc.html       | fatura vencida        | Sim           | Roteiro de telas                          |
| 6a  | Materiais                  | Materiais.dc.html           | normal, erro (ajuste) | Sim           | MaterialsPage                             |
| 6b  | Materiais · carregando     | MateriaisCarregando.dc.html | skeleton              | Sim           | MaterialsPage                             |
| 6c  | Materiais · catálogo vazio | MateriaisVazio.dc.html      | vazio                 | Sim           | MaterialsPage                             |
| 7a  | Planejamento               | Planejamento.dc.html        | normal                | Sim           | PlanningPage                              |
| 7b  | Planejamento · nenhum caso | PlanejamentoVazio.dc.html   | vazio                 | Sim           | PlanningPage                              |
| 8   | Tipos de movimento         | TiposMovimento.dc.html      | 1                     | Sim           | MovementMappings                          |
| 9   | Regras e letras            | RegrasLetras.dc.html        | 6 abas                | Sim           | RulesPage + catálogo de metodologia       |
| 10  | Nível de serviço           | NivelServico.dc.html        | 5 abas PQR            | Sim           | ServiceLevelRules + matriz V3             |
| 11  | Matriz TMER                | MatrizTmer.dc.html          | 5 abas PQR            | Sim           | TmerRules + proposta 2.0.0                |
| 12  | Minha conta                | Conta.dc.html               | 1                     | Sim           | GET /me (só leitura)                      |
| —   | Busca global               | BuscaGlobal.dc.html         | componente            | Sim           | Importado nas 15 telas com barra superior |

## Telas de entrada

Landing e login recriam as telas aprovadas no Figma, só com tokens do
sistema.

**Landing comercial.** Hero verde-900 com curvas de nível douradas a 9%
e a prévia do produto (único elemento com sombra). Na sequência:

1.  ERPs compatíveis (SAP, TOTVS, Senior, Excel/CSV).

2.  O problema, em 3 cartões.

3.  Como funciona, em 3 passos ligados por linha.

4.  "Cada número vem com a conta", com o exemplo ES 14 / PP 22 / EM 40.

5.  6 recursos.

6.  Preço: Grátis (10 itens) × Intelligence R\$ 100/mês.

7.  Dúvidas em acordeão.

8.  Chamada final e rodapé.

O dourado só aparece em testar e assinar.

**Login (normal e erro).** Metade esquerda com a marca e os números 14
indicadores, 12 meses e 100% rastreável; metade direita com o
formulário: e-mail, senha com olho para mostrar, "Manter conectado",
Entrar, link de acesso por e-mail, criar conta e explorar a
demonstração. No erro, os dois campos ficam com borda vermelha e a
mensagem "E-mail ou senha não conferem. Confira os dois e tente de
novo."

Os logos de SAP, TOTVS e Senior aparecem como nomes escritos: os
arquivos do sistema de design não puderam ser copiados para o canvas.

## Análise

As três telas de análise mostram o mesmo estoque: 812 posições, 23
abaixo do PP, 8 com saldo negativo e 214 sem giro.

### Visão geral

- Frase de conclusão: R\$ 412 mil (17%) parados e 23 posições abaixo do
  PP, 5 delas classe A, com o botão "Ver os 5 itens A".

- Faixa "Implantação 4 de 5".

- KPIs agrupados em Dinheiro, Saúde do estoque e Movimento.

- Tabela "O que resolver primeiro" com 6 posições e a lista "Sinais para
  agir" com 7 sinais.

- Matriz ABC × PQR, com a célula AP contornada, e composição das
  classes: A 98 · B 162 · C 391 · D 149 · N 12.

- 3 seções recolhidas em "Para aprofundar".

### Materiais

Segue o código:

- Catálogo particular em cartões com grupo, descrição, código, saldo
  oficial, local, ABC de estoque e criticidade escrita.

- Busca por código, local ou descrição.

- Baixar Excel do conjunto filtrado.

- Paginação de 100.

- Formulário "Adicionar material" com os mesmos campos do código.

Acrescentado:

- 5 filtros prontos com contagem.

- Selo de situação e barra saldo × PP em cada cartão.

- Estados carregando, erro de métricas, sem resultado e catálogo vazio.

### Planejamento

Segue o código:

- "Meu plano de estoque" com resumo: casos iniciados, validados,
  aplicados no ERP e dados para rever.

- Fila de casos por material + local com 7 filtros.

- 8 estados de caso, cada um com seu selo.

- "Baixar Excel de mudanças" dos validados atuais.

- Confirmar aplicação com referência externa.

- "Itens para iniciar análise".

Acrescentado:

- Proposta ES/PP/EM antes → depois em cada caso.

- Frase de conclusão que muda com a situação.

- Estado vazio que ensina o fluxo em 3 passos.

## Dados e regras do cálculo

Cinco telas definem o que entra no cálculo e como ele classifica. Só a
TMER ainda não altera o resultado.

| Tela                   | O que o usuário faz                                                  | Regras e valores do código                                                                                                                             | Acrescentado no protótipo                                                                                                    |
|------------------------|----------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Importar dados mestres | Envia a planilha em 4 passos: Arquivo → Colunas → Prévia → Concluído | .xlsx, .xls, .csv até 15 MB; tudo ou nada; acrescentar × substituir                                                                                    | Mapeamento lembrado, 6 erros editáveis linha a linha, progresso real, resumo "812 posições em 3 locais", histórico de cargas |
| Tipos de movimento     | Diz se cada código do extrato é Entrada ou Saída                     | Só IN/OUT; nenhum código de SAP, Senior ou Datasul presumido; versão nova a cada alteração; padrão sem cadastro: IN, ENTRADA, E / OUT, SAÍDA, SAIDA, S | Bloco "códigos novos sem mapeamento" (Z61, 311, 551; 33 linhas fora), remover com confirmação na linha                       |
| Regras e letras        | Consulta as classes e ajusta cortes                                  | ABC 80% / 95%; PQR 3 / 12 por ano (saídas e entradas); classe N em 180 dias; XYZ e Comprabilidade informados pelo cliente                              | Abas por classe, barra visual dos cortes, exemplo por letra, confirmação "isso recalcula o estoque todo"                     |
| Nível de serviço       | Define a meta de cada um dos 75 casos PQR × ABC × XYZ                | Matriz V3 do Sander (59,6% a 99,7%; linha S = 0%); 0 ou de 50% a menos de 100%; o 1º caso salvo inicia matriz própria e deixa os outros 74 NC          | Grade por aba PQR, cores por faixa, impacto pela Inversa Normal (fator z), confirmação do 1º caso                            |
| Matriz TMER            | Edita dias de referência entre reposições                            | Proposta 2.0.0: 75 casos PQR × ABC × X123, de 0 a 360 dias; 0 a 365 dias; não muda ES, PP nem EM                                                       | Grade em tons de dourado, "reposições por ano" (365 ÷ dias), régua do ano, voltar tudo à proposta                            |

## Conta, plano e busca

O cartão do plano no menu, o avatar HS e a busca levam a estas telas a
partir de qualquer tela do app.

**Plano (3 estados).**

- *Demonstração*: frase "você importou 812 posições, a demonstração
  analisa só 10"; planos lado a lado; pagamento por Pix, boleto ou
  cartão, com CPF ou CNPJ para a nota.

- *Intelligence ativo*: uso 812 de 1.000, próxima cobrança 03/12/2026,
  faturas e "Cancelar assinatura" isolado no fim.

- *Somente leitura*: aviso vermelho da fatura vencida, o que fica parado
  (importar, simular e validar, baixar Excel) e o que continua.

O botão dourado de pagar é o único da tela.

**Minha conta.**

- Nome e e-mail editáveis; trocar o e-mail pede a senha atual e um link
  de confirmação.

- CPF mascarado e travado.

- Nome do espaço editável (padrão "Espaço de {nome}", como no código).

- Troca de senha com regras visíveis (mínimo de 8 caracteres).

- 4 avisos por e-mail.

- LGPD: pedir cópia dos dados e excluir conta (só libera ao escrever
  EXCLUIR).

- Barra "Salvar alterações" que só aparece quando algo muda.

**Busca global.** Componente único importado nas 15 telas com barra
superior:

- Sem texto, mostra buscas recentes e atalhos para 3 filtros.

- Com texto, mostra até 6 posições e até 3 telas, com o trecho
  encontrado marcado.

- Ignora acentos e aceita o código com ou sem espaços.

- Teclado: ↑ ↓, Enter e Esc.

## Leis de UX e animações

As mesmas leis se repetem em todas as telas; a tabela mostra onde cada
uma aparece mais.

| Lei                    | Onde aparece                                                                                                |
|------------------------|-------------------------------------------------------------------------------------------------------------|
| Von Restorff           | Um botão principal por tela; a frase de conclusão é o único bloco escuro; o dourado só em comprar ou testar |
| Hick                   | Abas com uma classe ou um PQR por vez; 3 formas de pagamento; avançado recolhido em "Para aprofundar"       |
| Fitts                  | Botões principais com 52 a 56px; alvos de 44px ou mais; ações destrutivas longe da principal                |
| Jakob                  | Busca no topo, arrastar o arquivo, checkout Pix · boleto · cartão, rótulo sempre acima do campo             |
| Proximidade            | KPIs por tema (Dinheiro, Saúde, Movimento); erro colado ao campo                                            |
| Conectividade uniforme | Passos ligados por linha na importação e na landing                                                         |
| Semelhança             | Mesmas cores, ícones e textos de status e classe em todas as telas                                          |
| Miller                 | Códigos em blocos de 4 dígitos; menu em 4 grupos; filtros ativos como chips                                 |
| Doherty                | Skeleton no carregando; progresso real na importação e na exportação                                        |
| Pico-fim               | Resumo grande ao fim da importação                                                                          |
| Zeigarnik              | Faixa "Implantação 4 de 5"; barra "10 de 10, no limite" na demonstração                                     |
| Tesler / Postel        | Vírgula ou ponto, CPF com ou sem pontos, código com ou sem espaços, mapeamento lembrado                     |
| Prägnanz               | Grades ABC × PQR e PQR × ABC × XYZ em vez de dispersão ou pizza                                             |

**Animações.** Todas servem para mostrar o que mudou e todas desligam
com "reduzir movimento" no sistema operacional.

- Entrada em cascata de cartões, linhas e células.

- Brilho verde na linha que mudou de estado e "pop" no selo.

- Contagem dos números do resumo e barras que crescem.

- Skeleton com brilho.

- Painéis e confirmações que deslizam.

- Pulso lento só no selo de Ruptura.

- Tremida no formulário incompleto.

- Barra de salvar que sobe do rodapé.

## Pendências

O protótipo está completo como desenho; 8 pontos dependem do backend, 1
de design e 6 de decisão do Sander ou do Hugo (1 já decidida).

**Backend que falta:**

- [ ] Conta: rotas para alterar nome, nome do espaço, e-mail (com link
  de confirmação), senha, avisos, exportar dados e excluir conta. Hoje
  só existe GET /me.

- [ ] Tipos de movimento: guardar os códigos recusados na última carga
  para listar "códigos novos sem mapeamento".

- [ ] Regras e letras: confirmar que mudar os cortes marca os casos
  validados como desatualizados.

- [ ] Busca global: trocar os 18 materiais de exemplo pela API de busca.

- [ ] Ficha do material: criar a tela. Hoje busca e cartões levam a
  Materiais.

- [ ] Abas Movimentos e Pedidos em aberto da importação: ainda sem
  conteúdo próprio. Enquanto isso, o "Ver movimentos" do KPI de
  movimento da Visão geral mostra "Em breve", sem link.

- [ ] Materiais: GET /api/v1/materiais e /materiais/excel precisam
  aceitar `?sinal=` com os 7 códigos de "Sinais para agir" (contrato em
  `frontend/src/api/tipos.ts`, `PaginaMateriais`).

- [ ] Adicionar material: criar GET /api/v1/unidades e
  GET /api/v1/grupos-padrao. Hoje as listas existem só no mock do front.

**Design que falta:**

- [ ] Visão geral, "Composição do estoque": as abas PQR, XYZ e
  Comprabilidade não têm design. O front mostra "% das posições" e não
  tem a frase de destaque que a aba ABC tem.

**Decisões em aberto:**

- [ ] Matriz TMER fica no produto? O manual pede confirmar com o Sander.

- [x] Botão "Ver os 5 itens A" da Visão geral: dourado (como no Figma)
  ou verde (pela regra de cor)? Decidido pelo Hugo: verde, e "Abrir meu
  plano" fica secundário.

- [ ] Planejamento: incluir as abas Em análise, Aplicados e Descartados
  do roteiro, passando de 7 opções?

- [ ] Tipos de movimento: o motor vai aceitar Transferência e Ignorar,
  além de Entrada e Saída?

- [ ] Plano: regra para quem passa de 1.000 itens.

- [ ] Importação: confirmar os nomes de coluna SAP (MATNR, MAKTX,
  WERKS + LGORT, VERPR, MATKL) com a exportação do cliente.

**Dados ilustrativos:** materiais, códigos, casos de planejamento,
lotes, faturas, datas, o e-mail hugo@empresa.com e os códigos Z61, 311 e
551 são exemplos. Os 75 valores da matriz V3, os 75 da TMER, os cortes
padrão e os textos das letras vêm do código.
