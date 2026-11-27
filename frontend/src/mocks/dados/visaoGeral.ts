/**
 * Visão geral ilustrativa (VisaoGeral.dc.html): 812 posições, 3 locais, R$ 2,4 mi,
 * R$ 412 mil parados em 214 itens, 23 abaixo do PP (5 classe A), 8 negativos.
 */
import type { CelulaMatriz, ClasseAbc, ClassePqr, FaixaCelula, VisaoGeral } from "@/api/tipos";

import { posicao } from "./posicoes";
import { d, dia, iso } from "./util";

type LinhaGrade = Exclude<ClassePqr, "N">;
type ColunaGrade = Exclude<ClasseAbc, "N">;

/** Grade ABC × PQR do design (posições). Faixa = intensidade já decidida pelo "backend". */
// Faixas pela intensidade do design (alfa do verde-700): 1 até 0,2 · 2 até 0,35 · 3 até 0,6 · 4 cheia.
const GRADE: [LinhaGrade, [number, FaixaCelula][]][] = [
  [
    "P",
    [
      [41, 2],
      [22, 2],
      [9, 1],
      [2, 1],
    ],
  ],
  [
    "Q",
    [
      [33, 2],
      [58, 3],
      [61, 3],
      [14, 1],
    ],
  ],
  [
    "R",
    [
      [16, 1],
      [52, 3],
      [148, 4],
      [41, 2],
    ],
  ],
  [
    "S",
    [
      [8, 1],
      [30, 2],
      [173, 4],
      [92, 3],
    ],
  ],
];
const COLUNAS: ColunaGrade[] = ["A", "B", "C", "D"];

const celulas: CelulaMatriz<LinhaGrade, ColunaGrade>[] = GRADE.flatMap(([linha, valores]) =>
  valores.map(([posicoes, faixa], i) => ({
    linha,
    coluna: COLUNAS[i] ?? "D",
    posicoes,
    faixa,
    destaque: linha === "P" && i === 0,
  })),
);

export const VISAO_GERAL: VisaoGeral = {
  contexto: {
    posicoes: 812,
    locais: 3,
    leitura_em: iso("2026-11-11T14:00:00Z"),
    periodo: { inicio: dia("2026-07-01"), fim: dia("2026-11-11") },
  },
  conclusao: {
    tipo: "parado_e_abaixo_pp",
    valores: {
      valor_parado: d("412380.00"),
      percentual_valor_parado: d("17"),
      itens_parados: 214,
      posicoes_abaixo_pp: 23,
      abaixo_pp_classe_a: 5,
    },
  },
  implantacao: {
    concluidas: 4,
    total: 5,
    etapas: [
      { id: "dados_mestres", concluida: true },
      { id: "movimentos", concluida: true },
      { id: "precos", concluida: true },
      { id: "nivel_servico", concluida: true },
      { id: "pedidos_em_aberto", concluida: false },
    ],
  },
  kpis: {
    valor_estoque: {
      estado: "disponivel",
      motivo: null,
      valores: { valor: d("2412530.40"), posicoes_com_preco: 812 },
    },
    parado_180_dias: {
      estado: "disponivel",
      motivo: null,
      valores: { valor: d("412380.00"), itens: 214, percentual_valor: d("17") },
    },
    abaixo_pp: { estado: "disponivel", motivo: null, valores: { posicoes: 23, classe_a: 5 } },
    saldo_negativo: { estado: "disponivel", motivo: null, valores: { posicoes: 8 } },
    movimento: {
      estado: "disponivel",
      motivo: null,
      valores: {
        entradas: 156,
        saidas: 520,
        periodo: { inicio: dia("2026-07-01"), fim: dia("2026-11-11") },
      },
    },
  },
  prioridades: {
    total_fila: 31,
    itens: [
      posicao("000000123456"),
      posicao("000000451180"),
      posicao("000000317720"),
      posicao("000000094412"),
      posicao("000000660301"),
      posicao("000000782093"),
    ],
  },
  sinais: [
    { codigo: "saldo_negativo", posicoes: 8, filtro: "saldo_negativo" },
    { codigo: "reposicao_indicada", posicoes: 23, filtro: "abaixo_pp" },
    { codigo: "acima_maximo", posicoes: 41, filtro: null },
    { codigo: "sem_giro", posicoes: 214, filtro: "parados" },
    { codigo: "historico_insuficiente", posicoes: 37, filtro: "sem_calculo" },
    { codigo: "preco_ausente", posicoes: 12, filtro: null },
    { codigo: "parametro_cliente", posicoes: 6, filtro: null },
  ],
  matriz_abc_pqr: { celulas, fora_da_grade: 12 },
  composicao: {
    abc: {
      medida: "valor_consumido",
      classes: [
        {
          classe: "A",
          percentual: d("71"),
          fracao_barra: d("0.71"),
          itens: 98,
          percentual_itens: d("12"),
        },
        {
          classe: "B",
          percentual: d("21"),
          fracao_barra: d("0.21"),
          itens: 162,
          percentual_itens: d("20"),
        },
        {
          classe: "C",
          percentual: d("7"),
          fracao_barra: d("0.07"),
          itens: 391,
          percentual_itens: d("48"),
        },
        {
          classe: "D",
          percentual: d("1"),
          fracao_barra: d("0.015"),
          itens: 149,
          percentual_itens: d("18"),
        },
        { classe: "N", percentual: null, fracao_barra: null, itens: 12, percentual_itens: d("1") },
      ],
      destaque: { classe: "A", percentual_itens: d("12"), percentual_valor: d("71") },
    },
    pqr: {
      medida: "posicoes",
      classes: [
        {
          classe: "P",
          percentual: d("9"),
          fracao_barra: d("0.09"),
          itens: 74,
          percentual_itens: d("9"),
        },
        {
          classe: "Q",
          percentual: d("20"),
          fracao_barra: d("0.2"),
          itens: 166,
          percentual_itens: d("20"),
        },
        {
          classe: "R",
          percentual: d("32"),
          fracao_barra: d("0.32"),
          itens: 257,
          percentual_itens: d("32"),
        },
        {
          classe: "S",
          percentual: d("37"),
          fracao_barra: d("0.37"),
          itens: 303,
          percentual_itens: d("37"),
        },
        {
          classe: "N",
          percentual: d("1"),
          fracao_barra: d("0.015"),
          itens: 12,
          percentual_itens: d("1"),
        },
      ],
      destaque: null,
    },
    xyz: {
      medida: "posicoes",
      classes: [
        {
          classe: "X",
          percentual: d("74"),
          fracao_barra: d("0.74"),
          itens: 604,
          percentual_itens: d("74"),
        },
        {
          classe: "Y",
          percentual: d("19"),
          fracao_barra: d("0.19"),
          itens: 151,
          percentual_itens: d("19"),
        },
        {
          classe: "Z",
          percentual: d("7"),
          fracao_barra: d("0.07"),
          itens: 57,
          percentual_itens: d("7"),
        },
      ],
      destaque: null,
    },
    comprabilidade: {
      medida: "posicoes",
      classes: [
        {
          classe: "1",
          percentual: d("48"),
          fracao_barra: d("0.48"),
          itens: 388,
          percentual_itens: d("48"),
        },
        {
          classe: "2",
          percentual: d("30"),
          fracao_barra: d("0.3"),
          itens: 241,
          percentual_itens: d("30"),
        },
        {
          classe: "3",
          percentual: d("23"),
          fracao_barra: d("0.23"),
          itens: 183,
          percentual_itens: d("23"),
        },
      ],
      destaque: null,
    },
  },
  memoria: {
    periodo: { inicio: dia("2026-07-01"), fim: dia("2026-11-11") },
    leitura_em: iso("2026-11-11T14:00:00Z"),
    versao_calculo: "Motor V3",
    regras: "Padrão Agro MRO (ABC 80% e 95%, PQR 3 e 12 saídas por ano, N em 180 dias)",
  },
};

