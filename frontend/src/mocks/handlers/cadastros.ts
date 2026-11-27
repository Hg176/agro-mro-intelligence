/**
 * Listas do cadastro de material. ROTAS A CRIAR no backend: GET /api/v1/unidades e
 * GET /api/v1/grupos-padrao. Só o mock responde hoje, com as listas do design
 * (Materiais.dc.html). Não entram no ?mock= (que só afeta a rota da tela).
 */
import { http, HttpResponse } from "msw";

import type { GrupoPadrao, UnidadeMedida } from "@/api/tipos";

import { latencia } from "../cenario";

/** Rota a criar: GET /api/v1/unidades. */
export const UNIDADES: UnidadeMedida[] = [
  { sigla: "UN", nome: "Unidade", categoria: "Contagem" },
  { sigla: "PR", nome: "Par", categoria: "Contagem" },
  { sigla: "JG", nome: "Jogo", categoria: "Conjunto" },
  { sigla: "M", nome: "Metro", categoria: "Comprimento" },
  { sigla: "KG", nome: "Quilograma", categoria: "Massa" },
  { sigla: "L", nome: "Litro", categoria: "Volume" },
  { sigla: "BD", nome: "Balde", categoria: "Embalagem" },
  { sigla: "CX", nome: "Caixa", categoria: "Embalagem" },
];

/** Rota a criar: GET /api/v1/grupos-padrao. */
export const GRUPOS_PADRAO: GrupoPadrao[] = [
  { nome: "Rolamentos" },
  { nome: "Filtros" },
  { nome: "Lubrificantes" },
  { nome: "Transmissão" },
];

export const handlersCadastros = [
  http.get("/api/v1/unidades", async () => {
    await latencia();
    return HttpResponse.json(UNIDADES);
  }),
  http.get("/api/v1/grupos-padrao", async () => {
    await latencia();
    return HttpResponse.json(GRUPOS_PADRAO);
  }),
];
