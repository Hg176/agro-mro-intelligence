/**
 * Guarda das regras inegociáveis que dá para checar por análise estática:
 * cores só por token, nada de token/sessão no navegador, nada de parseFloat/Number sobre Decimal.
 *
 * Varre src/ inteiro, inclusive src/components/ui/ (shadcn). Fica de fora só o que
 * pode ter cor literal: src/index.css (onde os tokens são definidos) e src/mocks/.
 */
import { lerArquivos, type ArquivoFonte } from "./guardas/arquivos";
import {
  verificarArmazenamento,
  verificarConversaoNumerica,
  verificarCores,
  verificarCoresCss,
  verificarParseFloat,
  type Ocorrencia,
} from "./guardas/verificadores";

const foraDaVarredura = (caminho: string) =>
  caminho === "src/index.css" || caminho.startsWith("src/mocks/");

const fontes = lerArquivos("src", [".ts", ".tsx"]).filter((a) => !foraDaVarredura(a.caminho));
const estilos = lerArquivos("src", [".css"]).filter((a) => !foraDaVarredura(a.caminho));

function relatar(arquivos: ArquivoFonte[], verificar: (texto: string) => Ocorrencia[]): string[] {
  return arquivos.flatMap((arquivo) =>
    verificar(arquivo.texto).map(
      (o) => `${arquivo.caminho}:${o.linha} — ${o.regra}: ${JSON.stringify(o.trecho)}`,
    ),
  );
}

const naPasta = (pasta: string) => (a: ArquivoFonte) => a.caminho.startsWith(`${pasta}/`);

describe("guarda: varredura de src/", () => {
  it("encontra arquivos para varrer (a guarda não está olhando uma pasta vazia)", () => {
    expect(fontes.length).toBeGreaterThan(0);
    expect(fontes.some((a) => a.caminho === "src/main.tsx")).toBe(true);
  });

  it("não tem hex solto, cor padrão do Tailwind, black/white nem cor em style inline", () => {
    expect(relatar(fontes, verificarCores)).toEqual([]);
    expect(relatar(estilos, verificarCoresCss)).toEqual([]);
  });

  it("não guarda token, auth ou sessão em localStorage/sessionStorage", () => {
    expect(relatar(fontes, verificarArmazenamento)).toEqual([]);
  });

  it("não usa parseFloat em src/", () => {
    expect(relatar(fontes, verificarParseFloat)).toEqual([]);
  });

  it("não converte para número em src/telas nem em src/componentes", () => {
    const telasEComponentes = fontes.filter(
      (a) => naPasta("src/telas")(a) || naPasta("src/componentes")(a),
    );
    expect(relatar(telasEComponentes, verificarConversaoNumerica)).toEqual([]);
  });
});

describe("guarda: casos negativos (provam que cada verificador reprova o erro)", () => {
  it.each([
    ['const cor = "#1F5135";', "#1F5135"],
    ['const cor = "#1f5135";', "#1f5135"],
    ["const curta = '#fff';", "#fff"],
    ['const comAlfa = "#1f513580";', "#1f513580"],
  ])("reprova hex solto: %s", (trecho, esperado) => {
    const achados = verificarCores(trecho);
    expect(achados).toHaveLength(1);
    expect(achados[0]?.trecho).toBe(esperado);
  });

  it("não confunde hex com âncora nem entidade HTML", () => {
    expect(verificarCores('<a href="#conteudo">Pular</a>')).toEqual([]);
    expect(verificarCores("const s = '&#123;';")).toEqual([]);
  });

  it.each([
    'className="bg-red-500"',
    'className="text-gray-600"',
    'className="hover:border-slate-200"',
    'className="bg-neutral-950/50"',
    'className="from-emerald-50"',
    "const v = 'var(--color-blue-200)';",
  ])("reprova cor padrão do Tailwind: %s", (trecho) => {
    expect(verificarCores(trecho)).toHaveLength(1);
  });

  it.each([
    'className="bg-black/50"',
    'className="text-white"',
    'className="border-white"',
    'className="data-[state=open]:bg-black"',
  ])("reprova black/white: %s", (trecho) => {
    expect(verificarCores(trecho)).toHaveLength(1);
  });

  it("aceita as classes dos tokens", () => {
    expect(
      verificarCores(
        'className="bg-verde-900 text-ouro-700 text-status-ruptura-texto bg-branco border-borda"',
      ),
    ).toEqual([]);
  });

  it("reprova cor em style inline", () => {
    expect(verificarCores("<p style={{ color: corDoTema }}>x</p>")).toHaveLength(1);
    expect(verificarCores("<p style={{ width: 4, backgroundColor: c }}>x</p>")).toHaveLength(1);
    expect(verificarCores("<p style={{ width: 4 }}>x</p>")).toEqual([]);
  });

  it("reprova hex e cor padrão em .css fora do index.css", () => {
    expect(verificarCoresCss(".x { color: #66746e; }")).toHaveLength(1);
    expect(verificarCoresCss(".x { @apply text-zinc-500; }")).toHaveLength(1);
  });

  it.each([
    'localStorage.setItem("token", valor);',
    "sessionStorage.setItem('auth', valor);",
    'localStorage.setItem("sessao_atual", JSON.stringify(s));',
    'window.localStorage . setItem("accessToken", t);',
  ])("reprova token/sessão no navegador: %s", (trecho) => {
    expect(verificarArmazenamento(trecho)).toHaveLength(1);
  });

  it("reprova parseFloat e Number() sobre Decimal", () => {
    expect(verificarParseFloat("const v = parseFloat(material.saldo_final);")).toHaveLength(1);
    expect(verificarConversaoNumerica("const v = Number(kpi.valor);")).toHaveLength(1);
    expect(verificarConversaoNumerica("const v = parseFloat(kpi.valor);")).toHaveLength(1);
    expect(verificarConversaoNumerica("Number.isInteger(x)")).toEqual([]);
  });

  it("aceita exceção explícita com motivo, e só com motivo", () => {
    expect(
      verificarConversaoNumerica("const p = Number(pagina); // guarda-ok: índice de paginação"),
    ).toEqual([]);
    expect(verificarConversaoNumerica("const p = Number(pagina); // guarda-ok:")).toHaveLength(1);
  });
});
