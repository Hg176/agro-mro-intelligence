/**
 * Janela central (shadcn Dialog revisado), como o modal "Adicionar material" do design
 * (Materiais.dc.html): rótulo ouro-700, título, conteúdo com rolagem própria e rodapé.
 * Esc fecha, exceto quando um combobox aberto dentro dela está usando o Esc para fechar a
 * própria lista.
 */
import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  aberta: boolean;
  aoMudar: (aberta: boolean) => void;
  /** Rótulo acima do título, em caixa alta (ex.: "Novo cadastro"). */
  rotulo?: string;
  titulo: string;
  descricao?: ReactNode;
  children: ReactNode;
  rodape?: ReactNode;
  /** Ex.: "sm:max-w-[720px]". */
  className?: string;
};

/** Combobox com a lista aberta: o Esc é dele, não da janela. */
function comboboxAbertoEmFoco(): boolean {
  const ativo = document.activeElement;
  return (
    ativo?.getAttribute("role") === "combobox" && ativo.getAttribute("aria-expanded") === "true"
  );
}

export function Janela({
  aberta,
  aoMudar,
  rotulo,
  titulo,
  descricao,
  children,
  rodape,
  className,
}: Props) {
  return (
    <Dialog open={aberta} onOpenChange={aoMudar}>
      <DialogContent
        className={cn("max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto px-8 pt-7 pb-8", className)}
        onEscapeKeyDown={(e) => {
          if (comboboxAbertoEmFoco()) e.preventDefault();
        }}
      >
        <DialogHeader className="gap-1.5">
          {rotulo && <p className="text-rotulo uppercase text-ouro-700">{rotulo}</p>}
          <DialogTitle className="text-titulo-m">{titulo}</DialogTitle>
          {descricao ? (
            <DialogDescription>{descricao}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{titulo}</DialogDescription>
          )}
        </DialogHeader>
        <div className="mt-6">{children}</div>
        {rodape && <DialogFooter className="mt-6">{rodape}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
