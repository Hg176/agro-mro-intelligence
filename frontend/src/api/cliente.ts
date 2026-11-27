/**
 * Cliente HTTP da API (/api/v1).
 *
 * - credentials: "include": a sessão é um cookie HttpOnly. O front nunca guarda token.
 * - JSON por padrão; FormData passa direto (upload de planilha).
 * - Timeout com AbortController. Nada de retry de escrita aqui (D12: escrita incerta
 *   nunca tem retry automático).
 * - Erro sempre como ApiErro { status, codigo, mensagem }. A mensagem é curta e humana:
 *   nunca a stack nem a resposta crua do servidor.
 * - 401 de qualquer rota avisa quem estiver ouvindo (o ProvedorSessao derruba a sessão).
 */

export const BASE_API = "/api/v1";
export const TIMEOUT_PADRAO_MS = 20_000;

export type CodigoErro =
  | "sessao_expirada"
  | "sem_permissao"
  | "nao_encontrado"
  | "conflito"
  | "arquivo_grande"
  | "validacao"
  | "servidor"
  | "indisponivel"
  | "tempo_esgotado"
  | "rede"
  | "resposta_invalida"
  | "desconhecido";

const MENSAGENS: Record<CodigoErro, string> = {
  sessao_expirada: "Sua sessão terminou. Entre de novo para continuar.",
  sem_permissao: "Seu plano não permite esta ação.",
  nao_encontrado: "Não encontramos o que você procurou.",
  conflito: "Os dados mudaram desde a última leitura. Atualize a página e confira.",
  arquivo_grande: "O arquivo passa do limite de 15 MB.",
  validacao: "Alguns dados não foram aceitos. Confira os campos e tente de novo.",
  servidor: "Não foi possível concluir agora. Tente de novo em instantes.",
  indisponivel: "O serviço está indisponível no momento. Tente de novo em instantes.",
  tempo_esgotado: "A resposta demorou demais. Confira sua conexão e tente de novo.",
  rede: "Sem conexão com o servidor. Confira sua internet e tente de novo.",
  resposta_invalida: "Recebemos uma resposta que não conseguimos ler.",
  desconhecido: "Algo deu errado. Tente de novo.",
};

/** Erro da API, já traduzido para a tela. */
export class ApiErro extends Error {
  readonly status: number;
  readonly codigo: CodigoErro;
  readonly mensagem: string;

  constructor(status: number, codigo: CodigoErro, mensagem?: string) {
    const texto = mensagem ?? MENSAGENS[codigo];
    super(texto);
    this.name = "ApiErro";
    this.status = status;
    this.codigo = codigo;
    this.mensagem = texto;
  }

  get sessaoExpirada() {
    return this.codigo === "sessao_expirada";
  }

  get semPermissao() {
    return this.codigo === "sem_permissao";
  }
}

export function codigoPorStatus(status: number): CodigoErro {
  if (status === 401) return "sessao_expirada";
  if (status === 403) return "sem_permissao";
  if (status === 404) return "nao_encontrado";
  if (status === 409) return "conflito";
  if (status === 413) return "arquivo_grande";
  if (status === 400 || status === 422) return "validacao";
  if (status === 502 || status === 503 || status === 504) return "indisponivel";
  if (status >= 500) return "servidor";
  return "desconhecido";
}

/**
 * Mensagem do backend só é usada quando é texto curto (FastAPI: { detail: "..." } ou
 * { detail: { message: "..." } }) e o erro é de regra (403, 404, 409, 413, 422).
 * Em 5xx a mensagem é sempre a nossa: nada do servidor vaza para a tela.
 */
function mensagemDoCorpo(corpo: unknown, status: number): string | undefined {
  if (status >= 500 || status === 401) return undefined;
  if (typeof corpo !== "object" || corpo === null || !("detail" in corpo)) return undefined;
  const detalhe = (corpo as { detail: unknown }).detail;
  const texto =
    typeof detalhe === "string"
      ? detalhe
      : typeof detalhe === "object" && detalhe !== null && "message" in detalhe
        ? (detalhe as { message: unknown }).message
        : undefined;
  if (typeof texto !== "string") return undefined;
  const limpo = texto.trim();
  return limpo.length > 0 && limpo.length <= 240 ? limpo : undefined;
}

/* ------------------------------------------------------------------------------------------
 * Sessão expirada (401)
 * ---------------------------------------------------------------------------------------- */

type OuvinteSessao = (erro: ApiErro) => void;
const ouvintesSessao = new Set<OuvinteSessao>();

/** Registra quem reage a um 401 (o ProvedorSessao). Devolve a função para cancelar. */
export function aoExpirarSessao(ouvinte: OuvinteSessao): () => void {
  ouvintesSessao.add(ouvinte);
  return () => {
    ouvintesSessao.delete(ouvinte);
  };
}

/* ------------------------------------------------------------------------------------------
 * request<T>()
 * ---------------------------------------------------------------------------------------- */

