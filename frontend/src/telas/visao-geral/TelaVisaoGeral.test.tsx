/** Visão geral (F1-7): renderização com o mock, estados, plano e acessibilidade. */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { ConclusaoVisaoGeral, Decimal } from "@/api/tipos";
import { fraseDaConclusao } from "@/componentes/FaixaConclusao";
import { renderizarApp } from "../../../tests/utils/renderizar";
import { violacoesSerias } from "../../../tests/utils/acessibilidade";

import { FRASES_VISAO_GERAL } from "./textos";

const ROTA = "/app/visao-geral";

async function abrir(pagina = "") {
  const r = renderizarApp(ROTA, { pagina });
  await screen.findByRole("heading", { level: 1, name: "Visão geral do estoque" });
  return r;
}

async function abrirComDados(pagina = "") {
  const r = await abrir(pagina);
  await screen.findByRole("table", { name: "O que resolver primeiro" });
  return r;
}

describe("Visão geral: com o mock", () => {
  it("cabeçalho, frase de conclusão e o botão principal verde", async () => {
    await abrirComDados();
    expect(
      screen.getByText("812 posições (material + local) em 3 locais · leitura de 11/11/2026"),
    ).toBeInTheDocument();

    const conclusao = screen.getByRole("region", { name: "Conclusão" });
    expect(conclusao).toHaveTextContent(
      "R$ 412 mil (17% do estoque) estão em 214 itens sem saída há mais de 180 dias. E 23 posições estão abaixo do ponto de pedido, 5 delas classe A: comece por elas.",
    );
    const principal = within(conclusao).getByRole("link", { name: "Ver os 5 itens A" });
    expect(principal).toHaveAttribute("href", "/app/materiais?filtro=abaixo_pp&abc=A");
    expect(principal).toHaveClass("bg-verde-700"); // verde, não o dourado
    expect(principal).not.toHaveClass("bg-ouro-500");

    // Só um principal: "Abrir meu plano" é secundário.
    expect(screen.getByRole("link", { name: "Abrir meu plano" })).toHaveClass("bg-branco");
  });

  it("implantação 4 de 5 com a etapa pendente e o link dela", async () => {
    await abrirComDados();
    const faixa = screen.getByRole("region", { name: "Implantação" });
    expect(faixa).toHaveTextContent("Implantação 4 de 5");
    expect(within(faixa).getByText(/Pedidos em aberto/)).toHaveTextContent("(pendente)");
    expect(
      within(faixa).getByRole("link", { name: "Importar pedidos em aberto →" }),
    ).toHaveAttribute("href", "/app/importar");
  });

  it("KPIs agrupados por tema, com os números do design e links filtrados", async () => {
    await abrirComDados();
    const dinheiro = screen.getByRole("region", { name: "Dinheiro" });
    expect(within(dinheiro).getByText("R$ 2,4 mi")).toHaveClass("text-numero-kpi");
    expect(within(dinheiro).getByText("214 itens · 17% do valor")).toBeInTheDocument();
    expect(within(dinheiro).getByRole("link", { name: "Ver composição →" })).toHaveAttribute(
      "href",
      "#composicao",
    );

    const saude = screen.getByRole("region", { name: "Saúde do estoque" });
    expect(within(saude).getByText("23")).toBeInTheDocument();
    expect(within(saude).getByText("5 são classe A")).toBeInTheDocument();
    expect(within(saude).getByRole("link", { name: "Conferir →" })).toHaveAttribute(
      "href",
      "/app/materiais?filtro=saldo_negativo",
    );

    const movimento = screen.getByRole("region", { name: "Movimento no período" });
    expect(within(movimento).getByText("156 · 520")).toBeInTheDocument();
    expect(within(movimento).getByText("01/07 a 11/11/2026")).toBeInTheDocument();
  });

  it("O que resolver primeiro: 6 posições na ordem da API, com código em blocos", async () => {
    await abrirComDados();
    const tabela = screen.getByRole("table", { name: "O que resolver primeiro" });
    const linhas = within(tabela).getAllByRole("row").slice(1);
    expect(linhas).toHaveLength(6);
    expect(linhas[0]).toHaveTextContent("Rolamento 6205 2RS");
    expect(linhas[0]).toHaveTextContent("0000 0012 3456");
    expect(linhas[0]).toHaveTextContent("0 de 22 UN");
    expect(linhas[0]).toHaveTextContent("Ruptura");
    expect(linhas[4]).toHaveTextContent("−2 UN (negativo) · PP 8");
    expect(
      within(tabela)
        .getAllByRole("columnheader")
        .every((th) => th.getAttribute("scope") === "col"),
    ).toBe(true);
    expect(
      within(tabela).getByRole("link", { name: "Abrir Rolamento 6205 2RS, Almox. central" }),
    ).toHaveAttribute("href", "/app/materiais?q=000000123456");
    expect(screen.getByRole("link", { name: "Ver fila completa (31) →" })).toHaveAttribute(
      "href",
      "/app/planejamento",
    );
  });

  it("Sinais para agir: 7 sinais, cada um abre Materiais filtrado", async () => {
    await abrirComDados();
    const sinais = screen.getByRole("region", { name: "Sinais para agir" });
    const links = within(sinais).getAllByRole("link");
    expect(links).toHaveLength(7);
    expect(links[0]).toHaveTextContent("Saldo negativo8");
    expect(links[0]).toHaveAttribute("href", "/app/materiais?filtro=saldo_negativo");
    expect(links[2]).toHaveTextContent("Acima do estoque máximo41");
    expect(links[2]).toHaveAttribute("href", "/app/materiais?sinal=acima_maximo");
  });

  it("matriz ABC × PQR: AP contornada, célula abre Materiais com abc e pqr", async () => {
    await abrirComDados();
    const ap = screen.getByRole("link", { name: "AP: 41 posições" });
    expect(ap).toHaveClass("outline-ouro-600");
    expect(ap).toHaveAttribute("href", "/app/materiais?abc=A&pqr=P");
    expect(screen.getByRole("link", { name: "CS: 173 posições" })).toHaveClass("bg-verde-700");
    expect(
      screen.getByText("AP: 41 itens mais caros e mais usados. Cuidar primeiro."),
    ).toBeInTheDocument();
    expect(screen.getByText("12 posições sem classe (N) ficam fora da grade.")).toBeInTheDocument();
  });

  it("composição: 4 abas, ABC com a frase de destaque, troca de aba pelo teclado", async () => {
    await abrirComDados();
    const usuario = userEvent.setup();
    const comp = screen.getByRole("region", { name: "Poucos itens, muito valor" });
    const abas = within(comp).getAllByRole("tab");
    expect(abas.map((a) => a.textContent)).toEqual([
      "ABC consumo",
      "PQR saídas",
      "XYZ criticidade",
      "Comprabilidade",
    ]);
    const painel = within(comp).getByRole("tabpanel");
    expect(painel).toHaveTextContent("% do valor consumido");
    expect(painel).toHaveTextContent("98 · 12%");
    expect(painel).toHaveTextContent("12% dos itens (classe A) concentram 71% do valor consumido.");

    await usuario.click(abas[0]!);
    await usuario.keyboard("{ArrowRight}");
    const pqr = within(comp).getByRole("tabpanel");
    expect(pqr).toHaveTextContent("% das posições");
    expect(pqr).toHaveTextContent("303 · 37%");
    expect(pqr).not.toHaveTextContent("concentram");
  });

  it("Para aprofundar: 3 seções recolhidas; a memória mostra período e regras", async () => {
    await abrirComDados();
    const usuario = userEvent.setup();
    const botoes = within(screen.getByRole("region", { name: "Para aprofundar" })).getAllByRole(
      "button",
    );
    expect(botoes).toHaveLength(3);
    expect(botoes.every((b) => b.getAttribute("aria-expanded") === "false")).toBe(true);
    await usuario.click(botoes[2]!);
    expect(botoes[2]).toHaveAttribute("aria-expanded", "true");
    const memoria = screen.getByRole("region", { name: "Memória desta leitura" });
    expect(memoria).toHaveTextContent("01/07 a 11/11/2026");
    expect(memoria).toHaveTextContent("Motor V3");
  });

  it("sem violações sérias de acessibilidade (axe; contraste fica com o Lighthouse)", async () => {
    await abrirComDados();
    expect(await violacoesSerias()).toEqual([]);
  });
});

