/**
 * Importar dados (rotas novas, a criar no backend). O mock faz o papel do backend: lê o
 * "arquivo" (finge 818 linhas), reconhece colunas, valida, aceita correções e grava com
 * progresso. Tudo em memória, por arquivo_id e carga_id.
 *
 * - ?mock=carregando | erro | vazio → GET /api/v1/importacao (vazio = sem histórico).
 * - ?plano=somente_leitura → envio e confirmação respondem 403.
 * - ?carga=falha → a gravação para no meio e nada é gravado.
 */
import { http, HttpResponse } from "msw";

import type {
  ArquivoRecebido,
  ErroLinhaImportacao,
  PreviaImportacao,
  ProgressoCarga,
} from "@/api/tipos";

import { aplicarEstadoTela, cargaFalha, estadoPlano, estadoTela, latencia } from "../cenario";
import {
  ABAS_DO_ARQUIVO,
  COLUNAS_DO_ARQUIVO,
  ERROS_DA_PREVIA,
  LINHAS_DO_ARQUIVO,
  PAINEL_IMPORTACAO,
  PAINEL_IMPORTACAO_VAZIO,
  RESUMO_DADOS_MESTRES,
} from "../dados/importacao";
import { LOCAIS } from "../dados/locais";
import { d } from "../dados/util";

const LIMITE_BYTES = 15 * 1024 * 1024;
const EXTENSOES = [".xlsx", ".xls", ".csv"];
/** Leituras do progresso até concluir (o real depende do tamanho da carga). */
const PASSOS_DA_GRAVACAO = 4;

type EstadoArquivo = { erros: ErroLinhaImportacao[] };
type EstadoCarga = { total: number; leituras: number; falha: boolean };

const arquivos = new Map<string, EstadoArquivo>();
const cargas = new Map<string, EstadoCarga>();
let sequencia = 0;

const bloqueado = () =>
  estadoPlano() === "somente_leitura"
    ? HttpResponse.json({ detail: "Seu espaço está em somente leitura." }, { status: 403 })
    : null;

function previa(estado: EstadoArquivo): PreviaImportacao {
  const comErro = estado.erros.filter((e) => !e.corrigido).length;
  return {
    linhas_lidas: LINHAS_DO_ARQUIVO,
    prontas: LINHAS_DO_ARQUIVO - comErro,
    com_erro: comErro,
    erros: estado.erros,
  };
}

/** Regras de exemplo do "backend" para aceitar uma correção. */
function correcaoValida(erro: ErroLinhaImportacao, valor: string): boolean {
  const v = valor.trim();
  if (!v) return false;
  if (erro.campo === "unit_price") return /^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(v);
  if (erro.campo === "location") {
    const alvo = v.toLowerCase();
    return LOCAIS.some((l) => l.codigo === v || l.nome.toLowerCase() === alvo);
  }
  if (erro.campo === "code") return v.replace(/\s/g, "") !== "000000451180";
  return true;
}

function progresso(id: string, carga: EstadoCarga): ProgressoCarga {
  const passo = Math.min(carga.leituras, PASSOS_DA_GRAVACAO);
  const gravadas = Math.round((carga.total * passo) / PASSOS_DA_GRAVACAO);
  const percentual = d(String(Math.round((100 * passo) / PASSOS_DA_GRAVACAO)));
  if (carga.falha && passo >= 2) {
    return {
      carga_id: id,
      estado: "falhou",
      gravadas: 0,
      total: carga.total,
      percentual: d("0"),
      resumo: null,
      motivo: "A gravação parou no meio. Nada foi gravado; o estoque continua como antes.",
    };
  }
  if (passo < PASSOS_DA_GRAVACAO) {
    return {
      carga_id: id,
      estado: "gravando",
      gravadas,
      total: carga.total,
      percentual,
      resumo: null,
      motivo: null,
    };
  }
  return {
    carga_id: id,
    estado: "concluida",
    gravadas: carga.total,
    total: carga.total,
    percentual: d("100"),
    resumo: { ...RESUMO_DADOS_MESTRES, posicoes: carga.total },
    motivo: null,
  };
}

const naoEncontrado = () =>
  HttpResponse.json(
    { detail: "Arquivo não encontrado. Envie a planilha de novo." },
    { status: 404 },
  );

