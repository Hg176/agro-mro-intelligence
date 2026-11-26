import type { EstadoPlano, Permissoes, Sessao } from "@/api/tipos";

import { iso } from "./util";

/**
 * O que o backend devolveria em GET /me para cada estado do plano.
 * As permissões são decididas pelo backend; estes valores são a suposição do mock:
 * - demonstração: tudo menos baixar Excel (CONTEXTO §20.1: demonstração sem emissão de Excel);
 * - ativo: tudo;
 * - somente leitura: nada de escrita (PlanosLeitura.dc.html).
 */
const PERMISSOES: Record<EstadoPlano, Permissoes> = {
  demonstracao: {
    importar: true,
    simular: true,
    validar: true,
    exportar_excel: false,
    editar_regras: true,
  },
  ativo: {
    importar: true,
    simular: true,
    validar: true,
    exportar_excel: true,
    editar_regras: true,
  },
  somente_leitura: {
    importar: false,
    simular: false,
    validar: false,
    exportar_excel: false,
    editar_regras: false,
  },
};

/** 03/12/2026 em Cuiabá (UTC−4) = 03/12/2026 15:00 UTC. */
const RENOVA_EM = iso("2026-12-03T15:00:00Z");

export function sessaoPorEstado(estado: EstadoPlano): Sessao {
  return {
    usuario: { nome: "Hugo dos Santos", email: "hugo@empresa.com", iniciais: "HS" },
    espaco: { nome: "Espaço de Hugo" },
    plano:
      estado === "demonstracao"
        ? { estado, itens_usados: 812, itens_limite: 10, renova_em: null }
        : { estado, itens_usados: 812, itens_limite: 1000, renova_em: RENOVA_EM },
    permissoes: PERMISSOES[estado],
  };
}
