/**
 * Tipos das respostas da API que as telas usam.
 *
 * Regras deste arquivo (valem para todo tipo novo):
 * - Todo Decimal é `Decimal` (string). O Pydantic serializa Decimal como string e o front
 *   nunca converte para número para fazer conta: só formata (src/lib/formato.ts).
 * - Todo campo que pode faltar é `T | null`. Nada de `?` opcional, nada de 0 por padrão.
 *   Ausente ≠ zero ≠ padrão. Quando há motivo (NC, histórico insuficiente), ele vem junto.
 * - Código do material e local são TEXTO (zeros à esquerda). Nunca number.
 * - Data e hora chegam em ISO UTC. A tela mostra em America/Cuiaba.
 * - Contagens inteiras (quantidade de posições, de casos, de linhas) são `number`.
 * - Nomes de campo: os do protótipo/backend quando existem (code, location,
 *   short_description, status...); em português quando a rota é nova.
 * - Cada tipo diz de onde vem: rota do protótipo (ramo codex/agro-mro-ate-p7-e64-2026-11-16)
 *   ou "rota nova, a criar no backend".
 */

/* ------------------------------------------------------------------------------------------
 * Primitivos
 * ---------------------------------------------------------------------------------------- */

/** Decimal serializado pelo Pydantic (ex.: "2412530.40", "-2", "0.975"). Sempre string. */
export type Decimal = string & { readonly __brand: "Decimal" };

/** Data e hora em ISO 8601, UTC (ex.: "2026-11-24T13:05:00Z"). */
export type DataHoraIso = string & { readonly __brand: "DataHoraIso" };

/** Data de calendário ISO (ex.: "2026-11-11"), sem fuso. */
export type DataIso = string & { readonly __brand: "DataIso" };

/** Período inclusivo, como a janela do MD (D-03). */
export type Periodo = {
  inicio: DataIso;
  fim: DataIso;
};

/** Estado de um indicador: disponível, ou indisponível com motivo (nunca vira zero). */
export type Disponibilidade =
  { estado: "disponivel"; motivo: null } | { estado: "indisponivel"; motivo: string };

/* ------------------------------------------------------------------------------------------
 * Classes e situações (iguais em todas as telas: lei da Semelhança)
 * ---------------------------------------------------------------------------------------- */

/** ABC de consumo (D-07). D = consumo de valor zero; N = item novo. Protótipo: approved_classifications.py */
export type ClasseAbc = "A" | "B" | "C" | "D" | "N";

/** PQR de saídas (maiúsculas). S = sem transação; N = item novo. Protótipo: approved_classifications.py */
export type ClassePqr = "P" | "Q" | "R" | "S" | "N";

/** XYZ (criticidade declarada pelo cliente; ausente vira X com origem agro_mro_default, D-09). */
export type ClasseXyz = "X" | "Y" | "Z";

/** Comprabilidade 1, 2 ou 3 (ausente vira 3 com origem agro_mro_default, D-09). */
export type Comprabilidade = 1 | 2 | 3;

/** O que o SeloClasse mostra: a letra ABC ou NC quando não há classe calculável. */
export type ClasseExibida = ClasseAbc | "NC";

/** Origem de um valor declarado/padrão. Protótipo: xyz_source / purchasability_source. */
export type OrigemDeclarada = "customer" | "agro_mro_default";

/**
 * Situação da posição (selo de status com cor + ícone + texto):
 * ● ruptura · ▲ abaixo_pp · ■ parado · ✓ saudavel · ○ sem_calculo.
 * Rota nova: o protótipo só tem status/below_reorder_point soltos; a situação consolidada
 * é decidida pelo backend.
 */
export type Situacao = "ruptura" | "abaixo_pp" | "parado" | "saudavel" | "sem_calculo";

/** Criticidade escrita do cadastro. Protótipo: Material.criticality (App.tsx, schemas.py MaterialIn). */
export type Criticidade = "critical" | "strategic" | "noncritical";

/* ------------------------------------------------------------------------------------------
 * Frase de conclusão
 * ---------------------------------------------------------------------------------------- */

/**
 * Frase de conclusão de uma tela: a API diz QUAL é a situação (tipo) e manda os números
 * prontos (valores). O front só escolhe o modelo de frase pelo tipo e preenche.
 * Código desconhecido: a faixa aparece sem frase, sem quebrar (aviso no console só em dev).
 * Rota nova: o campo `conclusao` entra na resposta de cada tela no backend.
 */
export type ConclusaoTela<Tipo extends string, Valores extends Record<string, unknown>> = {
  tipo: Tipo;
  valores: Valores;
};

/** Visão geral (VisaoGeral.dc.html): uma variação. */
export type ConclusaoVisaoGeral = ConclusaoTela<
  "parado_e_abaixo_pp",
  {
    valor_parado: Decimal | null;
    percentual_valor_parado: Decimal | null;
    itens_parados: number | null;
    posicoes_abaixo_pp: number | null;
    abaixo_pp_classe_a: number | null;
  }
>;

/** Materiais (Materiais.dc.html): catálogo com posições ou vazio. */
export type ConclusaoMateriais =
  | ConclusaoTela<
      "catalogo_com_posicoes",
      {
        posicoes: number;
        locais: number;
        pedem_reposicao: number | null;
        sem_giro_180_dias: number | null;
      }
    >
  | ConclusaoTela<"catalogo_vazio", Record<string, never>>;

