/** Faixa "Implantação 4 de 5" (lei de Zeigarnik). Contagem e etapas vêm da API. */
import { Check } from "lucide-react";
import { Link } from "react-router";

import type { VisaoGeral } from "@/api/tipos";
import { inteiro } from "@/lib/formato";

import { LINK_ETAPA, NOME_ETAPA } from "./textos";

export function Implantacao({ implantacao }: { implantacao: VisaoGeral["implantacao"] }) {
  const pendente = implantacao.etapas.find((e) => !e.concluida) ?? null;
  return (
    <section
      aria-label="Implantação"
      className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[14px] bg-ouro-100 px-5 py-3.5"
    >
      <span className="font-semibold text-ouro-700 tabular-nums">
        Implantação {inteiro(implantacao.concluidas)} de {inteiro(implantacao.total)}
      </span>
      <ol className="m-0 flex flex-[1_1_520px] list-none flex-wrap gap-x-[18px] gap-y-2 p-0 text-sm text-tinta-600">
        {implantacao.etapas.map((e) => (
          <li
            key={e.id}
            className={
              e.concluida
                ? "flex items-center gap-1.5"
                : "flex items-center gap-1.5 font-semibold text-tinta-900"
            }
          >
            {e.concluida ? (
              <span
                aria-hidden="true"
                className="grid size-[18px] place-items-center rounded-full bg-verde-700"
              >
                <Check className="size-[11px] text-branco" strokeWidth={3.5} />
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="size-[18px] rounded-full border-2 border-dashed border-ouro-600"
              />
            )}
            {NOME_ETAPA[e.id]}
            <span className="sr-only">{e.concluida ? " (concluída)" : " (pendente)"}</span>
          </li>
        ))}
      </ol>
      {pendente && (
        <Link
          to={LINK_ETAPA[pendente.id].para}
          className="inline-flex min-h-11 items-center text-sm leading-5 font-semibold text-verde-700 no-underline hover:text-verde-800"
        >
          {LINK_ETAPA[pendente.id].texto}
        </Link>
      )}
    </section>
  );
}
