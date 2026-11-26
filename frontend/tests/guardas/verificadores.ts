/**
 * Verificadores estáticos usados pelos testes de guarda.
 *
 * Cada verificador recebe o texto de um arquivo e devolve as ocorrências proibidas.
 * São funções puras, para o mesmo código varrer src/ e reprovar os exemplos errados
 * dos casos negativos.
 *
 * Limite conhecido: análise estática não garante que "o front não calcula".
 * Aqui só barramos o que dá para ver com segurança (parseFloat/Number sobre texto);
 * o resto é coberto pela revisão do PR (ver frontend/README.md).
 */

export type Ocorrencia = {
  regra: string;
  linha: number;
  trecho: string;
};

/** Linha com este marcador é ignorada pelos verificadores (exige motivo depois dos dois-pontos). */
export const MARCADOR_EXCECAO = /guarda-ok:\s*\S+/;

const CORES_PADRAO_TAILWIND = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;

const UTILITARIOS_DE_COR = [
  "bg",
  "text",
  "border",
  "border-x",
  "border-y",
  "border-t",
  "border-r",
  "border-b",
  "border-l",
  "border-s",
  "border-e",
  "ring",
  "ring-offset",
  "outline",
  "fill",
  "stroke",
  "from",
  "via",
  "to",
  "decoration",
  "divide",
  "placeholder",
  "caret",
  "accent",
  "shadow",
  "inset-shadow",
  "drop-shadow",
] as const;

type Regra = { nome: string; padrao: RegExp };

/** "#" + hex de cor (3, 4, 6 ou 8 dígitos), maiúscula ou minúscula. Não pega entidade HTML (&#123;). */
export const REGRA_HEX: Regra = {
  nome: "hex solto",
  padrao: /(?<![\w&])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])/i,
};

/** Paleta padrão do Tailwind: red-500, gray-50, text-slate-950, var(--color-blue-200)... */
export const REGRA_COR_PADRAO: Regra = {
  nome: "cor padrão do Tailwind",
  padrao: new RegExp(
    // Antes do nome da cor pode vir "-" (bg-red-500, --color-red-500), mas não letra/dígito.
    `(?<![A-Za-z0-9])(?:${CORES_PADRAO_TAILWIND.join("|")})-(?:50|[1-9]00|950)(?![\\w-])`,
  ),
};

/** bg-black, text-white, border-white/10, ring-black... */
export const REGRA_PRETO_BRANCO: Regra = {
  nome: "black/white do Tailwind",
  padrao: new RegExp(`(?<![\\w-])(?:${UTILITARIOS_DE_COR.join("|")})-(?:black|white)(?![\\w-])`),
};

/** style={{ color: ... }} e parecidos: cor só por classe de token. */
export const REGRA_STYLE_COR: Regra = {
  nome: "cor em style inline",
  padrao:
    /style=\{\{[^}]*\b(?:color|background|backgroundColor|borderColor|outlineColor|fill|stroke)\s*:/,
};

/** localStorage/sessionStorage.setItem com token, auth ou sessão. */
export const REGRA_TOKEN_STORAGE: Regra = {
  nome: "token/sessão no armazenamento do navegador",
  padrao: /(?:localStorage|sessionStorage)\s*\.\s*setItem\s*\([^)]*?(?:token|auth|sess)/i,
};

/** parseFloat: Decimal chega como string e não é convertido para número. */
export const REGRA_PARSE_FLOAT: Regra = {
  nome: "parseFloat sobre Decimal",
  padrao: /\bparseFloat\s*\(/,
};

/** Number(...) em tela/componente: conversão para número é proibida ali (Decimal é string). */
export const REGRA_NUMBER: Regra = {
  nome: "Number() sobre Decimal",
  padrao: /(?<![\w.])Number\s*\(/,
};

function procurar(texto: string, regras: readonly Regra[]): Ocorrencia[] {
  const achados: Ocorrencia[] = [];
  const linhas = texto.split(/\r?\n/);
  linhas.forEach((conteudo, indice) => {
    if (MARCADOR_EXCECAO.test(conteudo)) return;
    for (const regra of regras) {
      const casou = regra.padrao.exec(conteudo);
      if (casou) {
        achados.push({ regra: regra.nome, linha: indice + 1, trecho: casou[0] });
      }
    }
  });
  return achados;
}

/** Regras de cor que valem para todo .ts/.tsx de src/ (fora index.css e mocks). */
export function verificarCores(texto: string): Ocorrencia[] {
  return procurar(texto, [REGRA_HEX, REGRA_COR_PADRAO, REGRA_PRETO_BRANCO, REGRA_STYLE_COR]);
}

/** Classes de cor em arquivos .css (exceto src/index.css, que define os tokens). */
export function verificarCoresCss(texto: string): Ocorrencia[] {
  return procurar(texto, [REGRA_HEX, REGRA_COR_PADRAO]);
}

/** Token/sessão no armazenamento do navegador: vale para todo src/. */
export function verificarArmazenamento(texto: string): Ocorrencia[] {
  return procurar(texto, [REGRA_TOKEN_STORAGE]);
}

/** parseFloat em qualquer lugar de src/ (fora mocks). */
export function verificarParseFloat(texto: string): Ocorrencia[] {
  return procurar(texto, [REGRA_PARSE_FLOAT]);
}

/** Em src/telas e src/componentes: nem parseFloat nem Number(). */
export function verificarConversaoNumerica(texto: string): Ocorrencia[] {
  return procurar(texto, [REGRA_PARSE_FLOAT, REGRA_NUMBER]);
}
