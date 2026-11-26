import { LockKeyhole } from "lucide-react";
import { Link } from "react-router";

import { useSessao } from "@/sessao/contexto";

/**
 * Aviso da casca quando o plano está em somente leitura. Textos do PlanosLeitura.dc.html.
 * Aqui o estado do plano decide só se o AVISO aparece; os botões seguem permissoes (AcaoProtegida).
 */
export function AvisoSomenteLeitura() {
  const { plano } = useSessao();
  if (plano.estado !== "somente_leitura") return null;

  return (
    <section
      aria-labelledby="aviso-leitura-titulo"
      className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-status-ruptura bg-status-ruptura-bg px-6 py-4"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-branco text-status-ruptura">
        <LockKeyhole aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0 flex-[1_1_420px]">
        <h2 id="aviso-leitura-titulo" className="text-titulo-s text-status-ruptura-texto">
          Seu espaço está em somente leitura
        </h2>
        <p className="mt-1 text-corpo-m text-tinta-900">
          Você continua vendo tudo, mas algumas ações ficam paradas até o pagamento.
        </p>
      </div>
      <Link
        to="/app/plano"
        className="inline-flex min-h-11 items-center text-[15px] font-semibold text-verde-700"
      >
        Pagar e liberar →
      </Link>
    </section>
  );
}
