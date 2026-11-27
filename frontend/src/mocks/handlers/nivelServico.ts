/**
 * Nível de serviço (rotas novas, a criar no backend). O mock faz o papel do backend: guarda a
 * matriz (V3 ou própria), valida a meta, calcula fator z, faixa, impacto e a prévia da adoção.
 * reiniciarNivelServico() volta à V3 (os testes chamam).
 *
 * - ?mock=carregando | erro → GET /api/v1/nivel-servico.
 * - ?plano=somente_leitura → escritas respondem 403.
 */
import { http, HttpResponse } from "msw";

import type {
  CasoNivelServico,
  ConclusaoNivelServico,
  ImpactoMeta,
  MatrizNivelServico,
  PreviaAdocaoV3,
} from "@/api/tipos";

import { aplicarEstadoTela, estadoPlano, latencia } from "../cenario";
import { casosV3, faixaNivelServico, fatorZ } from "../dados/regras";
import { d } from "../dados/util";

const REFERENCIA = "agro-mro-ns-sander-v3-2026-10-10";

/** Posições por linha PQR + ABC (NivelServico.dc.html). */
const POSICOES_POR_LINHA: Record<string, number> = {
  PA: 41,
  PB: 22,
  PC: 9,
  PD: 2,
  QA: 33,
  QB: 58,
  QC: 61,
  QD: 14,
  RA: 16,
  RB: 52,
  RC: 148,
  RD: 41,
  SA: 8,
  SB: 30,
  SC: 173,
  SD: 92,
};

let casos: CasoNivelServico[] = casosV3();
let origem: MatrizNivelServico["origem"] = "v3";
let versao = 0;

export function reiniciarNivelServico() {
  casos = casosV3();
  origem = "v3";
  versao = 0;
}

const declarados = () =>
  casos.filter((c) => c.origem === "cliente" || c.origem === "v3_adotada").length;

function conclusao(): ConclusaoNivelServico {
  if (origem === "v3") {
    const a = casos
      .filter((c) => c.abc === "A" && c.service_level !== null && Number(c.service_level) > 0)
      .map((c) => Number(c.service_level));
    const z = casos
      .filter((c) => c.xyz === "Z" && c.service_level !== null)
      .map((c) => Number(c.service_level));
    return {
      tipo: "referencia_v3",
      valores: {
        meta_classe_a_minima: d(String(Math.min(...a))),
        meta_classe_a_maxima: d(String(Math.max(...a))),
        meta_maxima_z: d(String(Math.max(...z))),
      },
    };
  }
  const nc = casos.filter((c) => c.service_level === null).length;
  return nc > 0
    ? { tipo: "matriz_propria_com_nc", valores: { casos_declarados: declarados(), casos_nc: nc } }
    : { tipo: "matriz_propria_completa", valores: { casos_declarados: declarados() } };
}

function resposta(): MatrizNivelServico {
  return {
    conclusao: conclusao(),
    origem,
    versao,
    referencia: REFERENCIA,
    casos_declarados: origem === "v3" ? 0 : declarados(),
    casos,
    posicoes_por_linha: POSICOES_POR_LINHA,
  };
}

const barra = (z: string | null) =>
  z === null || Number(z) <= 0 ? null : d(String(Math.min(1, Number(z) / 3).toFixed(4)));

/** "97.5" → "0.975", sem lixo de ponto flutuante. */
const comoFracao = (percentual: number) => String(Number((percentual / 100).toFixed(4)));

function comMeta(
  c: CasoNivelServico,
  fracao: string | null,
  nova: CasoNivelServico["origem"],
): CasoNivelServico {
  const v = fracao === null ? null : Number(fracao);
  return {
    ...c,
    service_level: fracao === null ? null : d(fracao),
    fator_z:
      v === null
        ? null
        : (() => {
            const z = fatorZ(v);
            return z === null ? null : d(z);
          })(),
    faixa: v === null ? 0 : faixaNivelServico(v),
    fracao_barra_z: v === null ? null : barra(fatorZ(v)),
    origem: nova,
    diferente_da_v3: v !== null && v !== Number(c.referencia_v3),
    versao: nova === null ? null : (c.versao ?? 0) + 1,
  };
}

const META_VALIDA = /^\d{1,2}(\.\d{1,2})?$/;
const ERRO_META = "Informe zero ou uma meta de 50% a menos de 100%, com até duas casas.";

