import "@testing-library/jest-dom/vitest";

import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { servidorMock } from "@/mocks/servidor";

// findBy*/waitFor esperam até 4 s: a suíte roda em paralelo e a busca tem debounce.
configure({ asyncUtilTimeout: 4000 });

// O mesmo mock do navegador, em Node. Requisição sem handler é erro de teste.
beforeAll(() => {
  servidorMock.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  cleanup();
  servidorMock.resetHandlers();
  // Volta a URL da página (os parâmetros ?mock=, ?plano=, ?sessao= moram nela).
  globalThis.history?.replaceState(null, "", "/");
});

afterAll(() => {
  servidorMock.close();
});
