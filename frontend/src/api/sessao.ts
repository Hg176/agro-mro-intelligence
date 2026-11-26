import { request } from "@/api/cliente";
import type { Sessao } from "@/api/tipos";

/** GET /api/v1/me — usuário, espaço, plano e permissões (calculadas pelo backend). */
export function obterSessao(sinal?: AbortSignal): Promise<Sessao> {
  return request<Sessao>("/me", { sinal });
}