function metaPercentual(texto: string): number | null {
  if (!META_VALIDA.test(texto)) return null;
  const v = Number(texto);
  return v === 0 || (v >= 50 && v < 100) ? v : null;
}

function bloqueios(versaoPedida: number) {
  if (estadoPlano() === "somente_leitura") {
    return HttpResponse.json({ detail: "Seu espaço está em somente leitura." }, { status: 403 });
  }
  if (versaoPedida !== versao) {
    return HttpResponse.json(
      { detail: "A matriz mudou em outra tela. Atualize a página e confira antes de salvar." },
      { status: 409 },
    );
  }
  return null;
}

export const handlersNivelServico = [
  http.get("/api/v1/nivel-servico", async () => {
    const parada = await aplicarEstadoTela();
    if (parada) return parada;
    return HttpResponse.json(resposta());
  }),

  http.get("/api/v1/nivel-servico/impacto", async ({ request }) => {
    await latencia();
    const url = new URL(request.url);
    const caso = casos.find((c) => c.case === url.searchParams.get("caso"));
    if (!caso) return HttpResponse.json({ detail: "Caso não encontrado." }, { status: 404 });
    const meta = metaPercentual(url.searchParams.get("meta") ?? "");
    if (meta === null) return HttpResponse.json({ detail: ERRO_META }, { status: 422 });
    const zNovoTexto = fatorZ(Number(comoFracao(meta)));
    const zAtual = caso.fator_z;
    const variacao =
      zAtual !== null && Number(zAtual) > 0 && zNovoTexto !== null
        ? d(String(Math.round((Number(zNovoTexto) / Number(zAtual) - 1) * 100)))
        : null;
    return HttpResponse.json<ImpactoMeta>({
      caso: caso.case,
      fator_z_atual: zAtual,
      fator_z_novo: zNovoTexto === null ? null : d(zNovoTexto),
      variacao_percentual: variacao,
      fracao_barra_atual: barra(zAtual),
      fracao_barra_nova: barra(zNovoTexto),
    });
  }),

  http.put("/api/v1/nivel-servico/casos/:caso", async ({ params, request }) => {
    await latencia();
    const corpo = (await request.json()) as { meta_percentual: string; versao: number };
    const bloqueio = bloqueios(corpo.versao);
    if (bloqueio) return bloqueio;
    const alvo = String(params.caso);
    if (!casos.some((c) => c.case === alvo)) {
      return HttpResponse.json({ detail: "Caso não encontrado." }, { status: 404 });
    }
    const meta = metaPercentual(corpo.meta_percentual);
    if (meta === null) return HttpResponse.json({ detail: ERRO_META }, { status: 422 });
    if (origem === "v3") {
      // 1º caso salvo: inicia a matriz própria e os outros 74 ficam NC.
      casos = casos.map((c) => comMeta(c, null, null));
      origem = "propria";
    }
    casos = casos.map((c) => (c.case === alvo ? comMeta(c, comoFracao(meta), "cliente") : c));
    versao += 1;
    return HttpResponse.json(resposta());
  }),

  http.delete("/api/v1/nivel-servico/casos/:caso", async ({ params, request }) => {
    await latencia();
    const pedida = Number(new URL(request.url).searchParams.get("versao"));
    const bloqueio = bloqueios(pedida);
    if (bloqueio) return bloqueio;
    casos = casos.map((c) => (c.case === String(params.caso) ? comMeta(c, null, null) : c));
    versao += 1;
    return HttpResponse.json(resposta());
  }),

  http.get("/api/v1/nivel-servico/adocao-v3", async () => {
    await latencia();
    const n = declarados();
    return HttpResponse.json<PreviaAdocaoV3>({
      casos_a_incluir: 75 - n,
      configuracoes_a_substituir: n,
      valores_diferentes: casos.filter(
        (c) => c.service_level === null || c.service_level !== c.referencia_v3,
      ).length,
      niveis_manuais_preservados: 6,
    });
  }),

  http.post("/api/v1/nivel-servico/adocao-v3", async ({ request }) => {
    await latencia();
    const corpo = (await request.json()) as { versao: number };
    const bloqueio = bloqueios(corpo.versao);
    if (bloqueio) return bloqueio;
    casos = casos.map((c) => comMeta(c, c.referencia_v3, "v3_adotada"));
    origem = "propria";
    versao += 1;
    return HttpResponse.json(resposta());
  }),
];
