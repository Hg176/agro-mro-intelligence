import type { ParametrosMateriais } from "@/api/materiais";

/** Chaves do TanStack Query, num lugar só (para invalidar com segurança). */
export const chaves = {
  sessao: ["sessao"] as const,
  busca: (q: string) => ["busca", q] as const,
  visaoGeral: ["visao-geral"] as const,
  materiais: (p: ParametrosMateriais) => ["materiais", p.q, p.filtro, p.pagina] as const,
  todosMateriais: ["materiais"] as const,
};
