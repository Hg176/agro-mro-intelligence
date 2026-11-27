import { request } from "@/api/cliente";
import type { VisaoGeral } from "@/api/tipos";

/** GET /api/v1/visao-geral — painel da Visão geral (rota nova, a criar no backend). */
export function obterVisaoGeral(sinal?: AbortSignal): Promise<VisaoGeral> {
  return request<VisaoGeral>("/visao-geral", { sinal });
}
