/** Planejamento (F1-10): fila com o mock, ações, estados, plano, frases por código e a11y. */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import type { ConclusaoPlanejamento } from "@/api/tipos";
import { fraseDaConclusao } from "@/componentes/FaixaConclusao";
import { reiniciarPlanejamento } from "@/mocks/handlers/planejamento";
import { servidorMock } from "@/mocks/servidor";
import { renderizarApp } from "../../../tests/utils/renderizar";
import { violacoesSerias } from "../../../tests/utils/acessibilidade";

import { FRASES_PLANEJAMENTO } from "./textos";

beforeEach(() => {
  reiniciarPlanejamento();
  Object.assign(URL, { createObjectURL: vi.fn(() => "blob:x"), revokeObjectURL: vi.fn() });
});

async function abrir(pagina = "") {
  const r = renderizarApp("/app/planejamento", { pagina });
  await screen.findByRole("heading", { level: 1, name: "Meu plano de estoque" });
  return r;
}

async function abrirComFila(pagina = "") {
  const r = await abrir(pagina);
  await screen.findByRole("list", { name: "Casos" });
  return r;
}

const casos = () => within(screen.getByRole("list", { name: "Casos" })).getAllByRole("listitem");
const caso = (descricao: string) =>
  casos().find((c) => within(c).queryByRole("heading", { name: descricao }))!;

