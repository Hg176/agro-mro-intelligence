// @vitest-environment node
/**
 * Os dados do mock são os do design (uma fonte só, coerente entre telas).
 * Lê os .dc.html de docs/design/telas e compara.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { LOCAIS } from "@/mocks/dados/locais";
import { POSICOES } from "@/mocks/dados/posicoes";
import { casosTmer, casosV3, CORTES_PADRAO } from "@/mocks/dados/regras";
import { VISAO_GERAL } from "@/mocks/dados/visaoGeral";

import { RAIZ_FRONTEND } from "./guardas/arquivos";

const tela = (nome: string) =>
  readFileSync(join(RAIZ_FRONTEND, "..", "docs", "design", "telas", nome), "utf8");

/** Avalia um literal de objeto/array do script do .dc.html (só dados, sem chamada). */
function literal<T>(html: string, padrao: RegExp): T {
  const achado = padrao.exec(html)?.[1];
  if (!achado) throw new Error(`Bloco não encontrado: ${padrao}`);
  return Function(`"use strict"; return (${achado});`)() as T;
}

describe("dados do mock × design", () => {
  it("matriz V3: os 75 casos são os do NivelServico.dc.html", () => {
    const V = literal<Record<string, Record<string, number[]>>>(
      tela("NivelServico.dc.html"),
      /var V = (\{[\s\S]*?\n {4}\});/,
    );
    const casos = casosV3();
    expect(casos).toHaveLength(75);
    expect(new Set(casos.map((c) => c.case)).size).toBe(75);
    for (const c of casos) {
      const esperado = V[c.xyz]?.[c.pqr]?.["ABCDN".indexOf(c.abc)];
      expect(Number(c.service_level), c.case).toBe(esperado);
    }
  });

  it("linha S da V3 é 0% e não tem fator z", () => {
    for (const c of casosV3().filter((x) => x.pqr === "S")) {
      expect(c.service_level).toBe("0");
      expect(c.fator_z).toBeNull();
    }
  });

  it("TMER: os 75 casos são os do MatrizTmer.dc.html, de 0 a 360 dias", () => {
    const T = literal<Record<string, Record<string, number[]>>>(
      tela("MatrizTmer.dc.html"),
      /var T = (\{[\s\S]*?\n {4}\});/,
    );
    const casos = casosTmer();
    expect(casos).toHaveLength(75);
    for (const c of casos) {
      expect(Number(c.replenishment_days), c.case).toBe(T[c.pqr]?.[c.abc]?.[c.purchasability - 1]);
    }
    const dias = casos.map((c) => Number(c.replenishment_days));
    expect(Math.min(...dias)).toBe(0);
    expect(Math.max(...dias)).toBe(360);
  });

  it("cortes padrão são os do RegrasLetras.dc.html", () => {
    const p = literal<{ a: number; b: number; q: number; p: number; n: number }>(
      tela("RegrasLetras.dc.html"),
      /var padrao = (\{[^}]*\});/,
    );
    expect(Number(CORTES_PADRAO.abc_a) * 100).toBe(p.a);
    expect(Number(CORTES_PADRAO.abc_b) * 100).toBe(p.b);
    expect(Number(CORTES_PADRAO.pqr_output_q)).toBe(p.q);
    expect(Number(CORTES_PADRAO.pqr_output_p)).toBe(p.p);
    expect(CORTES_PADRAO.new_item_days).toBe(p.n);
  });

  it("as 18 posições são as do BuscaGlobal.dc.html (código, descrição, local, situação, classe)", () => {
    const base = literal<[string, string, string, string, string][]>(
      tela("BuscaGlobal.dc.html"),
      /this\.base = (\[[\s\S]*?\n {4}\]);/,
    );
    const situacao: Record<string, string> = {
      ruptura: "ruptura",
      abaixo: "abaixo_pp",
      parado: "parado",
      saudavel: "saudavel",
      nc: "sem_calculo",
    };
    expect(POSICOES).toHaveLength(18);
    POSICOES.forEach((p, i) => {
      const [code, desc, local, st, abc] = base[i] ?? [];
      expect(p.code).toBe(code?.replace(/\s/g, ""));
      expect(p.short_description).toBe(desc);
      expect(p.location_name).toBe(local);
      expect(p.situacao).toBe(situacao[st ?? ""]);
      expect(p.abc ?? "NC").toBe(abc);
    });
  });

  it("código e local são texto com zeros à esquerda", () => {
    for (const p of POSICOES) {
      expect(typeof p.code).toBe("string");
      expect(p.code).toMatch(/^0/);
      expect(typeof p.location).toBe("string");
    }
  });

  it("os números do design fecham entre si (812 posições)", () => {
    expect(LOCAIS.reduce((s, l) => s + l.posicoes, 0)).toBe(812);
    for (const aba of Object.values(VISAO_GERAL.composicao)) {
      expect(aba.classes.reduce((s, c) => s + (c.itens ?? 0), 0)).toBe(812);
    }
    const naGrade = VISAO_GERAL.matriz_abc_pqr.celulas.reduce((s, c) => s + c.posicoes, 0);
    expect(naGrade + VISAO_GERAL.matriz_abc_pqr.fora_da_grade).toBe(812);
    expect(VISAO_GERAL.composicao.abc.classes.map((c) => c.itens)).toEqual([98, 162, 391, 149, 12]);
  });
});
