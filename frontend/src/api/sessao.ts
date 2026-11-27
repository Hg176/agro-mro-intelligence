import { request } from "@/api/cliente";
import type { Sessao } from "@/api/tipos";

/** GET /api/v1/me — usuário, espaço, plano e permissões (calculadas pelo backend). */
export function obterSessao(sinal?: AbortSignal): Promise<Sessao> {
  return request<Sessao>("/me", { sinal });
}

/** DELETE /api/v1/sessao — sair (apaga o cookie no servidor). Rota nova, a criar no backend. */
export function encerrarSessao(): Promise<void> {
  return request<void>("/sessao", { metodo: "DELETE", ignorar401: true });
}
