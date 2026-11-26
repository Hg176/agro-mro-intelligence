import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { limparBuscasRecentes } from "@/componentes/busca/recentes";

import { violacoesSerias } from "../../../tests/utils/acessibilidade";
import { renderizarApp } from "../../../tests/utils/renderizar";

const rotaAtual = () => screen.getByTestId("rota-atual").textContent;

/**
 * Acha a opção pelo texto visível. O <mark> do trecho encontrado separa o nome acessível
 * no cálculo do jsdom ("Óle o"); no navegador ele é inline e o nome sai inteiro.
 */
const comTexto = (texto: string) => (_: string, el: Element) =>
  el.getAttribute("role") === "option" && (el.textContent ?? "").includes(texto);

async function abrirBusca() {
  renderizarApp("/app/visao-geral");
  const campo = await screen.findByRole("combobox", { name: "Buscar material ou tela" });
  return { campo, usuario: userEvent.setup() };
}

afterEach(() => limparBuscasRecentes());

describe("BuscaGlobal", () => {
  it("combobox ARIA fechado no início", async () => {
    const { campo } = await abrirBusca();
    expect(campo).toHaveAttribute("aria-expanded", "false");
    expect(campo).toHaveAttribute("aria-autocomplete", "list");
    expect(campo).toHaveAttribute("autocomplete", "off");
    expect(campo).toHaveAttribute("placeholder", "Buscar material por código ou descrição");
  });

  it("sem texto: 3 atalhos com a contagem da API", async () => {
    const { campo, usuario } = await abrirBusca();
    await usuario.click(campo);
    expect(campo).toHaveAttribute("aria-expanded", "true");
    const lista = screen.getByRole("listbox", { name: "Resultados da busca" });
    expect(campo).toHaveAttribute("aria-controls", lista.id);
    const atalhos = await within(lista).findAllByRole("option");
    expect(atalhos.map((o) => o.textContent)).toEqual([
      "▲Posições abaixo do ponto de pedido23",
      "●Saldo negativo8",
      "■Parados há mais de 180 dias214",
    ]);
  });

  it("ignora acento e marca o trecho encontrado", async () => {
    const { campo, usuario } = await abrirBusca();
    await usuario.type(campo, "oleo");
    const opcao = await screen.findByRole("option", { name: comTexto("Óleo hidráulico 68") });
    expect(within(opcao).getByText("Óleo", { selector: "mark" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Posições · 1" })).toBeInTheDocument();
  });

  it("código com espaços acha a posição e marca os dígitos", async () => {
    const { campo, usuario } = await abrirBusca();
    await usuario.type(campo, "0012 3456");
    const opcao = await screen.findByRole("option", { name: comTexto("Rolamento 6205 2RS") });
    expect(within(opcao).getByText("0012 3456", { selector: "mark" })).toBeInTheDocument();
    // Busca por código não sugere telas.
    expect(screen.queryByRole("group", { name: "Ir para" })).not.toBeInTheDocument();
  });

  it("código sem espaços também acha", async () => {
    const { campo, usuario } = await abrirBusca();
    await usuario.type(campo, "000000451180");
    expect(
      await screen.findByRole("option", { name: comTexto("Correia B-52") }),
    ).toBeInTheDocument();
  });

  it("mostra até 6 posições com o total e até 3 telas", async () => {
    const { campo, usuario } = await abrirBusca();
    await usuario.type(campo, "a");
    const grupo = await screen.findByRole("group", { name: /^Posições · 6 de \d+$/ });
    expect(within(grupo).getAllByRole("option")).toHaveLength(6);
    const telas = screen.queryByRole("group", { name: "Ir para" });
    if (telas) expect(within(telas).getAllByRole("option").length).toBeLessThanOrEqual(3);
  });

  it("acha telas pelo nome e pelas palavras", async () => {
    const { campo, usuario } = await abrirBusca();
    await usuario.type(campo, "pqr");
    const telas = await screen.findByRole("group", { name: "Ir para" });
    expect(
      within(telas).getByRole("option", { name: comTexto("Regras e letras") }),
    ).toBeInTheDocument();
  });

  it("teclado: ↓ move a opção ativa (aria-activedescendant) e Enter abre", async () => {
    const { campo, usuario } = await abrirBusca();
    await usuario.type(campo, "filtro");
    const primeira = await screen.findByRole("option", { name: comTexto("Filtro de ar primário") });
    expect(primeira).toHaveAttribute("aria-selected", "true");
    expect(campo).toHaveAttribute("aria-activedescendant", primeira.id);
    await usuario.keyboard("{ArrowDown}");
    const segunda = screen.getByRole("option", {
      name: comTexto("Filtro separador de combustível"),
    });
    expect(segunda).toHaveAttribute("aria-selected", "true");
    expect(campo).toHaveAttribute("aria-activedescendant", segunda.id);
    await usuario.keyboard("{ArrowUp}{ArrowUp}");
    expect(screen.getByRole("option", { name: comTexto("Filtro separador") })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await usuario.keyboard("{Enter}");
    await waitFor(() => expect(rotaAtual()).toBe("/app/materiais?q=000000660410"));
    expect(campo).toHaveAttribute("aria-expanded", "false");
  });

  it("Esc fecha; Esc de novo limpa", async () => {
    const { campo, usuario } = await abrirBusca();
    await usuario.type(campo, "correia");
    await screen.findByRole("option", { name: comTexto("Correia B-52") });
    await usuario.keyboard("{Escape}");
    expect(campo).toHaveAttribute("aria-expanded", "false");
    expect(campo).toHaveValue("correia");
    await usuario.keyboard("{Escape}");
    expect(campo).toHaveValue("");
  });

  it("Nada encontrado", async () => {
    const { campo, usuario } = await abrirBusca();
    await usuario.type(campo, "xyzw");
    expect(await screen.findByText("Nada encontrado para “xyzw”")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Confira o código (com ou sem espaços, tanto faz) ou busque por parte da descrição.",
      ),
    ).toBeInTheDocument();
  });

  it("guarda a busca escolhida em Buscas recentes (só na memória)", async () => {
    const { campo, usuario } = await abrirBusca();
    await usuario.type(campo, "correia");
    await usuario.click(await screen.findByRole("option", { name: comTexto("Correia B-52") }));
    await usuario.clear(campo);
    await usuario.click(campo);
    expect(await screen.findByRole("group", { name: "Buscas recentes" })).toHaveTextContent(
      "Correia B-52",
    );
  });

  it("atalho leva a Materiais com o filtro", async () => {
    const { campo, usuario } = await abrirBusca();
    await usuario.click(campo);
    await usuario.click(await screen.findByRole("option", { name: comTexto("Saldo negativo") }));
    await waitFor(() => expect(rotaAtual()).toBe("/app/materiais?filtro=saldo_negativo"));
  });

  it("Ver tudo em Materiais leva a busca para Materiais", async () => {
    const { campo, usuario } = await abrirBusca();
    await usuario.type(campo, "rolamento");
    await usuario.click(await screen.findByRole("button", { name: "Ver tudo em Materiais →" }));
    await waitFor(() => expect(rotaAtual()).toBe("/app/materiais?q=rolamento"));
  });

  it("aberta, sem violações sérias de acessibilidade", async () => {
    const { campo, usuario } = await abrirBusca();
    await usuario.type(campo, "filtro");
    await screen.findByRole("option", { name: comTexto("Filtro de ar primário") });
    expect(await violacoesSerias()).toEqual([]);
  }, 30_000);
});
