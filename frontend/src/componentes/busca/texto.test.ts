import { ehBuscaPorCodigo, partesComTermo, partesDoCodigo, semAcento } from "./texto";

const marcado = (partes: { texto: string; marcado: boolean }[]) =>
  partes.filter((p) => p.marcado).map((p) => p.texto);

describe("texto da busca", () => {
  it("ignora acentos e caixa", () => {
    expect(semAcento("Óleo HIDRÁULICO")).toBe("oleo hidraulico");
  });

  it("reconhece busca por código (2+ dígitos, só dígitos/espaços/ponto/traço)", () => {
    expect(ehBuscaPorCodigo("0012 3456")).toBe(true);
    expect(ehBuscaPorCodigo("12")).toBe(true);
    expect(ehBuscaPorCodigo("1")).toBe(false);
    expect(ehBuscaPorCodigo("6205 2RS")).toBe(false);
  });

  it("marca o trecho sem acento mantendo o texto original", () => {
    expect(marcado(partesComTermo("Óleo hidráulico 68", "oleo"))).toEqual(["Óleo"]);
    expect(partesComTermo("Correia B-52", "xyz")).toEqual([
      { texto: "Correia B-52", marcado: false },
    ]);
  });

  it("marca os dígitos no código em blocos, com ou sem espaços no termo", () => {
    expect(marcado(partesDoCodigo("0000 0012 3456", "0012 3456"))).toEqual(["0012 3456"]);
    expect(marcado(partesDoCodigo("0000 0012 3456", "00123456"))).toEqual(["0012 3456"]);
    expect(marcado(partesDoCodigo("0000 0012 3456", "123"))).toEqual(["12 3"]);
  });
});
