import { http, HttpResponse } from "msw";

import type { Sessao } from "@/api/tipos";

import { estadoPlano, latencia, sessaoExpirada } from "../cenario";
import { sessaoPorEstado } from "../dados/sessao";

export const handlersSessao = [
  http.get("/api/v1/me", async () => {
    await latencia();
    if (sessaoExpirada()) {
      return HttpResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }
    return HttpResponse.json<Sessao>(sessaoPorEstado(estadoPlano()));
  }),

  http.delete("/api/v1/sessao", async () => {
    await latencia();
    return new HttpResponse(null, { status: 204 });
  }),
];
