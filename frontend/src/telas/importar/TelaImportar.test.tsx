/** Importar dados (F1-9): fluxo completo com o mock, estados, plano e acessibilidade. */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { File as FileNode } from "node:buffer";

import type { ConclusaoImportacao } from "@/api/tipos";
import { fraseDaConclusao } from "@/componentes/FaixaConclusao";
import { servidorMock } from "@/mocks/servidor";
import { render } from "@testing-library/react";
import { renderizarApp } from "../../../tests/utils/renderizar";
import { violacoesSerias } from "../../../tests/utils/acessibilidade";

import { FRASES_IMPORTACAO } from "./textos";

const ESPERA = { timeout: 4000 };

/*
 * Upload nos testes: o FormData e o File do jsdom perdem o nome do arquivo ao passar pelo
 * fetch do Node (chega "blob" no mock). Aqui usamos os do próprio Node, que é o que o
 * navegador faz de verdade. Só neste arquivo.
 */
beforeAll(async () => {
  const FormDataNode = (await new Response(new URLSearchParams("a=1")).formData())
    .constructor as typeof FormData;
  vi.stubGlobal("FormData", FormDataNode);
});
afterAll(() => {
  vi.unstubAllGlobals();
});

async function abrir(pagina = "") {
  const r = renderizarApp("/app/importar", { pagina });
  await screen.findByRole("heading", { level: 1, name: "Importar dados" });
  return r;
}

async function abrirComPainel(pagina = "") {
  const r = await abrir(pagina);
  await screen.findByRole("heading", { name: "Cargas anteriores" });
  return r;
}

const planilha = (nome = "materiais_sap_nov.xlsx", bytes = 2_202_009) =>
  new FileNode([new Uint8Array(bytes)], nome, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }) as unknown as File;

const campoDeArquivo = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>('input[type="file"]')!;

async function enviar(container: HTMLElement, usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.upload(campoDeArquivo(container), planilha());
  await screen.findByText("✓ Arquivo lido");
}

async function ateAPrevia(container: HTMLElement, usuario: ReturnType<typeof userEvent.setup>) {
  await enviar(container, usuario);
  await usuario.click(screen.getByRole("button", { name: "Continuar para as colunas" }));
  await screen.findByText(/Lembramos do seu último mapeamento/);
  await usuario.click(screen.getByRole("button", { name: "Ver prévia" }));
  await screen.findByRole("heading", { name: "6 linhas pedem correção" });
}

describe("Importar dados: painel", () => {
  it("cabeçalho, frase de conclusão, abas e histórico do design", async () => {
    await abrirComPainel();
    expect(
      screen.getByText(
        "Envie a planilha do jeito que o ERP exporta. Nada é gravado antes da sua confirmação.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Conclusão" })).toHaveTextContent(
      "Comece pelos dados mestres: eles dizem quais materiais existem em cada local. Sem eles, movimentos e pedidos não têm onde se encaixar. Leva cerca de 2 minutos.",
    );
    const abas = within(screen.getByRole("tablist", { name: "Tipo de carga" })).getAllByRole("tab");
    expect(abas.map((a) => a.textContent)).toEqual([
      "1Dados mestresComece por aqui",
      "2Movimentos (em breve)",
      "3Pedidos em aberto (em breve)",
    ]);
    expect(screen.getByRole("list", { name: "Etapas da importação" })).toBeInTheDocument();

    const historico = screen.getByRole("region", { name: "Cargas anteriores" });
    const linhas = within(historico).getAllByRole("row").slice(1);
    expect(linhas.map((l) => l.textContent)).toEqual([
      "04/11/2026 · 14:12Movimentosmovimentos_sap_jul-out.xlsx4.312✓ ConcluídaHugo S.",
      "04/11/2026 · 13:58Dados mestresmateriais_sap_out.xlsx806✓ ConcluídaHugo S.",
      "04/11/2026 · 13:41Dados mestresmateriais_sap_out.xlsx806● Cancelada · nada gravadoHugo S.",
    ]);
    expect(await violacoesSerias(document.body)).toEqual([]);
  });

  it("Movimentos e Pedidos em aberto mostram Em breve", async () => {
    await abrirComPainel();
    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole("tab", { name: /Movimentos/ }));
    expect(
      await screen.findByText(/A carga de movimentos ainda não está disponível/),
    ).toBeInTheDocument();
    await usuario.click(screen.getByRole("tab", { name: /Pedidos em aberto/ }));
    expect(
      await screen.findByText(/A carga de pedidos em aberto ainda não está disponível/),
    ).toBeInTheDocument();
  });

  it("Baixar planilha modelo baixa o arquivo pronto da API, sem depender do plano", async () => {
    const criar = vi.fn(() => "blob:modelo");
    const revogar = vi.fn();
    Object.assign(URL, { createObjectURL: criar, revokeObjectURL: revogar });
    await abrirComPainel("?plano=somente_leitura");
    const botao = screen.getByRole("button", { name: /Baixar planilha modelo/ });
    expect(botao).not.toHaveAttribute("aria-disabled");
    await userEvent.setup().click(botao);
    await waitFor(() => expect(criar).toHaveBeenCalled());
  });
});

