/**
 * Troca do mock pela API real, rota a rota.
 * VITE_API_REAL="/me,/busca" faz essas rotas (e as filhas, ex.: /busca/x) passarem direto
 * pelo mock e irem para o backend pelo proxy do Vite (VITE_API_ALVO, padrão
 * http://127.0.0.1:8000). As demais continuam no mock.
 */
import { http, passthrough } from "msw";

const PREFIXO = "/api/v1";

export function lerRotasReais(valor: string | undefined): string[] {
  return (valor ?? "")
    .split(",")
    .map((r) => r.trim())
    .filter((r) => r.startsWith("/"))
    .map((r) => r.replace(/\/+$/, ""));
}

/** caminho = parte depois de /api/v1 (ex.: "/me", "/materiais"). */
export function ehRotaReal(caminho: string, reais: readonly string[]): boolean {
  return reais.some((r) => caminho === r || caminho.startsWith(`${r}/`));
}

/** Handler que vem ANTES dos mocks: deixa passar as rotas reais, ignora as outras. */
export function handlerRotasReais(reais: readonly string[]) {
  return http.all(`${PREFIXO}/*`, ({ request }) => {
    const caminho = new URL(request.url).pathname.slice(PREFIXO.length);
    if (ehRotaReal(caminho, reais)) return passthrough();
    return undefined;
  });
}
