/**
 * Planejamento: os 13 casos e as 4 sugestões de Planejamento.dc.html. Códigos como texto
 * (zeros à esquerda), datas do design em UTC. É a fonte do handler, que guarda uma cópia
 * mutável para as ações (iniciar, exportar, confirmar aplicação).
 */
import type {
  AntesDepois,
  CasoPlanejamento,
  ItemParaIniciar,
  PropostaParametros,
} from "@/api/tipos";

import { nomeDoLocal } from "./locais";
import { d, iso } from "./util";

const R = "Saldo abaixo do ponto de pedido; avaliar reposição e parâmetros.";

const par = (antes: string, depois: string): AntesDepois => ({
  antes: d(antes),
  depois: d(depois),
});

const proposta = (
  es: [string, string],
  pp: [string, string],
  em: [string, string],
): PropostaParametros => ({
  safety_stock: par(...es),
  reorder_point: par(...pp),
  maximum_stock: par(...em),
});

type Base = Pick<
  CasoPlanejamento,
  "id" | "code" | "location" | "short_description" | "status" | "reason"
> &
  Partial<CasoPlanejamento>;

function caso(b: Base): CasoPlanejamento {
  return {
    material_id: 500 + b.id,
    location_name: nomeDoLocal(b.location),
    stale: false,
    motivo_desatualizado: null,
    proposta: null,
    validated_at: null,
    exported_at: null,
    export_batch_id: null,
    applied_at: null,
    external_reference: null,
    entra_no_proximo_excel: false,
    ...b,
  };
}

export const CASOS_PLANEJAMENTO: CasoPlanejamento[] = [
  caso({
    id: 1,
    code: "000000123456",
    short_description: "Rolamento 6205 2RS",
    location: "1001",
    status: "ready",
    reason: R,
    proposta: proposta(["14", "16"], ["22", "24"], ["40", "44"]),
  }),
  caso({
    id: 2,
    code: "000000451180",
    short_description: "Correia B-52",
    location: "2001",
    status: "testing",
    reason: R,
    proposta: proposta(["4", "5"], ["9", "10"], ["18", "18"]),
  }),
  caso({
    id: 3,
    code: "000000317720",
    short_description: "Bico pulverizador 110-02",
    location: "1001",
    status: "validated",
    reason: R,
    proposta: proposta(["8", "10"], ["20", "22"], ["36", "40"]),
    validated_at: iso("2026-11-18T14:00:00Z"),
    entra_no_proximo_excel: true,
  }),
  caso({
    id: 4,
    code: "000000094412",
    short_description: "Óleo hidráulico 68 (20 L)",
    location: "3001",
    status: "validated",
    reason: R,
    proposta: proposta(["2", "2"], ["6", "5"], ["12", "10"]),
    validated_at: iso("2026-11-19T14:00:00Z"),
    entra_no_proximo_excel: true,
  }),
  caso({
    id: 5,
    code: "000000660301",
    short_description: "Filtro de ar primário",
    location: "2001",
    status: "validated",
    reason: R,
    proposta: proposta(["3", "4"], ["8", "9"], ["16", "16"]),
    validated_at: iso("2026-11-17T14:00:00Z"),
    stale: true,
    motivo_desatualizado:
      "A importação de movimentos de 04/11/2026 mudou o histórico usado no teste. Revise antes de exportar.",
  }),
  caso({
    id: 6,
    code: "000000782093",
    short_description: 'Mangueira 1/2" alta pressão',
    location: "1001",
    status: "ready",
    reason: "Parado há mais de 180 dias; avaliar redução do estoque máximo.",
    proposta: proposta(["2", "1"], ["4", "2"], ["20", "8"]),
  }),
  caso({
    id: 7,
    code: "000000660410",
    short_description: "Filtro separador de combustível",
    location: "3001",
    status: "exported",
    reason: R,
    proposta: proposta(["3", "3"], ["6", "7"], ["12", "14"]),
    validated_at: iso("2026-11-03T14:00:00Z"),
    export_batch_id: "2026-11-04-01",
    exported_at: iso("2026-11-04T14:00:00Z"),
  }),
  caso({
    id: 8,
    code: "000000557802",
    short_description: "Faca da plataforma de corte",
    location: "2001",
    status: "applied",
    reason: R,
    proposta: proposta(["4", "5"], ["10", "11"], ["20", "20"]),
    validated_at: iso("2026-11-03T14:00:00Z"),
    export_batch_id: "2026-11-04-01",
    exported_at: iso("2026-11-04T14:00:00Z"),
    applied_at: iso("2026-11-06T14:00:00Z"),
    external_reference: "chamado SAP 48213",
  }),
  caso({
    id: 9,
    code: "000000881290",
    short_description: "Junta homocinética",
    location: "1001",
    status: "todo",
    reason: "Histórico insuficiente: 37 dias de movimento. Complete o histórico para calcular.",
  }),
  caso({
    id: 10,
    code: "000000210045",
    short_description: "Graxa de lítio EP2 (1 kg)",
    location: "3001",
    status: "analysis",
    reason: "Análise iniciada pelo cliente na ficha do material.",
  }),
  caso({
    id: 11,
    code: "000000714402",
    short_description: "Corrente de transmissão 60-1",
    location: "2001",
    status: "todo",
    reason: R,
  }),
  caso({
    id: 12,
    code: "000000930117",
    short_description: "Lâmpada de farol LED 24 V",
    location: "2001",
    status: "testing",
    reason: R,
    proposta: proposta(["2", "3"], ["5", "6"], ["10", "12"]),
    stale: true,
    motivo_desatualizado: "O preço médio mudou depois da simulação. Recalcule antes de validar.",
  }),
  caso({
    id: 13,
    code: "000001025521",
    short_description: "Parafuso sextavado M12 × 40",
    location: "1001",
    status: "discarded",
    reason: "Descartado em 30/10/2026: o parâmetro atual já atende (justificativa registrada).",
  }),
];

export const SUGESTOES_PLANEJAMENTO: ItemParaIniciar[] = [
  {
    material_id: 601,
    code: "000000472210",
    short_description: "Bucha do braço oscilante",
    location: "2001",
    location_name: nomeDoLocal("2001"),
    stock_quantity: d("1"),
    reorder_point: d("4"),
  },
  {
    material_id: 602,
    code: "000001200083",
    short_description: "Sensor de rotação",
    location: "1001",
    location_name: nomeDoLocal("1001"),
    stock_quantity: d("0"),
    reorder_point: d("2"),
  },
  {
    material_id: 603,
    code: "000000643391",
    short_description: "Mola do assento do operador",
    location: "2001",
    location_name: nomeDoLocal("2001"),
    stock_quantity: d("2"),
    reorder_point: d("5"),
  },
  {
    material_id: 604,
    code: "000000159920",
    short_description: "Retentor 45 × 62 × 8",
    location: "1001",
    location_name: nomeDoLocal("1001"),
    stock_quantity: d("3"),
    reorder_point: d("8"),
  },
];

/** Posições abaixo do PP no catálogo (frase do estado vazio). */
export const POSICOES_ABAIXO_PP = 23;

export const MOTIVO_NOVO_CASO = R;