/** Planejamento (Planejamento.dc.html): a frase muda com a situação da fila. */
export type ConclusaoPlanejamento =
  | ConclusaoTela<"nenhum_caso", { posicoes_abaixo_pp: number | null }>
  | ConclusaoTela<
      "prontos_para_exportar",
      { casos_exportaveis: number; casos_com_dados_novos: number }
    >
  | ConclusaoTela<"aguardando_validacao", { casos_a_validar: number }>;

/** Importar dados (ImportarDados.dc.html): uma variação. */
export type ConclusaoImportacao = ConclusaoTela<
  "comecar_pelos_dados_mestres",
  { minutos_estimados: number | null }
>;

/** Regras e letras (RegrasLetras.dc.html): padrão Agro MRO ou cortes próprios. */
export type ConclusaoRegras = ConclusaoTela<
  "padrao_agro_mro" | "cortes_proprios",
  {
    /** Corte A da ABC em % do valor consumido (ex.: "80"). */
    corte_a_percentual: Decimal;
    /** Limite P da PQR de saídas, em saídas por ano (ex.: "12"). */
    limite_p_saidas_ano: Decimal;
    /** Prazo do item novo (N), em dias. */
    prazo_item_novo_dias: number;
  }
>;

/** Nível de serviço (NivelServico.dc.html): referência V3 ou matriz própria. */
export type ConclusaoNivelServico =
  | ConclusaoTela<
      "referencia_v3",
      {
        meta_classe_a_minima: Decimal;
        meta_classe_a_maxima: Decimal;
        meta_maxima_z: Decimal;
      }
    >
  | ConclusaoTela<"matriz_propria_com_nc", { casos_declarados: number; casos_nc: number }>
  | ConclusaoTela<"matriz_propria_completa", { casos_declarados: number }>;

/** Tipos de movimento (TiposMovimento.dc.html): há códigos novos sem mapeamento ou não. */
export type ConclusaoTiposMovimento =
  | ConclusaoTela<
      "codigos_sem_mapeamento",
      {
        codigos_mapeados: number;
        codigos_pendentes: number;
        /** Nome do sistema de origem dos códigos (ex.: "SAP"). */
        sistema: string;
        linhas_fora: number;
        carga_em: DataHoraIso;
      }
    >
  | ConclusaoTela<"todos_mapeados", { codigos_mapeados: number }>;

/** Matriz TMER (MatrizTmer.dc.html): proposta sem ou com ajustes do cliente. */
export type ConclusaoTmer =
  | ConclusaoTela<"proposta_sem_ajustes", { dias_minimo: Decimal; dias_maximo: Decimal }>
  | ConclusaoTela<
      "proposta_com_ajustes",
      { dias_minimo: Decimal; dias_maximo: Decimal; casos_ajustados: number }
    >;

/** Plano (Planos*.dc.html). Em somente leitura a tela não tem frase (conclusao = null). */
export type ConclusaoPlano =
  | ConclusaoTela<
      "demonstracao_limite",
      { posicoes_importadas: number; limite_demonstracao: number; preco_mensal: Decimal }
    >
  | ConclusaoTela<
      "intelligence_ativo",
      {
        itens_usados: number;
        itens_limite: number | null;
        valor_proxima_cobranca: Decimal | null;
        proxima_cobranca_em: DataHoraIso | null;
        forma_pagamento: FormaPagamento | null;
      }
    >;

/* ------------------------------------------------------------------------------------------
 * Sessão, plano e conta
 * ---------------------------------------------------------------------------------------- */

/** Estado do plano do espaço. Decidido só pelo backend (webhook do gateway), nunca pelo front. */
export type EstadoPlano = "demonstracao" | "ativo" | "somente_leitura";

/** Permissões que o backend calcula a partir do plano. O front só lê. */
export type Permissoes = {
  importar: boolean;
  simular: boolean;
  validar: boolean;
  exportar_excel: boolean;
  editar_regras: boolean;
};

/** Nome de uma permissão (usado por AcaoProtegida). */
export type NomePermissao = keyof Permissoes;

/** Plano do espaço. Protótipo: workspaces.plan + sku_limit (GET /me). */
export type Plano = {
  estado: EstadoPlano;
  itens_usados: number;
  /** Limite de posições do plano; null = sem limite declarado. Protótipo: sku_limit. */
  itens_limite: number | null;
  /** Fração de uso pronta para a barra do cartão do plano ("0" a "1"). null = sem barra. */
  fracao_uso: Decimal | null;
  renova_em: DataHoraIso | null;
};

/**
 * Resposta de GET /api/v1/me.
 * O protótipo tem GET /me com { id, name, email, workspace: { name, plan, sku_limit } }.
 * Este formato (com plano.estado e permissoes) é rota a ALTERAR no backend.
 */
export type Sessao = {
  usuario: {
    nome: string;
    email: string;
    /** Iniciais para o avatar (ex.: "HS"). */
    iniciais: string;
  };
  espaco: {
    nome: string;
    /** Locais do espaço (chip "Todos os locais (3)"). */
    locais: number;
    /** Período da leitura atual (chip "01/07 a 11/11/2026"). null = sem dados. */
    periodo: Periodo | null;
    /** Última atualização dos dados (pílula "Atualizado há 2 dias"). null = nunca. */
    atualizacao: { em: DataHoraIso; ha_dias: number } | null;
  };
  plano: Plano;
  permissoes: Permissoes;
};

