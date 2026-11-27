/**
 * O mock responde como o design e obedece aos parâmetros de URL:
 * ?mock=carregando|erro|vazio, ?plano=..., ?sessao=expirada.
 */
import { ApiErro } from "@/api/cliente";
import { buscarPosicoes } from "@/api/busca";
import { listarMateriais } from "@/api/materiais";
import { obterSessao } from "@/api/sessao";
import { obterVisaoGeral } from "@/api/visaoGeral";
import { servidorMock } from "@/mocks/servidor";

const naPagina = (busca: string) => history.replaceState(null, "", `/app/visao-geral${busca}`);

describe("mock: GET /me e o plano", () => {
  it("padrão é plano ativo com todas as permissões", async () => {
    const s = await obterSessao();
    expect(s.plano.estado).toBe("ativo");
    expect(s.plano.itens_usados).toBe(812);
    expect(s.plano.itens_limite).toBe(1000);
    expect(Object.values(s.permissoes).every(Boolean)).toBe(true);
    expect(s.usuario.iniciais).toBe("HS");
  });

  it("?plano=somente_leitura tira todas as permissões de escrita", async () => {
    naPagina("?plano=somente_leitura");
    const s = await obterSessao();
    expect(s.plano.estado).toBe("somente_leitura");
    expect(Object.values(s.permissoes).some(Boolean)).toBe(false);
  });

  it("?plano=demonstracao limita a 10 itens", async () => {
    naPagina("?plano=demonstracao");
    const s = await obterSessao();
    expect(s.plano.estado).toBe("demonstracao");
    expect(s.plano.itens_limite).toBe(10);
  });

  it("?sessao=expirada faz /me responder 401", async () => {
    naPagina("?sessao=expirada");
    const erro = (await obterSessao().catch((e: unknown) => e)) as ApiErro;
    expect(erro).toBeInstanceOf(ApiErro);
    expect(erro.status).toBe(401);
  });

  it("?mock= não afeta /me (só a rota da tela)", async () => {
    naPagina("?mock=erro");
    await expect(obterSessao()).resolves.toMatchObject({ plano: { estado: "ativo" } });
  });
});

describe("mock: estado da tela (?mock=)", () => {
  it("normal devolve a Visão geral do design", async () => {
    const v = await obterVisaoGeral();
    expect(v.conclusao?.tipo).toBe("parado_e_abaixo_pp");
    expect(v.contexto.posicoes).toBe(812);
    expect(v.prioridades.itens).toHaveLength(6);
    expect(v.sinais).toHaveLength(7);
  });

  it("?mock=erro responde 500", async () => {
    naPagina("?mock=erro");
    const erro = (await obterVisaoGeral().catch((e: unknown) => e)) as ApiErro;
    expect(erro.status).toBe(500);
    expect(erro.codigo).toBe("servidor");
  });

  it("?mock=vazio devolve catálogo vazio em Materiais", async () => {
    naPagina("?mock=vazio");
    const m = await listarMateriais({
      q: "",
      filtro: null,
      abc: null,
      pqr: null,
      sinal: null,
      pagina: 1,
    });
    expect(m.conclusao.tipo).toBe("catalogo_vazio");
    expect(m.itens).toEqual([]);
  });

  it("?mock=carregando não responde (a requisição fica pendente)", async () => {
    naPagina("?mock=carregando");
    const controle = new AbortController();
    const pendente = listarMateriais(
      { q: "", filtro: null, abc: null, pqr: null, sinal: null, pagina: 1 },
      controle.signal,
    );
    const resultado = await Promise.race([
      pendente.then(() => "respondeu"),
      new Promise((r) => setTimeout(() => r("pendente"), 100)),
    ]);
    controle.abort();
    await pendente.catch(() => undefined);
    expect(resultado).toBe("pendente");
  });

  it("?plano= e ?mock= combinam", async () => {
    naPagina("?plano=somente_leitura&mock=vazio");
    const [s, m] = await Promise.all([
      obterSessao(),
      listarMateriais({ q: "", filtro: null, abc: null, pqr: null, sinal: null, pagina: 1 }),
    ]);
    expect(s.plano.estado).toBe("somente_leitura");
    expect(m.conclusao.tipo).toBe("catalogo_vazio");
  });
});

