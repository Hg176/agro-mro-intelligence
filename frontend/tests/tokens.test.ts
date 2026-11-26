/**
 * Os tokens do design (docs/design/tokens/tokens.json) e o tema (src/index.css) andam juntos.
 * Se alguém mudar um lado só, este teste quebra.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { RAIZ_FRONTEND } from "./guardas/arquivos";
import { verificarCoresExpostas, verificarTokens, type TokensJson } from "./guardas/tema";

const tokens = JSON.parse(
  readFileSync(join(RAIZ_FRONTEND, "..", "docs", "design", "tokens", "tokens.json"), "utf8"),
) as TokensJson;
const css = readFileSync(join(RAIZ_FRONTEND, "src", "index.css"), "utf8");

describe("tokens.json × src/index.css", () => {
  it("tem os tokens que a fundação usa (o JSON foi lido de verdade)", () => {
    const nomes = tokens.color.tokens.map((t) => t.name);
    expect(nomes).toEqual(
      expect.arrayContaining(["verde-300", "ouro-700", "status-ruptura-texto", "tinta-500"]),
    );
    expect(nomes.length).toBeGreaterThanOrEqual(28);
  });

  it("cada token (cor, espaçamento, raio, sombra, texto) existe no CSS com o mesmo valor", () => {
    expect(verificarTokens(tokens, css)).toEqual([]);
  });

  it("cada token de cor está exposto como utilitário no @theme", () => {
    expect(verificarCoresExpostas(tokens, css)).toEqual([]);
  });

  it("tinta-500 é #66746e (o tema antigo tinha #6D7B75)", () => {
    expect(css.toLowerCase()).toContain("--tinta-500: #66746e;");
    expect(css.toLowerCase()).not.toContain("#6d7b75");
  });
});

describe("tokens: casos negativos", () => {
  const amostra: TokensJson = {
    color: { tokens: [{ name: "tinta-500", value: "#66746E" }] },
    spacing: { tokens: [{ name: "esp-4", value: "4px" }] },
    radius: { tokens: [] },
    shadow: { tokens: [{ name: "sombra-foco", value: "0 0 0 3px #E2EFE9" }] },
    type: { groups: [] },
  };

  it("aceita o mesmo hex em maiúscula ou minúscula", () => {
    const cssOk =
      ":root { --tinta-500: #66746e; --esp-4: 4px; --sombra-foco: 0 0 0  3px #e2efe9; }";
    expect(verificarTokens(amostra, cssOk)).toEqual([]);
  });

  it("reprova quando o CSS muda e o JSON não", () => {
    const cssErrado =
      ":root { --tinta-500: #6D7B75; --esp-4: 4px; --sombra-foco: 0 0 0 3px #e2efe9; }";
    expect(verificarTokens(amostra, cssErrado)).toEqual([
      "--tinta-500: index.css tem #6D7B75, tokens.json tem #66746E",
    ]);
  });

  it("reprova quando o JSON muda e o CSS não", () => {
    const jsonMudado: TokensJson = {
      ...amostra,
      color: { tokens: [{ name: "tinta-500", value: "#000000" }] },
    };
    const cssOk = ":root { --tinta-500: #66746e; --esp-4: 4px; --sombra-foco: 0 0 0 3px #e2efe9; }";
    expect(verificarTokens(jsonMudado, cssOk)).toHaveLength(1);
  });

  it("reprova token que falta no CSS", () => {
    const cssSemToken = ":root { --esp-4: 4px; --sombra-foco: 0 0 0 3px #e2efe9; }";
    expect(verificarTokens(amostra, cssSemToken)).toEqual([
      "--tinta-500 não existe em src/index.css (esperado #66746E)",
    ]);
  });

  it("ignora valor que só aparece em comentário", () => {
    const cssComentado =
      ":root { /* --tinta-500: #66746e; */ --esp-4: 4px; --sombra-foco: 0 0 0 3px #e2efe9; }";
    expect(verificarTokens(amostra, cssComentado)).toHaveLength(1);
  });

  it("reprova cor que não foi exposta no @theme", () => {
    const cssSemTheme = ":root { --tinta-500: #66746e; } @theme inline { --color-*: initial; }";
    expect(verificarCoresExpostas(amostra, cssSemTheme)).toEqual([
      "@theme não expõe --color-tinta-500: var(--tinta-500)",
    ]);
  });
});