export type FormaPagamento = "pix" | "boleto" | "cartao";

/** Minha conta (Conta.dc.html). Rota nova GET /api/v1/conta, a criar no backend. */
export type Conta = {
  nome: string;
  email: string;
  /** CPF já mascarado pelo backend (ex.: "***.456.789-**"). O front nunca recebe o CPF inteiro. */
  cpf_mascarado: string | null;
  espaco: { nome: string };
  avisos: {
    resumo_semanal: boolean;
    importacao_concluida: boolean;
    fatura: boolean;
    novidades: boolean;
  };
};

/* ------------------------------------------------------------------------------------------
 * Material e posição (SKU + Local)
 * ---------------------------------------------------------------------------------------- */

/** Local de estoque. Rota nova GET /api/v1/locais, a criar no backend. */
export type Local = {
  /** Código do local no ERP (texto). */
  codigo: string;
  nome: string;
  posicoes: number;
};

/**
 * Material do catálogo particular (uma linha = uma posição SKU + Local).
 * Protótipo: GET /api/v1/materials (main.py list_materials + serialize_material).
 */
export type Material = {
  id: number;
  code: string;
  short_description: string;
  long_description: string | null;
  unit: string;
  application: string | null;
  group_1: string | null;
  group_2: string | null;
  location: string;
  notes: string | null;
  replacement_code: string | null;
  criticality: Criticidade;
  obsolete: boolean;
  confirmed: boolean;
  customer_abc: "A" | "B" | "C" | null;
  purchasability: Comprabilidade | null;
  is_demo: boolean;
  image_ids: number[];
};

/** Corpo de POST /api/v1/materials. Protótipo: schemas.py MaterialIn. */
export type NovoMaterial = {
  code: string;
  short_description: string;
  long_description: string | null;
  unit: string;
  application: string | null;
  group_1: string | null;
  group_2: string | null;
  location: string;
  notes: string | null;
  replacement_code: string | null;
  criticality: Criticidade;
  customer_abc: "A" | "B" | "C" | null;
  purchasability: Comprabilidade | null;
};

/**
 * Unidade de medida do cadastro ("Adicionar material"). Rota a criar no backend:
 * GET /api/v1/unidades. Hoje a lista existe só no mock (as 8 do design).
 */
export type UnidadeMedida = {
  /** Valor gravado em NovoMaterial.unit (ex.: "UN"). */
  sigla: string;
  nome: string;
  categoria: string;
};

/**
 * Grupo de mercadoria do padrão Agro MRO, sugerido no "Grupo de mercadoria 1". Rota a criar
 * no backend: GET /api/v1/grupos-padrao. Hoje a lista existe só no mock (os 4 do design).
 */
export type GrupoPadrao = {
  nome: string;
};

/**
 * Posição com as métricas que as listas mostram (cartão de Materiais, tabela da Visão geral,
 * resultado da busca). Base no protótipo DashboardPosition (dashboardTypes.ts):
 * stock_quantity e reorder_point lá são number; aqui são Decimal (string).
 */
export type Posicao = {
  material_id: number;
  code: string;
  location: string;
  /** Nome do local para exibir (ex.: "Almox. central"). */
  location_name: string;
  short_description: string;
  unit: string;
  group_1: string | null;
  group_2: string | null;
  criticality: Criticidade;
  /** Saldo final oficial do MD (D-05). null = sem saldo informado (não é zero). */
  stock_quantity: Decimal | null;
  /** PP efetivo. null = sem cálculo (motivo em motivo_situacao). */
  reorder_point: Decimal | null;
  /**
   * Fração pronta para a barra saldo × PP, de "0" a "1". Calculada pelo backend;
   * o front só usa para a largura da barra. null = sem barra.
   */
  fracao_barra_saldo_pp: Decimal | null;
  situacao: Situacao;
  /** Motivo quando situacao = "sem_calculo" (ex.: "Histórico insuficiente: 37 dias"). */
  motivo_situacao: string | null;
  /** ABC de consumo efetiva; null = NC (sem classe calculável). */
  abc: ClasseAbc | null;
  /**
   * ABC de estoque (cartão de Materiais). Não ativada (CONTEXTO, D-P4-04): o backend manda
   * null até o Sander decidir, e a tela mostra "—". Rota nova, a criar no backend.
   */
  abc_estoque: ClasseAbc | null;
};

/** Filtros prontos de Materiais (chips com contagem). Contagem vem da API. */
export type FiltroMateriais =
  "abaixo_pp" | "saldo_negativo" | "parados" | "classe_a" | "sem_calculo";

export type ContagemFiltro<Id extends string> = {
  id: Id;
  contagem: number | null;
};

