/**
 * Ponte Decimal → número SÓ para a geometria do gráfico (altura da barra no Recharts).
 * Nunca use o resultado para exibir, somar, comparar ou decidir: o texto mostrado vem do
 * Decimal original formatado em src/lib/formato.ts. Fora das telas e componentes de
 * propósito (a guarda proíbe Number() lá).
 */
import type { Decimal } from "@/api/tipos";

export function alturaNoGrafico(valor: Decimal | null): number | null {
  if (valor === null || !/^-?\d+(?:\.\d+)?$/.test(valor)) return null;
  return Number(valor);
}
