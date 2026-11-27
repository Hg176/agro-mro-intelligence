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
const GRADE: [LinhaGrade, [number, FaixaCelula][]][] = [
  [
    "P",
    [
      [41, 4],
      [22, 3],
      [9, 1],
      [2, 1],
    ],
  ],
  [
    "Q",
    [
      [33, 3],
      [58, 3],
      [61, 3],
      [14, 1],
    ],
  ],
  [
    "R",
    [
      [16, 2],
      [52, 3],
      [148, 4],
      [41, 3],
    ],
  ],
  [
    "S",
    [
      [8, 1],
      [30, 2],
      [173, 4],
      [92, 4],
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
    abc: [
      { classe: "A", percentual_valor: d("71"), itens: 98, percentual_itens: d("12") },
      { classe: "B", percentual_valor: d("21"), itens: 162, percentual_itens: d("20") },
      { classe: "C", percentual_valor: d("7"), itens: 391, percentual_itens: d("48") },
      { classe: "D", percentual_valor: d("1"), itens: 149, percentual_itens: d("18") },
      { classe: "N", percentual_valor: null, itens: 12, percentual_itens: d("1") },
    ],
    pqr: [
      { classe: "P", percentual_valor: null, itens: 74, percentual_itens: d("9") },
      { classe: "Q", percentual_valor: null, itens: 166, percentual_itens: d("20") },
      { classe: "R", percentual_valor: null, itens: 257, percentual_itens: d("32") },
      { classe: "S", percentual_valor: null, itens: 303, percentual_itens: d("37") },
      { classe: "N", percentual_valor: null, itens: 12, percentual_itens: d("1") },
    ],
    xyz: [
      { classe: "X", percentual_valor: null, itens: 604, percentual_itens: d("74") },
      { classe: "Y", percentual_valor: null, itens: 151, percentual_itens: d("19") },
      { classe: "Z", percentual_valor: null, itens: 57, percentual_itens: d("7") },
    ],
    comprabilidade: [
      { classe: "1", percentual_valor: null, itens: 388, percentual_itens: d("48") },
      { classe: "2", percentual_valor: null, itens: 241, percentual_itens: d("30") },
      { classe: "3", percentual_valor: null, itens: 183, percentual_itens: d("23") },
    ],
  },
};
