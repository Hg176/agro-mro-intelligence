// @vitest-environment node
/**
 * scripts/verificar-build.mjs: uma dist limpa passa; uma com o worker do MSW ou com "msw"
 * no conteúdo reprova. Roda o script de verdade (node) sobre pastas temporárias.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { RAIZ_FRONTEND } from "./guardas/arquivos";

const SCRIPT = join(RAIZ_FRONTEND, "scripts", "verificar-build.mjs");
const pastas: string[] = [];

function distTemporaria(arquivos: Record<string, string>): string {
  const pasta = mkdtempSync(join(tmpdir(), "agro-dist-"));
  pastas.push(pasta);
  for (const [caminho, conteudo] of Object.entries(arquivos)) {
    const completo = join(pasta, caminho);
    mkdirSync(join(completo, ".."), { recursive: true });
    writeFileSync(completo, conteudo);
  }
  return pasta;
}

function verificar(pasta: string) {
  const r = spawnSync(process.execPath, [SCRIPT, pasta], { encoding: "utf8" });
  return { codigo: r.status, saida: `${r.stdout}${r.stderr}` };
}

afterAll(() => {
  for (const p of pastas) rmSync(p, { recursive: true, force: true });
});

const LIMPA = {
  "index.html": "<!doctype html><div id=root></div>",
  "assets/index-abc123.js": "console.log('Agro MRO');",
  "assets/index-abc123.css": ".bg-verde-700{background:var(--verde-700)}",
};

describe("verificar-build", () => {
  it("dist limpa passa", () => {
    const r = verificar(distTemporaria(LIMPA));
    expect(r.codigo, r.saida).toBe(0);
    expect(r.saida).toContain("ok");
  });

  it("reprova dist com mockServiceWorker.js", () => {
    const r = verificar(distTemporaria({ ...LIMPA, "mockServiceWorker.js": "/* worker */" }));
    expect(r.codigo).toBe(1);
    expect(r.saida).toContain("mockServiceWorker.js");
  });

  it("reprova worker em subpasta", () => {
    const r = verificar(distTemporaria({ ...LIMPA, "sub/mockServiceWorker.js": "x" }));
    expect(r.codigo).toBe(1);
  });

  it('reprova arquivo com "msw" no conteúdo', () => {
    const r = verificar(
      distTemporaria({ ...LIMPA, "assets/chunk.js": 'import("msw/browser").then(setupWorker)' }),
    );
    expect(r.codigo).toBe(1);
    expect(r.saida).toContain('"msw"');
  });

  it('reprova arquivo com "msw" no nome', () => {
    const r = verificar(distTemporaria({ ...LIMPA, "assets/msw-handlers.js": "x" }));
    expect(r.codigo).toBe(1);
  });

  it("reprova pasta que não existe (o build não rodou)", () => {
    const r = verificar(join(tmpdir(), "agro-dist-que-nao-existe-123"));
    expect(r.codigo).toBe(1);
  });

  it("reprova pasta vazia", () => {
    const r = verificar(distTemporaria({}));
    expect(r.codigo).toBe(1);
  });
});
