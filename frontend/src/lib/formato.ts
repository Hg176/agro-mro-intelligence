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

/*
 * Números Decimal (string). Intl.NumberFormat aceita a string direto (sem virar number,
 * sem perder precisão): o front não converte para fazer conta.
 */
type FormatoDecimal = { format(valor: string): string };
const comoTexto = (f: Intl.NumberFormat) => f as unknown as FormatoDecimal;

const moedaFmt = comoTexto(new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }));
const moedaCompactaFmt = comoTexto(
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
    maximumSignificantDigits: 3,
    roundingPriority: "lessPrecision",
  }),
);
const decimalFmt = comoTexto(new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }));
const porcentoFmt = comoTexto(new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }));
const fracaoPctFmt = comoTexto(
  new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }),
);

/** Decimal bem formado (o que o Pydantic manda). Fora disso, a tela mostra traço. */
const DECIMAL_VALIDO = /^-?\d+(?:\.\d+)?$/;
const valido = (v: Decimal | null): v is Decimal => v !== null && DECIMAL_VALIDO.test(v);

/** "100" → "R$ 100,00". */
export function moeda(valor: Decimal | null): string {
  return valido(valor) ? moedaFmt.format(valor).replace(/\u00a0/g, " ") : TRACO;
}

/** "2412530.40" → "R$ 2,4 mi"; "412380.00" → "R$ 412 mil". */
export function moedaCompacta(valor: Decimal | null): string {
  return valido(valor) ? moedaCompactaFmt.format(valor).replace(/\u00a0/g, " ") : TRACO;
}

/** Quantidade: "12.5" → "12,5"; "-2" → "-2"; "1000" → "1.000". */
export function decimal(valor: Decimal | null): string {
  return valido(valor) ? decimalFmt.format(valor) : TRACO;
}

/** Valor já em porcentagem: "17" → "17%"; "17.1" → "17,1%". */
export function percentual(valor: Decimal | null): string {
  return valido(valor) ? `${porcentoFmt.format(valor)}%` : TRACO;
}

/** Fração (nível de serviço): "0.975" → "97,5%"; "0" → "0%". */
export function percentualDeFracao(valor: Decimal | null): string {
  return valido(valor) ? fracaoPctFmt.format(valor).replace(/\u00a0/g, "") : TRACO;
}

/**
 * Código só de dígitos em blocos de 4, da esquerda: "000000123456" → "0000 0012 3456".
 * Só visual: o código continua texto. Código com letra fica como veio.
 */
export function codigoEmBlocos(codigo: string): string {
  return /^\d{5,}$/.test(codigo) ? codigo.replace(/(\d{4})(?=\d)/g, "$1 ") : codigo;
}

/** Para buscar: aceita o código com ou sem espaços. */
export function codigoSemEspacos(texto: string): string {
  return texto.replace(/\s+/g, "");
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
