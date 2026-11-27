/// <reference types="vitest/config" />
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

/**
 * O worker do MSW fica em mock-worker/ (FORA de public/), então o Vite nunca o copia para
 * dist/. Este plugin só existe no `vite dev` (apply: "serve") e serve o arquivo em
 * /mockServiceWorker.js. No build ele não roda. scripts/verificar-build.mjs confere.
 */
function workerDoMockSoNoDev(): Plugin {
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
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), workerDoMockSoNoDev()],
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
