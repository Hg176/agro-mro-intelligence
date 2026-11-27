/** Textos de Materiais (Materiais.dc.html). */
import type { ConclusaoMateriais, Criticidade, FiltroMateriais } from "@/api/tipos";
import { Destaque, type ModelosDeFrase } from "@/componentes/FaixaConclusao";
import { inteiro } from "@/lib/formato";

export const FRASES_MATERIAIS: ModelosDeFrase<ConclusaoMateriais> = {
  catalogo_com_posicoes: (v) => (
    <>
      <Destaque>{inteiro(v.posicoes)} posições</Destaque> em {inteiro(v.locais)} locais.{" "}
      <Destaque>{inteiro(v.pedem_reposicao)} pedem reposição</Destaque> e{" "}
      {inteiro(v.sem_giro_180_dias)} estão sem giro há mais de 180 dias. Use os filtros prontos
      abaixo para chegar nelas.
    </>
  ),
  catalogo_vazio: () => (
    <>
      Seu catálogo ainda está vazio. <Destaque>Importe os dados mestres</Destaque> para ver saldo,
      classe e situação de cada posição.
    </>
  ),
};

export const CHIPS: Record<FiltroMateriais, { rotulo: string; icone: string; cor: string }> = {
  abaixo_pp: { rotulo: "Abaixo do PP", icone: "▲", cor: "text-status-alerta" },
  saldo_negativo: { rotulo: "Saldo negativo", icone: "●", cor: "text-status-ruptura" },
  parados: { rotulo: "Parados +180d", icone: "■", cor: "text-status-parado" },
  classe_a: { rotulo: "Classe A", icone: "A", cor: "text-verde-700" },
  sem_calculo: { rotulo: "Sem cálculo", icone: "○", cor: "text-tinta-500" },
};

export const CRITICIDADE: Record<Criticidade, { texto: string; ponto: string }> = {
  critical: { texto: "Crítico", ponto: "bg-status-alerta" },
  strategic: { texto: "Estratégico", ponto: "bg-status-ruptura" },
  noncritical: { texto: "Não crítico", ponto: "bg-tinta-300" },
};
