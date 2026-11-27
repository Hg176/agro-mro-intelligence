/**
 * Textos do Nível de serviço (NivelServico.dc.html). A frase vem pelo código da conclusão;
 * os números (metas, casos declarados, NC) vêm prontos da API.
 */
import type {
  CasoNivelServico,
  ClasseAbc,
  ClassePqr,
  ClasseXyz,
  ConclusaoNivelServico,
  FaixaCelula,
} from "@/api/tipos";
import { Destaque, type ModelosDeFrase } from "@/componentes/FaixaConclusao";
import { inteiro, percentualDeFracao } from "@/lib/formato";

export const FRASES_NIVEL_SERVICO: ModelosDeFrase<ConclusaoNivelServico> = {
  referencia_v3: (v) => (
    <>
      Seu espaço usa a <Destaque>referência V3</Destaque> nos 75 casos. Itens A têm meta menor (de{" "}
      <Destaque>
        {percentualDeFracao(v.meta_classe_a_minima)} a {percentualDeFracao(v.meta_classe_a_maxima)}
      </Destaque>
      ) para não prender capital; itens vitais (Z) que saem muito chegam a{" "}
      <Destaque>{percentualDeFracao(v.meta_maxima_z)}</Destaque>.
    </>
  ),
  matriz_propria_com_nc: (v) => (
    <>
      Sua matriz própria tem <Destaque>{inteiro(v.casos_declarados)} de 75 casos</Destaque>{" "}
      declarados. {inteiro(v.casos_nc)}{" "}
      {v.casos_nc === 1
        ? "combinação está NC: os itens nela ficam"
        : "combinações estão NC: os itens nelas ficam"}{" "}
      sem meta pela matriz até você declarar ou adotar a V3.
    </>
  ),
  matriz_propria_completa: (v) => (
    <>
      Sua matriz própria tem <Destaque>{inteiro(v.casos_declarados)} de 75 casos</Destaque>{" "}
      declarados. Nenhuma combinação está sem meta.
    </>
  ),
};

export const ORDEM_PQR: ClassePqr[] = ["P", "Q", "R", "S", "N"];
export const ORDEM_ABC: ClasseAbc[] = ["A", "B", "C", "D", "N"];
export const ORDEM_XYZ: ClasseXyz[] = ["X", "Y", "Z"];

export const TEXTO_PQR: Record<ClassePqr, string> = {
  P: "saídas frequentes",
  Q: "saídas intermediárias",
  R: "saídas raras",
  S: "sem saídas",
  N: "item novo",
};
export const TEXTO_ABC: Record<ClasseAbc, string> = {
  A: "alto valor de consumo",
  B: "valor intermediário",
  C: "menor valor de consumo",
  D: "consumo de valor zero",
  N: "item novo",
};
export const TEXTO_XYZ: Record<ClasseXyz, string> = {
  X: "baixa criticidade",
  Y: "intermediária",
  Z: "vital",
};

/** Cor da célula pela faixa que a API manda (legenda do design). */
export const COR_FAIXA: Record<FaixaCelula, string> = {
  0: "border border-borda bg-creme-100 text-tinta-600",
  1: "border border-transparent bg-verde-100 text-verde-800",
  2: "border border-transparent bg-verde-300 text-verde-950",
  3: "border border-transparent bg-verde-700 text-branco",
  4: "border border-transparent bg-verde-700 text-branco",
};
export const COR_NC = "border-[1.5px] border-dashed border-tinta-300 bg-branco text-tinta-600";

/** Rótulo pequeno da célula. */
export function subtituloDoCaso(c: CasoNivelServico): string {
  if (c.service_level === null) return "não declarado";
  if (c.service_level === "0") return "sem proteção";
  return c.origem === "cliente" ? "editado" : "V3";
}

export function origemDoCaso(c: CasoNivelServico, matrizPropria: boolean): string {
  if (c.origem === "v3_adotada") return `V3 adotada · v${inteiro(c.versao ?? 0)}`;
  if (c.origem === "cliente") return `Editado no espaço · v${inteiro(c.versao ?? 0)}`;
  return matrizPropria ? "Não declarado na matriz própria" : "Padrão V3";
}

export const NOTA =
  "Meta maior pode aumentar a proteção e o estoque necessário; meta menor pode ampliar o risco de falta. Zero é uma decisão válida e pode deixar alguns métodos indisponíveis. O nível manual do material sempre tem precedência.";

export const AJUDA_META =
  "Zero ou de 50% a menos de 100%, com até duas casas. Vírgula ou ponto, tanto faz.";
export const ERRO_META = "Informe zero ou uma meta de 50% a menos de 100%, com até duas casas.";

/**
 * Formato aceito no campo (só texto, sem conta): 0 ou de 50 a 99,99, com vírgula ou ponto.
 * A regra de verdade é do backend (422 com a mensagem).
 */
export const FORMATO_META = /^(?:0(?:[.,]0{1,2})?|[5-9]\d(?:[.,]\d{1,2})?)$/;

export const avisoSalvo = (caso: string) => `Caso ${caso} salvo com histórico e origem.`;
export const avisoRemovido = (caso: string) =>
  `Configuração ${caso} removida. A combinação fica NC na matriz própria.`;
export const AVISO_ADOTADO =
  "Os 75 valores V3 foram adotados. As versões anteriores e os níveis manuais dos materiais foram preservados.";
export const GRAVACAO_INCERTA =
  "Não sabemos se a matriz foi salva. Atualize a página e confira antes de salvar de novo.";
