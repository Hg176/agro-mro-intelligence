/**
 * Textos da Visão geral (VisaoGeral.dc.html). A frase de conclusão é escolhida pelo código
 * que a API manda (conclusao.tipo); os números vêm prontos em conclusao.valores.
 */
import type { CodigoSinal, ConclusaoVisaoGeral, EtapaImplantacao } from "@/api/tipos";
import { Destaque, type ModelosDeFrase } from "@/componentes/FaixaConclusao";
import { inteiro, moedaCompacta, percentual } from "@/lib/formato";

export const FRASES_VISAO_GERAL: ModelosDeFrase<ConclusaoVisaoGeral> = {
  parado_e_abaixo_pp: (v) => (
    <>
      <Destaque>{moedaCompacta(v.valor_parado)}</Destaque> ({percentual(v.percentual_valor_parado)}{" "}
      do estoque) estão em {inteiro(v.itens_parados)} itens sem saída há mais de 180 dias. E{" "}
      {inteiro(v.posicoes_abaixo_pp)} posições estão abaixo do ponto de pedido,{" "}
      <Destaque>{inteiro(v.abaixo_pp_classe_a)} delas classe A</Destaque>: comece por elas.
    </>
  ),
};

export const NOME_ETAPA: Record<EtapaImplantacao["id"], string> = {
  dados_mestres: "Dados mestres",
  movimentos: "Movimentos",
  precos: "Preços",
  nivel_servico: "Nível de serviço",
  pedidos_em_aberto: "Pedidos em aberto",
};

/** Link da etapa pendente (o texto do design existe só para "Pedidos em aberto"). */
export const LINK_ETAPA: Record<EtapaImplantacao["id"], { texto: string; para: string }> = {
  dados_mestres: { texto: "Importar dados mestres →", para: "/app/importar" },
  movimentos: { texto: "Importar movimentos →", para: "/app/importar" },
  precos: { texto: "Importar preços →", para: "/app/importar" },
  nivel_servico: { texto: "Revisar nível de serviço →", para: "/app/nivel-servico" },
  pedidos_em_aberto: { texto: "Importar pedidos em aberto →", para: "/app/importar" },
};

export type TomSinal = "ruptura" | "alerta" | "parado" | "neutro";

export const SINAIS: Record<CodigoSinal, { texto: string; icone: string; tom: TomSinal }> = {
  saldo_negativo: { texto: "Saldo negativo", icone: "●", tom: "ruptura" },
  reposicao_indicada: { texto: "Reposição indicada", icone: "▲", tom: "alerta" },
  acima_maximo: { texto: "Acima do estoque máximo", icone: "▲", tom: "alerta" },
  sem_giro: { texto: "Item sem giro", icone: "■", tom: "parado" },
  historico_insuficiente: { texto: "Histórico insuficiente", icone: "○", tom: "neutro" },
  preco_ausente: { texto: "Preço ausente", icone: "○", tom: "neutro" },
  parametro_cliente: { texto: "Parâmetro definido por você", icone: "○", tom: "neutro" },
};
