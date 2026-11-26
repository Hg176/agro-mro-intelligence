import type { EstadoPlano } from "@/api/tipos";

/**
 * Motivo mostrado quando uma ação protegida está bloqueada. O BLOQUEIO vem só de
 * permissoes[x] (backend); o estado do plano escolhe apenas a frase, tirada do design:
 * - somente leitura: PlanosLeitura.dc.html ("Seu espaço está em somente leitura");
 * - demonstração: cartão do plano em Planos.dc.html ("Assine para liberar tudo").
 */
export const MOTIVO_BLOQUEIO: Record<EstadoPlano, string> = {
  somente_leitura: "Seu espaço está em somente leitura",
  demonstracao: "Assine para liberar tudo",
  ativo: "Seu plano não permite esta ação",
};
