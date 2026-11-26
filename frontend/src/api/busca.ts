import { request } from "@/api/cliente";
import type { ResultadoBusca } from "@/api/tipos";

/**
 * GET /api/v1/busca?q= — posições para a busca global (rota nova, a criar no backend).
 * Pontuação e ordem vêm do backend. Com q vazio, vêm só os atalhos com contagem.
 */
export function buscarPosicoes(q: string, sinal?: AbortSignal): Promise<ResultadoBusca> {
  return request<ResultadoBusca>("/busca", { parametros: { q }, sinal });
}
