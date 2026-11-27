/**
 * Regras e letras (rotas novas, a criar no backend). O mock faz o papel do backend: valida
 * os cortes (regras de RegrasLetras.dc.html), monta exemplo, contagens e barra com os
 * cortes salvos e controla a versão. reiniciarRegras() volta ao padrão (os testes chamam).
 *
 * - ?mock=carregando | erro → GET /api/v1/regras.
 * - ?plano=somente_leitura → escritas respondem 403.
 */
import { http, HttpResponse } from "msw";

import type {
  AbaRegras,
  CortesDoEspaco,
  PainelRegra,
  RegrasLetras,
  SegmentoBarra,
} from "@/api/tipos";

import { aplicarEstadoTela, estadoPlano, latencia } from "../cenario";
import { d } from "../dados/util";

export const CORTES_PADRAO_TELA: CortesDoEspaco = {
  abc_a_percentual: d("80"),
  abc_b_percentual: d("95"),
  pqr_saidas_q: d("3"),
  pqr_saidas_p: d("12"),
  pqr_entradas_q: d("3"),
  pqr_entradas_p: d("12"),
  item_novo_dias: 180,
};

let cortes: CortesDoEspaco = { ...CORTES_PADRAO_TELA };
let versao = 0;

export function reiniciarRegras() {
  cortes = { ...CORTES_PADRAO_TELA };
  versao = 0;
}

const n = (v: string) => Number(v);
const br = (v: string) => v.replace(".", ",");
/** Fração da barra com 4 casas, limitada a [0, 1]. */
const fracao = (v: number, max: number) => d(String(Math.min(1, Math.max(0, v / max)).toFixed(4)));

function segmentos(lista: [string, number, number][], max: number): SegmentoBarra[] {
  return lista.map(([letra, ini, fim]) => ({
    letra,
    inicio: fracao(ini, max),
    fim: fracao(fim, max),
  }));
}

function paineis(c: CortesDoEspaco): Record<AbaRegras, PainelRegra> {
  const a = n(c.abc_a_percentual);
  const b = n(c.abc_b_percentual);
  const q = n(c.pqr_saidas_q);
  const p = n(c.pqr_saidas_p);
  const eq = n(c.pqr_entradas_q);
  const ep = n(c.pqr_entradas_p);
  return {
    abc: {
      exemplo: `O Rolamento 6205 2RS sai bastante e custa caro. Ordenando todos os itens pelo valor consumido, ele cai dentro dos primeiros ${br(c.abc_a_percentual)}% do valor acumulado: classe A.`,
      contagens: { A: 98, B: 162, C: 391, D: 149, N: 12 },
      barra: segmentos(
        [
          ["A", 0, a],
          ["B", a, b],
          ["C", b, 100],
        ],
        100,
      ),
    },
    pqr_saidas: {
      exemplo: `A Correia B-52 teve 7 saídas em 7 meses, o que dá 12 por ano. Como ${br(c.pqr_saidas_p)} é o corte de P, ela é ${12 >= p ? "P (popular)." : 12 >= q ? "Q (quase popular)." : "R (rara)."}`,
      contagens: { P: 74, Q: 166, R: 257, S: 303, N: 12 },
      barra: segmentos(
        [
          ["R", 0, q],
          ["Q", q, p],
          ["P", p, 24],
        ],
        24,
      ),
    },
    pqr_entradas: {
      exemplo: `O Óleo hidráulico 68 recebeu 2 entradas em 8 meses, cerca de 3 por ano: classe ${3 >= ep ? "p." : 3 >= eq ? "q." : "r."}`,
      contagens: null,
      barra: segmentos(
        [
          ["r", 0, eq],
          ["q", eq, ep],
          ["p", ep, 24],
        ],
        24,
      ),
    },
    xyz: {
      exemplo:
        "Sem o Bico pulverizador, a pulverização para no meio da safra. Você declara Z (vital).",
      contagens: null,
      barra: null,
    },
    comprabilidade: {
      exemplo:
        "A Faca da plataforma de corte só vem do fabricante da colhedora e demora a chegar: Comprabilidade 3.",
      contagens: null,
      barra: null,
    },
    item_novo: {
      exemplo: `A Junta homocinética foi cadastrada há 37 dias e ainda não teve saída. Fica N até ${c.item_novo_dias} dias ou até a primeira saída válida.`,
      contagens: { N: 12 },
      barra: null,
    },
  };
}