/**
 * Resposta de GET /api/v1/materiais. Rota nova, a criar no backend (junta GET /materials com
 * GET /approved-math/dashboard?search=&page=&limit=100 do protótipo).
 *
 * Parâmetros (todos opcionais, combináveis; os mesmos de GET /api/v1/materiais/excel, sem
 * `pagina`):
 * - `q`: busca por código (com ou sem espaços), local ou descrição;
 * - `filtro`: FiltroMateriais (os 5 chips);
 * - `abc`: ClasseAbc · `pqr`: ClassePqr (célula da matriz ABC × PQR);
 * - `sinal`: CodigoSinal — os 7 de "Sinais para agir" da Visão geral. Os sinais sem filtro
 *   pronto (`acima_maximo`, `preco_ausente`, `parametro_cliente`) só chegam a Materiais por
 *   aqui, então o backend precisa aceitar todos os 7;
 * - `pagina`: 1, 2… (100 por página).
 */
export type PaginaMateriais = {
  conclusao: ConclusaoMateriais;
  filtros: ContagemFiltro<FiltroMateriais>[];
  itens: Posicao[];
  /** Posições que batem com a busca e os filtros. */
  total: number;
  /** Posições do catálogo inteiro, sem filtro ("23 de 812 posições"). */
  total_catalogo: number;
  pagina: number;
  /** Total de páginas (o front não divide total por limite). */
  paginas: number;
  limite: number;
  /** Métricas aprovadas indisponíveis: o catálogo continua consultável (estado "erro de métricas"). */
  metricas: Disponibilidade;
};

/* ------------------------------------------------------------------------------------------
 * Visão geral
 * ---------------------------------------------------------------------------------------- */

/** Indicador com estado: valor pronto ou indisponível com motivo. */
export type Kpi<Valores extends Record<string, unknown>> = Disponibilidade & {
  valores: Valores;
};

/** Sinais de "Sinais para agir" (encaminhamentos, CONTEXTO §10.2). */
export type CodigoSinal =
  | "saldo_negativo"
  | "reposicao_indicada"
  | "acima_maximo"
  | "sem_giro"
  | "historico_insuficiente"
  | "preco_ausente"
  | "parametro_cliente";

export type Sinal = {
  codigo: CodigoSinal;
  posicoes: number | null;
  /** Filtro de Materiais que o sinal abre; null = o sinal não tem filtro pronto. */
  filtro: FiltroMateriais | null;
};

/** Faixa de intensidade da célula (a cor sai do token pela faixa). 0 = vazia. */
export type FaixaCelula = 0 | 1 | 2 | 3 | 4;

/** Célula de uma grade (ABC × PQR, PQR × ABC × XYZ). */
export type CelulaMatriz<Linha extends string, Coluna extends string> = {
  linha: Linha;
  coluna: Coluna;
  posicoes: number;
  faixa: FaixaCelula;
  /** Célula destacada com contorno (ex.: AP na Visão geral). */
  destaque: boolean;
};

/** Grade ABC × PQR da Visão geral. Protótipo: visuals.matrix (dashboardTypes.ts). */
export type MatrizAbcPqr = {
  celulas: CelulaMatriz<Exclude<ClassePqr, "N">, Exclude<ClasseAbc, "N">>[];
  /** Posições sem classe (N) que ficam fora da grade. */
  fora_da_grade: number;
};

export type AbaComposicao = "abc" | "pqr" | "xyz" | "comprabilidade";

/** Linha de composição de uma classificação. Protótipo: distributions (dashboardTypes.ts). */
export type ComposicaoClasse = {
  /** Letra da classe ("A", "P", "X", "1"...). */
  classe: string;
  /** O que a barra mostra, já em porcentagem (ex.: "71"). null = sem valor (N, por exemplo). */
  percentual: Decimal | null;
  /** Largura da barra, fração de "0" a "1" pronta (o front não divide por 100). */
  fracao_barra: Decimal | null;
  itens: number | null;
  /** % dos itens (ex.: "12"). */
  percentual_itens: Decimal | null;
};

/**
 * Uma aba da composição. medida diz o que a barra mede (o cabeçalho da coluna muda).
 * destaque: a frase "12% dos itens (classe A) concentram 71% do valor consumido", com os
 * números prontos; null = sem frase nesta aba.
 */
export type ComposicaoAba = {
  medida: "valor_consumido" | "posicoes";
  classes: ComposicaoClasse[];
  destaque: {
    classe: string;
    percentual_itens: Decimal | null;
    percentual_valor: Decimal | null;
  } | null;
};

export type EtapaImplantacao = {
  id: "dados_mestres" | "movimentos" | "precos" | "nivel_servico" | "pedidos_em_aberto";
  concluida: boolean;
};

/**
 * Resposta de GET /api/v1/visao-geral. Rota nova, a criar no backend
 * (versão enxuta de GET /approved-math/dashboard do protótipo).
 */
