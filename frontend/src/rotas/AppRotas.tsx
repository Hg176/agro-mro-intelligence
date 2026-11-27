import { lazy, Suspense, type ComponentType } from "react";
import { Navigate, Route, Routes } from "react-router";

import { Esqueleto } from "@/componentes/Esqueleto";
import { LayoutApp } from "@/layout/LayoutApp";
import { telasDoMenu } from "@/rotas/mapa";
import { ComTitulo } from "@/rotas/TituloDaAba";
import { RotaProtegida } from "@/sessao/RotaProtegida";
import { EmBreve, EmConstrucao, NaoEncontrada, PublicaEmConstrucao } from "@/telas/provisorias";

/**
 * Telas do menu já feitas (as outras mostram "Em construção" com o passo). Cada uma é um
 * pedaço separado do build (lazy por rota): a casca carrega primeiro e a tela vem quando
 * a rota abre.
 */
const TELAS: Record<string, ComponentType> = {
  "/app/visao-geral": lazy(() => import("@/telas/visao-geral/TelaVisaoGeral")),
  "/app/materiais": lazy(() => import("@/telas/materiais/TelaMateriais")),
  "/app/importar": lazy(() => import("@/telas/importar/TelaImportar")),
  "/app/planejamento": lazy(() => import("@/telas/planejamento/TelaPlanejamento")),
  "/app/regras": lazy(() => import("@/telas/regras/TelaRegras")),
  "/app/nivel-servico": lazy(() => import("@/telas/nivel-servico/TelaNivelServico")),
};

/** Enquanto o código da tela chega: o mesmo skeleton de cabeçalho das telas. */
function CarregandoTela() {
  return (
    <div role="status" aria-label="Carregando a tela" className="flex flex-col gap-3">
      <Esqueleto className="h-4 w-32" />
      <Esqueleto className="h-11 w-80 max-w-full" />
      <Esqueleto className="h-5 w-[28rem] max-w-full" />
    </div>
  );
}

/** Passo do F1 em que cada tela com design entra (docs/design/README.md). */
const PASSO: Record<string, string> = {
  "/app/visao-geral": "F1-7",
  "/app/materiais": "F1-8",
  "/app/importar": "F1-9",
  "/app/planejamento": "F1-10",
  "/app/regras": "F1-11",
  "/app/nivel-servico": "F1-12",
  "/app/tipos-movimento": "F1-13",
  "/app/tmer": "F1-14",
};

/** /_fundamentos só existe no dev: o import some do build de produção. */
const TelaFundamentos = import.meta.env.DEV
  ? lazy(() => import("@/telas/fundamentos/TelaFundamentos"))
  : null;

/** Todas as rotas do app. Usado pelo App (BrowserRouter) e pelos testes (MemoryRouter). */
export function AppRotas() {
  return (
    <Routes>
      {TelaFundamentos && (
        <Route
          path="/_fundamentos"
          element={
            <ComTitulo titulo="Fundamentos">
              <Suspense fallback={<p role="status">Carregando os fundamentos…</p>}>
                <TelaFundamentos />
              </Suspense>
            </ComTitulo>
          }
        />
      )}
      <Route
        path="/"
        element={
          <ComTitulo titulo="Inteligência para materiais">
            <PublicaEmConstrucao titulo="Agro MRO Intelligence" passo="F1-18" />
          </ComTitulo>
        }
      />
      <Route
        path="/entrar"
        element={
          <ComTitulo titulo="Entrar">
            <PublicaEmConstrucao titulo="Entrar" passo="F1-17" />
          </ComTitulo>
        }
      />

      <Route path="/app" element={<RotaProtegida />}>
        <Route element={<LayoutApp />}>
          <Route index element={<Navigate to="/app/visao-geral" replace />} />
          {telasDoMenu().map((t) => {
            const Tela = TELAS[t.caminho];
            return (
              <Route
                key={t.caminho}
                path={t.caminho}
                element={
                  <ComTitulo titulo={t.titulo}>
                    {Tela ? (
                      <Suspense fallback={<CarregandoTela />}>
                        <Tela />
                      </Suspense>
                    ) : t.emBreve ? (
                      <EmBreve titulo={t.titulo} />
                    ) : (
                      <EmConstrucao titulo={t.titulo} passo={PASSO[t.caminho] ?? "F1"} />
                    )}
                  </ComTitulo>
                }
              />
            );
          })}
          <Route
            path="/app/plano"
            element={
              <ComTitulo titulo="Seu plano">
                <EmConstrucao titulo="Seu plano" passo="F1-15" />
              </ComTitulo>
            }
          />
          <Route
            path="/app/conta"
            element={
              <ComTitulo titulo="Minha conta">
                <EmConstrucao titulo="Minha conta" passo="F1-16" />
              </ComTitulo>
            }
          />
          <Route
            path="*"
            element={
              <ComTitulo titulo="Página não encontrada">
                <NaoEncontrada dentroDoApp />
              </ComTitulo>
            }
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <ComTitulo titulo="Página não encontrada">
            <NaoEncontrada dentroDoApp={false} />
          </ComTitulo>
        }
      />
    </Routes>
  );
}
