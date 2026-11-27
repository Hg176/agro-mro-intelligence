import { ehRotaReal, lerRotasReais } from "@/mocks/rotasReais";

describe("troca do mock pela API real, rota a rota", () => {
  it("lê a lista do VITE_API_REAL", () => {
    expect(lerRotasReais(undefined)).toEqual([]);
    expect(lerRotasReais("")).toEqual([]);
    expect(lerRotasReais(" /me , /busca/ ,materiais")).toEqual(["/me", "/busca"]);
  });

  it("casa a rota e as filhas, e só elas", () => {
    const reais = ["/me", "/materiais"];
    expect(ehRotaReal("/me", reais)).toBe(true);
    expect(ehRotaReal("/materiais/12", reais)).toBe(true);
    expect(ehRotaReal("/materials", reais)).toBe(false);
    expect(ehRotaReal("/mensagens", reais)).toBe(false);
    expect(ehRotaReal("/busca", reais)).toBe(false);
  });
});
