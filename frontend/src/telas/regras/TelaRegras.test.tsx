/** Regras e letras (F1-11): abas, cortes, confirmação, restaurar, estados, plano e a11y. */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import type { ConclusaoRegras, Decimal } from "@/api/tipos";
import { fraseDaConclusao } from "@/componentes/FaixaConclusao";
import { reiniciarRegras } from "@/mocks/handlers/regras";
import { servidorMock } from "@/mocks/servidor";
import { renderizarApp } from "../../../tests/utils/renderizar";
import { violacoesSerias } from "../../../tests/utils/acessibilidade";

import { FRASES_REGRAS } from "./textos";

beforeEach(() => reiniciarRegras());

async function abrir(pagina = "") {
  const r = renderizarApp("/app/regras", { pagina });
  await screen.findByRole("heading", { level: 1, name: "Regras e letras" });
  return r;
}

async function abrirComPainel(pagina = "") {
  const r = await abrir(pagina);
  await screen.findByRole("heading", { level: 2, name: "ABC por consumo" });
  return r;
}

const painel = () => screen.getByRole("tabpanel");

describe("Regras e letras: com o mock", () => {
  it("frase, origem, 6 abas e o painel ABC com barra, letras, contagens e exemplo", async () => {
    await abrirComPainel();
    expect(screen.getByRole("region", { name: "Conclusão" })).toHaveTextContent(
      "Seu espaço usa o padrão Agro MRO: A até 80% do valor consumido, P a partir de 12 saídas por ano e item novo (N) por 180 dias. XYZ e Comprabilidade vêm do que você informa no cadastro.",
    );
    expect(screen.getByText("Cortes padrão Agro MRO")).toBeInTheDocument();
    const abas = within(screen.getByRole("tablist", { name: "Classificações" })).getAllByRole(
      "tab",
    );
    expect(abas.map((a) => a.textContent)).toEqual([
      "ABCABC por consumo",
      "PQRPQR de saídas",
      "pqrPQR de entradas",
      "XYZXYZ declarado",
      "123Comprabilidade 1/2/3",
      "NClasse N",
    ]);
    const p = painel();
    expect(p).toHaveTextContent("Calculada pelo Agro MRO");
    expect(p).toHaveTextContent("Até 80% do valor acumulado98 posições");
    expect(p).toHaveTextContent("Acima de 80% até 95%162");
    expect(p).toHaveTextContent("ele cai dentro dos primeiros 80% do valor acumulado: classe A.");
    expect(p).toHaveTextContent("Quantas posições estão em cada letra hoje.");
    expect(within(p).getByLabelText("Classe A até")).toHaveValue("80");
    expect(within(p).getByText("Padrão: 80 %")).toBeInTheDocument();
    expect(within(p).getByRole("button", { name: "Salvar cortes" })).toBeDisabled();
    expect(
      screen.getByText("Classificações v3-1.0.1 · alertas cpf-1.1.0 · cortes padrão Agro MRO"),
    ).toBeInTheDocument();
    expect(await violacoesSerias(document.body)).toEqual([]);
  });

  it("XYZ e Comprabilidade são informadas por você e levam a Materiais", async () => {
    await abrirComPainel();
    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole("tab", { name: /XYZ declarado/ }));
    expect(
      await screen.findByRole("heading", { level: 2, name: "XYZ declarado" }),
    ).toBeInTheDocument();
    expect(painel()).toHaveTextContent("Informada por você");
    expect(within(painel()).getByRole("link", { name: "Abrir Materiais →" })).toHaveAttribute(
      "href",
      "/app/materiais",
    );
    expect(within(painel()).queryByRole("button", { name: /Salvar/ })).not.toBeInTheDocument();
    await usuario.click(screen.getByRole("tab", { name: /Comprabilidade/ }));
    expect(
      await screen.findByText(/A Faca da plataforma de corte só vem do fabricante/),
    ).toBeInTheDocument();
  });

  it("digitar muda o texto das letras (não a barra nem o exemplo) e Desfazer volta", async () => {
    await abrirComPainel();
    const usuario = userEvent.setup();
    const campoA = within(painel()).getByLabelText("Classe A até");
    await usuario.clear(campoA);
    await usuario.type(campoA, "75,5");
    expect(painel()).toHaveTextContent("Até 75,5% do valor acumulado");
    expect(painel()).toHaveTextContent(
      "Contagens atuais. Elas mudam depois de salvar os novos cortes.",
    );
    expect(painel()).toHaveTextContent("primeiros 80% do valor acumulado");
    expect(within(painel()).getByRole("button", { name: "Salvar cortes" })).toBeEnabled();
    await usuario.click(within(painel()).getByRole("button", { name: "Desfazer" }));
    expect(campoA).toHaveValue("80");
  });

  it("formato errado avisa no campo e não deixa salvar (a regra é do backend)", async () => {
    await abrirComPainel();
    const usuario = userEvent.setup();
    const campoA = within(painel()).getByLabelText("Classe A até");
    await usuario.clear(campoA);
    await usuario.type(campoA, "80,555");
    expect(campoA).toHaveAttribute("aria-invalid", "true");
    expect(painel()).toHaveTextContent("Use um número, com até duas casas depois da vírgula.");
    expect(within(painel()).getByRole("button", { name: "Salvar cortes" })).toBeDisabled();
  });

  it("salvar pede a confirmação, manda os cortes e mostra a resposta da API", async () => {
    let corpo: unknown = null;
    servidorMock.events.on("request:start", ({ request }) => {
      if (request.method === "PUT")
        void request
          .clone()
          .json()
          .then((j) => (corpo = j));
    });
    await abrirComPainel();
    const usuario = userEvent.setup();
    const campoA = within(painel()).getByLabelText("Classe A até");
    await usuario.clear(campoA);
    await usuario.type(campoA, "75,5");
    await usuario.click(within(painel()).getByRole("button", { name: "Salvar cortes" }));

    const dialogo = await screen.findByRole("alertdialog", {
      name: "Isso recalcula o estoque todo",
    });
    expect(dialogo).toHaveTextContent(
      "As 812 posições ganham a classe nova e os parâmetros que dependem dela mudam. Casos de planejamento já validados ficam marcados para revisão.",
    );
    expect(corpo).toBeNull();
    await usuario.click(within(dialogo).getByRole("button", { name: "Salvar e recalcular" }));

    expect(
      await screen.findByText(
        "Cortes salvos para o seu espaço · versão 1. As classificações passam a usar essa regra.",
      ),
    ).toBeInTheDocument();
    expect(corpo).toEqual({
      versao: 0,
      cortes: {
        abc_a_percentual: "75.5",
        abc_b_percentual: "95",
        pqr_saidas_q: "3",
        pqr_saidas_p: "12",
        pqr_entradas_q: "3",
        pqr_entradas_p: "12",
        item_novo_dias: 180,
      },
    });
    expect(screen.getByRole("region", { name: "Conclusão" })).toHaveTextContent(
      "Seu espaço usa cortes próprios: A até 75,5%",
    );
    expect(screen.getByText("Cortes do seu espaço · versão 1")).toBeInTheDocument();
    expect(painel()).toHaveTextContent("primeiros 75,5% do valor acumulado");
    servidorMock.events.removeAllListeners();
  });

  it("Voltar na confirmação não salva nada", async () => {
    const metodos: string[] = [];
    servidorMock.events.on("request:start", ({ request }) => metodos.push(request.method));
    await abrirComPainel();
    const usuario = userEvent.setup();
    const campo = within(painel()).getByLabelText("Classe B até");
    await usuario.clear(campo);
    await usuario.type(campo, "90");
    await usuario.click(within(painel()).getByRole("button", { name: "Salvar cortes" }));
    await usuario.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Voltar" }),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(metodos).not.toContain("PUT");
    servidorMock.events.removeAllListeners();
  });

  it("regra do backend (422) aparece no formulário", async () => {
    await abrirComPainel();
    const usuario = userEvent.setup();
    const campoA = within(painel()).getByLabelText("Classe A até");
    await usuario.clear(campoA);
    await usuario.type(campoA, "96");
    await usuario.click(within(painel()).getByRole("button", { name: "Salvar cortes" }));
    await usuario.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Salvar e recalcular",
      }),
    );
    expect(await within(painel()).findByRole("alert")).toHaveTextContent(
      "O corte de A precisa ser menor que o de B, e os dois entre 0% e 100%.",
    );
  });

  it("falha de rede ao salvar não promete nada", async () => {
    servidorMock.use(http.put("/api/v1/regras/cortes", () => HttpResponse.error()));
    await abrirComPainel();
    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole("tab", { name: /Classe N/ }));
    const dias = await within(painel()).findByLabelText("Dias desde o cadastro");
    await usuario.clear(dias);
    await usuario.type(dias, "200");
    await usuario.click(within(painel()).getByRole("button", { name: "Salvar prazo da classe N" }));
    await usuario.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Salvar e recalcular",
      }),
    );
    expect(await within(painel()).findByRole("alert")).toHaveTextContent(
      "Não sabemos se os cortes foram salvos. Atualize a página e confira a versão antes de salvar de novo.",
    );
  });

  it("restaurar: dois passos, Manter os meus desiste, Sim restaura", async () => {
    await abrirComPainel();
    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole("tab", { name: /PQR de saídas/ }));
    const p = await within(painel()).findByLabelText("P a partir de");
    await usuario.clear(p);
    await usuario.type(p, "10");
    await usuario.click(within(painel()).getByRole("button", { name: "Salvar cortes" }));
    await usuario.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Salvar e recalcular",
      }),
    );
    await screen.findByText(/Cortes salvos para o seu espaço · versão 1/);
    expect(painel()).toHaveTextContent("Como 10 é o corte de P, ela é P (popular).");

    await usuario.click(screen.getByRole("button", { name: "Restaurar todas as regras Agro MRO" }));
    await usuario.click(screen.getByRole("button", { name: "Manter os meus" }));
    expect(
      screen.getByRole("button", { name: "Restaurar todas as regras Agro MRO" }),
    ).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Restaurar todas as regras Agro MRO" }));
    await usuario.click(screen.getByRole("button", { name: "Sim, restaurar e recalcular" }));
    expect(
      await screen.findByText("Cortes Agro MRO restaurados no seu espaço."),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /Restaurar todas/ })).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Cortes padrão Agro MRO")).toBeInTheDocument();
  });

  it("Para aprofundar: 3 seções recolhidas e o atalho para Casos de controle", async () => {
    await abrirComPainel();
    const secao = screen.getByRole("region", { name: "Para aprofundar" });
    expect(within(secao).getByText("Regra dos lotes").closest("details")).not.toHaveAttribute(
      "open",
    );
    expect(within(secao).getByText("Em homologação")).toBeInTheDocument();
    expect(within(secao).getByRole("link", { name: /8 alertas ativos/ })).toHaveAttribute(
      "href",
      "/app/casos-controle",
    );
  });
});

