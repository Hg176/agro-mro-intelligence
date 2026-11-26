import { useQueryClient } from "@tanstack/react-query";
import { Leaf, LogOut } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router";

import { encerrarSessao } from "@/api/sessao";
import { CartaoPlano } from "@/layout/CartaoPlano";
import { cn } from "@/lib/utils";
import { GRUPOS_MENU, telasDoMenu } from "@/rotas/mapa";

const ITEM =
  "flex h-11 items-center gap-3 rounded-md px-3 text-corpo-m no-underline transition-colors motion-reduce:transition-none";

/** Menu lateral verde-900 de 248px, 4 grupos (VisaoGeral.dc.html). */
export function MenuLateral() {
  const telas = telasDoMenu();
  const cliente = useQueryClient();
  const navegar = useNavigate();

  const sair = async () => {
    try {
      await encerrarSessao();
    } finally {
      cliente.clear();
      void navegar("/entrar", { replace: true });
    }
  };

  return (
    <nav
      aria-label="Menu do sistema"
      className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col overflow-y-auto bg-verde-900 px-esp-16 pt-7 pb-esp-24 text-verde-100"
    >
      <Link to="/" className="flex items-center gap-3 px-2 text-branco no-underline">
        <span className="grid size-10 place-items-center rounded-[11px] bg-ouro-500 text-verde-950">
          <Leaf aria-hidden="true" className="size-5" />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-[17px] font-semibold">Agro MRO</span>
          <span className="mt-1 text-[9px] font-semibold tracking-[0.24em] text-ouro-300">
            INTELLIGENCE
          </span>
        </span>
      </Link>

      {GRUPOS_MENU.map((grupo, i) => (
        <div key={grupo}>
          <p
            className={cn(
              "mx-2 mb-2 text-rotulo uppercase text-verde-300",
              i === 0 ? "mt-9" : "mt-esp-24",
            )}
          >
            {grupo}
          </p>
          <ul className="m-0 list-none p-0">
            {telas
              .filter((t) => t.grupo === grupo)
              .map((t) => (
                <li key={t.caminho}>
                  <NavLink
                    to={t.caminho}
                    className={({ isActive }) =>
                      cn(
                        ITEM,
                        isActive
                          ? "bg-verde-700 font-semibold text-branco"
                          : "font-medium text-verde-100 hover:bg-verde-800",
                      )
                    }
                  >
                    <t.icone aria-hidden="true" className="size-[18px] shrink-0" />
                    {t.titulo}
                  </NavLink>
                </li>
              ))}
          </ul>
        </div>
      ))}

      <div className="min-h-10 flex-1" />
      <CartaoPlano />
      <button
        type="button"
        onClick={() => void sair()}
        className={cn(
          ITEM,
          "mt-3 w-full cursor-pointer border-0 bg-transparent text-left font-medium text-verde-100 hover:bg-verde-800",
        )}
      >
        <LogOut aria-hidden="true" className="size-[18px] shrink-0" />
        Sair
      </button>
    </nav>
  );
}