describe("Visão geral: destino que ainda não existe", () => {
  it('"Ver movimentos" mostra Em breve, sem link e sem cursor de clique', async () => {
    await abrirComDados();
    const movimento = screen.getByRole("region", { name: "Movimento no período" });
    expect(within(movimento).getByText("Ver movimentos")).toBeInTheDocument();
    expect(within(movimento).getByText("Em breve")).toBeInTheDocument();
    expect(within(movimento).queryByRole("link")).not.toBeInTheDocument();
    expect(movimento.querySelector(".cursor-pointer")).toBeNull();
  });
});

describe("Visão geral: estados forçados por ?mock=", () => {
  it("carregando mostra skeleton com status", async () => {
    await abrir("?mock=carregando");
    expect(screen.getByRole("status", { name: "Carregando a Visão geral" })).toBeInTheDocument();
  });

  it("erro mostra a mensagem curta e Tentar de novo", async () => {
    await abrir("?mock=erro");
    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("Não foi possível carregar a Visão geral.");
    expect(alerta).toHaveTextContent(
      "Não foi possível concluir agora. Tente de novo em instantes.",
    );
    expect(within(alerta).getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
  });

  it("vazio: sem frase, indicadores com motivo (nunca zero) e tabela vazia", async () => {
    await abrirComDados("?mock=vazio");
    expect(screen.queryByRole("region", { name: "Conclusão" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Sem dados importados")).toHaveLength(5);
    expect(screen.queryByText("R$ 2,4 mi")).not.toBeInTheDocument();
    expect(screen.getByText("Nenhuma posição para resolver agora")).toBeInTheDocument();
    const sinais = screen.getByRole("region", { name: "Sinais para agir" });
    expect(within(sinais).getAllByText("—")).toHaveLength(7);
    expect(await violacoesSerias()).toEqual([]);
  });
});

describe("Visão geral: Baixar Excel e o plano", () => {
  it("?plano=somente_leitura bloqueia Baixar Excel com o motivo visível", async () => {
    await abrirComDados("?plano=somente_leitura");
    const botao = screen.getByRole("button", { name: /Baixar Excel/ });
    expect(botao).toHaveAttribute("aria-disabled", "true");
    expect(screen.getAllByText("Seu espaço está em somente leitura").length).toBeGreaterThan(0);
  });

  it("?plano=ativo baixa o arquivo que a API mandou", async () => {
    const criar = vi.fn(() => "blob:teste");
    const revogar = vi.fn();
    Object.assign(URL, { createObjectURL: criar, revokeObjectURL: revogar });
    const cliques = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    await abrirComDados("?plano=ativo");
    const usuario = userEvent.setup();
    const botao = screen.getByRole("button", { name: /Baixar Excel/ });
    expect(botao).not.toHaveAttribute("aria-disabled");
    await usuario.click(botao);
    await vi.waitFor(() => expect(cliques).toHaveBeenCalledTimes(1));
    expect(criar).toHaveBeenCalledTimes(1);
    const link = cliques.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe("visao-geral-exemplo.csv");
    cliques.mockRestore();
  });
});

describe("Visão geral: frase por conclusao.tipo", () => {
  it("parado_e_abaixo_pp preenche com os valores; null vira traço", () => {
    const conclusao: ConclusaoVisaoGeral = {
      tipo: "parado_e_abaixo_pp",
      valores: {
        valor_parado: "1000" as Decimal,
        percentual_valor_parado: null,
        itens_parados: 3,
        posicoes_abaixo_pp: null,
        abaixo_pp_classe_a: 1,
      },
    };
    const { container } = render(<p>{fraseDaConclusao(conclusao, FRASES_VISAO_GERAL)}</p>);
    expect(container).toHaveTextContent(
      "R$ 1 mil (— do estoque) estão em 3 itens sem saída há mais de 180 dias. E — posições",
    );
  });

  it("código desconhecido não quebra: sem frase", () => {
    const desconhecida = { tipo: "outro", valores: {} } as unknown as ConclusaoVisaoGeral;
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(fraseDaConclusao(desconhecida, FRASES_VISAO_GERAL)).toBeNull();
    aviso.mockRestore();
  });
});
