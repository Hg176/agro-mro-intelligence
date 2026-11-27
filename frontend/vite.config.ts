/// <reference types="vitest/config" />
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

import {
  destinoNoServidorDev,
  lerRotasReais,
  MENSAGEM_MOCK_NAO_INTERCEPTOU,
} from "./src/mocks/guardaDoDev.ts";

/**
 * O worker do MSW fica em mock-worker/ (FORA de public/), então o Vite nunca o copia para
 * dist/. Este plugin só existe no `vite dev` (apply: "serve") e serve o arquivo em
 * /mockServiceWorker.js. No build ele não roda. scripts/verificar-build.mjs confere.
 *
 * Guarda: com o mock ligado, uma chamada /api que chega ao servidor do Vite é uma chamada que
 * o service worker NÃO interceptou. Em vez de ir para o proxy (backend talvez fora do ar →
 * ECONNREFUSED), ela responde 503 com a explicação. Rotas em VITE_API_REAL seguem para o proxy.
 */
function workerDoMockSoNoDev(env: Record<string, string>): Plugin {
  const mockLigado = env.VITE_API_MOCK !== "false";
  const reais = lerRotasReais(env.VITE_API_REAL);
  const arquivo = fileURLToPath(new URL("./mock-worker/mockServiceWorker.js", import.meta.url));
  return {
    name: "agro-mro:worker-do-mock-so-no-dev",
    apply: "serve",
    configureServer(servidor) {
      servidor.middlewares.use("/mockServiceWorker.js", (_req, res) => {
        res.setHeader("Content-Type", "text/javascript; charset=utf-8");
        res.setHeader("Service-Worker-Allowed", "/");
        res.end(readFileSync(arquivo));
      });
      // Roda antes do proxy (middlewares de plugin vêm antes dos internos do Vite).
      servidor.middlewares.use((req, res, proximo) => {
        const url = req.url ?? "";
        if (destinoNoServidorDev(url, { mockLigado, reais }) === "proxy") return proximo();
        servidor.config.logger.warn(
          `[mock] chamada não interceptada pelo service worker: ${req.method} ${url}`,
          {
            timestamp: true,
          },
        );
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ detail: MENSAGEM_MOCK_NAO_INTERCEPTOU }));
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), workerDoMockSoNoDev(loadEnv(mode, process.cwd(), "VITE_"))],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    // /_fundamentos lê docs/design/tokens/tokens.json (fora de frontend/).
    fs: { allow: [".", "../docs/design"] },
    // Rotas que não estão no mock (VITE_API_MOCK=false ou VITE_API_REAL) vão para o backend.
    proxy: {
      "/api": {
        target: loadEnv(mode, process.cwd(), "VITE_").VITE_API_ALVO || "http://127.0.0.1:8000",
        changeOrigin: false,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
    css: false,
  },
}));
