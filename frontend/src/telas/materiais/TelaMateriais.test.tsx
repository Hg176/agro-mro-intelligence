/** Materiais (F1-8): renderização com o mock, filtros na URL, estados, plano e acessibilidade. */
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { servidorMock } from "@/mocks/servidor";
import { renderizarApp } from "../../../tests/utils/renderizar";
import { violacoesSerias } from "../../../tests/utils/acessibilidade";

async function abrir(rota = "/app/materiais", pagina = "") {
  const r = renderizarApp(rota, { pagina });
  await screen.findByRole("heading", { level: 1, name: "Materiais" });
  return r;
}

async function abrirComCartoes(rota?: string, pagina?: string) {
  const r = await abrir(rota, pagina);
  await screen.findByRole("list", { name: "Posições" });
  return r;
}

const rotaAtual = () => screen.getByTestId("rota-atual").textContent ?? "";

describe("Materiais: catálogo com o mock", () => {
  it("frase de conclusão, contagem, 5 filtros com contagem da API e cartões", async () => {
    await abrirComCartoes();
    expect(screen.getByRole("region", { name: "Conclusão" })).toHaveTextContent(
      "812 posições em 3 locais. 23 pedem reposição e 214 estão sem giro há mais de 180 dias. Use os filtros prontos abaixo para chegar nelas.",
    );
    expect(screen.getByText("812 posições · página 1 de 9")).toBeInTheDocument();

    const filtros = within(screen.getByRole("group", { name: "Filtros prontos" })).getAllByRole(
      "button",
    );
    expect(filtros.map((b) => b.textContent)).toEqual([
      "▲Abaixo do PP23",
      "●Saldo negativo8",
      "■Parados +180d214",
      "AClasse A98",
      "○Sem cálculo37",
    ]);
    expect(filtros.every((b) => b.getAttribute("aria-pressed") === "false")).toBe(true);

    const cartoes = within(screen.getByRole("list", { name: "Posições" })).getAllByRole("article");
    expect(cartoes.length).toBeGreaterThan(0);
    const rolamento = screen.getByRole("article", { name: "Rolamento 6205 2RS, Almox. central" });
    expect(rolamento).toHaveTextContent("Rolamentos · Esferas");
    expect(rolamento).toHaveTextContent("0000 0012 3456");
    expect(rolamento).toHaveTextContent("PP 22 un");
    expect(rolamento).toHaveTextContent("Ruptura");
    expect(rolamento).toHaveTextContent("Crítico");
    // ABC de estoque não ativada: traço, nunca uma letra inventada.
    expect(
      within(rolamento).getByRole("img", { name: "ABC de estoque não informada" }),
    ).toHaveTextContent("—");

    const filtroAr = screen.getByRole("article", { name: "Filtro de ar primário, Oficina campo" });
    expect(filtroAr).toHaveTextContent("−2");

    expect(screen.getByRole("navigation", { name: "Paginação" })).toHaveTextContent(
      "Página 1 de 9 · 100 posições por página",
    );
    expect(screen.getByRole("button", { name: /Página anterior/ })).toBeDisabled();
  });

  it("filtro pronto vai para a URL e a contagem vem da API", async () => {
    await abrirComCartoes();
    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole("button", { name: /Saldo negativo/ }));
    expect(rotaAtual()).toBe("/app/materiais?filtro=saldo_negativo");
    expect(await screen.findByText("8 posições no filtro")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Saldo negativo/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await usuario.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(rotaAtual()).toBe("/app/materiais");
  });

  it("busca aceita código com espaços e vai para a URL", async () => {
    await abrirComCartoes();
    const usuario = userEvent.setup();
    await usuario.type(
      screen.getByRole("searchbox", { name: "Buscar posições" }),
      "0000 0012 3456",
    );
    await vi.waitFor(() => expect(rotaAtual()).toBe("/app/materiais?q=0000+0012+3456"));
    expect(await screen.findByText("1 de 812 posições")).toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: "Rolamento 6205 2RS, Almox. central" }),
    ).toBeInTheDocument();
  });

  it("links da Visão geral: ?filtro=abaixo_pp&abc=A mostra os dois filtros", async () => {
    await abrirComCartoes("/app/materiais?filtro=abaixo_pp&abc=A");
    expect(screen.getByRole("button", { name: /Abaixo do PP/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole("button", { name: "Remover filtro ABC A" }));
    expect(rotaAtual()).toBe("/app/materiais?filtro=abaixo_pp");
  });

  it("sinal sem filtro pronto vira chip removível", async () => {
    await abrir("/app/materiais?sinal=acima_maximo");
    expect(
      await screen.findByRole("button", { name: "Remover filtro Acima do estoque máximo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("41 posições no filtro")).toBeInTheDocument();
  });

  it("sem resultado: mensagem do design e Limpar busca e filtros", async () => {
    await abrir("/app/materiais?q=nadaassim");
    expect(
      await screen.findByRole("heading", { name: "Nenhuma posição encontrada" }),
    ).toBeInTheDocument();
    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole("button", { name: "Limpar busca e filtros" }));
    expect(rotaAtual()).toBe("/app/materiais");
  });

  it("sem violações sérias de acessibilidade", async () => {
    await abrirComCartoes();
    expect(await violacoesSerias()).toEqual([]);
  });
});

describe("Materiais: estados forçados por ?mock=", () => {
  it("carregando: skeleton e a mensagem do design", async () => {
    await abrir("/app/materiais", "?mock=carregando");
    expect(screen.getByText("Consultando métricas aprovadas…")).toHaveAttribute("role", "status");
  });

  it("erro de métricas: o catálogo continua, sem saldo nem selo", async () => {
    await abrirComCartoes("/app/materiais", "?mock=erro");
    expect(screen.getByRole("alert")).toHaveTextContent("Métricas indisponíveis agora.");
    const rolamento = screen.getByRole("article", { name: "Rolamento 6205 2RS, Almox. central" });
    expect(rolamento).toHaveTextContent("Indisponível");
    expect(rolamento).not.toHaveTextContent("Ruptura");
    expect(rolamento).not.toHaveTextContent("PP");
    expect(await violacoesSerias()).toEqual([]);
  });

  it("catálogo vazio: frase do vazio, Importar dados mestres principal, Novo material secundário", async () => {
    await abrir("/app/materiais", "?mock=vazio");
    expect(
      await screen.findByRole("heading", { name: "Nenhum material ainda" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Conclusão" })).toHaveTextContent(
      "Seu catálogo ainda está vazio. Importe os dados mestres para ver saldo, classe e situação de cada posição.",
    );
    expect(screen.getByRole("link", { name: "Importar dados mestres" })).toHaveClass(
      "bg-verde-700",
    );
    expect(screen.getByRole("button", { name: /Novo material/ })).toHaveClass("bg-branco");
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Baixar Excel/ })).not.toBeInTheDocument();
    expect(await violacoesSerias()).toEqual([]);
  });

  it("falha do catálogo inteiro (500) mostra o erro da tela", async () => {
    servidorMock.use(http.get("/api/v1/materiais", () => HttpResponse.json({}, { status: 500 })));
    await abrir();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar o catálogo.",
    );
  });
});

