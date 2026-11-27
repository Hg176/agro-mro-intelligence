/**
 * Textos do Planejamento (Planejamento.dc.html). A frase de conclusão é escolhida pelo
 * código que a API manda (conclusao.tipo): o front não decide a situação olhando contagens.
 */
import type { CasoPlanejamento, ConclusaoPlanejamento, FiltroPlanejamento } from "@/api/tipos";
import { Destaque, type ModelosDeFrase } from "@/componentes/FaixaConclusao";
import { dataDoInstante, inteiro } from "@/lib/formato";

const casos = (n: number) => `${inteiro(n)} ${n === 1 ? "caso" : "casos"}`;

export const FRASES_PLANEJAMENTO: ModelosDeFrase<ConclusaoPlanejamento> = {
  nenhum_caso: (v) =>
    v.posicoes_abaixo_pp === null ? (
      <>Você ainda não iniciou nenhum caso.</>
    ) : (
      <>
        Você ainda não iniciou nenhum caso.{" "}
        <Destaque>
          {inteiro(v.posicoes_abaixo_pp)} {v.posicoes_abaixo_pp === 1 ? "posição" : "posições"}
        </Destaque>{" "}
        {v.posicoes_abaixo_pp === 1 ? "está" : "estão"} abaixo do ponto de pedido: comece por uma
        delas.
      </>
    ),
  prontos_para_exportar: (v) => (
    <>
      <Destaque>
        {v.casos_exportaveis === 1
          ? "1 caso validado está pronto"
          : `${inteiro(v.casos_exportaveis)} casos validados estão prontos`}
      </Destaque>{" "}
      para o Excel de mudanças.
      {v.casos_com_dados_novos > 0 &&
        ` ${casos(v.casos_com_dados_novos)} ${v.casos_com_dados_novos === 1 ? "tem" : "têm"} dados novos: revise antes de exportar.`}
    </>
  ),
  aguardando_validacao: (v) => (
    <>
      Nenhum caso validado esperando exportação. <Destaque>{casos(v.casos_a_validar)}</Destaque>{" "}
      {v.casos_a_validar === 1 ? "aguarda" : "aguardam"} a sua validação.
    </>
  ),
};

export const ROTULO_FILTRO: Record<FiltroPlanejamento, string> = {
  active: "Em aberto",
  todo: "A fazer",
  testing: "Em teste",
  ready: "A validar",
  validated: "Validados",
  exported: "Exportados",
  all: "Todos",
};

export const ORDEM_FILTROS: FiltroPlanejamento[] = [
  "active",
  "todo",
  "testing",
  "ready",
  "validated",
  "exported",
  "all",
];

/** Linha de rodapé do caso, montada com as datas e referências que a API manda. */
export function rodapeDoCaso(c: CasoPlanejamento): string | null {
  if (c.status === "validated" && c.entra_no_proximo_excel && c.validated_at) {
    return `Validado em ${dataDoInstante(c.validated_at)} · entra no próximo Excel de mudanças`;
  }
  if (c.status === "exported" && c.export_batch_id) {
    return `Lote ${c.export_batch_id} · exportado em ${dataDoInstante(c.exported_at)}`;
  }
  if (c.status === "applied" && c.applied_at) {
    return `Aplicado em ${dataDoInstante(c.applied_at)} · ${
      c.external_reference ? `referência: ${c.external_reference}` : "sem referência externa"
    }`;
  }
  return null;
}

export const AVISO_EXPORTADO =
  "Lote emitido e arquivo entregue ao navegador. Confira o download; a aplicação no ERP é outra etapa.";

export const avisoAplicado = (c: CasoPlanejamento) =>
  `Aplicação declarada para ${c.short_description} (${c.location_name}). O resultado observado aparece quando houver histórico novo.`;

export const avisoIniciado = (c: CasoPlanejamento) =>
  `Caso iniciado para ${c.short_description} (${c.location_name}). Ele está no topo da fila, em "A fazer".`;

/** Exportar que falha por rede/5xx: o lote pode ter sido emitido (D12, sem retry). */
export const EXPORTACAO_INCERTA =
  "Não sabemos se o lote foi emitido. Atualize a página e confira os casos Exportados antes de baixar de novo.";

export const APLICACAO_INCERTA =
  "Não sabemos se a aplicação foi registrada. Atualize a página e confira o caso antes de confirmar de novo.";