/**
 * ?mock=vazio: espaço sem dados importados. Nada vira zero: os indicadores ficam
 * indisponíveis com motivo e a conclusão não existe (null).
 */
const SEM_DADOS = { estado: "indisponivel", motivo: "Sem dados importados" } as const;

export const VISAO_GERAL_VAZIA: VisaoGeral = {
  contexto: { posicoes: 0, locais: 0, leitura_em: VISAO_GERAL.contexto.leitura_em, periodo: null },
  conclusao: null,
  implantacao: {
    concluidas: 0,
    total: 5,
    etapas: VISAO_GERAL.implantacao.etapas.map((e) => ({ ...e, concluida: false })),
  },
  kpis: {
    valor_estoque: { ...SEM_DADOS, valores: { valor: null, posicoes_com_preco: null } },
    parado_180_dias: {
      ...SEM_DADOS,
      valores: { valor: null, itens: null, percentual_valor: null },
    },
    abaixo_pp: { ...SEM_DADOS, valores: { posicoes: null, classe_a: null } },
    saldo_negativo: { ...SEM_DADOS, valores: { posicoes: null } },
    movimento: { ...SEM_DADOS, valores: { entradas: null, saidas: null, periodo: null } },
  },
  prioridades: { total_fila: 0, itens: [] },
  sinais: VISAO_GERAL.sinais.map((s) => ({ ...s, posicoes: null })),
  matriz_abc_pqr: {
    celulas: celulas.map((c) => ({ ...c, posicoes: 0, faixa: 0, destaque: false })),
    fora_da_grade: 0,
  },
  composicao: {
    abc: { medida: "valor_consumido", classes: [], destaque: null },
    pqr: { medida: "posicoes", classes: [], destaque: null },
    xyz: { medida: "posicoes", classes: [], destaque: null },
    comprabilidade: { medida: "posicoes", classes: [], destaque: null },
  },
  memoria: { periodo: null, leitura_em: null, versao_calculo: "Motor V3", regras: null },
};
