#!/usr/bin/env node
/**
 * Garante que o mock (MSW) não foi parar no build de produção.
 *
 * Falha (código de saída 1) se a pasta do build:
 *   - não existir ou estiver vazia (o build não rodou);
 *   - tiver o arquivo mockServiceWorker.js em qualquer nível;
 *   - tiver algum arquivo cujo nome ou conteúdo contenha "msw" ou "mockServiceWorker".
 *
 * Uso: node scripts/verificar-build.mjs [pasta]   (padrão: dist, relativa a frontend/)
 * Roda no fim do `npm run check`, depois do `npm run build`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ_FRONTEND = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROIBIDOS = ["mockServiceWorker", "msw"];

/** Lista os arquivos de uma pasta, recursivamente. */
function listar(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const completo = join(dir, nome);
    return statSync(completo).isDirectory() ? listar(completo) : [completo];
  });
}

/**
 * Verifica a pasta do build e devolve a lista de problemas (vazia = ok).
 * @param {string} pasta caminho absoluto da pasta do build
 * @returns {string[]}
 */
export function verificarDist(pasta) {
  if (!existsSync(pasta) || !statSync(pasta).isDirectory()) {
    return [`pasta do build não encontrada: ${pasta} (rode npm run build antes)`];
  }
  const arquivos = listar(pasta);
  if (arquivos.length === 0) {
    return [`pasta do build vazia: ${pasta}`];
  }
  const problemas = [];
  for (const arquivo of arquivos) {
    const rel = relative(pasta, arquivo).split(sep).join("/");
    if (rel.split("/").at(-1) === "mockServiceWorker.js") {
      problemas.push(`${rel}: o worker do MSW não pode estar no build`);
      continue;
    }
    const nomeProibido = PROIBIDOS.find((p) => rel.includes(p));
    if (nomeProibido) {
      problemas.push(`${rel}: nome contém "${nomeProibido}"`);
      continue;
    }
    const conteudo = readFileSync(arquivo).toString("latin1");
    const achado = PROIBIDOS.find((p) => conteudo.includes(p));
    if (achado) {
      problemas.push(`${rel}: conteúdo contém "${achado}"`);
    }
  }
  return problemas;
}

const executadoDireto =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (executadoDireto) {
  const pasta = resolve(RAIZ_FRONTEND, process.argv[2] ?? "dist");
  const problemas = verificarDist(pasta);
  if (problemas.length > 0) {
    console.error("verificar-build: o build de produção tem rastro do mock:");
    for (const p of problemas) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`verificar-build: ok (${relative(RAIZ_FRONTEND, pasta) || "."} sem MSW)`);
}
