/**
 * Erro ao carregar uma tela inteira: mensagem curta (ApiErro, nunca a resposta crua) e
 * "Tentar de novo". Padrão de todas as telas do F1.
 */
import { CircleAlert } from "lucide-react";

import { ApiErro } from "@/api/cliente";
import { Botao } from "@/componentes/Botao";

type Props = {
  /** Ex.: "Não foi possível carregar a Visão geral." */
  titulo: string;
  erro: unknown;
  aoTentarDeNovo: () => void;
};

export function ErroDaTela({ titulo, erro, aoTentarDeNovo }: Props) {
  const mensagem = erro instanceof ApiErro ? erro.mensagem : "Algo deu errado. Tente de novo.";
  return (
    <section
      role="alert"
      className="flex flex-wrap items-start gap-esp-16 rounded-xl border border-status-ruptura/40 bg-status-ruptura-bg p-esp-24"
    >
      <CircleAlert aria-hidden="true" className="size-6 shrink-0 text-status-ruptura-texto" />
      <div className="min-w-0 flex-[1_1_320px]">
        <h2 className="text-titulo-s text-status-ruptura-texto">{titulo}</h2>
        <p className="mt-1 text-corpo-m text-tinta-900">{mensagem}</p>
      </div>
      <Botao variant="secundario" onClick={aoTentarDeNovo}>
        Tentar de novo
      </Botao>
    </section>
  );
}
