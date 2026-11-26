import type { DataHoraIso, DataIso, Decimal } from "@/api/tipos";
import {
  data,
  dataDoInstante,
  dataHora,
  haDias,
  inteiro,
  larguraDaFracao,
  periodo,
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
