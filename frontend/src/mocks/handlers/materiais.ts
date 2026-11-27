/**
 * GET /api/v1/materiais, GET /api/v1/materiais/excel e POST /api/v1/materials.
 *
 * O catálogo ilustrativo tem 812 posições, mas o mock só conhece as 18 do design. Por isso
 * os TOTAIS são os do design (812, 9 páginas, 23 no filtro "Abaixo do PP"...) e os ITENS são
 * as posições de exemplo que batem com a busca e os filtros. É o mock que decide isso, como
 * o backend decidiria; a tela só mostra.
 *
 * ?mock=erro aqui é o estado "erro de métricas" do design: o catálogo responde (200) com
 * metricas indisponível e sem saldo, PP nem classe nos itens (a frase e as contagens
 * continuam, como no design). ?mock=vazio é o catálogo vazio.
 */
import { http, HttpResponse } from "msw";

import type {
  ClasseAbc,
  ClassePqr,
  CodigoSinal,
  FiltroMateriais,
  Material,
  NovoMaterial,
  PaginaMateriais,
  Posicao,
} from "@/api/tipos";

import { aplicarEstadoTela, estadoPlano, estadoTela, latencia } from "../cenario";
import { POSICOES } from "../dados/posicoes";
import { VISAO_GERAL } from "../dados/visaoGeral";

const LIMITE = 100;
const TOTAL_CATALOGO = 812;
const PAGINAS_CATALOGO = 9;

const normalizar = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/\s+/g, "");

const FILTROS: Record<FiltroMateriais, (p: Posicao) => boolean> = {
  abaixo_pp: (p) => p.situacao === "abaixo_pp" || p.situacao === "ruptura",
  saldo_negativo: (p) => p.stock_quantity !== null && p.stock_quantity.startsWith("-"),
  parados: (p) => p.situacao === "parado",
  classe_a: (p) => p.abc === "A",
  sem_calculo: (p) => p.situacao === "sem_calculo",
};

const CONTAGEM_FILTRO: Record<FiltroMateriais, number> = {
  abaixo_pp: 23,
  saldo_negativo: 8,
  parados: 214,
  classe_a: 98,
  sem_calculo: 37,
};

/** Sinais sem filtro pronto: o mock aproxima com as posições de exemplo. */
const SINAIS: Record<CodigoSinal, (p: Posicao) => boolean> = {
  saldo_negativo: FILTROS.saldo_negativo,
  reposicao_indicada: FILTROS.abaixo_pp,
  acima_maximo: (p) => p.situacao === "parado",
  sem_giro: FILTROS.parados,
  historico_insuficiente: FILTROS.sem_calculo,
  preco_ausente: () => false,
  parametro_cliente: () => false,
};

const umDe = <T extends string>(valor: string | null, opcoes: readonly T[]): T | null =>
  valor !== null && (opcoes as readonly string[]).includes(valor) ? (valor as T) : null;

type Consulta = {
  q: string;
  filtro: FiltroMateriais | null;
  abc: ClasseAbc | null;
  pqr: ClassePqr | null;
  sinal: CodigoSinal | null;
};

function lerConsulta(url: URL): Consulta {
  const p = url.searchParams;
  return {
    q: normalizar(p.get("q") ?? ""),
    filtro: umDe(p.get("filtro"), Object.keys(FILTROS) as FiltroMateriais[]),
    abc: umDe(p.get("abc"), ["A", "B", "C", "D", "N"] as const),
    pqr: umDe(p.get("pqr"), ["P", "Q", "R", "S", "N"] as const),
    sinal: umDe(p.get("sinal"), Object.keys(SINAIS) as CodigoSinal[]),
  };
}

function filtrar(c: Consulta): Posicao[] {
  return POSICOES.filter(
    (p) =>
      (!c.filtro || FILTROS[c.filtro](p)) &&
      (!c.abc || p.abc === c.abc) &&
      (!c.sinal || SINAIS[c.sinal](p)) &&
      (!c.q || normalizar(p.code + p.location_name + p.short_description).includes(c.q)),
  );
}

/** Total "do backend" para a consulta: os números do design quando há um, senão a lista. */
function totalDaConsulta(c: Consulta, achadas: number): number {
  if (c.q) return achadas;
  if (c.abc && c.pqr) {
    const celula = VISAO_GERAL.matriz_abc_pqr.celulas.find(
      (x) => x.coluna === c.abc && x.linha === c.pqr,
    );
    return celula?.posicoes ?? achadas;
  }
  if (c.sinal) {
    return VISAO_GERAL.sinais.find((s) => s.codigo === c.sinal)?.posicoes ?? achadas;
  }
  if (c.filtro && !c.abc) return CONTAGEM_FILTRO[c.filtro];
  if (!c.filtro && !c.abc && !c.pqr) return TOTAL_CATALOGO;
  return achadas;
}