describe("Materiais: ações protegidas pelo plano", () => {
  it("?plano=somente_leitura bloqueia Baixar Excel e Novo material com o motivo", async () => {
    await abrirComCartoes("/app/materiais", "?plano=somente_leitura");
    expect(screen.getByRole("button", { name: /Baixar Excel \(812 posições\)/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    const novo = screen.getByRole("button", { name: /Novo material/ });
    expect(novo).toHaveAttribute("aria-disabled", "true");
    const usuario = userEvent.setup();
    await usuario.click(novo);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("?plano=demonstracao: cadastra, mas não baixa Excel", async () => {
    await abrirComCartoes("/app/materiais", "?plano=demonstracao");
    expect(screen.getByRole("button", { name: /Baixar Excel/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("button", { name: /Novo material/ })).not.toHaveAttribute(
      "aria-disabled",
    );
  });

  it("Adicionar material: rótulos acima, erro colado ao campo e salvar", async () => {
    await abrirComCartoes();
    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole("button", { name: /Novo material/ }));
    const gaveta = await screen.findByRole("dialog", { name: "Adicionar material" });

    await usuario.click(within(gaveta).getByRole("button", { name: "Salvar material" }));
    expect(within(gaveta).getByLabelText("Código")).toHaveAttribute("aria-invalid", "true");
    expect(within(gaveta).getByText("Informe o código.")).toBeInTheDocument();
    expect(within(gaveta).getByText("Informe a descrição.")).toBeInTheDocument();

    await usuario.type(within(gaveta).getByLabelText("Código"), "000777");
    await usuario.type(within(gaveta).getByLabelText("Descrição"), "Pino de engate");
    await usuario.selectOptions(within(gaveta).getByLabelText("Criticidade (XYZ)"), "critical");
    expect(await violacoesSerias(gaveta)).toEqual([]);
    await usuario.click(within(gaveta).getByRole("button", { name: "Salvar material" }));

    expect(await screen.findByText("Material 000777 salvo.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("código duplicado: a mensagem do backend aparece na gaveta", async () => {
    await abrirComCartoes();
    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole("button", { name: /Novo material/ }));
    const gaveta = await screen.findByRole("dialog", { name: "Adicionar material" });
    await usuario.type(within(gaveta).getByLabelText("Código"), "000000123456");
    await usuario.type(within(gaveta).getByLabelText("Descrição"), "Rolamento");
    await usuario.clear(within(gaveta).getByLabelText("Local"));
    await usuario.type(within(gaveta).getByLabelText("Local"), "1001");
    await usuario.click(within(gaveta).getByRole("button", { name: "Salvar material" }));
    expect(await within(gaveta).findByRole("alert")).toHaveTextContent(
      "Já existe um material com este código neste local.",
    );
  });
});

describe("Materiais: janela Adicionar material", () => {
  async function abrirJanela() {
    await abrirComCartoes();
    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole("button", { name: /Novo material/ }));
    const janela = await screen.findByRole("dialog", { name: "Adicionar material" });
    return { usuario, janela };
  }

  it("é a janela central do design, com o rótulo Novo cadastro", async () => {
    const { janela } = await abrirJanela();
    expect(within(janela).getByText("Novo cadastro")).toBeInTheDocument();
    expect(janela).toHaveAttribute("data-slot", "dialog-content");
  });

  it("unidade com busca: filtra por nome, sigla ou categoria e escolhe pelo teclado", async () => {
    const { usuario, janela } = await abrirJanela();
    const unidade = within(janela).getByRole("combobox", { name: "Unidade de medida" });
    await usuario.click(unidade);
    const lista = await within(janela).findByRole("listbox", { name: "Unidades de medida" });
    expect(within(lista).getAllByRole("option")).toHaveLength(8);
    expect(within(lista).getByRole("option", { name: /Unidade/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await usuario.clear(unidade);
    await usuario.type(unidade, "embalagem");
    expect(
      within(lista)
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual(["BaldeBDEmbalagem", "CaixaCXEmbalagem"]);

    await usuario.keyboard("{ArrowDown}{Enter}");
    expect(unidade).toHaveValue("Caixa (CX)");
    expect(unidade).toHaveAttribute("aria-expanded", "false");

    await usuario.clear(unidade);
    await usuario.type(unidade, "xyz");
    expect(within(janela).getByText("Nenhuma unidade encontrada.")).toBeInTheDocument();
  });

  it("Esc fecha só a lista de unidades; o segundo Esc fecha a janela", async () => {
    const { usuario, janela } = await abrirJanela();
    const unidade = within(janela).getByRole("combobox", { name: "Unidade de medida" });
    await usuario.click(unidade);
    await within(janela).findByRole("listbox");
    await usuario.keyboard("{Escape}");
    expect(unidade).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("dialog", { name: "Adicionar material" })).toBeInTheDocument();
    await usuario.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("unidades e grupos vêm da API (rotas a criar), e a sigla escolhida vai no POST", async () => {
    servidorMock.use(
      http.get("/api/v1/unidades", () =>
        HttpResponse.json([
          { sigla: "UN", nome: "Unidade", categoria: "Contagem" },
          { sigla: "GL", nome: "Galão", categoria: "Volume" },
        ]),
      ),
      http.get("/api/v1/grupos-padrao", () => HttpResponse.json([{ nome: "Correias" }])),
    );
    let corpo: unknown = null;
    servidorMock.events.on("request:start", ({ request }) => {
      if (request.method === "POST")
        void request
          .clone()
          .json()
          .then((j) => (corpo = j));
    });
    const { usuario, janela } = await abrirJanela();
    const unidade = within(janela).getByRole("combobox", { name: "Unidade de medida" });
    await usuario.click(unidade);
    const lista = await within(janela).findByRole("listbox");
    await usuario.click(within(lista).getByRole("option", { name: /Galão/ }));
    expect(unidade).toHaveValue("Galão (GL)");
    expect(janela.querySelector("datalist option")).toHaveValue("Correias");

    await usuario.type(within(janela).getByLabelText("Código"), "000888");
    await usuario.type(within(janela).getByLabelText("Descrição"), "Óleo hidráulico");
    await usuario.click(within(janela).getByRole("button", { name: "Salvar material" }));
    expect(await screen.findByText("Material 000888 salvo.")).toBeInTheDocument();
    expect(corpo).toMatchObject({ code: "000888", unit: "GL" });
    servidorMock.events.removeAllListeners();
  });

  it("falha ao carregar as unidades: avisa ao lado do campo", async () => {
    servidorMock.use(
      http.get("/api/v1/unidades", () => HttpResponse.json({ detail: "x" }, { status: 500 })),
    );
    const { janela } = await abrirJanela();
    expect(await within(janela).findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar as unidades.",
    );
  });
});

describe("Materiais: cartão não é clicável (a ficha ainda não existe)", () => {
  it("sem link e sem cursor de clique", async () => {
    await abrirComCartoes();
    const cartao = screen.getAllByRole("article")[0]!;
    expect(within(cartao).queryByRole("link")).not.toBeInTheDocument();
    expect(cartao.className).not.toMatch(/cursor-pointer/);
    expect(cartao.querySelector(".cursor-pointer")).toBeNull();
  });
});