describe("mock: Materiais", () => {
  it("?filtro=abaixo_pp&abc=A&pagina=1 (link 'Ver os 5 itens A') é respondido pelo handler, sem ir para a rede", async () => {
    const vistas: string[] = [];
    const semHandler: string[] = [];
    const ouvir = ({ request }: { request: Request }) => vistas.push(request.url);
    const naoCasou = ({ request }: { request: Request }) => semHandler.push(request.url);
    servidorMock.events.on("request:start", ouvir);
    servidorMock.events.on("request:unhandled", naoCasou);
    try {
      const m = await listarMateriais({
        q: "",
        filtro: "abaixo_pp",
        abc: "A",
        pqr: null,
        sinal: null,
        pagina: 1,
      });
      const url = new URL(vistas[0] ?? "http://x");
      expect(url.pathname).toBe("/api/v1/materiais");
      expect(Object.fromEntries(url.searchParams)).toEqual({
        filtro: "abaixo_pp",
        abc: "A",
        pagina: "1",
      });
      expect(semHandler).toEqual([]);
      expect(m.conclusao.tipo).toBe("catalogo_com_posicoes");
      expect(m.itens.length).toBeGreaterThan(0);
      expect(m.itens.every((p) => p.abc === "A")).toBe(true);
      expect(m.itens.every((p) => p.situacao === "abaixo_pp" || p.situacao === "ruptura")).toBe(
        true,
      );
      expect(m.total).toBe(m.itens.length);
      expect(m.pagina).toBe(1);
      expect(m.paginas).toBe(1);
    } finally {
      servidorMock.events.removeListener("request:start", ouvir);
      servidorMock.events.removeListener("request:unhandled", naoCasou);
    }
  });

  it("filtra por código com ou sem espaços", async () => {
    const comEspaco = await listarMateriais({
      q: "0000 0012 3456",
      filtro: null,
      abc: null,
      pqr: null,
      sinal: null,
      pagina: 1,
    });
    const semEspaco = await listarMateriais({
      q: "000000123456",
      filtro: null,
      abc: null,
      pqr: null,
      sinal: null,
      pagina: 1,
    });
    expect(comEspaco.itens.map((p) => p.code)).toEqual(["000000123456"]);
    expect(semEspaco.itens.map((p) => p.code)).toEqual(["000000123456"]);
  });

  it("aplica filtro pronto", async () => {
    const m = await listarMateriais({
      q: "",
      filtro: "saldo_negativo",
      abc: null,
      pqr: null,
      sinal: null,
      pagina: 1,
    });
    expect(m.itens.map((p) => p.short_description)).toEqual(["Filtro de ar primário"]);
  });

  it("Decimal chega como string e ausente chega como null", async () => {
    const m = await listarMateriais({
      q: "junta",
      filtro: null,
      abc: null,
      pqr: null,
      sinal: null,
      pagina: 1,
    });
    const junta = m.itens[0];
    expect(junta?.stock_quantity).toBe("2");
    expect(junta?.reorder_point).toBeNull();
    expect(junta?.abc).toBeNull();
    expect(junta?.situacao).toBe("sem_calculo");
    expect(junta?.motivo_situacao).toMatch(/Histórico insuficiente/);
  });
});

describe("mock: busca global (pontuação do BuscaGlobal.dc.html)", () => {
  it("sem texto devolve só os 3 atalhos com contagem", async () => {
    const r = await buscarPosicoes("");
    expect(r.posicoes).toEqual([]);
    expect(r.atalhos?.map((a) => a.posicoes)).toEqual([23, 8, 214]);
  });

  it("código com espaços acha a posição", async () => {
    const r = await buscarPosicoes("0012 3456");
    expect(r.posicoes[0]?.short_description).toBe("Rolamento 6205 2RS");
  });

  it("ignora acentos", async () => {
    const r = await buscarPosicoes("oleo");
    expect(r.posicoes[0]?.short_description).toBe("Óleo hidráulico 68 (20 L)");
  });

  it("devolve no máximo 6 posições e o total", async () => {
    const r = await buscarPosicoes("a");
    expect(r.posicoes.length).toBeLessThanOrEqual(6);
    expect(r.total).toBeGreaterThan(6);
  });

  it("começo da descrição vem antes de trecho no meio", async () => {
    const r = await buscarPosicoes("filtro");
    expect(r.posicoes.map((p) => p.short_description)).toEqual([
      "Filtro de ar primário",
      "Filtro separador de combustível",
    ]);
  });

  it("sem resultado devolve lista vazia", async () => {
    const r = await buscarPosicoes("xyzw");
    expect(r.total).toBe(0);
    expect(r.posicoes).toEqual([]);
  });

  it("rota sem mock responde 501 (não vai para a rede)", async () => {
    const resposta = await fetch(`${location.origin}/api/v1/nao-existe`);
    expect(resposta.status).toBe(501);
  });
});
