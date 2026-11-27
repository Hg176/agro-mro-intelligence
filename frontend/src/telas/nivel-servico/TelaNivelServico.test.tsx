/** Nível de serviço (F1-12): grade V3, editor, impacto da API, 1º caso, adoção, estados e a11y. */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import type { ConclusaoNivelServico, Decimal } from "@/api/tipos";
import { fraseDaConclusao } from "@/componentes/FaixaConclusao";
import { reiniciarNivelServico } from "@/mocks/handlers/nivelServico";
import { servidorMock } from "@/mocks/servidor";
import { renderizarApp } from "../../../tests/utils/renderizar";
import { violacoesSerias } from "../../../tests/utils/acessibilidade";

import { FRASES_NIVEL_SERVICO } from "./textos";

beforeEach(() => reiniciarNivelServico());

async function abrir(pagina = "") {
  const r = renderizarApp("/app/nivel-servico", { pagina });
  await screen.findByRole("heading", { level: 1, name: "Nível de serviço" });
  return r;
}

async function abrirComGrade(pagina = "") {
  const r = await abrir(pagina);
  await screen.findByRole("table", { name: /Metas de serviço para P/ });
  return r;
}

const celula = (caso: string) => screen.getByRole("button", { name: new RegExp(`^Caso ${caso}:`) });
const editor = () => screen.getByRole("complementary");
const campoMeta = () => within(editor()).getByLabelText("Meta efetiva");

