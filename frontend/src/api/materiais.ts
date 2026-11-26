import { request } from "@/api/cliente";
import type { FiltroMateriais, Material, NovoMaterial, PaginaMateriais } from "@/api/tipos";

export type ParametrosMateriais = {
  /** Busca por código (com ou sem espaços), local ou descrição. */
  q: string;
  filtro: FiltroMateriais | null;
  pagina: number;
};

/** GET /api/v1/materiais?q=&filtro=&pagina= — catálogo com métricas (rota nova, a criar no backend). */
export function listarMateriais(
  parametros: ParametrosMateriais,
  sinal?: AbortSignal,
): Promise<PaginaMateriais> {
  return request<PaginaMateriais>("/materiais", {
    parametros: { q: parametros.q, filtro: parametros.filtro, pagina: parametros.pagina },
    sinal,
  });
}

/** POST /api/v1/materials — cadastra um material. Protótipo: main.py create_material. */
export function criarMaterial(material: NovoMaterial): Promise<Material> {
  return request<Material>("/materials", { metodo: "POST", corpo: material });
}
