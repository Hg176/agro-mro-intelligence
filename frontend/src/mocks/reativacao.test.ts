/**
 * Reativação da aba no worker do mock: o navegador pode encerrar o service worker e ele
 * volta sem saber quais abas estão ativas (caso de Materiais com filtro indo para o proxy).
 */
import { fetchComReativacao, reativar, type CanalDoWorker } from "@/mocks/reativacao";

/** Worker falso: responde MOCKING_ENABLED a cada MOCK_ACTIVATE (como o mockServiceWorker.js). */
function workerFalso({ responde = true } = {}) {
  const ouvintes = new Set<(e: MessageEvent) => void>();
  const mensagens: string[] = [];
  const canal: CanalDoWorker = {
    controlador: () => ({
      postMessage: (m: string) => {
        mensagens.push(m);
        if (responde) {
          queueMicrotask(() => {
            for (const o of ouvintes)
              o(new MessageEvent("message", { data: { type: "MOCKING_ENABLED" } }));
          });
        }
      },
    }),
    ouvir: (o) => {
      ouvintes.add(o);
      return () => ouvintes.delete(o);
    },
  };
  return { canal, mensagens, ouvintes };
}

describe("reativar()", () => {
  it("manda MOCK_ACTIVATE e espera a confirmação, sem deixar ouvinte pendurado", async () => {
    const w = workerFalso();
    await reativar(w.canal);
    expect(w.mensagens).toEqual(["MOCK_ACTIVATE"]);
    expect(w.ouvintes.size).toBe(0);
  });

  it("worker que não responde não trava a chamada (tempo limite)", async () => {
    const w = workerFalso({ responde: false });
    await reativar(w.canal, 10);
    expect(w.ouvintes.size).toBe(0);
  });

  it("sem controlador (aba sem worker) segue direto", async () => {
    await expect(
      reativar({ controlador: () => null, ouvir: () => () => {} }),
    ).resolves.toBeUndefined();
  });
});

describe("fetchComReativacao()", () => {
  it("Materiais com filtros: reativa a aba ANTES de chamar a rede", async () => {
    const w = workerFalso();
    const ordem: string[] = [];
    const original = vi.fn(async (entrada: RequestInfo | URL) => {
      ordem.push(`fetch ${String(entrada)}`);
      return new Response("{}");
    });
    const canal: CanalDoWorker = {
      ...w.canal,
      controlador: () => ({
        postMessage: (m: string) => {
          ordem.push(m);
          w.canal.controlador()?.postMessage(m);
        },
      }),
    };
    const buscar = fetchComReativacao(original as unknown as typeof fetch, canal);
    const url = "http://localhost:5173/api/v1/materiais?filtro=abaixo_pp&abc=A&pagina=1";
    await buscar(url, { credentials: "include" });
    expect(ordem).toEqual(["MOCK_ACTIVATE", `fetch ${url}`]);
    expect(original).toHaveBeenCalledWith(url, { credentials: "include" });
  });

  it("asset e módulo do Vite não passam pela reativação", async () => {
    const w = workerFalso();
    const original = vi.fn(async () => new Response(""));
    const buscar = fetchComReativacao(original as unknown as typeof fetch, w.canal);
    await buscar("http://localhost:5173/src/main.tsx");
    await buscar(new Request("http://localhost:5173/fonts/inter.woff2"));
    expect(w.mensagens).toEqual([]);
    expect(original).toHaveBeenCalledTimes(2);
  });
});
