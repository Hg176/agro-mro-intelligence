import { render } from "@testing-library/react";

import type { Decimal } from "@/api/tipos";
import { BarraSaldoPp, textoSaldoPp } from "@/componentes/BarraSaldoPp";

const d = (v: string) => v as Decimal;

describe("BarraSaldoPp", () => {
  it("texto pelo modelo da situação (o front não compara saldo com PP)", () => {
    expect(
      textoSaldoPp({ saldo: d("3"), pontoPedido: d("9"), unidade: "un", situacao: "abaixo_pp" }),
    ).toBe("3 de 9 un");
    expect(
      textoSaldoPp({ saldo: d("48"), pontoPedido: d("4"), unidade: "un", situacao: "parado" }),
    ).toBe("48 un · PP 4");
    expect(
      textoSaldoPp({ saldo: d("-2"), pontoPedido: d("8"), unidade: "un", situacao: "ruptura" }),
    ).toBe("−2 un (negativo) · PP 8");
    expect(
      textoSaldoPp({ saldo: d("2"), pontoPedido: null, unidade: "un", situacao: "sem_calculo" }),
    ).toBe("2 un · sem PP");
  });

  it("saldo ausente aparece como traço, não como zero", () => {
    expect(
      textoSaldoPp({ saldo: null, pontoPedido: d("9"), unidade: "un", situacao: "sem_calculo" }),
    ).toBe("— un · PP 9");
  });

  it("largura da barra é a fração da API", () => {
    const { container } = render(
      <BarraSaldoPp
        saldo={d("3")}
        pontoPedido={d("9")}
        unidade="un"
        fracao={d("0.17")}
        situacao="abaixo_pp"
      />,
    );
    const preenchida = container.querySelector(".bg-status-alerta") as HTMLElement;
    // O navegador (e o jsdom) normaliza calc(0.17 * 100%) para calc(17%).
    expect(preenchida.style.width).toBe("calc(17%)");
  });

  it("sem fração, sem barra", () => {
    const { container } = render(
      <BarraSaldoPp
        saldo={d("3")}
        pontoPedido={d("9")}
        unidade="un"
        fracao={null}
        situacao="abaixo_pp"
      />,
    );
    expect(container.querySelector("[aria-hidden='true']")).toBeNull();
  });
});
