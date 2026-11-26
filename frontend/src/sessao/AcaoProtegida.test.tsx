import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AcaoProtegida } from "@/sessao/AcaoProtegida";

import { renderizarNaCasca } from "../../tests/utils/renderizar";

function Exemplo({ aoImportar }: { aoImportar: () => void }) {
  return (
    <AcaoProtegida permissao="importar">
      <button type="button" onClick={aoImportar}>
        Importar planilha
      </button>
    </AcaoProtegida>
  );
}

describe("AcaoProtegida", () => {
  it("?plano=somente_leitura desabilita o botão e mostra o motivo", async () => {
    const aoImportar = vi.fn();
    renderizarNaCasca(<Exemplo aoImportar={aoImportar} />, { pagina: "?plano=somente_leitura" });
    const botao = await screen.findByRole("button", { name: "Importar planilha" });
    expect(botao).toHaveAttribute("aria-disabled", "true");
    expect(botao).toHaveAccessibleDescription("Seu espaço está em somente leitura");
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent(
      "Seu espaço está em somente leitura",
    );
    await userEvent.click(botao);
    expect(aoImportar).not.toHaveBeenCalled();
  });

  it("bloqueado continua alcançável pelo teclado (para ler o motivo)", async () => {
    renderizarNaCasca(<Exemplo aoImportar={vi.fn()} />, { pagina: "?plano=somente_leitura" });
    const botao = await screen.findByRole("button", { name: "Importar planilha" });
    expect(botao).not.toBeDisabled();
    botao.focus();
    expect(botao).toHaveFocus();
  });

  it("?plano=ativo libera o botão", async () => {
    const aoImportar = vi.fn();
    renderizarNaCasca(<Exemplo aoImportar={aoImportar} />, { pagina: "?plano=ativo" });
    const botao = await screen.findByRole("button", { name: "Importar planilha" });
    expect(botao).not.toHaveAttribute("aria-disabled");
    await userEvent.click(botao);
    expect(aoImportar).toHaveBeenCalledTimes(1);
  });

  it("o bloqueio segue a permissão, não o estado do plano", async () => {
    // Demonstração: importar liberado, exportar_excel bloqueado (permissões do mock).
    renderizarNaCasca(
      <>
        <AcaoProtegida permissao="importar">
          <button type="button">Importar</button>
        </AcaoProtegida>
        <AcaoProtegida permissao="exportar_excel">
          <button type="button">Baixar Excel</button>
        </AcaoProtegida>
      </>,
      { pagina: "?plano=demonstracao" },
    );
    expect(await screen.findByRole("button", { name: "Importar" })).not.toHaveAttribute(
      "aria-disabled",
    );
    const excel = screen.getByRole("button", { name: "Baixar Excel" });
    expect(excel).toHaveAttribute("aria-disabled", "true");
    expect(excel).toHaveAccessibleDescription("Assine para liberar tudo");
  });
});
