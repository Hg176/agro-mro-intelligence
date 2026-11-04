# Contrato matemático — métodos e cenários (versão 0.3)

## Unidade e janela

- A unidade de análise é espaço de trabalho + material + localização.
- Saídas são agregadas por dia; dias sem saída dentro da janela recebem demanda zero.
- A janela começa na primeira movimentação válida e termina na data de cálculo.
- Quantidades são positivas; o sentido é definido por `IN` ou `OUT`.

## Variáveis

Para média diária de saídas `μ`, desvio-padrão amostral diário das saídas `σ`, prazo médio de reposição `LT`, desvio-padrão do prazo `σLT`, período de revisão `TR`, nível de serviço `NS` e quantil normal `z(NS)`.

O `TMEA` é o tempo médio entre dias com saída. O buffer de tempo é `LT + z(NS) × σLT` e o buffer de saídas é `buffer de tempo ÷ TMEA`.

## Estoque de segurança

O sistema calcula e mostra, em paralelo:

1. **Inversa Normal:** `ES = μ + z(NS) × σ`.
2. **TMEA:** `ES = resultado da Inversa Normal ÷ buffer de saídas`.
3. **Raiz tradicional:** `ES = z(NS) × √(σ² × LT + σLT² × μ²)`.
4. **Fator tradicional:** `ES = z(NS) × σ × √LT`.
5. **Motor Estatístico Agro MRO:** quantil empírico da demanda acumulada nas janelas de `LT`, menos a demanda média no prazo, limitado a zero.
6. **Valor do cliente:** estoque de segurança declarado pelo cliente.

## Ponto de pedido

1. **Tradicional:** `PP = ES escolhido + LT × μ`.
2. **Motor Estatístico Agro MRO:** quantil empírico da demanda acumulada nas janelas de `LT`.
3. **Valor do cliente:** ponto de pedido declarado pelo cliente.

## Estoque máximo

1. **Tradicional:** `EM = ES escolhido + PP escolhido`.
2. **Tradicional 2:** `EM = consumo máximo diário × LT + ES escolhido`.
3. **Motor Estatístico Agro MRO:** quantil da demanda no prazo de reposição + quantil da demanda no período de revisão.
4. **Valor do cliente:** estoque máximo declarado pelo cliente.

## Cenários de decisão

Os valores declarados pelo cliente têm precedência. Sem valor manual, o usuário escolhe:

- **Motor Agro MRO:** usa diretamente o método estatístico da Agro MRO.
- **Conservador:** média aritmética dos métodos calculáveis, sem incluir o valor manual.
- **Maior proteção:** maior resultado calculável. Esta apresentação substitui o rótulo informal “sem risco nenhum”, pois nenhum método elimina todo risco operacional.
- **Com risco:** menor resultado estritamente positivo entre os métodos calculáveis.

Cada indicador registra a origem efetivamente usada. Se o cenário selecionado não puder ser calculado, o sistema tenta o Motor Agro MRO e depois o primeiro método disponível, sempre identificando a fonte.

## Indicadores complementares

### Referência do saldo inicial no MD

Ao importar um saldo inicial, o cliente deve informar se ele representa a posição **antes** ou **depois** das movimentações da data inicial do saldo daquele SKU + Local. A escolha vale para a carga inteira e pode ser sobrescrita por linha. Sem a escolha, a linha com saldo inicial é inválida e não pode ser confirmada.

O MD aceita `Data inicial do saldo` e `Data final do saldo` por SKU + Local. Quando ambas estão presentes, **elas determinam a janela inclusiva dos movimentos usados nos cálculos** de saldo, consumo, ABC, PQR e planejamento daquele SKU + Local. As fórmulas e cortes permanecem iguais; mudam apenas as entradas e o denominador em dias do item. O saldo final declarado é conferido contra os movimentos nessa janela, respeitando a opção antes/depois. A data final não pode anteceder a inicial. Cargas antigas sem o par de datas ainda usam a janela observada do espaço como compatibilidade provisória, identificada como sem comprovação temporal. A tabela de movimentos é uma fonte viva: importações podem acrescentar linhas ou substituir toda a tabela, com prévia e confirmação; o arquivo importado não define o período matemático.

Curva ABC do cliente não informada permanece nula no cadastro e é exibida como **ND · Não declarado**; a ABC calculada independe dela. Célula vazia, `-`, `ND`, `N/D` e marcadores comuns de vazio em planilhas são tratados como não declarados nessas classificações. Na importação, XYZ ausente recebe **X** e Comprabilidade ausente recebe **3**, com origem `agro_mro_default` persistida por SKU + Local e contagem mostrada na prévia e na confirmação. Valores declarados mantêm origem `customer`. A regra de TMER continua informativa e não é acionada por esse preenchimento.

- **Antes:** `saldo = saldo inicial + todas as entradas − todas as saídas`.
- **Depois:** `saldo = saldo inicial + todas as entradas − todas as saídas − movimento líquido da primeira data`.

As entradas e saídas do primeiro dia continuam a compor os indicadores de movimento e demanda nos dois casos. O ajuste afeta saldo e valor de estoque e os indicadores que dependem deles, sem alterar a fórmula homologada de segurança ou classificação. Bases importadas antes deste contrato, sem referência registrada, mantêm provisoriamente a hipótese anterior aos movimentos, identificada como **não confirmada**. Saldo final declarado sem data de referência permite comparar quantidades, mas não comprova conciliação temporal.

