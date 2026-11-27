/** "Sinais para agir": cada sinal abre Materiais já filtrado. Contagens vêm da API. */
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

import type { Sinal } from "@/api/tipos";
import { inteiro } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { linkMateriais } from "@/rotas/links";

import { SINAIS, type TomSinal } from "./textos";

const COR_ICONE: Record<TomSinal, string> = {
  ruptura: "text-status-ruptura",
  alerta: "text-status-alerta",
  parado: "text-status-parado",
  neutro: "text-tinta-500",
};

/** Sinal com filtro pronto de Materiais abre o chip; os outros vão por ?sinal=. */
function destino(sinal: Sinal): string {
  return sinal.filtro
    ? linkMateriais({ filtro: sinal.filtro })
    : linkMateriais({ sinal: sinal.codigo });
}

export function Sinais({ sinais }: { sinais: Sinal[] }) {
  return (
    <section
      aria-labelledby="t-enc"
      className="min-w-0 flex-[1_1_320px] rounded-xl border border-borda bg-branco p-esp-24"
    >
      <p className="text-rotulo uppercase text-ouro-700">Encaminhamentos</p>
      <h2 id="t-enc" className="mt-1.5 font-display text-titulo-secao text-tinta-900">
        Sinais para agir
      </h2>
      <ul className="m-0 mt-4 flex list-none flex-col p-0 tabular-nums">
        {sinais.map((s) => {
          const texto = SINAIS[s.codigo];
          return (
            <li key={s.codigo}>
              <Link
                to={destino(s)}
                className="flex min-h-[52px] items-center gap-3 rounded-md px-1 text-tinta-900 no-underline hover:bg-verde-50"
              >
                <span
                  aria-hidden="true"
                  className={cn("w-4 text-center text-xs", COR_ICONE[texto.tom])}
                >
                  {texto.icone}
                </span>
                <span className="flex-1">{texto.texto}</span>
                <b className="font-semibold">{inteiro(s.posicoes)}</b>
                <ChevronRight aria-hidden="true" className="size-4 text-tinta-500" />
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-corpo-s text-tinta-500">
        Cada sinal abre a lista de posições já filtrada.
      </p>
    </section>
  );
}
