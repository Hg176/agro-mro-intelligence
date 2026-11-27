/**
 * Textos do Importar dados (ImportarDados.dc.html). A frase de conclusão é escolhida pelo
 * código que a API manda (conclusao.tipo); os números vêm prontos em conclusao.valores.
 */
import type {
  ConclusaoImportacao,
  ConfiancaColuna,
  DatasetImportacao,
  ErpOrigem,
  ModoImportacao,
  StatusCarga,
} from "@/api/tipos";
import { Destaque, type ModelosDeFrase } from "@/componentes/FaixaConclusao";
import { inteiro } from "@/lib/formato";

export const FRASES_IMPORTACAO: ModelosDeFrase<ConclusaoImportacao> = {
  comecar_pelos_dados_mestres: (v) => (
    <>
      Comece pelos <Destaque>dados mestres</Destaque>: eles dizem quais materiais existem em cada
      local. Sem eles, movimentos e pedidos não têm onde se encaixar.
      {v.minutos_estimados !== null && (
        <>
          {" "}
          Leva{" "}
          <Destaque>
            cerca de {inteiro(v.minutos_estimados)}{" "}
            {v.minutos_estimados === 1 ? "minuto" : "minutos"}
          </Destaque>
          .
        </>
      )}
    </>
  ),
};

export const NOME_DATASET: Record<DatasetImportacao, string> = {
  master_data: "Dados mestres",
  movements: "Movimentos",
  pipeline: "Pedidos em aberto",
};

export const ORDEM_DATASET: DatasetImportacao[] = ["master_data", "movements", "pipeline"];

export const ERPS: { id: ErpOrigem; nome: string; sub: string }[] = [
  { id: "sap", nome: "SAP", sub: "ECC e S/4HANA" },
  { id: "totvs", nome: "TOTVS", sub: "Protheus, Datasul, RM" },
  { id: "senior", nome: "Senior", sub: "Gestão Empresarial" },
  { id: "outro", nome: "Outro", sub: "Excel ou CSV" },
];

export const NOME_ERP: Record<ErpOrigem, string> = {
  sap: "SAP",
  totvs: "TOTVS",
  senior: "Senior",
  outro: "Excel ou CSV",
};

/** Coluna trocada por você: a confiança do reconhecimento automático não vale mais. */
export const ESCOLHA_MANUAL = {
  texto: "✓ Escolhida por você",
  classe: "bg-verde-50 text-verde-700",
};

export const PASSOS = ["Arquivo", "Colunas", "Prévia", "Concluído"];

export const CONFIANCA: Record<ConfiancaColuna, { texto: string; classe: string }> = {
  alta: { texto: "✓ Alta", classe: "bg-verde-100 text-verde-700" },
  media: { texto: "▲ Confira", classe: "bg-status-alerta-bg text-status-alerta-texto" },
  nenhuma: { texto: "— Sem coluna", classe: "bg-creme-100 text-tinta-600" },
};

export const MODOS: {
  id: ModoImportacao;
  titulo: string;
  descricao: (atuais: number | null) => string;
}[] = [
  {
    id: "append",
    titulo: "Acrescentar e atualizar",
    descricao: () =>
      "Novas posições entram; as que já existem recebem os dados do arquivo. Nada é apagado.",
  },
  {
    id: "replace",
    titulo: "Substituir tudo",
    descricao: (atuais) =>
      `${atuais === null ? "As posições atuais saem" : `As ${inteiro(atuais)} posições atuais saem`} e ficam só as do arquivo. Simulações ligadas a posições removidas são arquivadas.`,
  },
];

export const STATUS_CARGA: Record<StatusCarga, { texto: string; classe: string }> = {
  completed: { texto: "✓ Concluída", classe: "bg-verde-100 text-verde-700" },
  blocked: {
    texto: "● Cancelada · nada gravado",
    classe: "bg-status-ruptura-bg text-status-ruptura-texto",
  },
  failed: {
    texto: "● Falhou · nada gravado",
    classe: "bg-status-ruptura-bg text-status-ruptura-texto",
  },
};

/** Aviso antecipado (o backend valida de verdade). */
export const LIMITE_ARQUIVO_BYTES = 15 * 1024 * 1024;
export const EXTENSOES_ACEITAS = [".xlsx", ".xls", ".csv"];
export const AVISO_FORMATO = "Formato não aceito. Envie .xlsx, .xls ou .csv.";
export const AVISO_TAMANHO = "O arquivo passa do limite de 15 MB.";
