/**
 * Buscas recentes: só na memória da sessão (nada de localStorage até decidirmos com o
 * back-end). Somem ao recarregar a página e ao sair.
 */
import { useSyncExternalStore } from "react";

const LIMITE = 4;
let recentes: readonly string[] = [];
const ouvintes = new Set<() => void>();

function avisar() {
  for (const o of ouvintes) o();
}

export function registrarBusca(texto: string): void {
  const t = texto.trim();
  if (!t) return;
  recentes = [t, ...recentes.filter((r) => r !== t)].slice(0, LIMITE);
  avisar();
}

export function limparBuscasRecentes(): void {
  recentes = [];
  avisar();
}

export function useBuscasRecentes(): readonly string[] {
  return useSyncExternalStore(
    (o) => {
      ouvintes.add(o);
      return () => {
        ouvintes.delete(o);
      };
    },
    () => recentes,
  );
}
