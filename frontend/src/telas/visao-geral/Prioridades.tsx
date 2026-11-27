/** "O que resolver primeiro": 6 posições na ordem que a API mandou (a fila é do backend). */
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, Upload } from "lucide-react";
import { Link } from "react-router";

import type { Posicao, VisaoGeral } from "@/api/tipos";
import { BarraSaldoPp } from "@/componentes/BarraSaldoPp";
import { variantesBotao } from "@/componentes/Botao";
import { SeloClasse, SeloStatus } from "@/componentes/Selos";
import { TabelaDados } from "@/componentes/TabelaDados";
import { codigoEmBlocos, inteiro } from "@/lib/formato";
import { linkMateriais } from "@/rotas/links";

const COLUNAS: ColumnDef<Posicao, unknown>[] = [
  {
    id: "classe",
    header: "Classe",
    cell: ({ row }) => <SeloClasse classe={row.original.abc ?? "NC"} />,
  },
  {
    id: "material",
    header: "Material",
    cell: ({ row }) => (
      <>
        <div className="font-semibold text-tinta-900">{row.original.short_description}</div>
        <div className="text-corpo-s text-tinta-500">{codigoEmBlocos(row.original.code)}</div>
      </>
    ),
  },
  {
    id: "local",
    header: "Local",
    cell: ({ row }) => <span className="text-tinta-600">{row.original.location_name}</span>,
  },
  {
    id: "saldo_pp",
    header: "Saldo × ponto de pedido",
    cell: ({ row }) => (
      <BarraSaldoPp
        saldo={row.original.stock_quantity}
        pontoPedido={row.original.reorder_point}
        unidade={row.original.unit}
        fracao={row.original.fracao_barra_saldo_pp}
        situacao={row.original.situacao}
        className="w-[150px] font-semibold"
      />
    ),
  },
  {
    id: "situacao",
    header: "Situação",
    cell: ({ row }) => <SeloStatus situacao={row.original.situacao} />,
  },
  {
    id: "abrir",
    header: () => <span className="sr-only">Abrir</span>,
    cell: ({ row }) => (
      <Link
        to={linkMateriais({ q: row.original.code })}
        aria-label={`Abrir ${row.original.short_description}, ${row.original.location_name}`}
        className="grid size-11 place-items-center rounded-md text-tinta-500 hover:bg-verde-50 hover:text-verde-700"
      >
        <ChevronRight aria-hidden="true" className="size-[18px]" />
      </Link>
    ),
  },
];

export function Prioridades({ prioridades }: { prioridades: VisaoGeral["prioridades"] }) {
  return (
    <section
      aria-labelledby="t-prio"
      className="min-w-0 flex-[2_1_640px] rounded-xl border border-borda bg-branco p-esp-24"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-rotulo uppercase text-ouro-700">Prioridades</p>
          <h2 id="t-prio" className="mt-1.5 font-display text-titulo-secao text-tinta-900">
            O que resolver primeiro
          </h2>
        </div>
        {prioridades.total_fila > 0 && (
          <Link
            to="/app/planejamento"
            className="inline-flex min-h-11 items-center text-sm leading-5 font-semibold text-verde-700 no-underline hover:text-verde-800"
          >
            Ver fila completa ({inteiro(prioridades.total_fila)}) →
          </Link>
        )}
      </div>
      <div className="mt-3 [&_table]:min-w-[640px]">
        <TabelaDados
          titulo="O que resolver primeiro"
          colunas={COLUNAS}
          dados={prioridades.itens}
          idDaLinha={(p) => `${p.code}@${p.location}`}
          nomeDasLinhas="posições"
          vazio={{
            titulo: "Nenhuma posição para resolver agora",
            texto: "Quando houver dados importados, as posições mais urgentes aparecem aqui.",
            acao: (
              <Link to="/app/importar" className={variantesBotao({ variant: "secundario" })}>
                <Upload aria-hidden="true" />
                Importar dados
              </Link>
            ),
          }}
        />
      </div>
    </section>
  );
}
