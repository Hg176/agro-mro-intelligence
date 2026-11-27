/** Campo, CampoSenha e Confirmacao (inclusive a variante que exige digitar EXCLUIR). */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Campo, CampoSenha } from "@/componentes/Campo";
import { Confirmacao } from "@/componentes/Confirmacao";

describe("Campo", () => {
  it("rótulo acima e ligado ao campo", () => {
    render(<Campo rotulo="E-mail" />);
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
  });

  it("erro colado ao campo, aria-invalid, borda de erro e tremida com motion-safe", () => {
    const { container } = render(<Campo rotulo="E-mail" erro="E-mail inválido." />);
    const campo = screen.getByLabelText("E-mail");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAccessibleDescription("E-mail inválido.");
    expect(campo).toHaveClass("aria-invalid:border-status-ruptura");
    expect(container.innerHTML).toContain("motion-safe:animate-tremida");
  });

  it("ajuda vira descrição acessível", () => {
    render(<Campo rotulo="Código" ajuda="Com ou sem espaços." />);
    expect(screen.getByLabelText("Código")).toHaveAccessibleDescription("Com ou sem espaços.");
  });
});

describe("CampoSenha", () => {
  it("o olho mostra e esconde a senha", async () => {
    render(<CampoSenha rotulo="Senha" />);
    const campo = screen.getByLabelText("Senha");
    expect(campo).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(campo).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ocultar senha" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("Confirmacao", () => {
  it("confirma uma ação comum", async () => {
    const confirmar = vi.fn();
    render(
      <Confirmacao
        aberta
        aoMudar={vi.fn()}
        titulo="Isso recalcula o estoque todo"
        descricao="Os cortes novos valem para todas as posições."
        textoConfirmar="Salvar e recalcular"
        aoConfirmar={confirmar}
      />,
    );
    expect(
      screen.getByRole("alertdialog", { name: "Isso recalcula o estoque todo" }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Salvar e recalcular" }));
    expect(confirmar).toHaveBeenCalledTimes(1);
  });

  it("só libera ao digitar EXCLUIR exatamente", async () => {
    const confirmar = vi.fn();
    render(
      <Confirmacao
        aberta
        aoMudar={vi.fn()}
        titulo="Excluir sua conta"
        descricao="Isso não pode ser desfeito."
        textoConfirmar="Excluir conta"
        variante="perigo"
        palavraExigida="EXCLUIR"
        aoConfirmar={confirmar}
      />,
    );
    const botao = screen.getByRole("button", { name: "Excluir conta" });
    expect(botao).toBeDisabled();
    const campo = screen.getByLabelText("Digite EXCLUIR para confirmar");
    await userEvent.type(campo, "excluir");
    expect(botao).toBeDisabled();
    await userEvent.clear(campo);
    await userEvent.type(campo, "EXCLUIR");
    expect(botao).toBeEnabled();
    await userEvent.click(botao);
    expect(confirmar).toHaveBeenCalledTimes(1);
  });

  it("Cancelar fecha sem confirmar", async () => {
    const confirmar = vi.fn();
    const mudar = vi.fn();
    render(
      <Confirmacao
        aberta
        aoMudar={mudar}
        titulo="Remover código"
        descricao="O código Z61 volta para a lista de pendentes."
        textoConfirmar="Remover"
        aoConfirmar={confirmar}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(confirmar).not.toHaveBeenCalled();
    expect(mudar).toHaveBeenCalledWith(false);
  });
});
