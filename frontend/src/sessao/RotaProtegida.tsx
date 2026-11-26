import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router";

import { aoExpirarSessao, ApiErro } from "@/api/cliente";
import { useConsultaSessao } from "@/api/hooks";
import { CascaCarregando } from "@/layout/CascaCarregando";
import { ContextoSessao } from "@/sessao/contexto";

/** "/entrar?volta=/app/materiais%3Fq%3D..." a partir da rota atual. */
export function caminhoEntrar(volta: string): string {
  return `/entrar?volta=${encodeURIComponent(volta)}`;
}

/**
 * Protege /app/*:
 * - carregando GET /me → skeleton da casca;
 * - /me 401 → /entrar?volta=<rota atual>;
 * - qualquer outra rota que responder 401 → limpa o cache e vai para /entrar (cliente.ts avisa);
 * - outro erro → mensagem com "Tentar de novo" (nunca repete sozinho).
 */
export function RotaProtegida() {
  const consulta = useConsultaSessao();
  const cliente = useQueryClient();
  const navegar = useNavigate();
  const local = useLocation();
  const rotaAtual = `${local.pathname}${local.search}`;

  const rotaRef = useRef(rotaAtual);
  useEffect(() => {
    rotaRef.current = rotaAtual;
  }, [rotaAtual]);

  useEffect(
    () =>
      aoExpirarSessao(() => {
        const volta = rotaRef.current;
        cliente.clear();
        void navegar(caminhoEntrar(volta), { replace: true });
      }),
    [cliente, navegar],
  );

  if (consulta.isPending) {
    return <CascaCarregando />;
  }

  if (consulta.isError) {
    if (consulta.error instanceof ApiErro && consulta.error.sessaoExpirada) {
      return <Navigate to={caminhoEntrar(rotaAtual)} replace />;
    }
    const mensagem =
      consulta.error instanceof ApiErro
        ? consulta.error.mensagem
        : "Não foi possível abrir sua sessão.";
    return (
      <main className="grid min-h-screen place-items-center bg-background p-esp-24">
        <div className="max-w-md rounded-xl border border-borda bg-branco p-esp-24" role="alert">
          <h1 className="font-display text-titulo-s text-tinta-900">
            Não foi possível abrir sua sessão
          </h1>
          <p className="mt-esp-8 text-corpo-m text-tinta-600">{mensagem}</p>
          <button
            type="button"
            onClick={() => void consulta.refetch()}
            className="mt-esp-16 inline-flex min-h-11 items-center rounded-lg bg-verde-700 px-esp-24 text-botao text-branco hover:bg-verde-800"
          >
            Tentar de novo
          </button>
        </div>
      </main>
    );
  }

  return (
    <ContextoSessao.Provider value={consulta.data}>
      <Outlet />
    </ContextoSessao.Provider>
  );
}
