import { Bell, CalendarDays, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { haDias, inteiro, periodo } from "@/lib/formato";
import { useSessao } from "@/sessao/contexto";

const CHIP =
  "inline-flex h-12 items-center gap-2 rounded-md border border-borda bg-branco px-esp-16 text-sm font-medium text-tinta-900";

/**
 * Barra superior (VisaoGeral.dc.html): busca global (F1-6), locais, período,
 * "Atualizado há N dias", notificações e avatar que leva a Minha conta.
 * Locais e período são informativos no F1: o filtro por local/período não tem design.
 */
export function BarraSuperior({ busca }: { busca?: ReactNode }) {
  const { usuario, espaco } = useSessao();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative z-20 min-w-0 flex-[1_1_320px] md:max-w-[460px]">{busca}</div>
      <span className={CHIP}>
        <MapPin aria-hidden="true" className="size-4 text-tinta-500" />
        Todos os locais ({inteiro(espaco.locais)})
      </span>
      {espaco.periodo && (
        <span className={`${CHIP} tabular-nums`}>
          <CalendarDays aria-hidden="true" className="size-4 text-tinta-500" />
          {periodo(espaco.periodo)}
        </span>
      )}
      <span className="flex-1" />
      {espaco.atualizacao && (
        <span className="inline-flex h-9 items-center gap-2 rounded-pill bg-verde-100 px-3.5 text-[13px] leading-[18px] font-semibold text-verde-700">
          <span aria-hidden="true" className="size-[7px] rounded-full bg-verde-700" />
          Atualizado {haDias(espaco.atualizacao.ha_dias)}
        </span>
      )}
      <button
        type="button"
        aria-label="Notificações"
        aria-disabled="true"
        title="Notificações: em breve"
        className="grid size-12 cursor-not-allowed place-items-center rounded-lg border border-borda bg-branco text-tinta-900"
      >
        <Bell aria-hidden="true" className="size-5" />
      </button>
      <Link
        to="/app/conta"
        aria-label={`${usuario.iniciais} · Minha conta (${usuario.nome})`}
        className="grid size-11 place-items-center rounded-full bg-ouro-100 text-sm font-semibold text-ouro-700 no-underline"
      >
        {usuario.iniciais}
      </Link>
    </div>
  );
}