export const handlersImportacao = [
  http.get("/api/v1/importacao", async () => {
    const parada = await aplicarEstadoTela();
    if (parada) return parada;
    return HttpResponse.json(
      estadoTela() === "vazio" ? PAINEL_IMPORTACAO_VAZIO : PAINEL_IMPORTACAO,
    );
  }),

  http.post("/api/v1/importacao/arquivos", async ({ request }) => {
    await latencia();
    const proibido = bloqueado();
    if (proibido) return proibido;
    const corpo = await request.formData();
    const arquivo = corpo.get("arquivo");
    // Checagem pela forma: no Node (testes) o File do corpo não é o File global do jsdom.
    if (arquivo === null || typeof arquivo === "string") {
      return HttpResponse.json({ detail: "Nenhum arquivo enviado." }, { status: 422 });
    }
    if (arquivo.size > LIMITE_BYTES) {
      return HttpResponse.json({ detail: "O arquivo excede o limite de 15 MB." }, { status: 413 });
    }
    const nome = arquivo.name.toLowerCase();
    if (!EXTENSOES.some((e) => nome.endsWith(e))) {
      return HttpResponse.json(
        { detail: "Formato não aceito. Envie .xlsx, .xls ou .csv." },
        { status: 422 },
      );
    }
    sequencia += 1;
    const arquivoId = `arq-${String(sequencia).padStart(4, "0")}`;
    arquivos.set(arquivoId, { erros: ERROS_DA_PREVIA.map((e) => ({ ...e })) });
    return HttpResponse.json<ArquivoRecebido>({
      arquivo_id: arquivoId,
      nome: arquivo.name,
      tamanho_bytes: arquivo.size,
      linhas: LINHAS_DO_ARQUIVO,
      abas: nome.endsWith(".csv") ? [] : ABAS_DO_ARQUIVO,
    });
  }),

  http.get("/api/v1/importacao/arquivos/:id/colunas", async ({ params }) => {
    await latencia();
    if (!arquivos.has(String(params.id))) return naoEncontrado();
    return HttpResponse.json(COLUNAS_DO_ARQUIVO);
  }),

  http.post("/api/v1/importacao/arquivos/:id/previa", async ({ params }) => {
    await latencia();
    const estado = arquivos.get(String(params.id));
    if (!estado) return naoEncontrado();
    return HttpResponse.json(previa(estado));
  }),

  http.put("/api/v1/importacao/arquivos/:id/correcoes", async ({ params, request }) => {
    await latencia();
    const estado = arquivos.get(String(params.id));
    if (!estado) return naoEncontrado();
    const corpo = (await request.json()) as { linha: number; campo: string; valor: string };
    const erro = estado.erros.find((e) => e.linha === corpo.linha && e.campo === corpo.campo);
    if (!erro) {
      return HttpResponse.json({ detail: "Linha sem erro para corrigir." }, { status: 422 });
    }
    erro.valor = corpo.valor.trim() === "" ? null : corpo.valor;
    erro.corrigido = correcaoValida(erro, corpo.valor);
    return HttpResponse.json(previa(estado));
  }),

  http.post("/api/v1/importacao/arquivos/:id/confirmar", async ({ params }) => {
    await latencia();
    const proibido = bloqueado();
    if (proibido) return proibido;
    const estado = arquivos.get(String(params.id));
    if (!estado) return naoEncontrado();
    sequencia += 1;
    const cargaId = `carga-${String(sequencia).padStart(4, "0")}`;
    cargas.set(cargaId, { total: previa(estado).prontas, leituras: 0, falha: cargaFalha() });
    return HttpResponse.json({ carga_id: cargaId }, { status: 202 });
  }),

  http.get("/api/v1/importacao/cargas/:id", async ({ params }) => {
    const id = String(params.id);
    const carga = cargas.get(id);
    if (!carga) return naoEncontrado();
    carga.leituras += 1;
    return HttpResponse.json(progresso(id, carga));
  }),

  http.get("/api/v1/importacao/modelo", async () => {
    await latencia();
    const cabecalho = "codigo;descricao;local;preco_unitario;grupo_material;criticidade";
    return new HttpResponse(`${cabecalho}\r\n`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="modelo-dados-mestres.csv"',
      },
    });
  }),
];
