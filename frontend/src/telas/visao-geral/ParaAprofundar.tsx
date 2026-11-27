/** "Para aprofundar": 3 seções recolhidas (lei de Hick: o avançado fica guardado). */
import { ChevronDown, ChevronUp } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import type { VisaoGeral } from "@/api/tipos";
import { TRACO, dataHora, periodo } from "@/lib/formato";

function Recolhida({
  titulo,
  resumo,
  children,
}: {
  titulo: string;
  resumo: string;
  children: ReactNode;
}) {
  const [aberta, setAberta] = useState(false);
  const id = useId();
  const Icone = aberta ? ChevronUp : ChevronDown;
  return (
    <div className="rounded-xl border border-borda bg-branco">
      <button
        type="button"
        aria-expanded={aberta}
        aria-controls={id}
        onClick={() => setAberta((v) => !v)}
        className="flex min-h-[76px] w-full cursor-pointer items-center gap-4 rounded-xl border-0 bg-transparent px-6 py-[18px] text-left"
      >
        <span className="flex-1">
          <span className="block text-base leading-6 font-semibold text-tinta-900">{titulo}</span>
          <span className="block text-corpo-s text-tinta-500">{resumo}</span>
        </span>
        <Icone aria-hidden="true" className="size-[18px] text-tinta-600" />
      </button>
      <div id={id} role="region" aria-label={titulo} hidden={!aberta} className="px-6 pb-5">
        {children}
      </div>
    </div>
  );
}

function Item({ nome, valor }: { nome: string; valor: string | null }) {
  return (
    <div className="flex flex-wrap gap-x-3">
      <dt className="min-w-40 text-corpo-s text-tinta-500">{nome}</dt>
      <dd className="m-0 text-corpo-m text-tinta-900 tabular-nums">{valor ?? TRACO}</dd>
    </div>
  );
}

export function ParaAprofundar({ memoria }: { memoria: VisaoGeral["memoria"] }) {
  return (
    <section aria-labelledby="t-apr">
      <h2 id="t-apr" className="mb-2.5 text-rotulo uppercase text-tinta-600">
        Para aprofundar
      </h2>
      <div className="flex flex-col gap-3">
        <Recolhida
          titulo="Explorar pela árvore de decisão"
          resumo="PQR → XYZ → Comprabilidade → ABC, filtrando um grupo por vez"
        >
          <p className="text-corpo-m text-tinta-600">Em breve.</p>
        </Recolhida>
        <Recolhida
          titulo="Conferir origem e conciliação dos saldos"
          resumo="De onde veio cada número e o que não fechou com o ERP"
        >
          <p className="text-corpo-m text-tinta-600">Em breve.</p>
        </Recolhida>
        <Recolhida
          titulo="Memória desta leitura"
          resumo="Período, regras e versão do cálculo usados nesta Visão geral"
        >
          <dl className="m-0 flex flex-col gap-2">
            <Item nome="Período" valor={memoria.periodo ? periodo(memoria.periodo) : null} />
            <Item
              nome="Leitura de"
              valor={memoria.leitura_em ? dataHora(memoria.leitura_em) : null}
            />
            <Item nome="Regras" valor={memoria.regras} />
            <Item nome="Versão do cálculo" valor={memoria.versao_calculo} />
          </dl>
        </Recolhida>
      </div>
    </section>
  );
}
