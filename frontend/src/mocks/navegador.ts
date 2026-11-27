/**
 * Liga o mock no navegador. Só é importado no dev (import dinâmico em src/main.tsx dentro
 * de `import.meta.env.DEV`), então nunca entra no build de produção.
 * O worker é servido em /mockServiceWorker.js pelo plugin de dev do vite.config.ts
 * (o arquivo fica em frontend/mock-worker/, fora de public/).
 */
import { setupWorker } from "msw/browser";

import { aoChamarSemHandler } from "./guardaDoDev";
import { handlers } from "./handlers";
import { canalDoNavegador, fetchComReativacao } from "./reativacao";
import { handlerRotasReais, lerRotasReais } from "./rotasReais";

export async function iniciarMock(): Promise<void> {
  const reais = lerRotasReais(import.meta.env.VITE_API_REAL);
  const worker = setupWorker(...(reais.length ? [handlerRotasReais(reais)] : []), ...handlers);
  await worker.start({
    serviceWorker: { url: "/mockServiceWorker.js" },
    onUnhandledRequest: aoChamarSemHandler,
  });
  // O navegador pode encerrar o worker a qualquer momento (ver reativacao.ts).
  globalThis.fetch = fetchComReativacao(globalThis.fetch.bind(globalThis), canalDoNavegador());
  if (reais.length) {
    console.info(`[mock] rotas indo para a API real: ${reais.join(", ")}`);
  }
}
