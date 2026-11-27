import { http, HttpResponse } from "msw";

import { handlersBusca } from "./busca";
import { handlersCadastros } from "./cadastros";
import { handlersImportacao } from "./importacao";
import { handlersMateriais } from "./materiais";
import { handlersSessao } from "./sessao";
import { handlersVisaoGeral } from "./visaoGeral";

/** Rota /api/v1 sem mock ainda: responde 501 em vez de ir para a rede. */
const semMock = http.all("/api/v1/*", ({ request }) =>
  HttpResponse.json(
    { detail: `Rota ainda sem mock: ${request.method} ${new URL(request.url).pathname}` },
    { status: 501 },
  ),
);

export const handlers = [
  ...handlersSessao,
  ...handlersBusca,
  ...handlersVisaoGeral,
  ...handlersMateriais,
  ...handlersCadastros,
  ...handlersImportacao,
  semMock,
];
