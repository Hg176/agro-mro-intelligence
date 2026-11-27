import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { request } from "@/api/cliente";
import { servidorMock } from "@/mocks/servidor";

import { renderizarApp } from "../../tests/utils/renderizar";

const rotaAtual = () => screen.getByTestId("rota-atual").textContent;

describe("casca do app", () => {
  it("mostra skeleton enquanto /me carrega e depois a casca", async () => {
    renderizarApp("/app/visao-geral");
    expect(screen.getByRole("status", { name: "Carregando sua sessão" })).toBeInTheDocument();
    expect(await screen.findByRole("navigation", { name: "Menu do sistema" })).toBeInTheDocument();
  });

  it("menu tem os 4 grupos, o item ativo com aria-current e o título da aba", async () => {
    renderizarApp("/app/materiais");
    const menu = await screen.findByRole("navigation", { name: "Menu do sistema" });
    for (const grupo of ["Análise", "Dados", "Regras do cálculo", "Aprender e ajuda"]) {
      expect(within(menu).getByText(grupo)).toBeInTheDocument();
    }
    expect(within(menu).getByRole("link", { name: "Materiais" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(menu).getByRole("link", { name: "Visão geral" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(document.title).toBe("Materiais · Agro MRO Intelligence");
  });

  it("cartão do plano lê os textos de /me", async () => {
    renderizarApp("/app/visao-geral");
    const cartao = await screen.findByRole("link", { name: /Plano Intelligence/ });
    expect(cartao).toHaveTextContent("812 de 1.000 itens");
    expect(cartao).toHaveTextContent("Renova em 03/12/2026");
    expect(cartao).toHaveAttribute("href", "/app/plano");
  });

  it("cartão do plano em demonstração", async () => {
    renderizarApp("/app/visao-geral", { pagina: "?plano=demonstracao" });
    const cartao = await screen.findByRole("link", { name: /Demonstração/ });
    expect(cartao).toHaveTextContent("10 de 10 itens");
    expect(cartao).toHaveTextContent("Assine para liberar tudo");
  });

  it("barra superior com locais, período, atualização e avatar para Minha conta", async () => {
    renderizarApp("/app/visao-geral");
    expect(await screen.findByText("Todos os locais (3)")).toBeInTheDocument();
    expect(screen.getByText("01/07 a 11/11/2026")).toBeInTheDocument();
    expect(screen.getByText("Atualizado há 2 dias")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "HS · Minha conta (Hugo dos Santos)" }),
    ).toHaveAttribute("href", "/app/conta");
  });

  it("tem o link de pular para o conteúdo apontando para o main", async () => {
    renderizarApp("/app/visao-geral");
    const pular = await screen.findByRole("link", { name: "Pular para o conteúdo" });
    expect(pular).toHaveAttribute("href", "#conteudo");
    expect(document.getElementById("conteudo")?.tagName).toBe("MAIN");
  });

  it("/app leva para /app/visao-geral", async () => {
    renderizarApp("/app");
    await waitFor(() => expect(rotaAtual()).toBe("/app/visao-geral"));
  });

  it("telas sem design mostram Em breve", async () => {
    renderizarApp("/app/academia");
    expect(await screen.findByRole("heading", { name: "Em breve", level: 2 })).toBeInTheDocument();
  });

  it("rota inexistente mostra 404 próprio (dentro e fora do app)", async () => {
    renderizarApp("/app/nao-existe");
    expect(
      await screen.findByRole("heading", { name: "Página não encontrada" }),
    ).toBeInTheDocument();
  });

  it("rota pública inexistente também mostra 404", () => {
    renderizarApp("/qualquer-coisa");
    expect(screen.getByRole("heading", { name: "Página não encontrada" })).toBeInTheDocument();
  });
});

describe("sessão", () => {
  it("/me 401 (?sessao=expirada) redireciona para /entrar?volta=<rota>", async () => {
    renderizarApp("/app/materiais?q=rolamento", { pagina: "?sessao=expirada" });
    await waitFor(() =>
      expect(rotaAtual()).toBe(`/entrar?volta=${encodeURIComponent("/app/materiais?q=rolamento")}`),
    );
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });

  it("401 de qualquer outra rota derruba a sessão e redireciona", async () => {
    servidorMock.use(
      http.get(`${location.origin}/api/v1/qualquer`, () => HttpResponse.json({}, { status: 401 })),
    );
    renderizarApp("/app/planejamento");
    await screen.findByRole("navigation", { name: "Menu do sistema" });
    await request("/qualquer").catch(() => undefined);
    await waitFor(() =>
      expect(rotaAtual()).toBe(`/entrar?volta=${encodeURIComponent("/app/planejamento")}`),
    );
  });

  it("erro que não é 401 mostra mensagem e Tentar de novo (sem repetir sozinho)", async () => {
    servidorMock.use(
      http.get(`${location.origin}/api/v1/me`, () => HttpResponse.json({}, { status: 503 })),
    );
    renderizarApp("/app/visao-geral");
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível abrir sua sessão");
    expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
  });

  it("somente leitura mostra o aviso na casca com link para o plano", async () => {
    renderizarApp("/app/visao-geral", { pagina: "?plano=somente_leitura" });
    const aviso = await screen.findByRole("region", { name: "Seu espaço está em somente leitura" });
    expect(within(aviso).getByRole("link", { name: "Pagar e liberar →" })).toHaveAttribute(
      "href",
      "/app/plano",
    );
  });

  it("plano ativo não mostra o aviso de somente leitura", async () => {
    renderizarApp("/app/visao-geral");
    await screen.findByRole("navigation", { name: "Menu do sistema" });
    expect(screen.queryByText("Seu espaço está em somente leitura")).not.toBeInTheDocument();
  });
});
