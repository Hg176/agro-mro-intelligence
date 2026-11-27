/**
 * Textos de Regras e letras (RegrasLetras.dc.html). As letras mostram os cortes que você
 * está digitando (só texto); exemplo, contagens e barra vêm da API com os cortes salvos.
 */
import type { AbaRegras, ConclusaoRegras, CortesDoEspaco } from "@/api/tipos";
import { Destaque, type ModelosDeFrase } from "@/componentes/FaixaConclusao";
import { decimal, inteiro } from "@/lib/formato";

export const FRASES_REGRAS: ModelosDeFrase<ConclusaoRegras> = {
  padrao_agro_mro: (v) => fraseDosCortes("o padrão Agro MRO", v),
  cortes_proprios: (v) => fraseDosCortes("cortes próprios", v),
};

function fraseDosCortes(origem: string, v: ConclusaoRegras["valores"]) {
  return (
    <>
      Seu espaço usa {origem}: <Destaque>A até {decimal(v.corte_a_percentual)}%</Destaque> do valor
      consumido, <Destaque>P a partir de {decimal(v.limite_p_saidas_ano)} saídas por ano</Destaque>{" "}
      e item novo (N) por {inteiro(v.prazo_item_novo_dias)} dias. XYZ e Comprabilidade vêm do que
      você informa no cadastro.
    </>
  );
}

/** Rascunho dos campos como texto digitado (vírgula decimal). */
export type Rascunho = Record<keyof CortesDoEspaco, string>;

export type Campo = {
  chave: keyof CortesDoEspaco;
  rotulo: string;
  sufixo: string;
  inteiro?: boolean;
};

export type Letra = { letra: string; texto: string; contagem?: string };

export type DefinicaoAba = {
  nome: string;
  rotuloAba: string;
  letrasAba: string;
  calculada: boolean;
  frase: string;
  regra: string;
  escala?: { inicio: string; fim: string; cores: Record<string, string> };
  letras: (r: Rascunho) => Letra[];
  campos?: Campo[];
  cortesTitulo?: string;
  cortesNota?: string;
  salvarRotulo?: string;
  ondeInforma?: string;
  /** Mostra "Quantas posições estão em cada letra hoje." */
  notaContagem?: boolean;
};

const textoN = (dias: string) =>
  `Menos de ${dias} dias, sem consumo válido comprovado até o fim do período`;

export const ORDEM_ABAS: AbaRegras[] = [
  "abc",
  "pqr_saidas",
  "pqr_entradas",
  "xyz",
  "comprabilidade",
  "item_novo",
];

