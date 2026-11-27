/**
 * Regras e letras (F1-11). Rotas novas, a criar no backend (base no protótipo
 * GET/PUT /api/v1/classification-settings). O front não recalcula nada: manda o corte novo
 * e mostra a resposta. Salvar recalcula o estoque todo; escrita nunca repete sozinha.
 */
import { request } from "@/api/cliente";
import type { CortesDoEspaco, RegrasLetras } from "@/api/tipos";

/** GET /api/v1/regras — cortes, padrão, exemplos, contagens e barra de cada aba. */
export function obterRegras(sinal?: AbortSignal): Promise<RegrasLetras> {
  return request<RegrasLetras>("/regras", { sinal });
}

/** PUT /api/v1/regras/cortes — salva os cortes do espaço (versão esperada evita sobrescrever). */
export function salvarCortes(cortes: CortesDoEspaco, versao: number): Promise<RegrasLetras> {
  return request<RegrasLetras>("/regras/cortes", { metodo: "PUT", corpo: { cortes, versao } });
}

/** POST /api/v1/regras/cortes/restaurar — volta todos os cortes ao padrão Agro MRO. */
export function restaurarCortes(versao: number): Promise<RegrasLetras> {
  return request<RegrasLetras>("/regras/cortes/restaurar", { metodo: "POST", corpo: { versao } });
}
