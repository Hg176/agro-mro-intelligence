import type { ParametrosMateriais } from "@/api/materiais";
import type { FiltroPlanejamento } from "@/api/tipos";

/** Chaves do TanStack Query, num lugar só (para invalidar com segurança). */
export const chaves = {
  sessao: ["sessao"] as const,
  busca: (q: string) => ["busca", q] as const,
  visaoGeral: ["visao-geral"] as const,
  materiais: (p: ParametrosMateriais) =>
    ["materiais", p.q, p.filtro, p.abc, p.pqr, p.sinal, p.pagina] as const,
  todosMateriais: ["materiais"] as const,
  unidades: ["unidades"] as const,
  gruposPadrao: ["grupos-padrao"] as const,
  importacao: ["importacao"] as const,
  planejamento: (filtro: FiltroPlanejamento) => ["planejamento", filtro] as const,
  todoPlanejamento: ["planejamento"] as const,
  regras: ["regras"] as const,
  colunasDoArquivo: (arquivoId: string) => ["importacao", "colunas", arquivoId] as const,
  progressoCarga: (cargaId: string) => ["importacao", "carga", cargaId] as const,
};