export type VisaoGeral = {
  contexto: {
    posicoes: number;
    locais: number;
    leitura_em: DataHoraIso;
    periodo: Periodo | null;
  };
  /** null = a API não tem conclusão para mostrar (ex.: sem dados importados). */
  conclusao: ConclusaoVisaoGeral | null;
  implantacao: {
    concluidas: number;
    total: number;
    etapas: EtapaImplantacao[];
  };
  kpis: {
    valor_estoque: Kpi<{ valor: Decimal | null; posicoes_com_preco: number | null }>;
    parado_180_dias: Kpi<{
      valor: Decimal | null;
      itens: number | null;
      percentual_valor: Decimal | null;
    }>;
    abaixo_pp: Kpi<{ posicoes: number | null; classe_a: number | null }>;
    saldo_negativo: Kpi<{ posicoes: number | null }>;
    movimento: Kpi<{ entradas: number | null; saidas: number | null; periodo: Periodo | null }>;
  };
  prioridades: {
    /** Tamanho da fila completa (link "Ver fila completa (31)"). */
    total_fila: number;
    itens: Posicao[];
  };
  sinais: Sinal[];
  matriz_abc_pqr: MatrizAbcPqr;
  composicao: Record<AbaComposicao, ComposicaoAba>;
  /** "Memória desta leitura" (Para aprofundar): de onde vêm os números desta tela. */
  memoria: {
    periodo: Periodo | null;
    leitura_em: DataHoraIso | null;
    /** Ex.: "Motor V3". null = não informado. */
    versao_calculo: string | null;
    /** Ex.: "Padrão Agro MRO". null = não informado. */
    regras: string | null;
  };
};

/* ------------------------------------------------------------------------------------------
 * Planejamento
 * ---------------------------------------------------------------------------------------- */

/**
 * Os 8 estados de caso mostrados no Planejamento. Protótipo: planning_cases.status
 * (main.py planning_list). O protótipo também tem "monitoring" e "completed", que o design
 * não mostra; ficam fora até decidirmos (ver pendências).
 */
export type EstadoCaso =
  "todo" | "analysis" | "testing" | "ready" | "validated" | "exported" | "applied" | "discarded";

/** Filtros da fila (7). A API aplica o filtro (GET /api/v1/planejamento?filtro=). */
export type FiltroPlanejamento =
  "active" | "todo" | "testing" | "ready" | "validated" | "exported" | "all";

/** Antes → depois de um parâmetro. null = sem valor (não é zero). */
export type AntesDepois = {
  antes: Decimal | null;
  depois: Decimal | null;
};

/** Proposta ES / PP / EM da simulação selecionada. Protótipo: planning_simulations.result_json. */
export type PropostaParametros = {
  safety_stock: AntesDepois;
  reorder_point: AntesDepois;
  maximum_stock: AntesDepois;
};

/** Caso de planejamento (um por SKU + Local). Protótipo: planning_case_payload (main.py). */
export type CasoPlanejamento = {
  id: number;
  material_id: number;
  code: string;
  location: string;
  location_name: string;
  short_description: string;
  status: EstadoCaso;
  /** Motivo do caso. Protótipo: planning_cases.reason. */
  reason: string;
  /** Os dados mudaram depois do teste/validação. Protótipo: stale. */
  stale: boolean;
  motivo_desatualizado: string | null;
  proposta: PropostaParametros | null;
  validated_at: DataHoraIso | null;
  exported_at: DataHoraIso | null;
  export_batch_id: string | null;
  applied_at: DataHoraIso | null;
  external_reference: string | null;
  /**
   * Validado, atual e ainda não exportado: entra no próximo Excel de mudanças. Decidido pelo
   * backend (o front não cruza status com stale).
   */
  entra_no_proximo_excel: boolean;
};

/** Posição sugerida para iniciar análise ("Itens para iniciar análise"). */
export type ItemParaIniciar = {
  material_id: number;
  code: string;
  location: string;
  location_name: string;
  short_description: string;
  stock_quantity: Decimal | null;
  reorder_point: Decimal | null;
};

/**
 * Resposta de GET /api/v1/planejamento?filtro=. Base no protótipo GET /api/v1/planning
 * ({ items, summary }); conclusao, filtros, percentuais como Decimal e sugestões são novos.
 *
 * Escritas da tela (rotas novas, a criar no backend):
 * - POST /api/v1/planejamento/casos { material_id } → CasoPlanejamento ("Iniciar análise");
 * - POST /api/v1/planejamento/casos/{id}/aplicacao { referencia_externa: string | null } →
 *   CasoPlanejamento ("Confirmar aplicação no ERP": declaração do cliente; não muda o ERP);
 * - POST /api/v1/planejamento/excel-de-mudancas → arquivo .xlsx (Content-Disposition) e emite
 *   o lote: os casos exportáveis passam a "Exportado". Exportar NÃO confirma aplicação.
 */
export type Planejamento = {
  conclusao: ConclusaoPlanejamento;
  /** Filtro aplicado em `casos`. */
  filtro: FiltroPlanejamento;
  resumo: {
    iniciados: number;
    validados: number;
    aplicados: number;
    dados_para_rever: number;
    /** % de casos validados (ex.: "38"). Protótipo: analysis_progress. */
    percentual_analise: Decimal | null;
    /** % dos validados que foram aplicados. Protótipo: implementation_progress. */
    percentual_aplicacao: Decimal | null;
  };
  filtros: ContagemFiltro<FiltroPlanejamento>[];
  /** Casos do filtro, na ordem da fila (decidida pelo backend). */
  casos: CasoPlanejamento[];
  /** Quantos casos validados e atuais entram no próximo Excel de mudanças. */
  exportaveis: number;
  sugestoes: ItemParaIniciar[];
};

/* ------------------------------------------------------------------------------------------
 * Importação
 * ---------------------------------------------------------------------------------------- */

/** Dataset da carga. Protótipo: TableImportIn.import_type. */
export type DatasetImportacao = "master_data" | "movements" | "pipeline";

