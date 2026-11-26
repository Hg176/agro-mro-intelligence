/** Estado vazio: ícone, título, texto e uma ação. */
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  icone: LucideIcon;
  titulo: string;
  texto?: ReactNode;
  acao?: ReactNode;
  className?: string;
};

export function EstadoVazio({ icone: Icone, titulo, texto, acao, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-borda bg-branco px-esp-24 py-esp-48 text-center",
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-full bg-verde-50 text-verde-700">
        <Icone aria-hidden="true" className="size-6" />
      </span>
      <h2 className="text-titulo-s text-tinta-900">{titulo}</h2>
      {texto && <p className="max-w-md text-corpo-m text-tinta-600">{texto}</p>}
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  );
}