/** Métricas fora do ar: o cadastro continua, saldo/PP/classe/situação não vêm. */
const semMetricas = (p: Posicao): Posicao => ({
  ...p,
  stock_quantity: null,
  reorder_point: null,
  fracao_barra_saldo_pp: null,
  situacao: "sem_calculo",
  motivo_situacao: "Métricas indisponíveis",
  abc: null,
  abc_estoque: null,
});

export const handlersMateriais = [
  http.get("/api/v1/materiais", async ({ request }) => {
    const estado = estadoTela();
    if (estado !== "erro") {
      const parada = await aplicarEstadoTela();
      if (parada) return parada;
    } else {
      await latencia();
    }

    const url = new URL(request.url);
    const pagina = Math.max(1, Math.trunc(Number(url.searchParams.get("pagina") ?? "1")) || 1);

    if (estado === "vazio") {
      return HttpResponse.json<PaginaMateriais>({
        conclusao: { tipo: "catalogo_vazio", valores: {} },
        filtros: (Object.keys(FILTROS) as FiltroMateriais[]).map((id) => ({ id, contagem: null })),
        itens: [],
        total: 0,
        total_catalogo: 0,
        pagina: 1,
        paginas: 0,
        limite: LIMITE,
        metricas: { estado: "disponivel", motivo: null },
      });
    }

    const consulta = lerConsulta(url);
    const lista = filtrar(consulta);
    const total = totalDaConsulta(consulta, lista.length);
    const paginas = total === TOTAL_CATALOGO ? PAGINAS_CATALOGO : Math.ceil(total / LIMITE);
    const metricasFora = estado === "erro";

    return HttpResponse.json<PaginaMateriais>({
      conclusao: {
        tipo: "catalogo_com_posicoes",
        valores: {
          posicoes: TOTAL_CATALOGO,
          locais: 3,
          pedem_reposicao: 23,
          sem_giro_180_dias: 214,
        },
      },
      filtros: (Object.keys(FILTROS) as FiltroMateriais[]).map((id) => ({
        id,
        contagem: CONTAGEM_FILTRO[id],
      })),
      // Fora da página 1 o mock repete as posições de exemplo (não há 812 de verdade).
      itens: (pagina <= paginas ? lista : []).map((p) => (metricasFora ? semMetricas(p) : p)),
      total,
      total_catalogo: TOTAL_CATALOGO,
      pagina,
      paginas,
      limite: LIMITE,
      metricas: metricasFora
        ? { estado: "indisponivel", motivo: "Métricas aprovadas indisponíveis agora." }
        : { estado: "disponivel", motivo: null },
    });
  }),

  /** Excel do conjunto filtrado. No mock, um CSV de exemplo; o arquivo real virá do backend. */
  http.get("/api/v1/materiais/excel", async ({ request }) => {
    await latencia();
    if (estadoPlano() !== "ativo") {
      return HttpResponse.json(
        { detail: "Seu plano não permite baixar o Excel." },
        { status: 403 },
      );
    }
    const lista = filtrar(lerConsulta(new URL(request.url)));
    const linhas = [
      "codigo;local;descricao;unidade;saldo;ponto_de_pedido;situacao",
      ...lista.map((p) =>
        [
          p.code,
          p.location,
          p.short_description,
          p.unit,
          p.stock_quantity ?? "",
          p.reorder_point ?? "",
          p.situacao,
        ].join(";"),
      ),
    ];
    return new HttpResponse(`${linhas.join("\r\n")}\r\n`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="materiais-exemplo.csv"',
      },
    });
  }),

  http.post("/api/v1/materials", async ({ request }) => {
    await latencia();
    if (estadoPlano() === "somente_leitura") {
      return HttpResponse.json({ detail: "Seu espaço está em somente leitura." }, { status: 403 });
    }
    const corpo = (await request.json()) as NovoMaterial;
    if (POSICOES.some((p) => p.code === corpo.code && p.location === corpo.location)) {
      return HttpResponse.json(
        { detail: "Já existe um material com este código neste local." },
        { status: 409 },
      );
    }
    return HttpResponse.json<Material>(
      {
        ...corpo,
        id: 1000 + POSICOES.length,
        obsolete: false,
        confirmed: false,
        is_demo: false,
        image_ids: [],
      },
      { status: 201 },
    );
  }),
];