/** ERP de onde vem a planilha (escolha do passo Arquivo). Protótipo: movement_system. */
export type ErpOrigem = "sap" | "totvs" | "senior" | "outro";

/** Acrescentar e atualizar × substituir tudo. Protótipo: movement_import_mode. */
export type ModoImportacao = "append" | "replace";

/** Situação do recibo. Protótipo: trace_import_receipts.status. */
export type StatusCarga = "completed" | "blocked" | "failed";

/** Carga do histórico ("Cargas anteriores"). Protótipo: GET /api/v1/lineage/receipts. */
export type CargaImportacao = {
  id: string;
  dataset: DatasetImportacao;
  arquivo: string;
  modo: ModoImportacao;
  status: StatusCarga;
  linhas: number;
  recebida_em: DataHoraIso;
  /** Nome curto de quem enviou (ex.: "Hugo S."). */
  por: string;
};

/** Uma aba de carga ("Dados mestres", "Movimentos", "Pedidos em aberto"). */
export type AbaImportacao = {
  dataset: DatasetImportacao;
  /** false = "Em breve" (o backend ainda não recebe esta carga pela tela nova). */
  disponivel: boolean;
};

/**
 * Resposta de GET /api/v1/importacao. Rota nova, a criar no backend (junta o histórico de
 * GET /api/v1/lineage/receipts com o que a tela precisa para começar).
 */
export type PainelImportacao = {
  conclusao: ConclusaoImportacao | null;
  abas: AbaImportacao[];
  /** Posições que já estão no sistema (texto do "Substituir tudo"). null = nenhuma. */
  posicoes_atuais: number | null;
  historico: CargaImportacao[];
};

/**
 * Resposta de POST /api/v1/importacao/arquivos (multipart: arquivo, dataset, erp). Rota nova,
 * a criar no backend; base no protótipo POST /api/v1/imports/file. O backend lê a planilha
 * e guarda o arquivo (source_file_id); o front não lê o conteúdo.
 */
export type ArquivoRecebido = {
  arquivo_id: string;
  nome: string;
  tamanho_bytes: number;
  linhas: number;
  /** Abas da planilha que entram (ex.: ["MARA_MARD"]). Vazio em .csv. */
  abas: string[];
};

/** Confiança do reconhecimento automático de uma coluna. */
export type ConfiancaColuna = "alta" | "media" | "nenhuma";

/** Um campo do sistema e a coluna do arquivo ligada a ele (passo Colunas). */
export type CampoMapeado = {
  /** Identificador do campo (ex.: "code", "location", "unit_price"). */
  campo: string;
  nome: string;
  obrigatorio: boolean;
  /** Complemento do "Obrigatório" (ex.: "centro + depósito"). */
  detalhe: string | null;
  /** Coluna escolhida. null = "Não usar" / nenhuma coluna encontrada. */
  coluna: string | null;
  /** Exemplo da 1ª linha, já como o sistema vai entender (texto pronto da API). */
  exemplo: string | null;
  confianca: ConfiancaColuna;
};

/**
 * Resposta de GET /api/v1/importacao/arquivos/{arquivo_id}/colunas. Rota nova, a criar no
 * backend. O mapeamento lembrado vem daqui (o front não guarda nada).
 */
export type ColunasDoArquivo = {
  /** Último mapeamento lembrado; null = primeira carga desse ERP. */
  lembrado: { erp: ErpOrigem; carga_em: DataHoraIso } | null;
  campos_ligados: number;
  total_campos: number;
  campos: CampoMapeado[];
  /** Colunas encontradas no arquivo, para as listas de escolha. */
  colunas_do_arquivo: string[];
};

/** Linha com erro na prévia. Corrigir um valor manda PUT …/correcoes e volta a prévia nova. */
export type ErroLinhaImportacao = {
  linha: number;
  campo: string;
  /** Nome da coluna como aparece na tela (ex.: "Preço unitário"). */
  coluna: string;
  /** Valor como está no arquivo (ou como foi corrigido). null = vazio. */
  valor: string | null;
  /** O que fazer (texto pronto da API). */
  motivo: string;
  /** true = a correção enviada foi aceita pelo backend. */
  corrigido: boolean;
};

/**
 * Prévia (nada gravado). Resposta de POST /api/v1/importacao/arquivos/{arquivo_id}/previa
 * ({ mapeamento: {campo: coluna | null}, lembrar }) e de PUT …/correcoes
 * ({ linha, campo, valor }). Rotas novas, a criar no backend; base no protótipo
 * imports/table com confirm=false.
 */
export type PreviaImportacao = {
  linhas_lidas: number;
  prontas: number;
  com_erro: number;
  erros: ErroLinhaImportacao[];
};

/** Resumo grande do fim ("812 posições em 3 locais"). Valores prontos da API. */
export type ResumoCarga = {
  posicoes: number;
  locais: number;
  nomes_locais: string[];
  /** Valor em estoque das posições com preço. null = sem preço nenhum. */
  valor_estoque: Decimal | null;
  /** Posições sem preço (ficam NC até o cliente informar). */
  sem_preco: number;
};

/**
 * Progresso real da gravação. POST /api/v1/importacao/arquivos/{arquivo_id}/confirmar
 * ({ modo }) responde 202 com { carga_id }; a tela lê GET /api/v1/importacao/cargas/{carga_id}
 * até sair de "gravando". Rotas novas, a criar no backend. Tudo ou nada: se falhar, nada é
 * gravado e `motivo` explica.
 */
