/**
 * Cartão de uma posição (Materiais.dc.html): grupo, descrição, código em blocos, saldo
 * oficial, PP, barra saldo × PP, local, ABC de estoque e criticidade escrita.
 * Não calcula nada: largura da barra, situação e classe vêm da API.
 */
import { MapPin, Package } from "lucide-react";

import type { Posicao } from "@/api/tipos";
import { SeloStatus } from "@/componentes/Selos";
import { TRACO, codigoEmBlocos, decimal, larguraDaFracao } from "@/lib/formato";
import { cn } from "@/lib/utils";

import { CRITICIDADE } from "./textos";

const COR_BARRA: Record<Posicao["situacao"], string> = {
  ruptura: "bg-status-ruptura",
  abaixo_pp: "bg-status-alerta",
  parado: "bg-status-parado",
  saudavel: "bg-verde-700",
  sem_calculo: "bg-tinta-300",
};

/** "-2" → "−2" (sinal de menos tipográfico). Só troca o caractere, não faz conta. */
const comMenos = (texto: string) => texto.replace(/^-/, "−");

type Props = {
  posicao: Posicao;
  /** Métricas fora do ar: sem selo, sem saldo, sem PP e sem barra. */
  semMetricas: boolean;
  ordem: number;
};

export function CartaoPosicao({ posicao: p, semMetricas, ordem }: Props) {
  const grupo = [p.group_1, p.group_2].filter(Boolean).join(" · ") || "Sem grupo";
  const negativo = p.stock_quantity?.startsWith("-") ?? false;
  const largura = semMetricas ? null : larguraDaFracao(p.fracao_barra_saldo_pp);
  const crit = CRITICIDADE[p.criticality];

  return (
    <article
      aria-label={`${p.short_description}, ${p.location_name}`}
      className="flex flex-1 flex-col overflow-hidden rounded-xl border border-borda bg-branco motion-safe:animate-entrada"
      style={{ animationDelay: `${Math.min(ordem, 12) * 45}ms` }}
    >
      <div className="relative grid h-32 place-items-center border-b border-borda bg-creme-100">
        <Package aria-hidden="true" className="size-9 text-verde-300" strokeWidth={1.6} />
        <span
          role="img"
          aria-label={
            p.abc_estoque ? `ABC de estoque ${p.abc_estoque}` : "ABC de estoque não informada"
          }
          className="absolute top-3 left-3 grid size-7 place-items-center rounded-[7px] border border-borda bg-branco text-xs font-semibold text-tinta-600"
        >
          {p.abc_estoque ?? TRACO}
        </span>
        {!semMetricas && <SeloStatus situacao={p.situacao} className="absolute top-3 right-3" />}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 px-5 pt-4 pb-[18px]">
        <p className="text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-tinta-500">
          {grupo}
        </p>
        <h3 className="mt-1 text-base leading-[22px] font-semibold text-tinta-900">
          {p.short_description}
        </h3>
        <p className="text-[13px] leading-5 font-medium tracking-[0.02em] tabular-nums text-tinta-500">
          {codigoEmBlocos(p.code)}
        </p>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-rotulo uppercase text-tinta-500">Saldo oficial</p>
            {semMetricas ? (
              <p className="mt-0.5 text-lg leading-8 font-semibold text-tinta-500">Indisponível</p>
            ) : (
              <p
                className={cn(
                  "numero mt-0.5 text-titulo-m",
                  negativo ? "text-status-ruptura" : "text-tinta-900",
                )}
              >
                {p.stock_quantity === null ? TRACO : comMenos(decimal(p.stock_quantity))}{" "}
                <span className="font-sans text-[13px] leading-5 font-medium text-tinta-500">
                  {p.unit}
                </span>
              </p>
            )}
          </div>
          {!semMetricas && (
            <p className="mb-1 text-right text-[13px] leading-[18px] font-medium tabular-nums text-tinta-600">
              {p.reorder_point === null
                ? "PP: NC"
                : `PP ${decimal(p.reorder_point)} ${p.unit.toLowerCase()}`}
            </p>
          )}
        </div>

        <div aria-hidden="true" className="mt-2 h-1 rounded-[2px] bg-creme-100">
          {largura !== null && (
            <div
              className={cn(
                "h-1 origin-left rounded-[2px] motion-safe:animate-crescer",
                COR_BARRA[p.situacao],
              )}
              style={{ width: largura }}
            />
          )}
        </div>

        <div className="mt-3.5 flex items-center gap-2 border-t border-borda pt-3 text-[13px] leading-[18px] font-medium text-tinta-600">
          <MapPin aria-hidden="true" className="size-3.5" />
          <span className="flex-1">{p.location_name}</span>
          <span aria-hidden="true" className={cn("size-2 rounded-full", crit.ponto)} />
          <span>{crit.texto}</span>
        </div>
      </div>
    </article>
  );
}
