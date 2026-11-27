/**
 * Planejamento (rotas novas, a criar no backend). O mock faz o papel do backend: filtra a
 * fila, conta, decide a situação da frase (conclusao.tipo), quem é exportável e muda os
 * estados nas ações. A cópia mutável vive em memória; reiniciarPlanejamento() volta ao
 * design (os testes chamam antes de cada caso).
 *
 * - ?mock=carregando | erro | vazio → GET /api/v1/planejamento (vazio = nenhum caso).
 * - ?plano=somente_leitura → escritas respondem 403; ?plano=demonstracao → Excel 403.
 */
import { http, HttpResponse } from "msw";

import type {
  CasoPlanejamento,
  ConclusaoPlanejamento,
  EstadoCaso,
  FiltroPlanejamento,
  ItemParaIniciar,
  Planejamento,
} from "@/api/tipos";

import { aplicarEstadoTela, estadoPlano, estadoTela, latencia } from "../cenario";
import {
  CASOS_PLANEJAMENTO,
  MOTIVO_NOVO_CASO,
  POSICOES_ABAIXO_PP,
  SUGESTOES_PLANEJAMENTO,
} from "../dados/planejamento";
import { d, iso } from "../dados/util";

let casos: CasoPlanejamento[] = [];
let sugestoes: ItemParaIniciar[] = [];
let lotes = 0;

export function reiniciarPlanejamento() {
  casos = CASOS_PLANEJAMENTO.map((c) => ({ ...c }));
  sugestoes = SUGESTOES_PLANEJAMENTO.map((s) => ({ ...s }));
  lotes = 0;
}
reiniciarPlanejamento();

const FILTROS: FiltroPlanejamento[] = [
  "active",
  "todo",
  "testing",
  "ready",
  "validated",
  "exported",
  "all",
];

const noFiltro = (f: FiltroPlanejamento) => (c: CasoPlanejamento) =>
  f === "all" ? true : f === "active" ? c.status !== "discarded" : c.status === f;

const exportavel = (c: CasoPlanejamento) => c.status === "validated" && !c.stale;
const VALIDADOS: EstadoCaso[] = ["validated", "exported", "applied"];

/** % inteiro, como o backend arredondaria. */
const pct = (parte: number, todo: number) =>
  todo === 0 ? null : d(String(Math.round((100 * parte) / todo)));

function conclusao(lista: CasoPlanejamento[]): ConclusaoPlanejamento {
  if (lista.length === 0) {
    return { tipo: "nenhum_caso", valores: { posicoes_abaixo_pp: POSICOES_ABAIXO_PP } };
  }
  const prontos = lista.filter(exportavel).length;
  if (prontos > 0) {
    return {
      tipo: "prontos_para_exportar",
      valores: {
        casos_exportaveis: prontos,
        casos_com_dados_novos: lista.filter((c) => c.stale).length,
      },
    };
  }
  return {
    tipo: "aguardando_validacao",
    valores: { casos_a_validar: lista.filter((c) => c.status === "ready").length },
  };
}

function resposta(filtro: FiltroPlanejamento): Planejamento {
  const lista = estadoTela() === "vazio" ? [] : casos;
  const validados = lista.filter((c) => VALIDADOS.includes(c.status)).length;
  const aplicados = lista.filter((c) => c.status === "applied").length;
  return {
    conclusao: conclusao(lista),
    filtro,
    resumo: {
      iniciados: lista.length,
      validados,
      aplicados,
      dados_para_rever: lista.filter((c) => c.stale).length,
      percentual_analise: pct(validados, lista.length),
      percentual_aplicacao: pct(aplicados, validados),
    },
    filtros: FILTROS.map((id) => ({ id, contagem: lista.filter(noFiltro(id)).length })),
    casos: lista
      .filter(noFiltro(filtro))
      .map((c) => ({ ...c, entra_no_proximo_excel: exportavel(c) })),
    exportaveis: lista.filter(exportavel).length,
    sugestoes,
  };
}