export type ProgressoCarga = {
  carga_id: string;
  estado: "gravando" | "concluida" | "falhou";
  gravadas: number;
  total: number;
  /** % pronto da API (ex.: "43"); o front não divide gravadas por total. */
  percentual: Decimal;
  resumo: ResumoCarga | null;
  motivo: string | null;
};

/* ------------------------------------------------------------------------------------------
 * Regras do cálculo
 * ---------------------------------------------------------------------------------------- */

/** Origem de uma regra do espaço. */
export type OrigemRegra = "agro_mro" | "cliente";

/**
 * Cortes da classificação. Protótipo: GET/PUT /api/v1/classification-settings
 * (schemas.py ClassificationSettingsIn: abc_a, abc_b em fração; pqr_* em transações/ano).
 */
export type RegraCorte = {
  abc_a: Decimal;
  abc_b: Decimal;
  pqr_output_q: Decimal;
  pqr_output_p: Decimal;
  pqr_entry_q: Decimal;
  pqr_entry_p: Decimal;
  new_item_days: number;
  origem: OrigemRegra;
  versao: number;
};

/** As 6 abas de Regras e letras. */
export type AbaRegras =
  "abc" | "pqr_saidas" | "pqr_entradas" | "xyz" | "comprabilidade" | "item_novo";

/**
 * Cortes do espaço como a tela mostra e edita: ABC em % do valor acumulado, PQR em
 * transações por ano, item novo em dias. O backend converte para o formato de
 * PUT /classification-settings do protótipo (abc_a/abc_b em fração). Decimal sempre string.
 */
export type CortesDoEspaco = {
  abc_a_percentual: Decimal;
  abc_b_percentual: Decimal;
  pqr_saidas_q: Decimal;
  pqr_saidas_p: Decimal;
  pqr_entradas_q: Decimal;
  pqr_entradas_p: Decimal;
  item_novo_dias: number;
};

/** Faixa de uma letra na barra dos cortes: início e fim em fração da barra ("0" a "1"). */
export type SegmentoBarra = { letra: string; inicio: Decimal; fim: Decimal };

/** O que a API calcula para cada aba com os cortes SALVOS (o rascunho não muda isso). */
export type PainelRegra = {
  /** Exemplo do design com a classe já decidida pelo backend. */
  exemplo: string;
  /** Posições em cada letra hoje. null = a aba não mostra contagem. */
  contagens: Record<string, number> | null;
  /** Barra dos cortes. null = aba sem barra (XYZ, Comprabilidade, N). */
  barra: SegmentoBarra[] | null;
};

/**
 * Resposta de GET /api/v1/regras. Rota nova, a criar no backend (base no protótipo
 * GET /api/v1/classification-settings + contagens e exemplos). Escritas:
 * - PUT /api/v1/regras/cortes { cortes: CortesDoEspaco, versao } → RegrasLetras. Recalcula o
 *   estoque todo. 422 com a mensagem da regra (ex.: "O corte de A precisa ser menor que o
 *   de B…"); 409 se a versão mudou.
 * - POST /api/v1/regras/cortes/restaurar { versao } → RegrasLetras (volta ao padrão).
 */
export type RegrasLetras = {
  conclusao: ConclusaoRegras;
  origem: OrigemRegra;
  /** Versão dos cortes do espaço (0 = padrão Agro MRO). */
  versao: number;
  cortes: CortesDoEspaco;
  padrao: CortesDoEspaco;
  /** Posições que mudam de classe ao salvar (texto da confirmação). */
  posicoes: number;
  paineis: Record<AbaRegras, PainelRegra>;
  versao_classificacoes: string;
  versao_alertas: string;
  /** Alertas ativos ("8 alertas ativos" em Para aprofundar). */
  alertas_ativos: number;
};

/**
 * Origem da meta de um caso. "v3" = referência V3 em uso (matriz padrão); "cliente" =
 * editado no espaço; "v3_adotada" = V3 adotada explicitamente na matriz própria; null = NC
 * (não declarado na matriz própria).
 */
export type OrigemCasoNivelServico = "v3" | "cliente" | "v3_adotada" | null;

/** Caso da matriz de nível de serviço (75 casos). Protótipo: service_level_rules / approved_service_levels_v3.json. */
export type CasoNivelServico = {
  /** Código do caso (ex.: "PAX"). */
  case: string;
  pqr: ClassePqr;
  abc: ClasseAbc;
  xyz: ClasseXyz;
  /** Meta em fração (ex.: "0.975"); "0" é decisão válida; null = NC. */
  service_level: Decimal | null;
  /** Fator z (Inversa Normal) calculado pelo backend. null quando NS = 0 ou NC. */
  fator_z: Decimal | null;
  /** Faixa da cor: 0 = 0%, 1 = 50 a 79%, 2 = 80 a 94%, 3 = 95% ou mais (decidida pelo backend). */
  faixa: FaixaCelula;
  origem: OrigemCasoNivelServico;
  /** Valor V3 do caso, para comparar. */
  referencia_v3: Decimal;
  /** A meta em uso é diferente da V3 (ponto dourado). Decidido pelo backend. */
  diferente_da_v3: boolean;
  /** Versão da configuração do caso no espaço; null = sem configuração própria. */
  versao: number | null;
  /** Largura da barra "O que muda no ES" para a meta atual, de "0" a "1". null = sem barra. */
  fracao_barra_z: Decimal | null;
};

