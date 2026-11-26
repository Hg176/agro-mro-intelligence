/**
 * GET /api/v1/busca?q= — no mock, filtra as 18 posições com a pontuação do
 * BuscaGlobal.dc.html. No real, pontuação e ordem virão do backend.
 */
import { http, HttpResponse } from "msw";

import type { PosicaoBusca, ResultadoBusca } from "@/api/tipos";

import { latencia } from "../cenario";
import { POSICOES } from "../dados/posicoes";

const semAcento = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Código exibido em blocos de 4 (como o design pontua "code" com espaços). */
const emBlocos = (code: string) => code.replace(/(\d{4})(?=\d)/g, "$1 ");

export function pontuar(q: string): { posicao: PosicaoBusca; pontos: number }[] {
  const termo = q.trim();
  if (!termo) return [];
  const nq = semAcento(termo);
  const digitos = termo.replace(/\D/g, "");
  const soNumero = digitos.length >= 2 && /^[\d\s.-]+$/.test(termo);

  const achados: { posicao: PosicaoBusca; pontos: number }[] = [];
  for (const p of POSICOES) {
    const nd = semAcento(p.short_description);
    const indiceCodigo = p.code.indexOf(digitos);
    let pontos = 0;
    if (soNumero && indiceCodigo >= 0) pontos = indiceCodigo === 0 ? 100 : 80;
    else if (nd.startsWith(nq)) pontos = 70;
    else if (` ${nd}`.includes(` ${nq}`)) pontos = 60;
    else if (nd.includes(nq)) pontos = 40;
    else if (semAcento(emBlocos(p.code)).includes(nq)) pontos = 30;
    else if (semAcento(p.location_name).includes(nq)) pontos = 20;
    if (pontos > 0) {
      achados.push({
        pontos,
        posicao: {
          material_id: p.material_id,
          code: p.code,
          short_description: p.short_description,
          location_name: p.location_name,
          situacao: p.situacao,
          classe: p.abc ?? "NC",
        },
      });
    }
  }
  // Ordenação estável: empate mantém a ordem da base, como no design.
  return achados.sort((a, b) => b.pontos - a.pontos);
}

export const handlersBusca = [
  http.get("/api/v1/busca", async ({ request }) => {
    await latencia();
    const q = new URL(request.url).searchParams.get("q") ?? "";
    if (!q.trim()) {
      return HttpResponse.json<ResultadoBusca>({
        posicoes: [],
        total: 0,
        atalhos: [
          { filtro: "abaixo_pp", posicoes: 23 },
          { filtro: "saldo_negativo", posicoes: 8 },
          { filtro: "parados", posicoes: 214 },
        ],
      });
    }
    const achados = pontuar(q);
    return HttpResponse.json<ResultadoBusca>({
      posicoes: achados.slice(0, 6).map((a) => a.posicao),
      total: achados.length,
      atalhos: null,
    });
  }),
];