const somenteLeitura = () =>
  estadoPlano() === "somente_leitura"
    ? HttpResponse.json({ detail: "Seu espaço está em somente leitura." }, { status: 403 })
    : null;

export const handlersPlanejamento = [
  http.get("/api/v1/planejamento", async ({ request }) => {
    const parada = await aplicarEstadoTela();
    if (parada) return parada;
    const pedido = new URL(request.url).searchParams.get("filtro");
    const filtro = FILTROS.find((f) => f === pedido) ?? "active";
    return HttpResponse.json(resposta(filtro));
  }),

  http.post("/api/v1/planejamento/casos", async ({ request }) => {
    await latencia();
    const proibido = somenteLeitura();
    if (proibido) return proibido;
    const { material_id } = (await request.json()) as { material_id: number };
    const sugestao = sugestoes.find((s) => s.material_id === material_id);
    if (!sugestao) {
      return HttpResponse.json({ detail: "Esta posição já tem um caso." }, { status: 409 });
    }
    const novo: CasoPlanejamento = {
      id: 1000 + material_id,
      material_id,
      code: sugestao.code,
      location: sugestao.location,
      location_name: sugestao.location_name,
      short_description: sugestao.short_description,
      status: "todo",
      reason: MOTIVO_NOVO_CASO,
      stale: false,
      motivo_desatualizado: null,
      proposta: null,
      validated_at: null,
      exported_at: null,
      export_batch_id: null,
      applied_at: null,
      external_reference: null,
      entra_no_proximo_excel: false,
    };
    casos = [novo, ...casos];
    sugestoes = sugestoes.filter((s) => s.material_id !== material_id);
    return HttpResponse.json(novo, { status: 201 });
  }),

  http.post("/api/v1/planejamento/casos/:id/aplicacao", async ({ params, request }) => {
    await latencia();
    const proibido = somenteLeitura();
    if (proibido) return proibido;
    const alvo = casos.find((c) => c.id === Number(params.id));
    if (!alvo) return HttpResponse.json({ detail: "Caso não encontrado." }, { status: 404 });
    if (alvo.status !== "exported") {
      return HttpResponse.json(
        { detail: "Só casos exportados podem ter a aplicação confirmada." },
        { status: 409 },
      );
    }
    const { referencia_externa } = (await request.json()) as { referencia_externa: string | null };
    alvo.status = "applied";
    alvo.applied_at = iso(new Date().toISOString());
    alvo.external_reference = referencia_externa?.trim() || null;
    return HttpResponse.json(alvo);
  }),

  http.post("/api/v1/planejamento/excel-de-mudancas", async () => {
    await latencia();
    if (estadoPlano() !== "ativo") {
      return HttpResponse.json(
        { detail: "Seu plano não permite baixar o Excel." },
        { status: 403 },
      );
    }
    const prontos = casos.filter(exportavel);
    if (prontos.length === 0) {
      return HttpResponse.json(
        { detail: "Nenhum caso validado e atual para exportar." },
        { status: 409 },
      );
    }
    lotes += 1;
    const agora = new Date().toISOString();
    const lote = `${agora.slice(0, 10)}-${String(lotes).padStart(2, "0")}`;
    for (const c of prontos) {
      c.status = "exported";
      c.export_batch_id = lote;
      c.exported_at = iso(agora);
    }
    const linhas = [
      "codigo;local;descricao;es_antes;es_depois;pp_antes;pp_depois;em_antes;em_depois",
      ...prontos.map((c) =>
        [
          c.code,
          c.location,
          c.short_description,
          c.proposta?.safety_stock.antes ?? "",
          c.proposta?.safety_stock.depois ?? "",
          c.proposta?.reorder_point.antes ?? "",
          c.proposta?.reorder_point.depois ?? "",
          c.proposta?.maximum_stock.antes ?? "",
          c.proposta?.maximum_stock.depois ?? "",
        ].join(";"),
      ),
    ];
    return new HttpResponse(`${linhas.join("\r\n")}\r\n`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="excel-de-mudancas-${lote}.csv"`,
      },
    });
  }),
];
