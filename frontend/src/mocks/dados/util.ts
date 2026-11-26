import type { DataHoraIso, DataIso, Decimal } from "@/api/tipos";

/** Decimal como o Pydantic manda (string). Só para montar os dados do mock. */
export const d = (valor: string) => valor as Decimal;

/** Data e hora ISO em UTC. */
export const iso = (valor: string) => valor as DataHoraIso;

/** Data de calendário ISO. */
export const dia = (valor: string) => valor as DataIso;
