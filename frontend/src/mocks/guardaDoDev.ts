/**
 * Regras puras do mock no dev, usadas pelo navegador (src/mocks/navegador.ts) e pelo
 * servidor do Vite (vite.config.ts). Sem import de msw: o vite.config também carrega isto.
 */

export const PREFIXO_API = "/api/v1";

/** VITE_API_REAL="/me,/busca" → ["/me", "/busca"]. */
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

/** Chamada da API (qualquer coisa em /api/), pelo caminho da URL. */
export function ehChamadaDaApi(caminho: string): boolean {
  return caminho === "/api" || caminho.startsWith("/api/");
}

/**
 * O que o servidor do Vite faz com uma chamada /api que CHEGOU até ele.
 * - mock desligado: proxy para o backend (VITE_API_ALVO).
 * - mock ligado e rota em VITE_API_REAL: proxy (troca rota a rota).
 * - mock ligado e rota mockada: o service worker deveria ter respondido. Não manda para o
 *   backend (que pode nem estar no ar): responde 503 com a explicação.
 */
export function destinoNoServidorDev(
  caminhoComBusca: string,
  { mockLigado, reais }: { mockLigado: boolean; reais: readonly string[] },
): "proxy" | "mock_nao_interceptou" {
  const caminho = caminhoComBusca.split("?")[0] ?? "";
  if (!mockLigado || !ehChamadaDaApi(caminho)) return "proxy";
  if (
    caminho.startsWith(`${PREFIXO_API}/`) &&
    ehRotaReal(caminho.slice(PREFIXO_API.length), reais)
  ) {
    return "proxy";
  }
  return "mock_nao_interceptou";
}

export const MENSAGEM_MOCK_NAO_INTERCEPTOU =
  "O mock (MSW) não interceptou esta chamada: o service worker não estava ativo para esta aba. Recarregue a página.";

type Impressora = { warning: () => void; error: () => void };

/**
 * onUnhandledRequest do mock no navegador: chamada /api/* sem handler é ERRO (nunca vai para
 * a rede escondida); o resto (assets do Vite, fontes) segue direto. As rotas de VITE_API_REAL
 * têm handler (passthrough) e não caem aqui.
 */
export function aoChamarSemHandler(request: Request, imprimir: Impressora): void {
  if (ehChamadaDaApi(new URL(request.url).pathname)) imprimir.error();
}
