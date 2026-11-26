/**
 * KPI (VisaoGeral.dc.html): rótulo, número grande (numero-l), apoio e link "Ver … →".
 * Agrupados por tema (lei da Proximidade): Dinheiro, Saúde do estoque, Movimento.
 * O número chega pronto (já formatado a partir da API); indisponível mostra o motivo.
 */
import type { ReactNode } from "react";
import { Link } from "react-router";

import { cn } from "@/lib/utils";

export type TomKpi = "neutro" | "ruptura" | "alerta" | "parado";

const TOM: Record<TomKpi, string> = {
  neutro: "text-tinta-900",
  ruptura: "text-status-ruptura",
  alerta: "text-status-alerta",
  parado: "text-status-parado",
};

type Props = {
  rotulo: string;
  /** Valor já formatado (formato.ts). null = indisponível (mostra o motivo). */
  valor: string | null;
  /** Motivo quando valor = null (ex.: "Sem preço no cadastro"). */
  motivo?: string | null;
  apoio?: ReactNode;
  link?: { texto: string; para: string };
  /** Cor do número (≥ 24px: status-* passa contraste como texto grande). */
  tom?: TomKpi;
};

export function CartaoKpi({ rotulo, valor, motivo, apoio, link, tom = "neutro" }: Props) {
  return (
    <div className="flex flex-col rounded-xl border border-borda bg-branco px-[22px] py-5">
      <p className="text-rotulo uppercase text-tinta-500">{rotulo}</p>
      {valor === null ? (
        <p className="mt-1.5 text-corpo-m text-tinta-600">
          <span aria-hidden="true">○ </span>
          {motivo ?? "Sem cálculo"}
        </p>
      ) : (
        <p className={cn("numero mt-1.5 text-numero-l", TOM[tom])}>{valor}</p>
      )}
      {apoio && <p className="mt-1 text-corpo-s text-tinta-500">{apoio}</p>}
      {link && (
        <Link
          to={link.para}
          className="mt-2 inline-flex min-h-8 items-center self-start text-sm leading-5 font-semibold text-verde-700 no-underline hover:text-verde-800"
        >
          {link.texto}
        </Link>
      )}
    </div>
  );
}

/** Grupo de KPIs com título do tema (h2 em caixa alta, tinta-500). */
export function GrupoKpi({
  titulo,
  colunas = 2,
  className,
  children,
}: {
  titulo: string;
  colunas?: 1 | 2;
  className?: string;
  children: ReactNode;
}) {
  const id = `grupo-kpi-${titulo.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section aria-labelledby={id} className={cn("min-w-0", className)}>
      <h2 id={id} className="mb-2.5 text-rotulo uppercase text-tinta-500">
        {titulo}
      </h2>
      <div className={cn("grid gap-esp-16", colunas === 2 ? "grid-cols-2" : "grid-cols-1")}>
        {children}
      </div>
    </section>
  );
}
