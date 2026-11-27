import { http, HttpResponse } from "msw";

import type { VisaoGeral } from "@/api/tipos";

import { aplicarEstadoTela, estadoTela } from "../cenario";
import { VISAO_GERAL, VISAO_GERAL_VAZIA } from "../dados/visaoGeral";

export const handlersVisaoGeral = [
  http.get("/api/v1/visao-geral", async () => {
    const parada = await aplicarEstadoTela();
    if (parada) return parada;
    if (estadoTela() === "vazio") return HttpResponse.json<VisaoGeral>(VISAO_GERAL_VAZIA);
    return HttpResponse.json<VisaoGeral>(VISAO_GERAL);
  }),
  /** Excel da Visão geral. No mock, um CSV de exemplo; o arquivo real virá do backend. */
  http.get("/api/v1/visao-geral/excel", async () => {
    const parada = await aplicarEstadoTela();
    if (parada) return parada;
    const linhas = [
      "codigo;local;descricao;situacao",
      ...VISAO_GERAL.prioridades.itens.map(
        (p) => `${p.code};${p.location};${p.short_description};${p.situacao}`,
      ),
    ];
    return new HttpResponse(`${linhas.join("\r\n")}\r\n`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="visao-geral-exemplo.csv"',
      },
    });
  }),
];
