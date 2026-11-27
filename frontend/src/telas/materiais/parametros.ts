/**
 * Busca e filtros de Materiais na URL (?q=&filtro=&abc=&pqr=&sinal=&pagina=), para os links
 * da Visão geral, da busca global e dos cartões funcionarem. Valor inválido é ignorado.
 */
import { useSearchParams } from "react-router";

import type { ParametrosMateriais } from "@/api/materiais";
import type { ClasseAbc, ClassePqr, CodigoSinal, FiltroMateriais } from "@/api/tipos";

const FILTROS: readonly FiltroMateriais[] = [
  "abaixo_pp",
  "saldo_negativo",
  "parados",
  "classe_a",
  "sem_calculo",
];
const ABC: readonly ClasseAbc[] = ["A", "B", "C", "D", "N"];
const PQR: readonly ClassePqr[] = ["P", "Q", "R", "S", "N"];
const SINAIS: readonly CodigoSinal[] = [
  "saldo_negativo",
  "reposicao_indicada",
  "acima_maximo",
  "sem_giro",
  "historico_insuficiente",
  "preco_ausente",
  "parametro_cliente",
];

function umDe<T extends string>(valor: string | null, opcoes: readonly T[]): T | null {
  return valor !== null && (opcoes as readonly string[]).includes(valor) ? (valor as T) : null;
}

export function lerParametros(busca: URLSearchParams): ParametrosMateriais {
  const pagina = Number.parseInt(busca.get("pagina") ?? "1", 10);
  return {
    q: busca.get("q") ?? "",
    filtro: umDe(busca.get("filtro"), FILTROS),
    abc: umDe(busca.get("abc"), ABC),
    pqr: umDe(busca.get("pqr"), PQR),
    sinal: umDe(busca.get("sinal"), SINAIS),
    pagina: Number.isInteger(pagina) && pagina > 0 ? pagina : 1,
  };
}

export type MudancaParametros = Partial<ParametrosMateriais>;

/** Lê e muda os parâmetros. Mudar busca ou filtro volta para a página 1. */
export function useParametrosMateriais() {
  const [busca, setBusca] = useSearchParams();
  const parametros = lerParametros(busca);

  const mudar = (mudanca: MudancaParametros, { substituir = false } = {}) => {
    const novo = { ...parametros, pagina: 1, ...mudanca };
    const proxima = new URLSearchParams(busca);
    for (const chave of ["q", "filtro", "abc", "pqr", "sinal"] as const) {
      const valor = novo[chave];
      if (valor) proxima.set(chave, valor);
      else proxima.delete(chave);
    }
    if (novo.pagina > 1) proxima.set("pagina", String(novo.pagina));
    else proxima.delete("pagina");
    setBusca(proxima, { replace: substituir });
  };

  const limpar = () => mudar({ q: "", filtro: null, abc: null, pqr: null, sinal: null, pagina: 1 });

  return { parametros, mudar, limpar };
}