describe("Regras e letras: estados e plano", () => {
  it("?mock=carregando mostra skeleton com status", async () => {
    await abrir("?mock=carregando");
    expect(screen.getByRole("status", { name: "Carregando as regras" })).toBeInTheDocument();
  });

  it("?mock=erro mostra a mensagem curta e Tentar de novo", async () => {
    await abrir("?mock=erro");
    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("Não foi possível carregar as regras.");
  });

  it("?plano=somente_leitura bloqueia salvar, com o motivo", async () => {
    await abrirComPainel("?plano=somente_leitura");
    const usuario = userEvent.setup();
    const campoA = within(painel()).getByLabelText("Classe A até");
    await usuario.clear(campoA);
    await usuario.type(campoA, "70");
    const salvar = within(painel()).getByRole("button", { name: "Salvar cortes" });
    expect(salvar).toHaveAttribute("aria-disabled", "true");
    await usuario.click(salvar);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});

describe("Regras e letras: frase por conclusao.tipo", () => {
  const valores = {
    corte_a_percentual: "80" as Decimal,
    limite_p_saidas_ano: "12" as Decimal,
    prazo_item_novo_dias: 180,
  };
  const frase = (c: ConclusaoRegras) =>
    render(<p>{fraseDaConclusao(c, FRASES_REGRAS)}</p>).container;

  it("padrao_agro_mro", () => {
    expect(frase({ tipo: "padrao_agro_mro", valores })).toHaveTextContent(
      "Seu espaço usa o padrão Agro MRO: A até 80% do valor consumido",
    );
  });

  it("cortes_proprios", () => {
    expect(
      frase({
        tipo: "cortes_proprios",
        valores: { ...valores, corte_a_percentual: "82.5" as Decimal },
      }),
    ).toHaveTextContent("Seu espaço usa cortes próprios: A até 82,5% do valor consumido");
  });
});
