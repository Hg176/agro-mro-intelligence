/**
 * Chip de filtro com contagem (Materiais.dc.html). A contagem vem da API.
 * Ligado: verde-700 com texto branco. Com aoRemover, mostra o × (filtro ativo como chip,
 * lei de Miller).
 */
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { inteiro } from "@/lib/formato";
import { cn } from "@/lib/utils";

type Props = {
  rotulo: string;
  contagem?: number | null;
  /** Ícone de status (● ▲ ■ ○) ou letra; já com a cor certa. */
  icone?: ReactNode;
  ativo: boolean;
  aoAlternar: () => void;
  aoRemover?: () => void;
};

export function ChipFiltro({ rotulo, contagem, icone, ativo, aoAlternar, aoRemover }: Props) {
  return (
    <span className="inline-flex items-center">
      <button
        type="button"
        aria-pressed={ativo}
        onClick={aoAlternar}
        className={cn(
          "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border px-3.5 text-sm leading-5 font-semibold",
          "transition-colors motion-reduce:transition-none",
          ativo
            ? "border-verde-700 bg-verde-700 text-branco"
            : "border-borda bg-branco text-tinta-900 hover:bg-verde-50",
          aoRemover && ativo && "rounded-r-none border-r-0 pr-2.5",
        )}
      >
        {icone && (
          <span aria-hidden="true" className={cn("text-[11px]", ativo && "text-ouro-300")}>
            {icone}
          </span>
        )}
        {rotulo}
        {contagem !== undefined && (
          <span
            className={cn(
              "rounded-pill px-2 py-0.5 text-xs leading-4 font-semibold tabular-nums",
              ativo ? "bg-branco/20 text-branco" : "bg-creme-100 text-tinta-600",
            )}
          >
            {inteiro(contagem)}
          </span>
        )}
      </button>
      {aoRemover && ativo && (
        <button
          type="button"
          onClick={aoRemover}
          aria-label={`Remover filtro ${rotulo}`}
          className="grid min-h-11 w-10 cursor-pointer place-items-center rounded-r-pill border border-l-0 border-verde-700 bg-verde-700 text-branco hover:bg-verde-800"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </span>
  );
}
