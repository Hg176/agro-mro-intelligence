import { baixarArquivo, request, type ArquivoBaixado } from "@/api/cliente";
import type { VisaoGeral } from "@/api/tipos";

/** GET /api/v1/visao-geral — painel da Visão geral (rota nova, a criar no backend). */
export function obterVisaoGeral(sinal?: AbortSignal): Promise<VisaoGeral> {
  return request<VisaoGeral>("/visao-geral", { sinal });
}

/**
 * GET /api/v1/visao-geral/excel — planilha pronta da Visão geral (rota nova, a criar no
 * backend; exige permissoes.exportar_excel). No mock, um CSV de exemplo.
 */
export function baixarExcelVisaoGeral(): Promise<ArquivoBaixado> {
  return baixarArquivo("/visao-geral/excel", { nomePadrao: "visao-geral.xlsx" });
}
