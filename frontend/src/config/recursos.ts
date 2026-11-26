/**
 * Chaves de recurso: tiram uma tela do menu sem apagar o código.
 * matrizTmer: o Sander indicou em 02/11/2026 que a TMER deve sair (confirmar antes de apagar).
 * Ligada enquanto a decisão não sai.
 */
export const recursos = {
  matrizTmer: true,
} as const;

export type Recurso = keyof typeof recursos;
