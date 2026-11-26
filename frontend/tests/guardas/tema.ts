/**
 * Verificadores do tema (src/index.css) contra docs/design/tokens/tokens.json.
 * Funções puras: recebem o texto do CSS e o JSON e devolvem a lista de problemas.
 */

export type TokensJson = {
  color: { tokens: { name: string; value: string }[] };
  spacing: { tokens: { name: string; value: string }[] };
  radius: { tokens: { name: string; value: string }[] };
  shadow: { tokens: { name: string; value: string }[] };
  type: {
    groups: {
      styles: {
        name: string;
        fontSize: string;
        lineHeight: string;
        fontWeight: number;
        letterSpacing?: string;
      }[];
    }[];
  };
};

/** Tira comentários de CSS. */
function semComentarios(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Normaliza valor para comparar: minúsculas, espaços colapsados, sem espaço após vírgula. */
export function normalizar(valor: string): string {
  return valor.trim().toLowerCase().replace(/\s+/g, " ").replace(/,\s*/g, ",");
}

/** Todas as declarações "--nome: valor;" do CSS (a última vence, como no navegador). */
export function extrairVariaveis(css: string): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const m of semComentarios(css).matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
    const [, nome, valor] = m;
    if (nome !== undefined && valor !== undefined) mapa.set(nome, valor.trim());
  }
  return mapa;
}

/** Conteúdo de cada bloco @theme (com ou sem "inline"). */
export function extrairBlocosTheme(css: string): string[] {
  const limpo = semComentarios(css);
  const blocos: string[] = [];
  for (const m of limpo.matchAll(/@theme\b[^{]*\{/g)) {
    let profundidade = 1;
    let i = (m.index ?? 0) + m[0].length;
    const inicio = i;
    while (i < limpo.length && profundidade > 0) {
      if (limpo[i] === "{") profundidade++;
      if (limpo[i] === "}") profundidade--;
      i++;
    }
    blocos.push(limpo.slice(inicio, i - 1));
  }
  return blocos;
}

/** Confere cada token do tokens.json no CSS. Hex comparado sem diferenciar maiúscula. */
export function verificarTokens(tokens: TokensJson, css: string): string[] {
  const vars = extrairVariaveis(css);
  const problemas: string[] = [];
  const conferir = (nome: string, esperado: string) => {
    const atual = vars.get(`--${nome}`);
    if (atual === undefined) {
      problemas.push(`--${nome} não existe em src/index.css (esperado ${esperado})`);
    } else if (normalizar(atual) !== normalizar(esperado)) {
      problemas.push(`--${nome}: index.css tem ${atual}, tokens.json tem ${esperado}`);
    }
  };
  for (const t of tokens.color.tokens) conferir(t.name, t.value);
  for (const t of tokens.spacing.tokens) conferir(t.name, t.value);
  for (const t of tokens.radius.tokens) conferir(t.name, t.value);
  for (const t of tokens.shadow.tokens) conferir(t.name, t.value);
  for (const grupo of tokens.type.groups) {
    for (const s of grupo.styles) {
      conferir(`text-${s.name}`, s.fontSize);
      conferir(`text-${s.name}--line-height`, s.lineHeight);
      conferir(`text-${s.name}--font-weight`, String(s.fontWeight));
      conferir(`text-${s.name}--letter-spacing`, s.letterSpacing ?? "0");
    }
  }
  return problemas;
}

/** Cada token de cor precisa estar exposto no @theme como --color-<nome>. */
export function verificarCoresExpostas(tokens: TokensJson, css: string): string[] {
  const theme = extrairVariaveis(extrairBlocosTheme(css).join("\n"));
  return tokens.color.tokens
    .filter((t) => theme.get(`--color-${t.name}`) !== `var(--${t.name})`)
    .map((t) => `@theme não expõe --color-${t.name}: var(--${t.name})`);
}

/**
 * A paleta padrão do Tailwind precisa estar desligada: "--color-*: initial" dentro de
 * um @theme, ANTES de qualquer --color- declarado nesse bloco.
 */
export function verificarTemaSemCoresPadrao(css: string): string[] {
  const blocos = extrairBlocosTheme(css);
  if (blocos.length === 0) return ["src/index.css não tem bloco @theme"];
  const reset = /--color-\*\s*:\s*initial\s*;/;
  const comReset = blocos.find((b) => reset.test(b));
  if (comReset === undefined) return ["nenhum @theme tem --color-*: initial"];
  const posReset = comReset.search(reset);
  const posPrimeiraCor = comReset.search(/--color-[\w-]+\s*:/);
  if (posPrimeiraCor !== -1 && posPrimeiraCor < posReset) {
    return ["--color-*: initial precisa vir antes das cores declaradas no @theme"];
  }
  return [];
}
