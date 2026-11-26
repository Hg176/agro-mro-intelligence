import { screen } from "@testing-library/react";

import { renderizarApp } from "../../../tests/utils/renderizar";
import { violacoesSerias } from "../../../tests/utils/acessibilidade";

describe("/_fundamentos", () => {
  // A página é carregada por import dinâmico (só no dev). Pré-carrega uma vez: o primeiro
  // import do módulo (Recharts, tabela...) é lento com a suíte inteira rodando em paralelo.
  beforeAll(async () => {
    await import("@/telas/fundamentos/TelaFundamentos");
  }, 60_000);

  it(
    "mostra todos os tokens de cor do tokens.json e as seções de componentes",
    { timeout: 30_000 },
    async () => {
      renderizarApp("/_fundamentos");
      expect(
        await screen.findByRole(
          "heading",
          { name: "Fundamentos do front-end" },
          { timeout: 15_000 },
        ),
      ).toBeInTheDocument();
      for (const nome of ["verde-300", "ouro-700", "status-ruptura-texto", "tinta-500"]) {
        expect(screen.getByText(nome)).toBeInTheDocument();
      }
      expect(screen.getByText("#66746e")).toBeInTheDocument(); // guarda-ok: confere o valor do tokens.json exibido
      for (const secao of [
        "Cores",
        "Tipografia",
        "Botões",
        "Selos",
        "KPIs",
        "Campos",
        "Tabela",
        "Grades e gráfico",
      ]) {
        expect(screen.getByRole("heading", { name: secao })).toBeInTheDocument();
      }
      expect(document.title).toBe("Fundamentos · Agro MRO Intelligence");
    },
  );

  it(
    "mostra a ação protegida bloqueada em somente leitura e demonstração",
    { timeout: 30_000 },
    async () => {
      renderizarApp("/_fundamentos");
      expect(
        await screen.findByRole(
          "button",
          { name: "Baixar Excel (somente_leitura)" },
          { timeout: 15_000 },
        ),
      ).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("button", { name: "Baixar Excel (ativo)" })).not.toHaveAttribute(
        "aria-disabled",
      );
    },
  );

  it("sem violações sérias de acessibilidade (axe; contraste fica com o Lighthouse)", async () => {
    renderizarApp("/_fundamentos");
    await screen.findByRole("heading", { name: "Fundamentos do front-end" }, { timeout: 15_000 });
    expect(await violacoesSerias()).toEqual([]);
  }, 30_000);
});