describe("Nível de serviço: V3 com o mock", () => {
  it("frase V3, aba P, 15 casos com faixa e o caso PBY selecionado", async () => {
    await abrirComGrade();
    expect(screen.getByRole("region", { name: "Conclusão" })).toHaveTextContent(
      "Seu espaço usa a referência V3 nos 75 casos. Itens A têm meta menor (de 59,6% a 84%) para não prender capital; itens vitais (Z) que saem muito chegam a 99,7%.",
    );
    expect(screen.getByText("Referência padrão V3 em uso")).toBeInTheDocument();
    const abas = within(
      screen.getByRole("tablist", { name: "Frequência de saída (PQR)" }),
    ).getAllByRole("tab");
    expect(abas).toHaveLength(5);
    expect(abas[0]).toHaveAttribute("aria-selected", "true");

    const grade = screen.getByRole("table", { name: /Metas de serviço para P/ });
    expect(within(grade).getAllByRole("button")).toHaveLength(15);
    expect(within(grade).getByText("41 posições AP")).toBeInTheDocument();
    expect(celula("PAX")).toHaveTextContent("70,7%V3");
    expect(celula("PBY")).toHaveAttribute("aria-pressed", "true");
    expect(celula("PBY")).toHaveClass("bg-verde-700");

    expect(within(editor()).getByRole("heading", { name: "PBY" })).toBeInTheDocument();
    expect(editor()).toHaveTextContent(
      "saídas frequentes · valor intermediário · criticidade Y (intermediária)",
    );
    expect(editor()).toHaveTextContent("Referência V397,5%");
    expect(editor()).toHaveTextContent("OrigemPadrão V3");
    expect(campoMeta()).toHaveValue("97,5");
    expect(editor()).toHaveTextContent(
      "Meta atual de 97,5% corresponde a um fator z de 1,96. Digite outra meta para comparar.",
    );
    expect(within(editor()).getByRole("button", { name: "Salvar meta de PBY" })).toBeDisabled();
    expect(await violacoesSerias(document.body)).toEqual([]);
  });

  it("aba S: linha S = 0% sem proteção; trocar de aba mantém ABC e XYZ", async () => {
    await abrirComGrade();
    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole("tab", { name: /sem saídas/ }));
    await screen.findByRole("table", { name: /Metas de serviço para S/ });
    expect(celula("SAX")).toHaveTextContent("0%sem proteção");
    expect(within(editor()).getByRole("heading", { name: "SBY" })).toBeInTheDocument();
    expect(editor()).toHaveTextContent(
      "Com 0%, a Inversa Normal fica indisponível e o estoque de segurança destes itens pode zerar.",
    );
  });

  it("digitar uma meta pede o impacto à API (o front não calcula o fator z)", async () => {
    const pedidos: string[] = [];
    servidorMock.events.on("request:start", ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith("/impacto")) pedidos.push(url.search);
    });
    await abrirComGrade();
    const usuario = userEvent.setup();
    await usuario.clear(campoMeta());
    await usuario.type(campoMeta(), "99");
    expect(
      await within(editor()).findByText(
        "De 97,5% para 99%: o estoque de segurança destes itens fica cerca de 19% maior (fator z 1,96 → 2,33).",
      ),
    ).toBeInTheDocument();
    expect(pedidos).toEqual(["?caso=PBY&meta=99"]);
    await usuario.clear(campoMeta());
    await usuario.type(campoMeta(), "90");
    expect(await within(editor()).findByText(/fica cerca de \d+% menor/)).toBeInTheDocument();
    servidorMock.events.removeAllListeners();
  });

  it("formato fora do aceito avisa e não pede impacto nem deixa salvar", async () => {
    await abrirComGrade();
    const usuario = userEvent.setup();
    for (const valor of ["40", "100", "97,555", "abc"]) {
      await usuario.clear(campoMeta());
      await usuario.type(campoMeta(), valor);
      expect(within(editor()).getByRole("alert")).toHaveTextContent(
        "Informe zero ou uma meta de 50% a menos de 100%, com até duas casas.",
      );
      expect(within(editor()).getByRole("button", { name: "Salvar meta de PBY" })).toBeDisabled();
    }
    await usuario.clear(campoMeta());
    await usuario.type(campoMeta(), "0");
    expect(within(editor()).queryByRole("alert")).not.toBeInTheDocument();
    expect(within(editor()).getByRole("button", { name: "Salvar meta de PBY" })).toBeEnabled();
  });

  it("1º caso salvo: confirmação, matriz própria e os outros 74 NC", async () => {
    let corpo: unknown = null;
    servidorMock.events.on("request:start", ({ request }) => {
      if (request.method === "PUT")
        void request
          .clone()
          .json()
          .then((j) => (corpo = j));
    });
    await abrirComGrade();
    const usuario = userEvent.setup();
    await usuario.clear(campoMeta());
    await usuario.type(campoMeta(), "98,5");
    await usuario.click(within(editor()).getByRole("button", { name: "Salvar meta de PBY" }));
    const dialogo = await screen.findByRole("alertdialog", {
      name: "Este é o primeiro caso da sua matriz própria",
    });
    expect(dialogo).toHaveTextContent("As outras 74 combinações ficam NC (sem meta)");
    expect(corpo).toBeNull();
    await usuario.click(within(dialogo).getByRole("button", { name: "Iniciar matriz própria" }));

    expect(await screen.findByText("Caso PBY salvo com histórico e origem.")).toBeInTheDocument();
    expect(corpo).toEqual({ meta_percentual: "98.5", versao: 0 });
    expect(screen.getByRole("region", { name: "Conclusão" })).toHaveTextContent(
      "Sua matriz própria tem 1 de 75 casos declarados. 74 combinações estão NC: os itens nelas ficam sem meta pela matriz até você declarar ou adotar a V3.",
    );
    expect(screen.getByText("Matriz própria · 1 de 75 declarados")).toBeInTheDocument();
    expect(celula("PBY")).toHaveTextContent("98,5%editado");
    expect(celula("PBY")).toHaveAccessibleName("Caso PBY: 98,5%, diferente da V3");
    expect(celula("PAX")).toHaveTextContent("NCnão declarado");
    expect(editor()).toHaveTextContent("Editado no espaço · v1");
    servidorMock.events.removeAllListeners();
  });

  it("Voltar na confirmação do 1º caso não salva nada", async () => {
    const metodos: string[] = [];
    servidorMock.events.on("request:start", ({ request }) => metodos.push(request.method));
    await abrirComGrade();
    const usuario = userEvent.setup();
    await usuario.clear(campoMeta());
    await usuario.type(campoMeta(), "96");
    await usuario.click(within(editor()).getByRole("button", { name: "Salvar meta de PBY" }));
    await usuario.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Voltar" }),
    );
    expect(metodos).not.toContain("PUT");
    expect(screen.getByText("Referência padrão V3 em uso")).toBeInTheDocument();
    servidorMock.events.removeAllListeners();
  });

  it("na matriz própria salva direto e Remover configuração deixa o caso NC", async () => {
    await abrirComGrade();
    const usuario = userEvent.setup();
    await usuario.clear(campoMeta());
    await usuario.type(campoMeta(), "96");
    await usuario.click(within(editor()).getByRole("button", { name: "Salvar meta de PBY" }));
    await usuario.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Iniciar matriz própria",
      }),
    );
    await screen.findByText("Caso PBY salvo com histórico e origem.");

    await usuario.click(celula("PAZ"));
    expect(within(editor()).getByRole("heading", { name: "PAZ" })).toBeInTheDocument();
    expect(campoMeta()).toHaveValue("");
    await usuario.type(campoMeta(), "85");
    await usuario.click(within(editor()).getByRole("button", { name: "Salvar meta de PAZ" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(await screen.findByText("Caso PAZ salvo com histórico e origem.")).toBeInTheDocument();

    await usuario.click(within(editor()).getByRole("button", { name: "Remover configuração" }));
    expect(
      await screen.findByText("Configuração PAZ removida. A combinação fica NC na matriz própria."),
    ).toBeInTheDocument();
    expect(celula("PAZ")).toHaveTextContent("NCnão declarado");
  });

  it("adotar a V3: prévia da API, confirmação marcada e os 75 valores voltam", async () => {
    await abrirComGrade();
    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole("button", { name: "Adotar os 75 valores V3" }));
    const bloco = await screen.findByRole("region", { name: "Confira a adoção da matriz V3" });
    await within(bloco).findByText("casos a incluir");
    await waitFor(() => expect(bloco).toHaveTextContent("75casos a incluir"));
    expect(bloco).toHaveTextContent("6níveis manuais de materiais preservados");
    const confirmar = within(bloco).getByRole("button", { name: "Confirmar adoção" });
    expect(confirmar).toBeDisabled();
    await usuario.click(
      within(bloco).getByRole("checkbox", {
        name: "Confirmo substituir a configuração do meu espaço pelos 75 valores apresentados.",
      }),
    );
    expect(confirmar).toBeEnabled();
    expect(await violacoesSerias(document.body)).toEqual([]);
    await usuario.click(confirmar);
    expect(
      await screen.findByText(
        "Os 75 valores V3 foram adotados. As versões anteriores e os níveis manuais dos materiais foram preservados.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Conclusão" })).toHaveTextContent(
      "Sua matriz própria tem 75 de 75 casos declarados. Nenhuma combinação está sem meta.",
    );
    expect(editor()).toHaveTextContent("V3 adotada · v1");
    expect(
      screen.queryByRole("region", { name: "Confira a adoção da matriz V3" }),
    ).not.toBeInTheDocument();
  });

  it("falha de rede ao salvar não promete nada", async () => {
    servidorMock.use(http.put("/api/v1/nivel-servico/casos/:caso", () => HttpResponse.error()));
    await abrirComGrade();
    const usuario = userEvent.setup();
    await usuario.clear(campoMeta());
    await usuario.type(campoMeta(), "96");
    await usuario.click(within(editor()).getByRole("button", { name: "Salvar meta de PBY" }));
    await usuario.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Iniciar matriz própria",
      }),
    );
    expect(await within(editor()).findByRole("alert")).toHaveTextContent(
      "Não sabemos se a matriz foi salva. Atualize a página e confira antes de salvar de novo.",
    );
  });
});

