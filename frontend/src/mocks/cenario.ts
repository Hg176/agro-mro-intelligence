/**
 * Parâmetros de URL que forçam estados no mock. Dois assuntos separados, combináveis:
 *   ?mock=carregando | erro | vazio            → estado da tela (só a rota da tela)
 *   ?plano=demonstracao | ativo | somente_leitura → o que GET /me devolve (padrão: ativo)
 *   ?sessao=expirada                            → GET /me responde 401
 * Ex.: /app/materiais?plano=somente_leitura&mock=vazio
 *
 * Os handlers rodam no navegador (MSW), então leem a URL da página, não a da requisição.
 */
import { delay, HttpResponse } from "msw";

import type { EstadoPlano } from "@/api/tipos";

export type EstadoTela = "normal" | "carregando" | "erro" | "vazio";

function parametrosDaPagina(): URLSearchParams {
  return new URLSearchParams(globalThis.location?.search ?? "");
}

export function estadoTela(): EstadoTela {
  const valor = parametrosDaPagina().get("mock");
  return valor === "carregando" || valor === "erro" || valor === "vazio" ? valor : "normal";
}

export function estadoPlano(): EstadoPlano {
  const valor = parametrosDaPagina().get("plano");
  return valor === "demonstracao" || valor === "somente_leitura" ? valor : "ativo";
}

export function sessaoExpirada(): boolean {
  return parametrosDaPagina().get("sessao") === "expirada";
}

/** Latência simulada de 300 a 800 ms. Nos testes (MODE=test) é zero. */
export async function latencia(): Promise<void> {
  if (import.meta.env.MODE === "test") return;
  await delay(300 + Math.floor(Math.random() * 500));
}

/**
 * Aplica ?mock= na rota da tela. Devolve uma resposta pronta (erro) ou null para seguir.
 * "carregando" nunca responde; "vazio" é tratado por cada handler.
 */
export async function aplicarEstadoTela(): Promise<Response | null> {
  const estado = estadoTela();
  if (estado === "carregando") {
    await delay("infinite");
  }
  await latencia();
  if (estado === "erro") {
    return HttpResponse.json({ detail: "Falha simulada pelo mock (?mock=erro)." }, { status: 500 });
  }
  return null;
}