export type MetodoHttp = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type OpcoesRequest = {
  metodo?: MetodoHttp;
  /** Objeto vira JSON; FormData vai como multipart. */
  corpo?: unknown;
  /** Parâmetros de consulta; null/undefined/"" ficam de fora. */
  parametros?: Record<string, string | number | boolean | null | undefined>;
  sinal?: AbortSignal;
  timeoutMs?: number;
  /** Rotas que esperam 401 como resposta normal (ex.: login) não derrubam a sessão. */
  ignorar401?: boolean;
};

function montarUrl(caminho: string, parametros: OpcoesRequest["parametros"]): string {
  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(parametros ?? {})) {
    if (valor === null || valor === undefined || valor === "") continue;
    busca.set(chave, String(valor));
  }
  const consulta = busca.toString();
  // Mesma origem da página. Absoluta porque o fetch do Node (testes) não aceita URL relativa.
  const origem = globalThis.location?.origin ?? "http://localhost";
  return `${origem}${BASE_API}${caminho}${consulta ? `?${consulta}` : ""}`;
}

/** Faz a chamada e trata erro, 401 e timeout. Devolve a resposta OK para quem lê o corpo. */
async function enviar(caminho: string, opcoes: OpcoesRequest, aceita: string): Promise<Response> {
  const { metodo = "GET", corpo, parametros, sinal, timeoutMs = TIMEOUT_PADRAO_MS } = opcoes;

  const controle = new AbortController();
  let esgotou = false;
  const relogio = setTimeout(() => {
    esgotou = true;
    controle.abort();
  }, timeoutMs);
  const repassarCancelamento = () => controle.abort();
  if (sinal) {
    if (sinal.aborted) controle.abort();
    else sinal.addEventListener("abort", repassarCancelamento, { once: true });
  }

  const cabecalhos = new Headers({ Accept: aceita });
  let corpoEnviado: BodyInit | undefined;
  if (corpo instanceof FormData) {
    corpoEnviado = corpo;
  } else if (corpo !== undefined) {
    cabecalhos.set("Content-Type", "application/json");
    corpoEnviado = JSON.stringify(corpo);
  }

  let resposta: Response;
  try {
    resposta = await fetch(montarUrl(caminho, parametros), {
      method: metodo,
      headers: cabecalhos,
      body: corpoEnviado,
      credentials: "include",
      cache: "no-store",
      signal: controle.signal,
    });
  } catch (erro) {
    if (esgotou) throw new ApiErro(0, "tempo_esgotado");
    if (sinal?.aborted) throw erro; // cancelamento pedido por quem chamou (TanStack Query)
    throw new ApiErro(0, "rede");
  } finally {
    clearTimeout(relogio);
    sinal?.removeEventListener("abort", repassarCancelamento);
  }

  if (!resposta.ok) {
    const corpoErro: unknown = await resposta.json().catch(() => undefined);
    const codigo = codigoPorStatus(resposta.status);
    const erro = new ApiErro(resposta.status, codigo, mensagemDoCorpo(corpoErro, resposta.status));
    if (erro.sessaoExpirada && !opcoes.ignorar401) {
      for (const ouvinte of ouvintesSessao) ouvinte(erro);
    }
    throw erro;
  }
  return resposta;
}

export async function request<T>(caminho: string, opcoes: OpcoesRequest = {}): Promise<T> {
  const resposta = await enviar(caminho, opcoes, "application/json");
  if (resposta.status === 204) return undefined as T;
  try {
    return (await resposta.json()) as T;
  } catch {
    throw new ApiErro(resposta.status, "resposta_invalida");
  }
}

/* ------------------------------------------------------------------------------------------
 * Arquivos (Baixar Excel)
 * ---------------------------------------------------------------------------------------- */

export type ArquivoBaixado = { conteudo: Blob; nome: string };

/** Nome do arquivo no Content-Disposition (filename*=UTF-8'' ou filename="..."). */
export function nomeDoArquivo(cabecalho: string | null, padrao: string): string {
  if (!cabecalho) return padrao;
  const codificado = /filename*=UTF-8''([^;]+)/i.exec(cabecalho)?.[1];
  if (codificado) {
    try {
      return decodeURIComponent(codificado.trim());
    } catch {
      /* cai no filename simples */
    }
  }
  const simples = /filename="?([^";]+)"?/i.exec(cabecalho)?.[1];
  return simples?.trim() || padrao;
}

/** GET de um arquivo pronto do backend (o front não monta planilha). */
export async function baixarArquivo(
  caminho: string,
  opcoes: OpcoesRequest & { nomePadrao: string },
): Promise<ArquivoBaixado> {
  const resposta = await enviar(
    caminho,
    { ...opcoes, timeoutMs: opcoes.timeoutMs ?? 60_000 },
    "*/*",
  );
  return {
    conteudo: await resposta.blob(),
    nome: nomeDoArquivo(resposta.headers.get("Content-Disposition"), opcoes.nomePadrao),
  };
}
