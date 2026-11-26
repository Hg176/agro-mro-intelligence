import { QueryClient } from "@tanstack/react-query";

import { ApiErro } from "@/api/cliente";

/**
 * Leituras: uma nova tentativa só para falha de rede ou tempo esgotado (nunca para 4xx/5xx).
 * Escritas (mutations): nunca repetem sozinhas. Escrita incerta exige consultar o estado
 * antes de qualquer nova ação (D12).
 */
export function deveTentarDeNovo(tentativas: number, erro: unknown): boolean {
  if (!(erro instanceof ApiErro)) return false;
  return tentativas < 1 && (erro.codigo === "rede" || erro.codigo === "tempo_esgotado");
}

export function criarClienteConsultas(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: deveTentarDeNovo,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
