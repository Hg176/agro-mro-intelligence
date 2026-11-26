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
};

/** Filtros prontos de Materiais (chips com contagem). Contagem vem da API. */
export type FiltroMateriais =
  "abaixo_pp" | "saldo_negativo" | "parados" | "classe_a" | "sem_calculo";

export type ContagemFiltro<Id extends string> = {
  id: Id;
  contagem: number | null;
};

/**
 * Resposta de GET /api/v1/materiais?q=&filtro=&pagina=. Rota nova, a criar no backend
 * (junta GET /materials com GET /approved-math/dashboard?search=&page=&limit=100 do protótipo).
 */
export type PaginaMateriais = {
  conclusao: ConclusaoMateriais;
  filtros: ContagemFiltro<FiltroMateriais>[];
  itens: Posicao[];
  total: number;
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
  classe: string;
  /** % do valor consumido (ex.: "71"). null = não se aplica a esta aba. */
  percentual_valor: Decimal | null;
  itens: number;
  /** % dos itens (ex.: "12"). */
  percentual_itens: Decimal | null;
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
  conclusao: ConclusaoVisaoGeral;
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
  composicao: Record<AbaComposicao, ComposicaoClasse[]>;
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

/** Filtros da fila (7). */
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
 * Resposta de GET /api/v1/planejamento. Base no protótipo GET /api/v1/planning
 * ({ items, summary }); conclusao, filtros, percentuais como Decimal e sugestões são novos.
 */
export type Planejamento = {
  conclusao: ConclusaoPlanejamento;
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

/** Acrescentar ou substituir. Protótipo: movement_import_mode. */
export type ModoImportacao = "append" | "replace";

/** Situação do recibo. Protótipo: trace_import_receipts.status. */
export type StatusCarga = "completed" | "blocked" | "failed";

/** Carga do histórico. Protótipo: GET /api/v1/lineage/receipts. */
export type CargaImportacao = {
  id: string;
  dataset: DatasetImportacao;
  arquivo: string;
  modo: ModoImportacao;
  status: StatusCarga;
  linhas: number;
  posicoes: number | null;
  locais: number | null;
  recebida_em: DataHoraIso;
};

/** Coluna da planilha ligada a um campo do sistema (mapeamento lembrado vem da API). */
export type MapeamentoColuna = {
  campo: string;
  coluna_planilha: string | null;
  obrigatorio: boolean;
  lembrado: boolean;
};

/** Erro de uma linha na prévia (editável linha a linha). */
export type ErroLinhaImportacao = {
  linha: number;
  campo: string;
  valor: string | null;
  motivo: string;
};

/** Prévia (confirm=false). Protótipo: POST /api/v1/imports/file e /imports/table. */
export type PreviaImportacao = {
  arquivo_id: string;
  linhas: number;
  linhas_validas: number;
  erros: ErroLinhaImportacao[];
  mapeamento: MapeamentoColuna[];
  posicoes: number | null;
  locais: number | null;
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
  faixa: FaixaCelula;
  origem: "v3" | "cliente" | null;
};

/** Matriz de nível de serviço. Protótipo: GET /api/v1/service-level-rules (+ /state). */
export type MatrizNivelServico = {
  conclusao: ConclusaoNivelServico;
  origem: "v3" | "propria";
  versao: string;
  /** Sempre 75 casos (P/Q/R/S/N × A/B/C/D/N × X/Y/Z). */
  casos: CasoNivelServico[];
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
