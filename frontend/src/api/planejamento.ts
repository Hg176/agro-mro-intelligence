/**
 * Planejamento, "Meu plano de estoque" (F1-10). Rotas novas, a criar no backend (base no
 * protótipo GET /api/v1/planning e planning_case_payload). Simular não aplica, validar não
 * aplica e exportar não confirma aplicação: só "Confirmar aplicação" registra que o cliente
 * aplicou no ERP, e isso é uma declaração dele (o sistema não mexe no ERP).
 */
import { baixarArquivo, request, type ArquivoBaixado } from "@/api/cliente";
import type { CasoPlanejamento, FiltroPlanejamento, Planejamento } from "@/api/tipos";

/** GET /api/v1/planejamento?filtro= — resumo, fila filtrada pela API, contagens e sugestões. */
export function obterPlanejamento(
  filtro: FiltroPlanejamento,
  sinal?: AbortSignal,
): Promise<Planejamento> {
  return request<Planejamento>("/planejamento", { parametros: { filtro }, sinal });
}

/** POST /api/v1/planejamento/casos — "Iniciar análise" de uma posição sugerida. */
export function iniciarAnalise(materialId: number): Promise<CasoPlanejamento> {
  return request<CasoPlanejamento>("/planejamento/casos", {
    metodo: "POST",
    corpo: { material_id: materialId },
  });
}

/**
 * POST /api/v1/planejamento/casos/{id}/aplicacao — o cliente declara que aplicou no ERP.
 * Escrita: nunca repete sozinha.
 */
export function confirmarAplicacao(
  casoId: number,
  referenciaExterna: string | null,
): Promise<CasoPlanejamento> {
  return request<CasoPlanejamento>(`/planejamento/casos/${casoId}/aplicacao`, {
    metodo: "POST",
    corpo: { referencia_externa: referenciaExterna },
  });
}

/**
 * POST /api/v1/planejamento/excel-de-mudancas — emite o lote dos casos exportáveis e devolve
 * o arquivo pronto. Não confirma aplicação. Escrita: nunca repete sozinha.
 */
export function baixarExcelDeMudancas(): Promise<ArquivoBaixado> {
  return baixarArquivo("/planejamento/excel-de-mudancas", {
    metodo: "POST",
    nomePadrao: "excel-de-mudancas.xlsx",
  });
}
