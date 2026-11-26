import type { Local } from "@/api/tipos";

/** Os 3 locais ilustrativos do design. Códigos de ERP fictícios. */
export const LOCAIS: Local[] = [
  { codigo: "1001", nome: "Almox. central", posicoes: 412 },
  { codigo: "2001", nome: "Oficina campo", posicoes: 271 },
  { codigo: "3001", nome: "Posto combustível", posicoes: 129 },
];

export const nomeDoLocal = (codigo: string) =>
  LOCAIS.find((l) => l.codigo === codigo)?.nome ?? codigo;
