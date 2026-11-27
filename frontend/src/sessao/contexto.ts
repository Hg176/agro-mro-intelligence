import { createContext, useContext } from "react";

import type { Sessao } from "@/api/tipos";

/**
 * Sessão do usuário (resposta de GET /me) para toda a área /app.
 * Vive só na memória (TanStack Query + este contexto): nada vai para localStorage
 * nem sessionStorage.
 */
export const ContextoSessao = createContext<Sessao | null>(null);

/** { usuario, espaco, plano, permissoes } da sessão atual. Só dentro de /app. */
export function useSessao(): Sessao {
  const sessao = useContext(ContextoSessao);
  if (!sessao) {
    throw new Error("useSessao() fora da área protegida (/app). Envolva com <RotaProtegida>.");
  }
  return sessao;
}
