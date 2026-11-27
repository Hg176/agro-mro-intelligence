/** Gaveta lateral (shadcn Sheet revisado): formulário "Adicionar material" e afins. */
import type { ReactNode } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Props = {
  aberta: boolean;
  aoMudar: (aberta: boolean) => void;
  titulo: string;
  descricao?: ReactNode;
  children: ReactNode;
  rodape?: ReactNode;
};

export function Gaveta({ aberta, aoMudar, titulo, descricao, children, rodape }: Props) {
  return (
    <Sheet open={aberta} onOpenChange={aoMudar}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{titulo}</SheetTitle>
          {descricao ? (
            <SheetDescription>{descricao}</SheetDescription>
          ) : (
            <SheetDescription className="sr-only">{titulo}</SheetDescription>
          )}
        </SheetHeader>
        <div className="flex flex-col gap-esp-16 px-esp-24">{children}</div>
        {rodape && <SheetFooter>{rodape}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
}
