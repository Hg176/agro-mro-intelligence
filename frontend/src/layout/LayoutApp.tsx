import type { ReactNode } from "react";
import { Outlet } from "react-router";

import { AvisoSomenteLeitura } from "@/layout/AvisoSomenteLeitura";
import { BarraSuperior } from "@/layout/BarraSuperior";
import { MenuLateral } from "@/layout/MenuLateral";

export const ID_CONTEUDO = "conteudo";

/** Pular para o conteúdo: primeiro elemento focável da página. */
export function PularParaConteudo() {
  return (
    <a
      href={`#${ID_CONTEUDO}`}
      className="sr-only z-50 rounded-lg bg-verde-700 px-esp-16 py-3 text-botao text-branco focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
    >
      Pular para o conteúdo
    </a>
  );
}

/**
 * Casca do app (VisaoGeral.dc.html): menu lateral de 248px + conteúdo com padding
 * 32/40/56 e coluna de até 1200px, gap de 28px entre blocos.
 */
export function LayoutApp({ busca }: { busca?: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <PularParaConteudo />
      <MenuLateral />
      <div className="min-w-0 flex-1 px-10 pt-8 pb-14">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-7">
          <BarraSuperior busca={busca} />
          <AvisoSomenteLeitura />
          <main id={ID_CONTEUDO} tabIndex={-1} className="flex flex-col gap-7 outline-none">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