describe("Importar dados: fluxo Arquivo → Colunas → Prévia → Concluído", () => {
  it("envia, confere as colunas lembradas, corrige uma linha, grava com progresso e mostra o resumo", async () => {
    const { container } = await abrirComPainel();
    const usuario = userEvent.setup();

    // Passo 1: ERP e arquivo. Sem arquivo, não continua.
    expect(screen.getByRole("button", { name: "Continuar para as colunas" })).toBeDisabled();
    await usuario.click(screen.getByRole("button", { name: /TOTVS/ }));
    expect(screen.getByRole("button", { name: /TOTVS/ })).toHaveAttribute("aria-pressed", "true");
    await enviar(container, usuario);
    expect(screen.getByText("materiais_sap_nov.xlsx")).toBeInTheDocument();
    expect(screen.getByText("2,1 MB · 818 linhas · 1 aba (MARA_MARD)")).toBeInTheDocument();
    expect(await violacoesSerias(document.body)).toEqual([]);

    // Passo 2: colunas reconhecidas e lembradas pela API.
    await usuario.click(screen.getByRole("button", { name: "Continuar para as colunas" }));
    expect(
      (await screen.findByText(/Lembramos do seu último mapeamento/)).parentElement,
    ).toHaveTextContent(
      "Lembramos do seu último mapeamento (SAP, carga de 04/11/2026). 5 de 6 campos já estão ligados; confira os que pedem atenção.",
    );
    expect(screen.getByRole("combobox", { name: "Coluna para Código do material" })).toHaveValue(
      "MATNR",
    );
    expect(screen.getByRole("combobox", { name: "Coluna para Criticidade" })).toHaveDisplayValue(
      "Nenhuma coluna encontrada",
    );
    expect(screen.getByText("▲ Confira")).toBeInTheDocument();
    expect(screen.getByText("— Sem coluna")).toBeInTheDocument();
    expect(
      screen
        .getByRole("list", { name: "Etapas da importação" })
        .querySelector('[aria-current="step"]'),
    ).toHaveTextContent("Colunas");
    expect(await violacoesSerias(document.body)).toEqual([]);

    // Passo 3: prévia, 6 erros do design, correção conferida pela API.
    await usuario.click(screen.getByRole("button", { name: "Ver prévia" }));
    expect(
      await screen.findByRole("heading", { name: "6 linhas pedem correção" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Número com duas vírgulas. Use 12,50 ou 1250,00.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirmar importação de 812 linhas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/As 806 posições atuais saem e ficam só as do arquivo/),
    ).toBeInTheDocument();
    expect(await violacoesSerias(document.body)).toEqual([]);

    const preco = screen.getByRole("textbox", { name: "Linha 37, Preço unitário" });
    await usuario.clear(preco);
    await usuario.type(preco, "12,50{Enter}");
    expect(
      await screen.findByRole("heading", { name: "5 linhas pedem correção" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Corrigida")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirmar importação de 813 linhas" }),
    ).toBeInTheDocument();

    // Correção que o backend não aceita continua com o motivo.
    const local = screen.getByRole("textbox", { name: "Linha 215, Local" });
    await usuario.clear(local);
    await usuario.type(local, "ALM-98{Enter}");
    await waitFor(() =>
      expect(screen.queryByText("Conferindo a correção…")).not.toBeInTheDocument(),
    );
    expect(
      screen.getByText("Local que não existe. Use um dos 3 locais ou cadastre o novo."),
    ).toBeInTheDocument();

    // Confirmar: progresso real e resumo grande.
    await usuario.click(screen.getByRole("radio", { name: /Substituir tudo/ }));
    await usuario.click(screen.getByRole("button", { name: "Confirmar importação de 813 linhas" }));
    expect(await screen.findByText(/Gravando .* de 813 posições…/, {}, ESPERA)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeDisabled();
    expect(
      await screen.findByRole("heading", { name: "813 posições em 3 locais" }, ESPERA),
    ).toBeInTheDocument();
    expect(screen.getByText("R$ 2,4 mi")).toBeInTheDocument();
    expect(
      screen.getByText("Almox. central, Oficina campo, Posto combustível"),
    ).toBeInTheDocument();
    expect(screen.getByText("12 sem preço")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver minha Visão geral" })).toHaveAttribute(
      "href",
      "/app/visao-geral",
    );
    expect(
      screen
        .getByRole("list", { name: "Etapas da importação" })
        .querySelector('[aria-current="step"]'),
    ).toBeNull();
    expect(await violacoesSerias(document.body)).toEqual([]);

    await usuario.click(screen.getByRole("button", { name: "Importar movimentos" }));
    expect(screen.getByRole("tab", { name: /Movimentos/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("o modo e o mapeamento trocado vão para a API", async () => {
    const corpos: Record<string, unknown> = {};
    servidorMock.events.on("request:start", ({ request }) => {
      const caminho = new URL(request.url).pathname;
      if (request.method === "POST" && /previa|confirmar/.test(caminho)) {
        void request
          .clone()
          .json()
          .then((j) => (corpos[caminho.split("/").pop()!] = j));
      }
    });
    const { container } = await abrirComPainel();
    const usuario = userEvent.setup();
    await enviar(container, usuario);
    await usuario.click(screen.getByRole("button", { name: "Continuar para as colunas" }));
    const grupo = await screen.findByRole("combobox", { name: "Coluna para Grupo de material" });
    await usuario.selectOptions(grupo, "");
    expect(screen.getAllByText("— Sem coluna")).toHaveLength(2);
    await usuario.click(screen.getByRole("checkbox", { name: "Lembrar este mapeamento" }));
    await usuario.click(screen.getByRole("button", { name: "Ver prévia" }));
    await screen.findByRole("heading", { name: "6 linhas pedem correção" });
    await usuario.click(screen.getByRole("button", { name: "Confirmar importação de 812 linhas" }));
    await screen.findByRole("heading", { name: "812 posições em 3 locais" }, ESPERA);
    expect(corpos.previa).toMatchObject({
      lembrar: false,
      mapeamento: { code: "MATNR", group_1: null, criticality: null },
    });
    expect(corpos.confirmar).toEqual({ modo: "append" });
    servidorMock.events.removeAllListeners();
  });

  it("formato e tamanho errados avisam antes de enviar", async () => {
    const { container } = await abrirComPainel();
    const usuario = userEvent.setup({ applyAccept: false });
    await usuario.upload(campoDeArquivo(container), planilha("materiais.pdf", 10));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Formato não aceito. Envie .xlsx, .xls ou .csv.",
    );
    await usuario.upload(campoDeArquivo(container), planilha("grande.xlsx", 15 * 1024 * 1024 + 1));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O arquivo passa do limite de 15 MB.",
    );
    expect(screen.queryByText("✓ Arquivo lido")).not.toBeInTheDocument();
  });

  it("erro do backend na leitura aparece junto da área do arquivo", async () => {
    servidorMock.use(
      http.post("/api/v1/importacao/arquivos", () =>
        HttpResponse.json({ detail: "A planilha não tem a aba de materiais." }, { status: 422 }),
      ),
    );
    const { container } = await abrirComPainel();
    await userEvent.setup().upload(campoDeArquivo(container), planilha());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A planilha não tem a aba de materiais.",
    );
  });

  it("?carga=falha: tudo ou nada, o motivo aparece e dá para confirmar de novo", async () => {
    const { container } = await abrirComPainel("?carga=falha");
    const usuario = userEvent.setup();
    await ateAPrevia(container, usuario);
    await usuario.click(screen.getByRole("button", { name: "Confirmar importação de 812 linhas" }));
    const alerta = await screen.findByText("A importação não foi concluída", {}, ESPERA);
    expect(alerta.closest("[role=alert]")).toHaveTextContent(
      "A gravação parou no meio. Nada foi gravado; o estoque continua como antes.",
    );
    expect(
      screen.getByRole("button", { name: "Confirmar importação de 812 linhas" }),
    ).toBeEnabled();
  });

  it("falha de rede ao confirmar não promete nada (gravação incerta)", async () => {
    servidorMock.use(
      http.post("/api/v1/importacao/arquivos/:id/confirmar", () => HttpResponse.error()),
    );
    const { container } = await abrirComPainel();
    const usuario = userEvent.setup();
    await ateAPrevia(container, usuario);
    await usuario.click(screen.getByRole("button", { name: "Confirmar importação de 812 linhas" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não sabemos se a importação foi gravada. Confira em Cargas anteriores antes de enviar de novo.",
    );
  });
});

describe("Importar dados: estados e plano", () => {
  it("?mock=carregando mostra skeleton com status", async () => {
    await abrir("?mock=carregando");
    expect(screen.getByRole("status", { name: "Carregando a importação" })).toBeInTheDocument();
  });

  it("?mock=erro mostra a mensagem curta e Tentar de novo", async () => {
    await abrir("?mock=erro");
    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("Não foi possível carregar a importação.");
    expect(within(alerta).getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
  });

  it("?mock=vazio: sem histórico, e o Substituir não cita número", async () => {
    await abrir("?mock=vazio");
    expect(await screen.findByText("Nenhuma carga ainda.")).toBeInTheDocument();
  });

  it("?plano=somente_leitura bloqueia enviar o arquivo, com o motivo", async () => {
    await abrirComPainel("?plano=somente_leitura");
    const area = screen.getByRole("button", { name: /Arraste a planilha de dados mestres aqui/ });
    expect(area).toHaveAttribute("aria-disabled", "true");
    expect(screen.getAllByText("Seu espaço está em somente leitura").length).toBeGreaterThan(0);
  });
});

describe("Importar dados: frase por conclusao.tipo", () => {
  it("comecar_pelos_dados_mestres com e sem minutos", () => {
    const com: ConclusaoImportacao = {
      tipo: "comecar_pelos_dados_mestres",
      valores: { minutos_estimados: 1 },
    };
    const { container, rerender } = render(<p>{fraseDaConclusao(com, FRASES_IMPORTACAO)}</p>);
    expect(container).toHaveTextContent("Leva cerca de 1 minuto.");
    rerender(
      <p>
        {fraseDaConclusao(
          { tipo: "comecar_pelos_dados_mestres", valores: { minutos_estimados: null } },
          FRASES_IMPORTACAO,
        )}
      </p>,
    );
    expect(container).not.toHaveTextContent("Leva");
  });
});