export const ABAS: Record<AbaRegras, DefinicaoAba> = {
  abc: {
    nome: "ABC por consumo",
    rotuloAba: "ABC por consumo",
    letrasAba: "ABC",
    calculada: true,
    frase:
      "Quanto dinheiro cada item consome. Poucos itens costumam responder pela maior parte do valor: esses são os A.",
    regra:
      "média diária de saídas × custo; participação acumulada com cortes de 80% e 95%. Os mesmos cortes valem para a ABC do valor de estoque.",
    escala: {
      inicio: "0%",
      fim: "100% do valor",
      cores: {
        A: "bg-verde-700 text-branco",
        B: "bg-ouro-500 text-verde-950",
        C: "bg-status-parado text-branco",
      },
    },
    letras: (r) => [
      { letra: "A", texto: `Até ${r.abc_a_percentual}% do valor acumulado` },
      { letra: "B", texto: `Acima de ${r.abc_a_percentual}% até ${r.abc_b_percentual}%` },
      { letra: "C", texto: `Acima de ${r.abc_b_percentual}%` },
      { letra: "D", texto: "Valor de consumo zero; custo ausente deixa a turma como NC" },
      { letra: "N", texto: textoN(r.item_novo_dias) },
    ],
    campos: [
      { chave: "abc_a_percentual", rotulo: "Classe A até", sufixo: "%" },
      { chave: "abc_b_percentual", rotulo: "Classe B até", sufixo: "%" },
    ],
    cortesTitulo: "Cortes do seu espaço",
    cortesNota: "Também usados na ABC do valor de estoque.",
    salvarRotulo: "Salvar cortes",
    notaContagem: true,
  },
  pqr_saidas: {
    nome: "PQR de saídas",
    rotuloAba: "PQR de saídas",
    letrasAba: "PQR",
    calculada: true,
    frase:
      "Com que frequência o item sai do almoxarifado, contando as transações de saída por ano.",
    regra:
      "número de transações de saída anualizado pela janela dos dados mestres; cortes de 3 e 12 por ano.",
    escala: {
      inicio: "0",
      fim: "24+ saídas/ano",
      cores: {
        R: "bg-verde-100 text-verde-700",
        Q: "bg-verde-300 text-verde-950",
        P: "bg-verde-700 text-branco",
      },
    },
    letras: (r) => [
      { letra: "P", texto: `Popular: pelo menos ${r.pqr_saidas_p} saídas por ano` },
      {
        letra: "Q",
        texto: `Quase popular: de ${r.pqr_saidas_q} a menos de ${r.pqr_saidas_p} por ano`,
      },
      { letra: "R", texto: `Rara: mais de zero e menos de ${r.pqr_saidas_q} por ano` },
      { letra: "S", texto: "Sem saídas registradas" },
      { letra: "N", texto: textoN(r.item_novo_dias) },
    ],
    campos: [
      { chave: "pqr_saidas_q", rotulo: "Q a partir de", sufixo: "/ano" },
      { chave: "pqr_saidas_p", rotulo: "P a partir de", sufixo: "/ano" },
    ],
    cortesTitulo: "Cortes anuais do seu espaço",
    cortesNota: "Contagem de transações de saída por ano.",
    salvarRotulo: "Salvar cortes",
    notaContagem: true,
  },
  pqr_entradas: {
    nome: "PQR de entradas",
    rotuloAba: "PQR de entradas",
    letrasAba: "pqr",
    calculada: true,
    frase:
      "O mesmo raciocínio, olhando as entradas. As letras minúsculas separam a oferta (entradas) da demanda (saídas).",
    regra: "mesmos cortes aplicados às transações de entrada.",
    escala: {
      inicio: "0",
      fim: "24+ entradas/ano",
      cores: {
        r: "bg-verde-100 text-verde-700",
        q: "bg-verde-300 text-verde-950",
        p: "bg-verde-700 text-branco",
      },
    },
    letras: (r) => [
      { letra: "p", texto: `Pelo menos ${r.pqr_entradas_p} entradas por ano` },
      { letra: "q", texto: `De ${r.pqr_entradas_q} a menos de ${r.pqr_entradas_p} por ano` },
      { letra: "r", texto: `Mais de zero e menos de ${r.pqr_entradas_q} por ano` },
      { letra: "s", texto: "Sem entradas registradas" },
      { letra: "n", texto: textoN(r.item_novo_dias) },
    ],
    campos: [
      { chave: "pqr_entradas_q", rotulo: "q a partir de", sufixo: "/ano" },
      { chave: "pqr_entradas_p", rotulo: "p a partir de", sufixo: "/ano" },
    ],
    cortesTitulo: "Cortes anuais do seu espaço",
    cortesNota: "Contagem de transações de entrada por ano.",
    salvarRotulo: "Salvar cortes",
  },
  xyz: {
    nome: "XYZ declarado",
    rotuloAba: "XYZ declarado",
    letrasAba: "XYZ",
    calculada: false,
    frase: "O quanto a falta do item para a operação. Só você sabe isso; o sistema não adivinha.",
    regra:
      "criticidade declarada pelo cliente. Sem declaração, fica ND (não declarado); quando o cálculo precisa de um valor, usa X como padrão e mostra que a origem é o padrão.",
    letras: () => [
      { letra: "X", texto: "Baixa criticidade" },
      { letra: "Y", texto: "Criticidade intermediária" },
      { letra: "Z", texto: "Vital para a operação" },
    ],
    ondeInforma:
      'No cadastro de cada material, no campo "Criticidade (XYZ)", ou na coluna de criticidade dos dados mestres.',
  },
  comprabilidade: {
    nome: "Comprabilidade 1/2/3",
    rotuloAba: "Comprabilidade 1/2/3",
    letrasAba: "123",
    calculada: false,
    frase:
      "O quanto é fácil comprar o item de novo. Quanto mais difícil, mais proteção o estoque precisa.",
    regra:
      "definição adotada pelo Agro MRO (difere da ordem do manual SIO; importações não são invertidas). Sem declaração, fica ND; quando o cálculo precisa de um valor, usa 3 e mostra que a origem é o padrão.",
    letras: () => [
      { letra: "1", texto: "Encontrado em muitos fornecedores" },
      { letra: "2", texto: "Número reduzido de fornecedores" },
      { letra: "3", texto: "Exclusividade ou prazo longo de fornecimento" },
    ],
    ondeInforma:
      'No cadastro de cada material, no campo "Comprabilidade", ou na coluna correspondente dos dados mestres.',
  },
  item_novo: {
    nome: "Classe N · item novo",
    rotuloAba: "Classe N",
    letrasAba: "N",
    calculada: true,
    frase:
      "Item recém-cadastrado ainda não tem história para ser classificado. Ele fica N até provar consumo ou completar o prazo.",
    regra:
      "um único prazo vale para ABC de consumo, PQR de saídas e PQR de entradas. Uma saída válida, inclusive anterior ao período, libera o N. Entradas e saídas futuras não liberam.",
    letras: (r) => [{ letra: "N", texto: textoN(r.item_novo_dias) }],
    campos: [
      { chave: "item_novo_dias", rotulo: "Dias desde o cadastro", sufixo: "dias", inteiro: true },
    ],
    cortesTitulo: "Prazo de item novo",
    cortesNota: "Prazo maior mantém o item como N por mais tempo.",
    salvarRotulo: "Salvar prazo da classe N",
  },
};

/** Cores dos selos de letra (como o SeloClasse; as outras letras são neutras). */
export const COR_LETRA_ABC: Record<string, string> = {
  A: "bg-verde-100 text-verde-700",
  B: "bg-ouro-100 text-ouro-700",
  C: "bg-status-parado-bg text-status-parado",
  D: "bg-creme-100 text-tinta-600",
};
export const COR_LETRA_NEUTRA = "bg-creme-100 text-tinta-600";
export const COR_LETRA_NOVO = "border border-borda bg-branco text-tinta-600";

export const AVISO_RESTAURADO = "Cortes Agro MRO restaurados no seu espaço.";
export const avisoSalvo = (versao: number) =>
  `Cortes salvos para o seu espaço · versão ${inteiro(versao)}. As classificações passam a usar essa regra.`;
export const SALVAR_INCERTO =
  "Não sabemos se os cortes foram salvos. Atualize a página e confira a versão antes de salvar de novo.";

/** Formato do campo (a regra de cada corte é do backend). */
export const FORMATO_DECIMAL = /^\d{1,4}(,\d{1,2})?$/;
export const FORMATO_INTEIRO = /^\d{1,5}$/;
export const ERRO_FORMATO_DECIMAL = "Use um número, com até duas casas depois da vírgula.";
export const ERRO_FORMATO_INTEIRO = "Use um número inteiro de dias.";
