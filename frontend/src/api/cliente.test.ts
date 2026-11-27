import { delay, http, HttpResponse } from "msw";

import { aoExpirarSessao, ApiErro, request } from "@/api/cliente";
import { servidorMock } from "@/mocks/servidor";

const rota = (caminho: string) => `${location.origin}/api/v1${caminho}`;

describe("request()", () => {
  it("chama /api/v1 com credentials include e devolve o JSON", async () => {
    let credenciais: string | undefined;
    servidorMock.use(
      http.get(rota("/teste"), ({ request: req }) => {
        credenciais = req.credentials;
        return HttpResponse.json({ ok: true });
      }),
    );
    await expect(request<{ ok: boolean }>("/teste")).resolves.toEqual({ ok: true });
    expect(credenciais).toBe("include");
  });

  it("monta parâmetros e deixa de fora os vazios", async () => {
    let busca = "";
    servidorMock.use(
      http.get(rota("/teste"), ({ request: req }) => {
        busca = new URL(req.url).search;
        return HttpResponse.json({});
      }),
    );
    await request("/teste", { parametros: { q: "rolamento", filtro: null, vazio: "", pagina: 2 } });
    expect(busca).toBe("?q=rolamento&pagina=2");
  });

  it("manda JSON no corpo com Content-Type", async () => {
    let corpo: unknown;
    let tipo: string | null = null;
    servidorMock.use(
      http.post(rota("/teste"), async ({ request: req }) => {
        tipo = req.headers.get("content-type");
        corpo = await req.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await expect(
      request("/teste", { metodo: "POST", corpo: { saldo: "12.50" } }),
    ).resolves.toBeUndefined();
    expect(tipo).toBe("application/json");
    expect(corpo).toEqual({ saldo: "12.50" });
  });

  it("401 vira ApiErro sessao_expirada e avisa quem ouve", async () => {
    servidorMock.use(http.get(rota("/teste"), () => HttpResponse.json({}, { status: 401 })));
    const ouvinte = vi.fn();
    const cancelar = aoExpirarSessao(ouvinte);
    const erro = await request("/teste").catch((e: unknown) => e);
    cancelar();
    expect(erro).toBeInstanceOf(ApiErro);
    expect((erro as ApiErro).codigo).toBe("sessao_expirada");
    expect((erro as ApiErro).status).toBe(401);
    expect(ouvinte).toHaveBeenCalledTimes(1);
  });

  it("401 com ignorar401 não derruba a sessão", async () => {
    servidorMock.use(http.post(rota("/sessao"), () => HttpResponse.json({}, { status: 401 })));
    const ouvinte = vi.fn();
    const cancelar = aoExpirarSessao(ouvinte);
    await request("/sessao", { metodo: "POST", ignorar401: true }).catch(() => undefined);
    cancelar();
    expect(ouvinte).not.toHaveBeenCalled();
  });

  it("403 vira sem_permissao, distinto de 401, e usa a mensagem curta do backend", async () => {
    servidorMock.use(
      http.post(rota("/teste"), () =>
        HttpResponse.json({ detail: "Seu plano está em somente leitura." }, { status: 403 }),
      ),
    );
    const erro = (await request("/teste", { metodo: "POST" }).catch((e: unknown) => e)) as ApiErro;
    expect(erro.codigo).toBe("sem_permissao");
    expect(erro.semPermissao).toBe(true);
    expect(erro.sessaoExpirada).toBe(false);
    expect(erro.mensagem).toBe("Seu plano está em somente leitura.");
  });

  it("aceita detail no formato { message } do FastAPI", async () => {
    servidorMock.use(
      http.get(rota("/teste"), () =>
        HttpResponse.json({ detail: { message: "A base mudou." } }, { status: 409 }),
      ),
    );
    const erro = (await request("/teste").catch((e: unknown) => e)) as ApiErro;
    expect(erro.codigo).toBe("conflito");
    expect(erro.mensagem).toBe("A base mudou.");
  });

  it("5xx nunca mostra a resposta crua do servidor", async () => {
    servidorMock.use(
      http.get(rota("/teste"), () =>
        HttpResponse.json(
          { detail: "Traceback (most recent call last): psycopg.OperationalError ..." },
          { status: 500 },
        ),
      ),
    );
    const erro = (await request("/teste").catch((e: unknown) => e)) as ApiErro;
    expect(erro.codigo).toBe("servidor");
    expect(erro.mensagem).not.toMatch(/Traceback|psycopg/);
    expect(erro.message).toBe(erro.mensagem);
  });

  it("falha de rede vira ApiErro rede", async () => {
    servidorMock.use(http.get(rota("/teste"), () => HttpResponse.error()));
    const erro = (await request("/teste").catch((e: unknown) => e)) as ApiErro;
    expect(erro.codigo).toBe("rede");
    expect(erro.status).toBe(0);
  });

  it("tempo esgotado vira ApiErro tempo_esgotado", async () => {
    servidorMock.use(
      http.get(rota("/teste"), async () => {
        await delay(500);
        return HttpResponse.json({});
      }),
    );
    const erro = (await request("/teste", { timeoutMs: 30 }).catch((e: unknown) => e)) as ApiErro;
    expect(erro.codigo).toBe("tempo_esgotado");
  });

  it("resposta que não é JSON vira resposta_invalida", async () => {
    servidorMock.use(http.get(rota("/teste"), () => new HttpResponse("<html>", { status: 200 })));
    const erro = (await request("/teste").catch((e: unknown) => e)) as ApiErro;
    expect(erro.codigo).toBe("resposta_invalida");
  });
});
