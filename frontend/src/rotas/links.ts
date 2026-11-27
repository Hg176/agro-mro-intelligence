/**
 * Links para Materiais com filtros na URL (?q=&filtro=&abc=&pqr=&sinal=). Usados pela
 * Visão geral, pela busca e pelos cartões. Materiais lê os mesmos nomes (F1-8).
 */
import type { ClasseAbc, ClassePqr, CodigoSinal, FiltroMateriais } from "@/api/tipos";

export type FiltrosLinkMateriais = {
  q?: string;
  filtro?: FiltroMateriais | null;
  abc?: ClasseAbc | null;
  pqr?: ClassePqr | null;
  sinal?: CodigoSinal | null;
};

export function linkMateriais(filtros: FiltrosLinkMateriais = {}): string {
  const busca = new URLSearchParams();
  for (const chave of ["q", "filtro", "abc", "pqr", "sinal"] as const) {
    const valor = filtros[chave];
    if (valor) busca.set(chave, valor);
  }
  const consulta = busca.toString();
  return consulta ? `/app/materiais?${consulta}` : "/app/materiais";
}