describe("Planejamento: fila com o mock", () => {
  it("frase, resumo, filtros com contagem da API e os 12 casos em aberto", async () => {
    await abrirComFila();
    expect(screen.getByRole("region", { name: "Conclusão" })).toHaveTextContent(
      "2 casos validados estão prontos para o Excel de mudanças. 2 casos têm dados novos: revise antes de exportar.",
    );
    const resumo = screen.getByRole("region", { name: "Progresso do trabalho" });
    expect(resumo).toHaveTextContent("Casos iniciados13");
    expect(resumo).toHaveTextContent("Validados5 de 13");
    expect(resumo).toHaveTextContent("38% da análise");
    expect(resumo).toHaveTextContent("Aplicados no ERP1 de 5");
    expect(resumo).toHaveTextContent("20% dos validados");
    expect(resumo).toHaveTextContent("Dados para rever2");

    const filtros = within(
      screen.getByRole("group", { name: "Filtrar casos por etapa" }),
    ).getAllByRole("button");
    expect(filtros.map((b) => b.textContent)).toEqual([
      "Em aberto12",
      "A fazer2",
      "Em teste2",
      "A validar2",
      "Validados3",
      "Exportados1",
      "Todos13",
    ]);
    expect(filtros[0]).toHaveAttribute("aria-pressed", "true");
    expect(casos()).toHaveLength(12);
    expect(
      screen.getByRole("button", { name: /Baixar Excel de mudanças \(2\)/ }),
    ).toBeInTheDocument();
    expect(await violacoesSerias(document.body)).toEqual([]);
  });

  it("cartão: código em blocos, proposta antes → depois, selo, aviso de dados novos e rodapé", async () => {
    await abrirComFila();
    const rolamento = caso("Rolamento 6205 2RS");
    expect(rolamento).toHaveTextContent("0000 0012 3456 · Almox. central");
    const proposta = within(rolamento).getByLabelText(/Proposta: antes e depois/);
    expect(proposta).toHaveTextContent("ES14 → passa a 16");
    expect(proposta).toHaveTextContent("PP22 → passa a 24");
    expect(proposta).toHaveTextContent("EM40 → passa a 44");
    expect(rolamento).toHaveTextContent("▲A validar");
    expect(within(rolamento).getByRole("link", { name: /Examinar e planejar/ })).toHaveAttribute(
      "href",
      "/app/materiais?q=000000123456",
    );

    expect(caso("Filtro de ar primário")).toHaveTextContent(
      "A importação de movimentos de 04/11/2026 mudou o histórico usado no teste. Revise antes de exportar.",
    );
    expect(caso("Bico pulverizador 110-02")).toHaveTextContent(
      "Validado em 18/11/2026 · entra no próximo Excel de mudanças",
    );
    expect(caso("Filtro de ar primário")).not.toHaveTextContent("entra no próximo Excel");
    expect(caso("Faca da plataforma de corte")).toHaveTextContent(
      "Aplicado em 06/11/2026 · referência: chamado SAP 48213",
    );
    expect(caso("Filtro separador de combustível")).toHaveTextContent(
      "Lote 2026-11-04-01 · exportado em 04/11/2026",
    );
    expect(within(caso("Junta homocinética")).queryByLabelText(/Proposta/)).not.toBeInTheDocument();
  });

  it("trocar o filtro pede a fila filtrada à API", async () => {
    const pedidos: string[] = [];
    servidorMock.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname === "/api/v1/planejamento")
        pedidos.push(url.searchParams.get("filtro") ?? "");
    });
    await abrirComFila();
    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole("button", { name: /^Exportados/ }));
    await waitFor(() => expect(casos()).toHaveLength(1));
    expect(caso("Filtro separador de combustível")).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: /^Todos/ }));
    await waitFor(() => expect(casos()).toHaveLength(13));
    expect(pedidos).toEqual(["active", "exported", "all"]);
    servidorMock.events.removeAllListeners();
  });

  it("Baixar Excel de mudanças: baixa o arquivo, emite o lote e diz que aplicar é outra etapa", async () => {
    await abrirComFila();
    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole("button", { name: /Baixar Excel de mudanças \(2\)/ }));
    expect(
      (
        await screen.findByText(
          "Lote emitido e arquivo entregue ao navegador. Confira o download; a aplicação no ERP é outra etapa.",
        )
      ).closest("[role=status]"),
    ).toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalled();
    await waitFor(() => expect(caso("Bico pulverizador 110-02")).toHaveTextContent("↗Exportado"));
    expect(screen.getByRole("button", { name: /Baixar Excel de mudanças \(0\)/ })).toBeDisabled();
    expect(screen.getByRole("region", { name: "Conclusão" })).toHaveTextContent(
      "Nenhum caso validado esperando exportação. 2 casos aguardam a sua validação.",
    );
  });

  it("falha de rede ao exportar não promete nada (lote incerto)", async () => {
    servidorMock.use(
      http.post("/api/v1/planejamento/excel-de-mudancas", () => HttpResponse.error()),
    );
    await abrirComFila();
    await userEvent.setup().click(screen.getByRole("button", { name: /Baixar Excel de mudanças/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não sabemos se o lote foi emitido. Atualize a página e confira os casos Exportados antes de baixar de novo.",
    );
  });

  it("Confirmar aplicação no ERP: referência, confirmação e o caso passa a Aplicado", async () => {
    await abrirComFila();
    const usuario = userEvent.setup();
    const exportado = caso("Filtro separador de combustível");
    await usuario.type(
      within(exportado).getByLabelText(
        "Referência externa de Filtro separador de combustível, Posto combustível",
      ),
      "chamado SAP 50001",
    );
    await usuario.click(
      within(exportado).getByRole("button", { name: "Confirmar aplicação no ERP" }),
    );
    const dialogo = await screen.findByRole("alertdialog", {
      name: "Confirmar a aplicação no ERP?",
    });
    expect(dialogo).toHaveTextContent("referência chamado SAP 50001");
    expect(dialogo).toHaveTextContent("O Agro MRO não altera o ERP: só registra a sua declaração.");
    await usuario.click(within(dialogo).getByRole("button", { name: "Declarar aplicação" }));
    expect(
      (
        await screen.findByText(
          "Aplicação declarada para Filtro separador de combustível (Posto combustível). O resultado observado aparece quando houver histórico novo.",
        )
      ).closest("[role=status]"),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(caso("Filtro separador de combustível")).toHaveTextContent(
        /referência: chamado SAP 50001/,
      ),
    );
  });

  it("Cancelar na confirmação não registra nada", async () => {
    const posts: string[] = [];
    servidorMock.events.on("request:start", ({ request }) => {
      if (request.method === "POST") posts.push(request.url);
    });
    await abrirComFila();
    const usuario = userEvent.setup();
    await usuario.click(
      within(caso("Filtro separador de combustível")).getByRole("button", {
        name: "Confirmar aplicação no ERP",
      }),
    );
    const dialogo = await screen.findByRole("alertdialog");
    await usuario.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(posts).toEqual([]);
    servidorMock.events.removeAllListeners();
  });

  it("Iniciar análise: o caso entra no topo em A fazer e sai das sugestões", async () => {
    await abrirComFila();
    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole("button", { name: /^Validados/ }));
    await waitFor(() => expect(casos()).toHaveLength(3));
    const sugestoes = screen.getByRole("region", { name: "Itens para iniciar análise" });
    const bucha = within(sugestoes)
      .getAllByRole("listitem")
      .find((li) => within(li).queryByText("Bucha do braço oscilante"))!;
    expect(bucha).toHaveTextContent("Saldo 1 · ponto de pedido 4");
    await usuario.click(within(bucha).getByRole("button", { name: "Iniciar análise" }));
    expect(
      (
        await screen.findByText(
          'Caso iniciado para Bucha do braço oscilante (Oficina campo). Ele está no topo da fila, em "A fazer".',
        )
      ).closest("[role=status]"),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^A fazer/ })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
    await waitFor(() => expect(casos()[0]).toHaveTextContent("Bucha do braço oscilante"));
    expect(
      within(screen.getByRole("region", { name: "Itens para iniciar análise" })).queryByText(
        "Bucha do braço oscilante",
      ),
    ).not.toBeInTheDocument();
  });
});

