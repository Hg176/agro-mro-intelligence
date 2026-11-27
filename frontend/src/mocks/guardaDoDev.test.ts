/** Regras do mock no dev: o que o Vite faz com /api e o que o MSW faz sem handler. */
import { aoChamarSemHandler, destinoNoServidorDev, ehChamadaDaApi } from "@/mocks/guardaDoDev";

const URL_COM_FILTROS = "/api/v1/materiais?filtro=abaixo_pp&abc=A&pagina=1";

describe("servidor do Vite com o mock ligado", () => {
  const ligado = { mockLigado: true, reais: [] as string[] };

  it("chamada mockada que chegou ao Vite não vai para o proxy (o worker não interceptou)", () => {
    expect(destinoNoServidorDev(URL_COM_FILTROS, ligado)).toBe("mock_nao_interceptou");
    expect(destinoNoServidorDev("/api/v1/materiais?pagina=1", ligado)).toBe("mock_nao_interceptou");
    expect(destinoNoServidorDev("/api/outra", ligado)).toBe("mock_nao_interceptou");
  });

  it("rota em VITE_API_REAL segue para o proxy, com ou sem filtros", () => {
    const comReal = { mockLigado: true, reais: ["/materiais"] };
    expect(destinoNoServidorDev(URL_COM_FILTROS, comReal)).toBe("proxy");
    expect(destinoNoServidorDev("/api/v1/me", comReal)).toBe("mock_nao_interceptou");
  });

  it("mock desligado: tudo vai para o proxy; fora de /api nada muda", () => {
    expect(destinoNoServidorDev(URL_COM_FILTROS, { mockLigado: false, reais: [] })).toBe("proxy");
    expect(destinoNoServidorDev("/src/main.tsx", ligado)).toBe("proxy");
    expect(destinoNoServidorDev("/apiario", ligado)).toBe("proxy");
  });
});

describe("onUnhandledRequest no navegador", () => {
  it("/api/* sem handler é erro; asset do Vite segue sem aviso", () => {
    const imprimir = { warning: vi.fn(), error: vi.fn() };
    aoChamarSemHandler(new Request(`http://localhost:5173${URL_COM_FILTROS}`), imprimir);
    expect(imprimir.error).toHaveBeenCalledTimes(1);

    const outro = { warning: vi.fn(), error: vi.fn() };
    aoChamarSemHandler(new Request("http://localhost:5173/src/main.tsx"), outro);
    aoChamarSemHandler(
      new Request("http://localhost:5173/node_modules/.vite/deps/react.js"),
      outro,
    );
    expect(outro.error).not.toHaveBeenCalled();
    expect(outro.warning).not.toHaveBeenCalled();
  });

  it("reconhece só /api e /api/...", () => {
    expect(ehChamadaDaApi("/api")).toBe(true);
    expect(ehChamadaDaApi("/api/v1/materiais")).toBe(true);
    expect(ehChamadaDaApi("/apiario")).toBe(false);
    expect(ehChamadaDaApi("/app/materiais")).toBe(false);
  });
});
