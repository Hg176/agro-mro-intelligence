import { useEffect, type ReactNode } from "react";

import { tituloDaAba } from "@/rotas/mapa";

/** Define o título da aba ("Visão geral · Agro MRO Intelligence") e mostra a página. */
export function ComTitulo({ titulo, children }: { titulo: string; children: ReactNode }) {
  useEffect(() => {
    document.title = tituloDaAba(titulo);
  }, [titulo]);
  return children;
}