- Cobertura em dias: `saldo atual ÷ μ`.
- Giro anualizado: `(μ × 365) ÷ estoque médio`.
- Preço médio ponderado: `Σ(quantidade de entrada × preço) ÷ Σ(quantidade de entrada)`.

ABC de consumo e PQR seguem o `AGENTS.md`: ABC usa média diária de saídas × custo, cortes acumulados 80%/95%, D sem valor e N para cadastro conhecido com menos de 180 dias. PQR usa frequência anualizada de transações de entrada e saída, P ≥12/ano, Q ≥3 e <12/ano, R >0 e <3/ano, S sem transação e N recente. ABC declarada pelo cliente permanece separada da calculada.

Esses são os **cortes padrão Agro MRO**. O cliente pode alterar em seu espaço os dois limites acumulados ABC, separadamente os limites P e Q das frequências de entradas e saídas, e o prazo da classe N (padrão 180 dias). O mesmo prazo de N vale para ABC, PQR de entradas e PQR de saídas. A alteração é privada, versionada e auditada; aplica-se à próxima classificação, à matriz de serviço quando houver caso correspondente e aos painéis. Não altera dados de origem nem a fixture do golden master. Restaurar o padrão volta aos valores acima e cria nova versão da configuração.

### Trilha do Estoque

A ficha mostra a trajetória diária do saldo de um único SKU + Local até a última movimentação registrada, limitada aos 365 dias mais recentes. O saldo no início do trecho soma o saldo inicial e os movimentos anteriores ao trecho. Quando o saldo inicial do MD representa a posição **depois** dos movimentos da primeira data, o motor subtrai o líquido desse dia antes de percorrer a série; a posição exibida no fim da primeira data coincide assim com o saldo declarado. O gráfico usa somente movimentos reais e preserva dias sem movimento como saldo constante. Entradas e saídas do trecho, menor saldo, dias negativos e eventos recentes vêm da mesma série; pedidos pendentes não entram no saldo. Cadastros antigos sem referência temporal exibem a hipótese anterior ao primeiro dia como não confirmada. A trajetória serve à leitura histórica e não acrescenta uma nova fórmula de reposição.

### Precedência do nível de serviço

Por decisão do responsável em 04/10/2026, o nível informado manualmente por SKU + Local prevalece. Na ausência de escolha manual, a classificação calculada PQR de saídas + ABC de consumo e o XYZ declarado formam a chave de um dos 27 casos disponíveis por padrão. O cliente edita a meta diretamente na linha do caso; sua edição sobrepõe a proposta somente nesse caso. Se houver correspondência, o motor utiliza o nível do caso e registra valor, origem (`cliente` ou proposta Agro MRO), código e versão. Sem caso correspondente, mantém o valor padrão já registrado para o material, identificado como tal. Registros antigos sem origem conhecida preservam seu valor e são marcados como não confirmados; a matriz não os sobrescreve silenciosamente. A ficha, séries e painel usam a mesma resolução. Os números da proposta Agro MRO continuam sujeitos à homologação comercial, sem alterar fórmulas de ES/PP/EM.

### Matriz TMER

A proposta Agro MRO de 04/10/2026 contém **75 casos únicos** (P/Q/R/N/S × A/B/C/D/N × X123 1/2/3), incluindo TMER zero para PQR S. Os prazos são copiados exatamente da tabela do responsável e ficam versionados em `backend/app/tmer_standard.py`. Todos os casos aparecem por padrão; o cliente altera os dias na própria linha, com sobreposição privada e versionada somente do caso editado. A numeração X123 atribui prazo maior a 1 e menor a 3, enquanto a definição atual de Comprabilidade do cadastro diz 1 = muitos fornecedores e 3 = exclusividade. A relação entre as duas escalas ainda não foi confirmada. Nenhum valor TMER é aplicado automaticamente ao planejamento neste momento.

ES, PP e EM são arredondados para cima pelo múltiplo de embalagem quando informado. Sem múltiplo, são apresentados com duas casas decimais. O estoque máximo selecionado nunca é apresentado abaixo do ponto de pedido selecionado.

## Falhas explícitas

O cálculo retorna `insufficient_data`, acompanhado do motivo, quando não há movimentação ou quando o histórico é menor que o prazo de reposição. Cobertura e giro ficam sem valor quando seus denominadores são zero. O sistema não cria valores substitutos.

## Homologação pendente

Esta versão registra o item 6 do projeto consolidado em um contrato testável. O Motor Agro MRO foi explicitado como método empírico para permitir implementação e teste; sua definição deve ser homologada com as planilhas estatísticas e massas reais antes da recomendação comercial definitiva.

A expressão “três resultados” do objetivo comercial ainda precisa ser reconciliada com os quatro cenários nomeados nesta versão; nenhum cenário será removido silenciosamente. A referência do saldo inicial passou a ser declarada na importação; preço de referência para movimentações sem preço, data do saldo final e valorização mensal ainda exigem exemplos para fechar o contrato temporal.
