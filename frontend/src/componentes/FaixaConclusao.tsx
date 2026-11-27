import { Lightbulb } from "lucide-react";
import type { ReactNode } from "react";

/** Destaque dentro da frase (número ou palavra-chave em ouro-300). */
export function Destaque({ children }: { children: ReactNode }) {
  return <b className="font-semibold text-ouro-300">{children}</b>;
}

/** Modelos de frase por código: o tipo vem da API, os valores também. */
export type ModelosDeFrase<C extends { tipo: string; valores: Record<string, unknown> }> = {
  [T in C["tipo"]]: (valores: Extract<C, { tipo: T }>["valores"]) => ReactNode;
};

/**
 * Escolhe o modelo de frase pelo código que a API mandou e preenche com os valores.
 * O front NÃO decide a situação. Código desconhecido → null (a faixa aparece sem frase)
 * e aviso no console só em dev.
 */
export function fraseDaConclusao<C extends { tipo: string; valores: Record<string, unknown> }>(
  conclusao: C | null,
  modelos: ModelosDeFrase<C>,
): ReactNode {
  if (conclusao === null) return null;
  const modelo = (modelos as Record<string, ((v: unknown) => ReactNode) | undefined>)[
    conclusao.tipo
  ];
  if (!modelo) {
    if (import.meta.env.DEV) {
      console.warn(`[conclusão] código desconhecido: "${conclusao.tipo}"`);
    }
    return null;
  }
  return modelo(conclusao.valores);
}

type Props = {
  /** A frase já montada (fraseDaConclusao). null = faixa sem frase. */
  frase: ReactNode;
  /** Um botão opcional. */
  acao?: ReactNode;
};

/**
 * Frase de conclusão (VisaoGeral.dc.html): faixa verde-900, o único bloco escuro da tela
 * (Von Restorff), texto verde-100, destaques ouro-300, um botão opcional.
 */
export function FaixaConclusao({ frase, acao }: Props) {
  return (
    <section
      aria-label="Conclusão"
      className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-xl bg-verde-900 px-7 py-6 text-verde-100"
    >
      <Lightbulb aria-hidden="true" className="size-6 shrink-0 text-ouro-300" />
      <p className="m-0 min-w-0 flex-[1_1_480px] text-[17px] leading-[27px]">{frase}</p>
      {acao}
    </section>
  );
}
