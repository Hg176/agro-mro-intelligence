/**
 * Nível de serviço (F1-12). Rotas novas, a criar no backend (base no protótipo
 * GET /api/v1/service-level-rules + /state). A meta vai em % como foi digitada ("97.5"); a
 * regra (0 ou de 50 a menos de 100) e o fator z (Inversa Normal) são do backend.
 */
import { request } from "@/api/cliente";
import type { Decimal, ImpactoMeta, MatrizNivelServico, PreviaAdocaoV3 } from "@/api/tipos";

/** GET /api/v1/nivel-servico — os 75 casos, a origem da matriz e a frase. */
export function obterNivelServico(sinal?: AbortSignal): Promise<MatrizNivelServico> {
  return request<MatrizNivelServico>("/nivel-servico", { sinal });
}

/** GET /api/v1/nivel-servico/impacto?caso=&meta= — o que muda no ES com a meta digitada. */
export function obterImpacto(
  caso: string,
  meta: Decimal,
  sinal?: AbortSignal,
): Promise<ImpactoMeta> {
  return request<ImpactoMeta>("/nivel-servico/impacto", { parametros: { caso, meta }, sinal });
}

/** PUT /api/v1/nivel-servico/casos/{caso} — salva a meta (o 1º caso inicia a matriz própria). */
export function salvarMeta(
  caso: string,
  meta: Decimal,
  versao: number,
): Promise<MatrizNivelServico> {
  return request<MatrizNivelServico>(`/nivel-servico/casos/${encodeURIComponent(caso)}`, {
    metodo: "PUT",
    corpo: { meta_percentual: meta, versao },
  });
}

/** DELETE /api/v1/nivel-servico/casos/{caso} — remove a configuração (o caso fica NC). */
export function removerMeta(caso: string, versao: number): Promise<MatrizNivelServico> {
  return request<MatrizNivelServico>(`/nivel-servico/casos/${encodeURIComponent(caso)}`, {
    metodo: "DELETE",
    parametros: { versao },
  });
}

/** GET /api/v1/nivel-servico/adocao-v3 — o que a adoção da V3 vai mudar. */
export function obterPreviaAdocao(sinal?: AbortSignal): Promise<PreviaAdocaoV3> {
  return request<PreviaAdocaoV3>("/nivel-servico/adocao-v3", { sinal });
}

/** POST /api/v1/nivel-servico/adocao-v3 — adota os 75 valores V3. */
export function adotarV3(versao: number): Promise<MatrizNivelServico> {
  return request<MatrizNivelServico>("/nivel-servico/adocao-v3", {
    metodo: "POST",
    corpo: { versao },
  });
}