describe("Nível de serviço: estados e plano", () => {
  it("?mock=carregando mostra skeleton com status", async () => {
    await abrir("?mock=carregando");
    expect(
      screen.getByRole("status", { name: "Carregando o nível de serviço" }),
    ).toBeInTheDocument();
  });

  it("?mock=erro mostra a mensagem curta e Tentar de novo", async () => {
    await abrir("?mock=erro");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar o nível de serviço.",
    );
  });

  it("?plano=somente_leitura bloqueia salvar e adotar, com o motivo", async () => {
    await abrirComGrade("?plano=somente_leitura");
    const usuario = userEvent.setup();
    await usuario.clear(campoMeta());
    await usuario.type(campoMeta(), "96");
    const salvar = within(editor()).getByRole("button", { name: "Salvar meta de PBY" });
    expect(salvar).toHaveAttribute("aria-disabled", "true");
    await usuario.click(salvar);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adotar os 75 valores V3" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});

describe("Nível de serviço: frase por conclusao.tipo", () => {
  const frase = (c: ConclusaoNivelServico) =>
    render(<p>{fraseDaConclusao(c, FRASES_NIVEL_SERVICO)}</p>).container;

  it("referencia_v3", () => {
    expect(
      frase({
        tipo: "referencia_v3",
        valores: {
          meta_classe_a_minima: "0.596" as Decimal,
          meta_classe_a_maxima: "0.84" as Decimal,
          meta_maxima_z: "0.997" as Decimal,
        },
      }),
    ).toHaveTextContent("(de 59,6% a 84%)");
  });

  it("matriz_propria_com_nc, inclusive no singular", () => {
    expect(
      frase({ tipo: "matriz_propria_com_nc", valores: { casos_declarados: 74, casos_nc: 1 } }),
    ).toHaveTextContent(
      "74 de 75 casos declarados. 1 combinação está NC: os itens nela ficam sem meta",
    );
  });

  it("matriz_propria_completa", () => {
    expect(
      frase({ tipo: "matriz_propria_completa", valores: { casos_declarados: 75 } }),
    ).toHaveTextContent("75 de 75 casos declarados. Nenhuma combinação está sem meta.");
  });
});
