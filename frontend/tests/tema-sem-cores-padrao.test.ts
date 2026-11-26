// @vitest-environment node
/**
 * A paleta padrão do Tailwind fica desligada no tema: com "--color-*: initial" no @theme,
 * classes como bg-red-500, text-gray-600, bg-black e text-white não são geradas.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { compile } from "@tailwindcss/node";

import { RAIZ_FRONTEND } from "./guardas/arquivos";
import { verificarTemaSemCoresPadrao } from "./guardas/tema";

const css = readFileSync(join(RAIZ_FRONTEND, "src", "index.css"), "utf8");

describe("tema sem cores padrão", () => {
  it("src/index.css tem --color-*: initial dentro do @theme, antes das cores", () => {
    expect(verificarTemaSemCoresPadrao(css)).toEqual([]);
  });

  it("o Tailwind compila o tema e não gera as cores padrão (prova pelo compilador)", async () => {
    const compilador = await compile(css, {
      base: join(RAIZ_FRONTEND, "src"),
      onDependency: () => {},
    });
    const saida = compilador.build([
      "bg-verde-700",
      "text-ouro-700",
      "text-titulo-m",
      "shadow-foco",
      "rounded-xl",
      "bg-red-500",
      "text-gray-600",
      "border-slate-200",
      "bg-black",
      "text-white",
      "bg-neutral-950",
    ]);

    // Os tokens viram utilitários...
    expect(saida).toContain(".bg-verde-700");
    expect(saida).toContain(".text-ouro-700");
    // @theme inline: o valor do token entra direto na regra.
    expect(saida).toMatch(/\.text-titulo-m\s*\{[^}]*font-size:\s*26px/);
    expect(saida).toMatch(/\.text-titulo-m\s*\{[^}]*font-weight:\s*var\(--tw-font-weight,\s*700\)/);
    expect(saida).toContain(".shadow-foco");
    expect(saida).toMatch(/\.rounded-xl\s*\{[^}]*border-radius:\s*var\(--raio-xl\)/);

    // ...e a paleta padrão não existe mais.
    for (const classe of [
      "bg-red-500",
      "text-gray-600",
      "border-slate-200",
      "bg-black",
      "text-white",
      "bg-neutral-950",
    ]) {
      expect(saida).not.toContain(`.${classe}`);
    }
    expect(saida).not.toMatch(/--color-(?:red|gray|slate|neutral|black|white)\b/);
  });
});

describe("tema sem cores padrão: casos negativos", () => {
  it("reprova CSS sem @theme", () => {
    expect(verificarTemaSemCoresPadrao(":root { --x: 1px; }")).toEqual([
      "src/index.css não tem bloco @theme",
    ]);
  });

  it("reprova @theme sem o reset", () => {
    expect(verificarTemaSemCoresPadrao("@theme inline { --color-verde-700: #1c684c; }")).toEqual([
      "nenhum @theme tem --color-*: initial",
    ]);
  });

  it("reprova reset fora do @theme (em :root não vale)", () => {
    expect(
      verificarTemaSemCoresPadrao(":root { --color-*: initial; } @theme { --font-x: a; }"),
    ).toEqual(["nenhum @theme tem --color-*: initial"]);
  });

  it("reprova reset só em comentário", () => {
    expect(verificarTemaSemCoresPadrao("@theme { /* --color-*: initial; */ }")).toEqual([
      "nenhum @theme tem --color-*: initial",
    ]);
  });

  it("reprova reset depois das cores", () => {
    expect(
      verificarTemaSemCoresPadrao("@theme inline { --color-verde-700: x; --color-*: initial; }"),
    ).toEqual(["--color-*: initial precisa vir antes das cores declaradas no @theme"]);
  });
});
