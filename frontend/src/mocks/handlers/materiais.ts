/**
 * GET /api/v1/materiais e POST /api/v1/materials. No F1-3 o catálogo é das 18 posições;
 * o F1-8 completa a tela (paginação de 100 com o volume do design).
 */
import { http, HttpResponse } from "msw";

import type {
  FiltroMateriais,
  Material,
  NovoMaterial,
  PaginaMateriais,
  Posicao,
} from "@/api/tipos";

import { aplicarEstadoTela, estadoPlano, estadoTela, latencia } from "../cenario";
import { POSICOES } from "../dados/posicoes";

const LIMITE = 100;

const normalizar = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/\s+/g, "");

const FILTROS: Record<FiltroMateriais, (p: Posicao) => boolean> = {
  abaixo_pp: (p) => p.situacao === "abaixo_pp" || p.situacao === "ruptura",
  saldo_negativo: (p) => p.stock_quantity !== null && p.stock_quantity.startsWith("-"),
  parados: (p) => p.situacao === "parado",
  classe_a: (p) => p.abc === "A",
  sem_calculo: (p) => p.situacao === "sem_calculo",
};

const ehFiltro = (v: string | null): v is FiltroMateriais => v !== null && v in FILTROS;

export const handlersMateriais = [
  http.get("/api/v1/materiais", async ({ request }) => {
    const parada = await aplicarEstadoTela();
    if (parada) return parada;

    const url = new URL(request.url);
    const q = normalizar(url.searchParams.get("q") ?? "");
    const filtroBruto = url.searchParams.get("filtro");
    const filtro = ehFiltro(filtroBruto) ? filtroBruto : null;
    const pagina = Math.max(1, Math.trunc(Number(url.searchParams.get("pagina") ?? "1")) || 1);

    if (estadoTela() === "vazio") {
      return HttpResponse.json<PaginaMateriais>({
        conclusao: { tipo: "catalogo_vazio", valores: {} },
        filtros: Object.keys(FILTROS).map((id) => ({ id: id as FiltroMateriais, contagem: null })),
        itens: [],
        total: 0,
        pagina: 1,
        limite: LIMITE,
        metricas: { estado: "disponivel", motivo: null },
      });
    }

    const lista = POSICOES.filter(
      (p) =>
        (!filtro || FILTROS[filtro](p)) &&
        (!q || normalizar(p.code + p.location_name + p.short_description).includes(q)),
    );
    return HttpResponse.json<PaginaMateriais>({
      conclusao: {
        tipo: "catalogo_com_posicoes",
        valores: { posicoes: 812, locais: 3, pedem_reposicao: 23, sem_giro_180_dias: 214 },
      },
      filtros: [
        { id: "abaixo_pp", contagem: 23 },
        { id: "saldo_negativo", contagem: 8 },
        { id: "parados", contagem: 214 },
        { id: "classe_a", contagem: 98 },
        { id: "sem_calculo", contagem: 37 },
      ],
      itens: lista.slice((pagina - 1) * LIMITE, pagina * LIMITE),
      total: lista.length,
      pagina,
      limite: LIMITE,
      metricas: { estado: "disponivel", motivo: null },
    });
  }),

  http.post("/api/v1/materials", async ({ request }) => {
    await latencia();
    if (estadoPlano() === "somente_leitura") {
      return HttpResponse.json({ detail: "Seu plano está em somente leitura." }, { status: 403 });
    }
    const corpo = (await request.json()) as NovoMaterial;
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
