/**
 * Selos: status da posição, classe e estado do caso. Sempre cor + ícone + texto
 * (lei da Semelhança: os mesmos em todas as telas). Cores só pelos tokens.
 */
import type { ClasseExibida, EstadoCaso, Situacao } from "@/api/tipos";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- SeloStatus */

const STATUS: Record<Situacao, { icone: string; texto: string; cores: string }> = {
  ruptura: {
    icone: "●",
    texto: "Ruptura",
    cores: "bg-status-ruptura-bg text-status-ruptura-texto",
  },
  abaixo_pp: {
    icone: "▲",
    texto: "Abaixo do PP",
    cores: "bg-status-alerta-bg text-status-alerta-texto",
  },
  parado: { icone: "■", texto: "Parado +180d", cores: "bg-status-parado-bg text-status-parado" },
  saudavel: { icone: "✓", texto: "Saudável", cores: "bg-verde-100 text-verde-700" },
  sem_calculo: { icone: "○", texto: "Sem cálculo", cores: "bg-creme-100 text-tinta-600" },
};

export function SeloStatus({
  situacao,
  texto,
  className,
}: {
  situacao: Situacao;
  /** Troca o texto padrão (ex.: "Parado" na busca). */
  texto?: string;
  className?: string;
}) {
  const s = STATUS[situacao];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] rounded-pill py-[3px] pr-2.5 pl-2 text-xs leading-4 font-semibold whitespace-nowrap",
        s.cores,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("text-[10px]", situacao === "ruptura" && "motion-safe:animate-pulso-lento")}
      >
        {s.icone}
      </span>
      {texto ?? s.texto}
    </span>
  );
}

/* ---------------------------------------------------------------- SeloClasse */

const CLASSE: Record<ClasseExibida, string> = {
  A: "bg-verde-100 text-verde-700",
  B: "bg-ouro-100 text-ouro-700",
  C: "bg-status-parado-bg text-status-parado",
  D: "bg-creme-100 text-tinta-600",
  N: "border border-borda bg-branco text-tinta-600",
  NC: "border border-borda bg-branco text-tinta-600",
};

const NOME_CLASSE: Record<ClasseExibida, string> = {
  A: "Classe A",
  B: "Classe B",
  C: "Classe C",
  D: "Classe D",
  N: "Classe N (item novo)",
  NC: "Sem classe (NC)",
};

/** Selo de classe ABC: 28px, raio 7px. NC quando a API não manda classe. */
export function SeloClasse({ classe, className }: { classe: ClasseExibida; className?: string }) {
  return (
    <span
      role="img"
      aria-label={NOME_CLASSE[classe]}
      className={cn(
        "inline-grid size-7 shrink-0 place-items-center rounded-[7px] text-xs leading-none font-semibold",
        CLASSE[classe],
        className,
      )}
    >
      {classe}
    </span>
  );
}

/* ------------------------------------------------------------ SeloEstadoCaso */

/** Os 8 estados do caso (Planejamento.dc.html): nome, ícone e cores. */
export const ESTADOS_CASO: Record<EstadoCaso, { icone: string; texto: string; cores: string }> = {
  todo: { icone: "○", texto: "A fazer", cores: "border border-borda bg-creme-100 text-tinta-600" },
  analysis: {
    icone: "◔",
    texto: "Em análise",
    cores: "border border-verde-300 bg-verde-50 text-verde-800",
  },
  testing: { icone: "◐", texto: "Em teste", cores: "bg-ouro-100 text-ouro-700" },
  ready: { icone: "▲", texto: "A validar", cores: "bg-status-alerta-bg text-status-alerta-texto" },
  validated: { icone: "✓", texto: "Validado", cores: "bg-verde-100 text-verde-700" },
  exported: { icone: "↗", texto: "Exportado", cores: "bg-verde-800 text-branco" },
  applied: { icone: "✓", texto: "Aplicado no ERP", cores: "bg-verde-700 text-branco" },
  discarded: { icone: "■", texto: "Descartado", cores: "bg-status-parado-bg text-status-parado" },
};

export function SeloEstadoCaso({
  estado,
  mudou = false,
  className,
}: {
  estado: EstadoCaso;
  /** O estado acabou de mudar: "pop" no selo (só com motion-safe). */
  mudou?: boolean;
  className?: string;
}) {
  const e = ESTADOS_CASO[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill py-[5px] pr-3 pl-2.5 text-xs leading-[14px] font-semibold whitespace-nowrap",
        e.cores,
        mudou && "motion-safe:animate-pop",
        className,
      )}
    >
      <span aria-hidden="true">{e.icone}</span>
      {e.texto}
    </span>
  );
}
