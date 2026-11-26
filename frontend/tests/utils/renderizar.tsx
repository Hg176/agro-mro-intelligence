import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";

import { LayoutApp } from "@/layout/LayoutApp";
import { AppRotas } from "@/rotas/AppRotas";
import { RotaProtegida } from "@/sessao/RotaProtegida";

/** Cliente de consultas para teste: sem nova tentativa. */
export function clienteDeTeste() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

/** Mostra a rota atual (para conferir redirecionamentos). */
export function RotaAtual() {
  const l = useLocation();
  return <output data-testid="rota-atual">{`${l.pathname}${l.search}`}</output>;
}

type Opcoes = {
  /** Parâmetros da PÁGINA lidos pelo mock (?plano=, ?mock=, ?sessao=). */
  pagina?: string;
};

/** Renderiza o app inteiro numa rota, com o mock. */
export function renderizarApp(rota: string, { pagina = "" }: Opcoes = {}) {
  history.replaceState(null, "", `/${pagina}`);
  const cliente = clienteDeTeste();
  const resultado = render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[rota]}>
        <AppRotas />
        <RotaAtual />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...resultado, cliente };
}

/** Renderiza um conteúdo dentro da área protegida (sessão do mock + casca). */
export function renderizarNaCasca(conteudo: ReactNode, { pagina = "" }: Opcoes = {}) {
  history.replaceState(null, "", `/${pagina}`);
  const cliente = clienteDeTeste();
  const resultado = render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={["/app/teste"]}>
        <Routes>
          <Route path="/app" element={<RotaProtegida />}>
            <Route element={<LayoutApp />}>
              <Route path="/app/teste" element={conteudo} />
            </Route>
          </Route>
          <Route path="*" element={null} />
        </Routes>
        <RotaAtual />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...resultado, cliente };
}
