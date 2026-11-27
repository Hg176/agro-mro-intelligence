import { http, HttpResponse } from "msw";

import type { VisaoGeral } from "@/api/tipos";

import { aplicarEstadoTela, estadoTela } from "../cenario";
import { VISAO_GERAL } from "../dados/visaoGeral";

export const handlersVisaoGeral = [
  http.get("/api/v1/visao-geral", async () => {
    const parada = await aplicarEstadoTela();
    if (parada) return parada;
    if (estadoTela() === "vazio") {
      return HttpResponse.json<VisaoGeral>({
        ...VISAO_GERAL,
        contexto: { ...VISAO_GERAL.contexto, posicoes: 0, locais: 0, periodo: null },
        prioridades: { total_fila: 0, itens: [] },
      });
    }
    return HttpResponse.json<VisaoGeral>(VISAO_GERAL);
  }),
];
