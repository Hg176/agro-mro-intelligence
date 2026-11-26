import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { criarClienteConsultas } from "@/api/consultas";
import App from "@/App";
import "@/index.css";

/**
 * Mock (MSW) só no dev e só se VITE_API_MOCK não for "false".
 * `import.meta.env.DEV` é constante no build: o import dinâmico some do bundle de produção
 * (scripts/verificar-build.mjs confere).
 */
async function prepararMock(): Promise<void> {
  if (import.meta.env.DEV && import.meta.env.VITE_API_MOCK !== "false") {
    const { iniciarMock } = await import("./mocks/navegador");
    await iniciarMock();
  }
}

const raiz = document.getElementById("root");
if (!raiz) {
  throw new Error("Elemento #root não encontrado em index.html");
}

const clienteConsultas = criarClienteConsultas();

void prepararMock().then(() => {
  createRoot(raiz).render(
    <StrictMode>
      <QueryClientProvider client={clienteConsultas}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );
});
