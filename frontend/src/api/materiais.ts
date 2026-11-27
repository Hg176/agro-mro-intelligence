import { baixarArquivo, request, type ArquivoBaixado } from "@/api/cliente";
import type {
  ClasseAbc,
  ClassePqr,
  CodigoSinal,
  FiltroMateriais,
  Material,
  NovoMaterial,
  PaginaMateriais,
} from "@/api/tipos";

/** Busca e filtros de Materiais. Os mesmos nomes vão na URL da tela (?q=&filtro=&abc=...). */
export type ParametrosMateriais = {
  /** Busca por código (com ou sem espaços), local ou descrição. */
  q: string;
  /** Um dos 5 filtros prontos (chips). */
  filtro: FiltroMateriais | null;
  /** Célula da matriz ABC × PQR da Visão geral. */
  abc: ClasseAbc | null;
  pqr: ClassePqr | null;
  /** Sinal de "Sinais para agir" sem filtro pronto. */
  sinal: CodigoSinal | null;
  pagina: number;
};

function consulta(p: ParametrosMateriais) {
  return { q: p.q, filtro: p.filtro, abc: p.abc, pqr: p.pqr, sinal: p.sinal };
}

/**
 * GET /api/v1/materiais?q=&filtro=&abc=&pqr=&sinal=&pagina= — catálogo com métricas, 100 por
 * página (rota nova, a criar no backend).
 */
export function listarMateriais(
  parametros: ParametrosMateriais,
  sinal?: AbortSignal,
): Promise<PaginaMateriais> {
  return request<PaginaMateriais>("/materiais", {
    parametros: { ...consulta(parametros), pagina: parametros.pagina },
    sinal,
  });
}

/**
 * GET /api/v1/materiais/excel?q=&filtro=&abc=&pqr=&sinal= — planilha pronta do conjunto
 * filtrado, todas as páginas (rota nova; exige permissoes.exportar_excel). No mock, CSV de exemplo.
 */
export function baixarExcelMateriais(parametros: ParametrosMateriais): Promise<ArquivoBaixado> {
  return baixarArquivo("/materiais/excel", {
    parametros: consulta(parametros),
    nomePadrao: "materiais.xlsx",
  });
}

/** POST /api/v1/materials — cadastra um material. Protótipo: main.py create_material. */
export function criarMaterial(material: NovoMaterial): Promise<Material> {
  return request<Material>("/materials", { metodo: "POST", corpo: material });
}
