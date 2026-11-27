/**
 * Troca do mock pela API real, rota a rota.
 * VITE_API_REAL="/me,/busca" faz essas rotas (e as filhas, ex.: /busca/x) passarem direto
 * pelo mock e irem para o backend pelo proxy do Vite (VITE_API_ALVO, padrão
 * http://127.0.0.1:8000). As demais continuam no mock.
 */
import { http, passthrough } from "msw";

import { ehRotaReal, PREFIXO_API } from "./guardaDoDev";

export { ehRotaReal, lerRotasReais } from "./guardaDoDev";

/** Handler que vem ANTES dos mocks: deixa passar as rotas reais, ignora as outras. */
export function handlerRotasReais(reais: readonly string[]) {
  return http.all(`${PREFIXO_API}/*`, ({ request }) => {
    const caminho = new URL(request.url).pathname.slice(PREFIXO_API.length);
    if (ehRotaReal(caminho, reais)) return passthrough();
    return undefined;
  });
}
