/**
 * Formatadores de exibição (Intl pt-BR). Recebem o valor pronto da API e só formatam:
 * nenhuma conta de domínio acontece aqui.
 * Fuso de exibição: America/Cuiaba (a API manda ISO em UTC).
 * O F1-5 completa este arquivo (moeda, percentual, código em blocos).
 */
import type { DataHoraIso, DataIso, Decimal, Periodo } from "@/api/tipos";

export const FUSO = "America/Cuiaba";
export const TRACO = "—";

const inteiroFmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/** 1000 → "1.000". null → "—" (ausente não é zero). */
export function inteiro(valor: number | null): string {
  return valor === null ? TRACO : inteiroFmt.format(valor);
}

function partesDataIso(valor: DataIso): [string, string, string] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!m) throw new Error(`Data ISO inválida: ${valor}`);
  return [m[1] ?? "", m[2] ?? "", m[3] ?? ""];
}

/** "2026-11-11" → "11/11/2026". Data de calendário: sem fuso, sem Date. */
export function data(valor: DataIso | null): string {
  if (valor === null) return TRACO;
  const [ano, mes, dia] = partesDataIso(valor);
  return `${dia}/${mes}/${ano}`;
}

/** Período "01/07 a 11/11/2026" (o ano do início some quando é o mesmo do fim). */
export function periodo(valor: Periodo | null): string {
  if (valor === null) return TRACO;
  const [anoI, mesI, diaI] = partesDataIso(valor.inicio);
  const [anoF] = partesDataIso(valor.fim);
  const inicio = anoI === anoF ? `${diaI}/${mesI}` : `${diaI}/${mesI}/${anoI}`;
  return `${inicio} a ${data(valor.fim)}`;
}

const dataCuiaba = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dataHoraCuiaba = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** ISO UTC → data em Cuiabá ("03/12/2026"). */
export function dataDoInstante(valor: DataHoraIso | null): string {
  return valor === null ? TRACO : dataCuiaba.format(new Date(valor));
}

/** ISO UTC → data e hora em Cuiabá ("24/11/2026, 09:05"). */
export function dataHora(valor: DataHoraIso | null): string {
  return valor === null ? TRACO : dataHoraCuiaba.format(new Date(valor));
}

/**
 * Largura CSS de uma barra a partir da fração que a API manda ("0" a "1").
 * Não calcula: deixa o navegador fazer calc(). Valor fora do formato → null (sem barra).
 */
export function larguraDaFracao(fracao: Decimal | null): string | null {
  if (fracao === null || !/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(fracao)) return null;
  return `calc(${fracao} * 100%)`;
}

const relativoAuto = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
const relativoNumerico = new Intl.RelativeTimeFormat("pt-BR", { numeric: "always" });

/** Dias que a API mandou → "hoje", "há 1 dia", "há 2 dias" (como no design, sem "anteontem"). */
export function haDias(dias: number): string {
  return dias === 0 ? relativoAuto.format(0, "day") : relativoNumerico.format(-dias, "day");
}
