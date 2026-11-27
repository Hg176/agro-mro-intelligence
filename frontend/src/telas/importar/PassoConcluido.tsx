/**
 * Passo 4 · Concluído (pico-fim, ImportarDados.dc.html): o resumo grande vem pronto da API
 * (GET /api/v1/importacao/cargas/{id}, campo resumo).
 */
import { Check } from "lucide-react";
import { Link } from "react-router";

import type { ResumoCarga } from "@/api/tipos";
import { Botao, variantesBotao } from "@/componentes/Botao";
import { inteiro, moedaCompacta } from "@/lib/formato";

type Props = {
  resumo: ResumoCarga;
  aoImportarMovimentos: () => void;
};

const plural = (n: number, um: string, varios: string) => `${inteiro(n)} ${n === 1 ? um : varios}`;

export function PassoConcluido({ resumo, aoImportarMovimentos }: Props) {
  return (
    <div className="mt-8 flex flex-col items-center gap-3 pt-4 pb-2 text-center motion-safe:animate-aparecer">
      <span className="grid size-16 place-items-center rounded-full bg-verde-100">
        <Check aria-hidden="true" className="size-[30px] text-verde-700" strokeWidth={2.5} />
      </span>
      <p className="mt-2 text-rotulo uppercase text-ouro-700">Dados mestres importados</p>
      <h3 className="m-0 font-display text-[44px] leading-[52px] font-extrabold tracking-[-0.03em] tabular-nums">
        {plural(resumo.posicoes, "posição", "posições")} em{" "}
        {plural(resumo.locais, "local", "locais")}
      </h3>
      <div className="mt-3 grid w-full max-w-[760px] grid-cols-3 gap-3 text-left tabular-nums">
        <div className="rounded-[14px] bg-creme-100 px-[18px] py-4">
          <div className="font-display text-[26px] leading-8 font-bold">
            {moedaCompacta(resumo.valor_estoque)}
          </div>
          <div className="text-corpo-s text-tinta-600">em estoque, com preço</div>
        </div>
        <div className="rounded-[14px] bg-creme-100 px-[18px] py-4">
          <div className="font-display text-[26px] leading-8 font-bold">
            {plural(resumo.locais, "local", "locais")}
          </div>
          <div className="text-corpo-s text-tinta-600">{resumo.nomes_locais.join(", ")}</div>
        </div>
        <div className="rounded-[14px] bg-status-alerta-bg px-[18px] py-4">
          <div className="font-display text-[26px] leading-8 font-bold text-status-alerta">
            {inteiro(resumo.sem_preco)} sem preço
          </div>
          <div className="text-corpo-s text-status-alerta-texto">
            ficam como NC até você informar
          </div>
        </div>
      </div>
      <p className="mt-3 max-w-[560px] text-corpo-m text-tinta-600">
        Próximo passo: importe os <b className="font-semibold">movimentos</b> para descobrir quanto
        desse valor está parado e o que está abaixo do ponto de pedido.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          to="/app/visao-geral"
          className={variantesBotao({ variant: "secundario", size: "grande" })}
        >
          Ver minha Visão geral
        </Link>
        <Botao size="grande" onClick={aoImportarMovimentos}>
          Importar movimentos
        </Botao>
      </div>
    </div>
  );
}
