/**
 * Funções de texto da busca global (BuscaGlobal.dc.html). Só comparação de texto:
 * ignorar acentos, achar o trecho e marcar. A pontuação das posições é do backend.
 */

/** Minúsculas e sem acento. */
export function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export type Parte = { texto: string; marcado: boolean };

/** Termo só de dígitos (com espaços, ponto ou traço), com 2+ dígitos: é busca por código. */
export function ehBuscaPorCodigo(q: string): boolean {
  const termo = q.trim();
  return termo.replace(/\D/g, "").length >= 2 && /^[\d\s.-]+$/.test(termo);
}

/** Divide o texto em partes, marcando a primeira ocorrência do termo (sem acento). */
export function partesComTermo(texto: string, termo: string): Parte[] {
  const t = semAcento(termo.trim());
  if (!t) return [{ texto, marcado: false }];
  const i = semAcento(texto).indexOf(t);
  if (i < 0) return [{ texto, marcado: false }];
  return [
    { texto: texto.slice(0, i), marcado: false },
    { texto: texto.slice(i, i + t.length), marcado: true },
    { texto: texto.slice(i + t.length), marcado: false },
  ].filter((p) => p.texto.length > 0);
}

/**
 * Marca os dígitos buscados dentro do código exibido em blocos ("0000 0012 3456"),
 * ignorando os espaços do código e do termo.
 */
export function partesDoCodigo(codigoExibido: string, q: string): Parte[] {
  if (!ehBuscaPorCodigo(q)) return partesComTermo(codigoExibido, q);
  const digitos = q.replace(/\D/g, "");
  const semEspaco = codigoExibido.replace(/\s/g, "");
  const inicio = semEspaco.indexOf(digitos);
  if (inicio < 0) return [{ texto: codigoExibido, marcado: false }];

  let de = -1;
  let ate = -1;
  let n = 0;
  for (let k = 0; k < codigoExibido.length; k++) {
    if (codigoExibido[k] === " ") continue;
    if (n === inicio) de = k;
    if (n === inicio + digitos.length - 1) {
      ate = k + 1;
      break;
    }
    n++;
  }
  return [
    { texto: codigoExibido.slice(0, de), marcado: false },
    { texto: codigoExibido.slice(de, ate), marcado: true },
    { texto: codigoExibido.slice(ate), marcado: false },
  ].filter((p) => p.texto.length > 0);
}
