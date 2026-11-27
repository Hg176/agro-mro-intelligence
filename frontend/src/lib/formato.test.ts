import type { DataHoraIso, DataIso, Decimal } from "@/api/tipos";
import {
  codigoEmBlocos,
  codigoSemEspacos,
  data,
  dataComHora,
  dataDoInstante,
  dataHora,
  decimal,
  haDias,
  inteiro,
  larguraDaFracao,
  larguraDoPercentual,
  moeda,
  moedaCompacta,
  percentual,
  percentualDeFracao,
  periodo,
  tamanhoDeArquivo,
  TRACO,
} from "@/lib/formato";

const dia = (v: string) => v as DataIso;
const iso = (v: string) => v as DataHoraIso;

describe("formato", () => {
  it("inteiro com milhar, e ausente vira traço (não zero)", () => {
    expect(inteiro(1000)).toBe("1.000");
    expect(inteiro(812)).toBe("812");
    expect(inteiro(0)).toBe("0");
    expect(inteiro(null)).toBe(TRACO);
  });

  it("data de calendário sem fuso", () => {
    expect(data(dia("2026-11-11"))).toBe("11/11/2026");
    expect(data(null)).toBe(TRACO);
    expect(() => data(dia("11/11/2026"))).toThrow();
  });

  it("período omite o ano do início quando é o mesmo do fim", () => {
    expect(periodo({ inicio: dia("2026-07-01"), fim: dia("2026-11-11") })).toBe(
      "01/07 a 11/11/2026",
    );
    expect(periodo({ inicio: dia("2025-12-01"), fim: dia("2026-01-31") })).toBe(
      "01/12/2025 a 31/01/2026",
    );
  });

  it("instante UTC aparece em America/Cuiaba (UTC−4)", () => {
    // 03/12/2026 02:30 UTC ainda é 02/12/2026 em Cuiabá.
    expect(dataDoInstante(iso("2026-12-03T02:30:00Z"))).toBe("02/12/2026");
    expect(dataDoInstante(iso("2026-12-03T15:00:00Z"))).toBe("03/12/2026");
    expect(dataHora(iso("2026-11-24T13:05:00Z"))).toBe("24/11/2026, 09:05");
    expect(dataHora(null)).toBe(TRACO);
  });

  it("moeda BRL e moeda compacta como no design", () => {
    const f = (v: string) => v as Decimal;
    expect(moeda(f("100"))).toBe("R$ 100,00");
    expect(moeda(f("1234.5")).replace(/\u00a0/g, " ")).toBe("R$ 1.234,50");
    expect(moedaCompacta(f("2412530.40"))).toBe("R$ 2,4 mi");
    expect(moedaCompacta(f("412380.00"))).toBe("R$ 412 mil");
    expect(moedaCompacta(null)).toBe(TRACO);
  });

  it("não perde precisão: a string Decimal vai direto para o Intl", () => {
    const f = (v: string) => v as Decimal;
    // 0.1 + 0.2 em number daria 0.30000000000000004; aqui nada é somado nem convertido.
    expect(decimal(f("0.3000"))).toBe("0,3");
    expect(decimal(f("123456789012345.1234"))).toBe("123.456.789.012.345,1234");
  });

  it("quantidade, percentual e fração", () => {
    const f = (v: string) => v as Decimal;
    expect(decimal(f("-2"))).toBe("-2");
    expect(decimal(f("1000"))).toBe("1.000");
    expect(decimal(f("12.5"))).toBe("12,5");
    expect(percentual(f("17"))).toBe("17%");
    expect(percentual(f("17.1"))).toBe("17,1%");
    expect(percentualDeFracao(f("0.975"))).toBe("97,5%");
    expect(percentualDeFracao(f("0.596"))).toBe("59,6%");
    expect(percentualDeFracao(f("0"))).toBe("0%");
  });

  it("ausente ou malformado nunca vira zero", () => {
    const f = (v: string) => v as Decimal;
    expect(decimal(null)).toBe(TRACO);
    expect(percentual(null)).toBe(TRACO);
    expect(decimal(f(""))).toBe(TRACO);
    expect(decimal(f("NaN"))).toBe(TRACO);
    expect(moeda(f("abc"))).toBe(TRACO);
  });

  it("código em blocos de 4 é só visual", () => {
    expect(codigoEmBlocos("000000123456")).toBe("0000 0012 3456");
    expect(codigoEmBlocos("00150")).toBe("0015 0");
    expect(codigoEmBlocos("150")).toBe("150");
    expect(codigoEmBlocos("ABC-12")).toBe("ABC-12");
    expect(codigoSemEspacos("0000 0012 3456")).toBe("000000123456");
  });

  it("largura da barra usa a fração pronta e recusa valor fora do formato", () => {
    const f = (v: string) => v as Decimal;
    expect(larguraDaFracao(f("0.812"))).toBe("calc(0.812 * 100%)");
    expect(larguraDaFracao(f("1"))).toBe("calc(1 * 100%)");
    expect(larguraDaFracao(f("0"))).toBe("calc(0 * 100%)");
    expect(larguraDaFracao(null)).toBeNull();
    expect(larguraDaFracao(f("1.5"))).toBeNull();
    expect(larguraDaFracao(f("-0.2"))).toBeNull();
    expect(larguraDaFracao(f("1); background: url(x)"))).toBeNull();
  });

  it("dias decorridos que a API manda viram texto", () => {
    expect(haDias(2)).toBe("há 2 dias");
    expect(haDias(1)).toBe("há 1 dia");
    expect(haDias(0)).toBe("hoje");
  });
});

describe("formatadores do Importar dados", () => {
  it("dataComHora: Cuiabá, com ponto entre data e hora", () => {
    expect(dataComHora("2026-11-04T18:12:00Z" as DataHoraIso)).toBe("04/11/2026 · 14:12");
    expect(dataComHora(null)).toBe(TRACO);
  });

  it("larguraDoPercentual: o navegador faz a conta; fora do formato não tem barra", () => {
    expect(larguraDoPercentual("43" as Decimal)).toBe("calc(43 * 1%)");
    expect(larguraDoPercentual("100" as Decimal)).toBe("calc(100 * 1%)");
    expect(larguraDoPercentual("101" as Decimal)).toBeNull();
    expect(larguraDoPercentual("-1" as Decimal)).toBeNull();
    expect(larguraDoPercentual(null)).toBeNull();
  });

  it("tamanhoDeArquivo: MB com uma casa, kB abaixo de 1 MB", () => {
    expect(tamanhoDeArquivo(2_202_009)).toBe("2,1 MB");
    expect(tamanhoDeArquivo(48_000)).toBe("47 kB");
  });
});
