/**
 * Importar dados: valores ilustrativos de ImportarDados.dc.html (arquivo SAP de 818 linhas,
 * 812 prontas, 6 erros, histórico de 3 cargas). Horários do design em Cuiabá (UTC−4),
 * guardados aqui em UTC, como a API manda.
 */
import type {
  CampoMapeado,
  CargaImportacao,
  ColunasDoArquivo,
  ErroLinhaImportacao,
  PainelImportacao,
  ResumoCarga,
} from "@/api/tipos";

import { LOCAIS } from "./locais";
import { d, iso } from "./util";

export const HISTORICO_IMPORTACAO: CargaImportacao[] = [
  {
    id: "carga-0003",
    dataset: "movements",
    arquivo: "movimentos_sap_jul-out.xlsx",
    modo: "append",
    status: "completed",
    linhas: 4312,
    recebida_em: iso("2026-11-04T18:12:00Z"),
    por: "Hugo S.",
  },
  {
    id: "carga-0002",
    dataset: "master_data",
    arquivo: "materiais_sap_out.xlsx",
    modo: "append",
    status: "completed",
    linhas: 806,
    recebida_em: iso("2026-11-04T17:58:00Z"),
    por: "Hugo S.",
  },
  {
    id: "carga-0001",
    dataset: "master_data",
    arquivo: "materiais_sap_out.xlsx",
    modo: "append",
    status: "blocked",
    linhas: 806,
    recebida_em: iso("2026-11-04T17:41:00Z"),
    por: "Hugo S.",
  },
];

export const PAINEL_IMPORTACAO: PainelImportacao = {
  conclusao: { tipo: "comecar_pelos_dados_mestres", valores: { minutos_estimados: 2 } },
  abas: [
    { dataset: "master_data", disponivel: true },
    { dataset: "movements", disponivel: false },
    { dataset: "pipeline", disponivel: false },
  ],
  posicoes_atuais: 806,
  historico: HISTORICO_IMPORTACAO,
};

export const PAINEL_IMPORTACAO_VAZIO: PainelImportacao = {
  ...PAINEL_IMPORTACAO,
  posicoes_atuais: null,
  historico: [],
};

/** Linhas do arquivo de exemplo, como o backend leria. */
export const LINHAS_DO_ARQUIVO = 818;
export const ABAS_DO_ARQUIVO = ["MARA_MARD"];

const CAMPOS: CampoMapeado[] = [
  {
    campo: "code",
    nome: "Código do material",
    obrigatorio: true,
    detalhe: null,
    coluna: "MATNR",
    exemplo: "0000 0012 3456",
    confianca: "alta",
  },
  {
    campo: "short_description",
    nome: "Descrição",
    obrigatorio: true,
    detalhe: null,
    coluna: "MAKTX",
    exemplo: "Rolamento 6205 2RS",
    confianca: "alta",
  },
  {
    campo: "location",
    nome: "Local",
    obrigatorio: true,
    detalhe: "centro + depósito",
    coluna: "WERKS + LGORT",
    exemplo: "1000 / 0001 → Almox. central",
    confianca: "alta",
  },
  {
    campo: "unit_price",
    nome: "Preço unitário",
    obrigatorio: true,
    detalhe: null,
    coluna: "VERPR",
    exemplo: "R$ 48,90",
    confianca: "alta",
  },
  {
    campo: "group_1",
    nome: "Grupo de material",
    obrigatorio: false,
    detalhe: null,
    coluna: "MATKL",
    exemplo: "ROLAM",
    confianca: "media",
  },
  {
    campo: "criticality",
    nome: "Criticidade",
    obrigatorio: false,
    detalhe: null,
    coluna: null,
    exemplo: "NC",
    confianca: "nenhuma",
  },
];

export const COLUNAS_DO_ARQUIVO: ColunasDoArquivo = {
  lembrado: { erp: "sap", carga_em: iso("2026-11-04T17:58:00Z") },
  campos_ligados: 5,
  total_campos: 6,
  campos: CAMPOS,
  colunas_do_arquivo: ["MATNR", "MAKTX", "WERKS + LGORT", "VERPR", "MATKL", "MEINS", "LABST"],
};

export const ERROS_DA_PREVIA: ErroLinhaImportacao[] = [
  {
    linha: 37,
    campo: "unit_price",
    coluna: "Preço unitário",
    valor: "12,50,00",
    motivo: "Número com duas vírgulas. Use 12,50 ou 1250,00.",
    corrigido: false,
  },
  {
    linha: 214,
    campo: "code",
    coluna: "Código do material",
    valor: null,
    motivo: "Código vazio. Toda posição precisa de um código.",
    corrigido: false,
  },
  {
    linha: 215,
    campo: "location",
    coluna: "Local",
    valor: "ALM-99",
    motivo: "Local que não existe. Use um dos 3 locais ou cadastre o novo.",
    corrigido: false,
  },
  {
    linha: 402,
    campo: "code",
    coluna: "Código do material",
    valor: "0000 0045 1180",
    motivo: "Repetido no mesmo local (já está na linha 118). Apague um dos dois.",
    corrigido: false,
  },
  {
    linha: 633,
    campo: "unit_price",
    coluna: "Preço unitário",
    valor: "-45,00",
    motivo: "Preço negativo. Confira o valor no ERP.",
    corrigido: false,
  },
  {
    linha: 790,
    campo: "location",
    coluna: "Local",
    valor: null,
    motivo: "Local vazio. Informe onde o material fica.",
    corrigido: false,
  },
];

export const RESUMO_DADOS_MESTRES: Omit<ResumoCarga, "posicoes"> = {
  locais: LOCAIS.length,
  nomes_locais: LOCAIS.map((l) => l.nome),
  valor_estoque: d("2412530.40"),
  sem_preco: 12,
};
