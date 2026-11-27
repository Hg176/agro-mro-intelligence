import {
  cloneElement,
  useId,
  type AriaAttributes,
  type MouseEvent,
  type ReactElement,
} from "react";

import type { NomePermissao } from "@/api/tipos";
import { cn } from "@/lib/utils";
import { useSessao } from "@/sessao/contexto";
import { MOTIVO_BLOQUEIO } from "@/sessao/textos";

type PropsDaAcao = AriaAttributes & {
  onClick?: (evento: MouseEvent<HTMLElement>) => void;
  className?: string;
};

type Props = {
  /** Permissão exigida (vem de GET /me → permissoes). */
  permissao: NomePermissao;
  /** O botão ou link da ação (um elemento só). */
  children: ReactElement<PropsDaAcao>;
  className?: string;
};

/**
 * Ação de escrita protegida pelo plano. As telas usam SÓ isto: nenhuma tela lê
 * plano.estado para decidir botão.
 *
 * Bloqueada (permissoes[x] = false): o elemento continua focável (aria-disabled, não
 * `disabled`, para o teclado alcançar o motivo), o clique não faz nada, o motivo aparece
 * em texto ao lado e num tooltip acessível (role="tooltip", ligado por aria-describedby).
 */
export function AcaoProtegida({ permissao, children, className }: Props) {
  const { permissoes, plano } = useSessao();
  const idMotivo = useId();

  if (permissoes[permissao]) {
    return children;
  }

  const motivo = MOTIVO_BLOQUEIO[plano.estado];
  const bloquear = (evento: MouseEvent<HTMLElement>) => {
    evento.preventDefault();
    evento.stopPropagation();
  };

  return (
    <span className={cn("group/acao relative inline-flex flex-col items-start gap-1", className)}>
      {cloneElement(children, {
        "aria-disabled": true,
        "aria-describedby": idMotivo,
        onClick: bloquear,
        className: cn(children.props.className, "cursor-not-allowed opacity-60"),
      })}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-30 mb-2 hidden w-max max-w-64 rounded-sm bg-verde-950 px-3 py-2 text-corpo-s text-branco group-focus-within/acao:block group-hover/acao:block"
      >
        {motivo}
      </span>
      <span id={idMotivo} className="text-corpo-s text-tinta-600">
        {motivo}
      </span>
    </span>
  );
}