const ehPadrao = (c: CortesDoEspaco) =>
  (Object.keys(CORTES_PADRAO_TELA) as (keyof CortesDoEspaco)[]).every(
    (k) => String(c[k]) === String(CORTES_PADRAO_TELA[k]),
  );

function resposta(): RegrasLetras {
  const proprio = !ehPadrao(cortes);
  return {
    conclusao: {
      tipo: proprio ? "cortes_proprios" : "padrao_agro_mro",
      valores: {
        corte_a_percentual: cortes.abc_a_percentual,
        limite_p_saidas_ano: cortes.pqr_saidas_p,
        prazo_item_novo_dias: cortes.item_novo_dias,
      },
    },
    origem: proprio ? "cliente" : "agro_mro",
    versao,
    cortes,
    padrao: CORTES_PADRAO_TELA,
    posicoes: 812,
    paineis: paineis(cortes),
    versao_classificacoes: "v3-1.0.1",
    versao_alertas: "cpf-1.1.0",
    alertas_ativos: 8,
  };
}

/** As regras de RegrasLetras.dc.html, do lado do "backend". */
function erroDosCortes(c: CortesDoEspaco): string | null {
  const a = n(c.abc_a_percentual);
  const b = n(c.abc_b_percentual);
  if (!(a > 0 && b < 100 && a < b)) {
    return "O corte de A precisa ser menor que o de B, e os dois entre 0% e 100%.";
  }
  if (!(n(c.pqr_saidas_q) > 0 && n(c.pqr_saidas_q) < n(c.pqr_saidas_p))) {
    return "O corte de Q precisa ser maior que zero e menor que o de P.";
  }
  if (!(n(c.pqr_entradas_q) > 0 && n(c.pqr_entradas_q) < n(c.pqr_entradas_p))) {
    return "O corte de q precisa ser maior que zero e menor que o de p.";
  }
  if (!Number.isInteger(c.item_novo_dias) || c.item_novo_dias < 1 || c.item_novo_dias > 3650) {
    return "Use um número inteiro de dias, de 1 a 3.650.";
  }
  return null;
}

const bloqueios = (versaoPedida: number) => {
  if (estadoPlano() === "somente_leitura") {
    return HttpResponse.json({ detail: "Seu espaço está em somente leitura." }, { status: 403 });
  }
  if (versaoPedida !== versao) {
    return HttpResponse.json(
      { detail: "Os cortes mudaram em outra tela. Atualize a página e confira antes de salvar." },
      { status: 409 },
    );
  }
  return null;
};

export const handlersRegras = [
  http.get("/api/v1/regras", async () => {
    const parada = await aplicarEstadoTela();
    if (parada) return parada;
    return HttpResponse.json(resposta());
  }),

  http.put("/api/v1/regras/cortes", async ({ request }) => {
    await latencia();
    const corpo = (await request.json()) as { cortes: CortesDoEspaco; versao: number };
    const bloqueio = bloqueios(corpo.versao);
    if (bloqueio) return bloqueio;
    const erro = erroDosCortes(corpo.cortes);
    if (erro) return HttpResponse.json({ detail: erro }, { status: 422 });
    cortes = { ...corpo.cortes };
    versao += 1;
    return HttpResponse.json(resposta());
  }),

  http.post("/api/v1/regras/cortes/restaurar", async ({ request }) => {
    await latencia();
    const corpo = (await request.json()) as { versao: number };
    const bloqueio = bloqueios(corpo.versao);
    if (bloqueio) return bloqueio;
    cortes = { ...CORTES_PADRAO_TELA };
    versao = 0;
    return HttpResponse.json(resposta());
  }),
];