describe("Planejamento: estados e plano", () => {
  it("?mock=vazio: frase, os 3 passos que ensinam e as sugestões, sem resumo nem fila", async () => {
    await abrir("?mock=vazio");
    expect(await screen.findByRole("heading", { name: /Escolha uma posição/ })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Conclusão" })).toHaveTextContent(
      "Você ainda não iniciou nenhum caso. 23 posições estão abaixo do ponto de pedido: comece por uma delas.",
    );
    expect(screen.getByRole("heading", { name: /Teste e valide/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Exporte e confirme/ })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Progresso do trabalho" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Baixar Excel/ })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Itens para iniciar análise" })).toBeInTheDocument();
    expect(await violacoesSerias(document.body)).toEqual([]);
  });

  it("?mock=carregando mostra skeleton com status", async () => {
    await abrir("?mock=carregando");
    expect(
      screen.getByRole("status", { name: "Carregando o plano de estoque" }),
    ).toBeInTheDocument();
  });

  it("?mock=erro mostra a mensagem curta e Tentar de novo", async () => {
    await abrir("?mock=erro");
    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("Não foi possível carregar o plano de estoque.");
    expect(within(alerta).getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
  });

  it("?plano=somente_leitura bloqueia exportar, confirmar aplicação e iniciar análise", async () => {
    await abrirComFila("?plano=somente_leitura");
    expect(screen.getByRole("button", { name: /Baixar Excel de mudanças/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(
      within(caso("Filtro separador de combustível")).getByRole("button", {
        name: "Confirmar aplicação no ERP",
      }),
    ).toHaveAttribute("aria-disabled", "true");
    for (const b of screen.getAllByRole("button", { name: "Iniciar análise" })) {
      expect(b).toHaveAttribute("aria-disabled", "true");
    }
  });

  it("?plano=demonstracao: analisa, mas não baixa o Excel", async () => {
    await abrirComFila("?plano=demonstracao");
    expect(screen.getByRole("button", { name: /Baixar Excel de mudanças/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getAllByRole("button", { name: "Iniciar análise" })[0]).not.toHaveAttribute(
      "aria-disabled",
    );
  });

  it("os textos deixam claro que exportar não confirma aplicação", async () => {
    await abrirComFila();
    expect(
      screen.getByText(
        "O avanço considera apenas casos iniciados. A exportação é uma proposta para o sistema do cliente; não confirma implantação nem ganho realizado.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Um alerta pode iniciar a análise, mas só você valida e confirma a aplicação.",
      ),
    ).toBeInTheDocument();
  });
});

describe("Planejamento: uma frase por conclusao.tipo", () => {
  const frase = (c: ConclusaoPlanejamento) =>
    render(<p>{fraseDaConclusao(c, FRASES_PLANEJAMENTO)}</p>).container;

  it("nenhum_caso", () => {
    expect(frase({ tipo: "nenhum_caso", valores: { posicoes_abaixo_pp: 1 } })).toHaveTextContent(
      "Você ainda não iniciou nenhum caso. 1 posição está abaixo do ponto de pedido: comece por uma delas.",
    );
    expect(frase({ tipo: "nenhum_caso", valores: { posicoes_abaixo_pp: null } }).textContent).toBe(
      "Você ainda não iniciou nenhum caso.",
    );
  });

  it("prontos_para_exportar", () => {
    expect(
      frase({
        tipo: "prontos_para_exportar",
        valores: { casos_exportaveis: 1, casos_com_dados_novos: 0 },
      }).textContent,
    ).toBe("1 caso validado está pronto para o Excel de mudanças.");
    expect(
      frase({
        tipo: "prontos_para_exportar",
        valores: { casos_exportaveis: 3, casos_com_dados_novos: 1 },
      }),
    ).toHaveTextContent(
      "3 casos validados estão prontos para o Excel de mudanças. 1 caso tem dados novos: revise antes de exportar.",
    );
  });

  it("aguardando_validacao", () => {
    expect(
      frase({ tipo: "aguardando_validacao", valores: { casos_a_validar: 4 } }),
    ).toHaveTextContent(
      "Nenhum caso validado esperando exportação. 4 casos aguardam a sua validação.",
    );
  });
});