/**
 * Resposta de GET /api/v1/nivel-servico. Rota nova, a criar no backend (base no protótipo
 * GET /api/v1/service-level-rules + /state). Escritas (exigem permissoes.editar_regras):
 * - PUT /api/v1/nivel-servico/casos/{case} { meta_percentual: Decimal, versao } → esta
 *   resposta. O 1º caso salvo com origem "v3" inicia a matriz própria (os outros 74 ficam NC).
 *   Regra: 0 ou de 50 a menos de 100, até 2 casas (422 com a mensagem).
 * - DELETE /api/v1/nivel-servico/casos/{case}?versao= → esta resposta (o caso fica NC).
 * - POST /api/v1/nivel-servico/adocao-v3 { versao } → esta resposta (os 75 valores V3).
 */
export type MatrizNivelServico = {
  conclusao: ConclusaoNivelServico;
  origem: "v3" | "propria";
  /** Versão da matriz do espaço (concorrência: 409 se mudou). */
  versao: number;
  /** Identificador da referência (ex.: "agro-mro-ns-sander-v3-2026-10-10"). */
  referencia: string;
  /** Casos declarados na matriz própria (0 quando a V3 está em uso). */
  casos_declarados: number;
  /** Sempre 75 casos (P/Q/R/S/N × A/B/C/D/N × X/Y/Z). */
  casos: CasoNivelServico[];
  /** Posições em cada linha PQR + ABC (chave "PA", "QB"...). Ausente = sem contagem. */
  posicoes_por_linha: Record<string, number>;
};

/**
 * Impacto de uma meta digitada, antes de salvar. GET /api/v1/nivel-servico/impacto?caso=&meta=
 * (meta em %, ex.: "97.5"). Rota nova, a criar no backend: a Inversa Normal é do backend.
 */
export type ImpactoMeta = {
  caso: string;
  fator_z_atual: Decimal | null;
  fator_z_novo: Decimal | null;
  /** Variação aproximada do ES, em % com sinal (ex.: "12", "-8"). null = sem comparação. */
  variacao_percentual: Decimal | null;
  /** Largura das barras do impacto, de "0" a "1". */
  fracao_barra_atual: Decimal | null;
  fracao_barra_nova: Decimal | null;
};

/** Prévia da adoção da V3 ("Confira a adoção da matriz V3"). GET /api/v1/nivel-servico/adocao-v3. */
export type PreviaAdocaoV3 = {
  casos_a_incluir: number;
  configuracoes_a_substituir: number;
  valores_diferentes: number;
  niveis_manuais_preservados: number;
};

/** Caso da TMER (75 casos PQR × ABC × X123). Protótipo: tmer_standard.py / GET /api/v1/tmer-rules. */
export type CasoTmer = {
  case: string;
  pqr: ClassePqr;
  abc: ClasseAbc;
  /** X123: numeração da tabela recebida; relação com Comprabilidade não homologada (D-15). */
  purchasability: 1 | 2 | 3;
  replenishment_days: Decimal;
  /** Reposições por ano, calculado pelo backend (o front não divide 365 por dias). null quando dias = 0. */
  reposicoes_por_ano: Decimal | null;
  faixa: FaixaCelula;
  editado: boolean;
};

export type MatrizTmer = {
  conclusao: ConclusaoTmer;
  versao_modelo: string;
  casos: CasoTmer[];
};

/** Sentido do movimento. Só IN e OUT. Protótipo: MovementTypeMappingIn.direction. */
export type TipoMovimento = "IN" | "OUT";

/** Código do extrato → Entrada/Saída. Protótipo: GET /api/v1/movement-type-mappings. */
export type MapeamentoMovimento = {
  id: number;
  system: "custom" | "sap" | "senior" | "datasul";
  external_code: string;
  direction: TipoMovimento;
  description: string;
};

/** Código recusado na última carga. Rota nova, a criar no backend (pendência do design). */
export type CodigoSemMapeamento = {
  codigo: string;
  linhas_fora: number;
  carga_em: DataHoraIso;
};

/* ------------------------------------------------------------------------------------------
 * Busca global
 * ---------------------------------------------------------------------------------------- */

/** Posição encontrada pela busca. A pontuação e a ordem vêm do backend. */
export type PosicaoBusca = {
  material_id: number;
  code: string;
  short_description: string;
  location_name: string;
  situacao: Situacao;
  classe: ClasseExibida;
};

/** Atalho da busca sem texto (3 filtros com contagem). */
export type AtalhoBusca = {
  filtro: Extract<FiltroMateriais, "abaixo_pp" | "saldo_negativo" | "parados">;
  posicoes: number | null;
};

/** Resposta de GET /api/v1/busca?q=. Rota nova, a criar no backend. */
export type ResultadoBusca = {
  /** Até 6 posições, já ordenadas pela pontuação. */
  posicoes: PosicaoBusca[];
  /** Total de posições encontradas (para "6 de 9"). */
  total: number;
  /** Só com q vazio: os 3 atalhos com contagem. */
  atalhos: AtalhoBusca[] | null;
};
