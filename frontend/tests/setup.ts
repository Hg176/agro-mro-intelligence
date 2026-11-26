import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { servidorMock } from "@/mocks/servidor";

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
