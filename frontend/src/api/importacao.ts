/**
 * Importar dados (F1-9). Todas as rotas são novas, a criar no backend (base no protótipo:
 * POST /api/v1/imports/file e /imports/table com confirm=false/true, e
 * GET /api/v1/lineage/receipts). O front envia o arquivo e mostra o que a API devolve:
 * não lê a planilha, não valida regra de negócio e não conta linhas.
 */
import { baixarArquivo, request, type ArquivoBaixado } from "@/api/cliente";
import type {
  ArquivoRecebido,
  ColunasDoArquivo,
  DatasetImportacao,
  ErpOrigem,
  ModoImportacao,
  PainelImportacao,
  PreviaImportacao,
  ProgressoCarga,
} from "@/api/tipos";

/** Upload pode demorar mais que uma leitura comum (até 15 MB). */
const TIMEOUT_UPLOAD_MS = 120_000;

/** GET /api/v1/importacao — conclusão, abas disponíveis e histórico de cargas. */
export function obterPainelImportacao(sinal?: AbortSignal): Promise<PainelImportacao> {
  return request<PainelImportacao>("/importacao", { sinal });
}

/**
 * POST /api/v1/importacao/arquivos (multipart) — envia a planilha. O backend lê e guarda o
 * arquivo; nada entra no estoque ainda.
 */
export function enviarPlanilha(
  arquivo: File,
  dataset: DatasetImportacao,
  erp: ErpOrigem,
): Promise<ArquivoRecebido> {
  const corpo = new FormData();
  corpo.set("arquivo", arquivo, arquivo.name);
  corpo.set("dataset", dataset);
  corpo.set("erp", erp);
  return request<ArquivoRecebido>("/importacao/arquivos", {
    metodo: "POST",
    corpo,
    timeoutMs: TIMEOUT_UPLOAD_MS,
  });
}

/** GET /api/v1/importacao/arquivos/{id}/colunas — campos e colunas reconhecidas (e lembradas). */
export function obterColunas(arquivoId: string, sinal?: AbortSignal): Promise<ColunasDoArquivo> {
  return request<ColunasDoArquivo>(
    `/importacao/arquivos/${encodeURIComponent(arquivoId)}/colunas`,
    {
      sinal,
    },
  );
}

export type Mapeamento = Record<string, string | null>;

/** POST /api/v1/importacao/arquivos/{id}/previa — valida com o mapeamento, sem gravar. */
export function gerarPrevia(
  arquivoId: string,
  mapeamento: Mapeamento,
  lembrar: boolean,
): Promise<PreviaImportacao> {
  return request<PreviaImportacao>(`/importacao/arquivos/${encodeURIComponent(arquivoId)}/previa`, {
    metodo: "POST",
    corpo: { mapeamento, lembrar },
  });
}

/**
 * PUT /api/v1/importacao/arquivos/{id}/correcoes — corrige um valor de uma linha com erro.
 * O backend valida de novo e devolve a prévia atualizada (nada gravado).
 */
export function corrigirLinha(
  arquivoId: string,
  correcao: { linha: number; campo: string; valor: string },
): Promise<PreviaImportacao> {
  return request<PreviaImportacao>(
    `/importacao/arquivos/${encodeURIComponent(arquivoId)}/correcoes`,
    { metodo: "PUT", corpo: correcao },
  );
}

/**
 * POST /api/v1/importacao/arquivos/{id}/confirmar — grava (tudo ou nada). Responde 202 com
 * o id da carga; o progresso vem de obterProgresso(). Escrita: nunca repete sozinha.
 */
export function confirmarImportacao(
  arquivoId: string,
  modo: ModoImportacao,
): Promise<{ carga_id: string }> {
  return request<{ carga_id: string }>(
    `/importacao/arquivos/${encodeURIComponent(arquivoId)}/confirmar`,
    { metodo: "POST", corpo: { modo } },
  );
}

/** GET /api/v1/importacao/cargas/{carga_id} — progresso real da gravação. */
export function obterProgresso(cargaId: string, sinal?: AbortSignal): Promise<ProgressoCarga> {
  return request<ProgressoCarga>(`/importacao/cargas/${encodeURIComponent(cargaId)}`, { sinal });
}

/** GET /api/v1/importacao/modelo?dataset= — planilha modelo pronta do backend. */
export function baixarPlanilhaModelo(dataset: DatasetImportacao): Promise<ArquivoBaixado> {
  return baixarArquivo("/importacao/modelo", {
    parametros: { dataset },
    nomePadrao: "modelo-dados-mestres.xlsx",
  });
}
