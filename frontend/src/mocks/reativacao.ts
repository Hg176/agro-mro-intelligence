/**
 * Mantém a aba registrada no service worker do mock.
 *
 * Por que existe: o worker do MSW guarda as abas ativas só em memória. Quando o navegador
 * encerra o worker (aba em segundo plano, "guias em suspensão" do Edge, ociosidade), ele
 * volta vazio na próxima chamada e deixa TUDO passar direto para a rede
 * (mockServiceWorker.js, passthrough()). No dev isso vira proxy → backend fora do ar →
 * ECONNREFUSED. A lista que já estava no cache parece funcionar; só a consulta nova (ex.:
 * Materiais com filtro) quebra.
 *
 * Correção: antes de cada chamada /api/, a aba manda "MOCK_ACTIVATE" (a mesma mensagem que o
 * msw usa no worker.start()). A mensagem acorda o worker e o registra de novo; o msw ignora
 * a confirmação repetida (ele a escuta com once). Só no dev: este arquivo vive em src/mocks/.
 */
import { ehChamadaDaApi } from "./guardaDoDev";

/** Quanto esperar a confirmação do worker antes de seguir com a chamada mesmo assim. */
export const ESPERA_CONFIRMACAO_MS = 1000;

export type CanalDoWorker = {
  controlador: () => { postMessage: (mensagem: string) => void } | null;
  ouvir: (ouvinte: (evento: MessageEvent) => void) => () => void;
};

/** Manda MOCK_ACTIVATE e espera MOCKING_ENABLED (ou o tempo limite). */
export function reativar(canal: CanalDoWorker, esperaMs = ESPERA_CONFIRMACAO_MS): Promise<void> {
  const controlador = canal.controlador();
  if (!controlador) return Promise.resolve();
  return new Promise((pronto) => {
    let pararDeOuvir = () => {};
    const terminar = () => {
      clearTimeout(relogio);
      pararDeOuvir();
      pronto();
    };
    const relogio = setTimeout(terminar, esperaMs);
    pararDeOuvir = canal.ouvir((evento) => {
      const dado: unknown = evento.data;
      if (
        typeof dado === "object" &&
        dado !== null &&
        Reflect.get(dado, "type") === "MOCKING_ENABLED"
      ) {
        terminar();
      }
    });
    controlador.postMessage("MOCK_ACTIVATE");
  });
}

function caminhoDe(entrada: RequestInfo | URL): string {
  const texto = entrada instanceof Request ? entrada.url : String(entrada);
  return new URL(texto, globalThis.location?.origin ?? "http://localhost").pathname;
}

/** fetch que reativa a aba no worker antes de cada chamada /api/. O resto passa direto. */
export function fetchComReativacao(original: typeof fetch, canal: CanalDoWorker): typeof fetch {
  return async (entrada, init) => {
    if (ehChamadaDaApi(caminhoDe(entrada))) await reativar(canal);
    return original(entrada, init);
  };
}

/** Canal real: navigator.serviceWorker. */
export function canalDoNavegador(): CanalDoWorker {
  const sw = navigator.serviceWorker;
  return {
    controlador: () => sw.controller,
    ouvir: (ouvinte) => {
      sw.addEventListener("message", ouvinte);
      return () => sw.removeEventListener("message", ouvinte);
    },
  };
}
