import { request } from "@/api/cliente";
import type { GrupoPadrao, UnidadeMedida } from "@/api/tipos";

/**
 * GET /api/v1/unidades — unidades de medida do cadastro. ROTA A CRIAR no backend: hoje só o
 * mock responde (as 8 do design).
 */
export function listarUnidades(sinal?: AbortSignal): Promise<UnidadeMedida[]> {
  return request<UnidadeMedida[]>("/unidades", { sinal });
}

/**
 * GET /api/v1/grupos-padrao — grupos de mercadoria do padrão Agro MRO. ROTA A CRIAR no
 * backend: hoje só o mock responde (os 4 do design).
 */
export function listarGruposPadrao(sinal?: AbortSignal): Promise<GrupoPadrao[]> {
  return request<GrupoPadrao[]>("/grupos-padrao", { sinal });
}
