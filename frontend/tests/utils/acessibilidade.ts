/**
 * Checagem de acessibilidade com axe (vitest-axe). Só reprova violações sérias ou críticas.
 * Atenção: o jsdom não calcula estilo, então o axe aqui NÃO mede contraste (a regra
 * color-contrast fica desligada). Contraste é coberto pelos pares do tokens.css e pela
 * nota do Lighthouse.
 */
import { axe } from "vitest-axe";

export async function violacoesSerias(elemento: Element = document.body): Promise<string[]> {
  const resultado = await axe(elemento, {
    rules: { "color-contrast": { enabled: false } },
  });
  return resultado.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help} — ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
    );
}
