/**
 * Passos ligados por linha (lei da Conectividade uniforme): Importar dados e Landing.
 * O passo atual tem aria-current="step". `atual` = passos.length marca todos como concluídos
 * (ex.: "Concluído" do Importar). Cores do ImportarDados.dc.html.
 */
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  passos: string[];
  /** Índice do passo atual (0 = primeiro). */
  atual: number;
  rotulo?: string;
};

export function Stepper({ passos, atual, rotulo = "Passos" }: Props) {
  return (
    <ol aria-label={rotulo} className="m-0 flex list-none items-center gap-0 p-0">
      {passos.map((passo, i) => {
        const concluido = i < atual;
        const corrente = i === atual;
        return (
          <li
            key={passo}
            aria-current={corrente ? "step" : undefined}
            className="flex flex-1 items-center last:flex-none"
          >
            <span className="flex items-center gap-2.5">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold",
                  concluido && "bg-verde-700 text-branco",
                  corrente && "border-2 border-verde-700 bg-verde-100 text-verde-700",
                  !concluido && !corrente && "border-[1.5px] border-borda bg-branco text-tinta-500",
                )}
              >
                {concluido ? <Check aria-hidden="true" className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm leading-5 whitespace-nowrap",
                  corrente || concluido
                    ? "font-semibold text-tinta-900"
                    : "font-medium text-tinta-500",
                )}
              >
                {passo}
                {concluido && <span className="sr-only"> (concluído)</span>}
              </span>
            </span>
            {i < passos.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "mx-3 h-0.5 min-w-6 flex-1 rounded-[1px]",
                  concluido ? "bg-verde-700" : "bg-borda",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
