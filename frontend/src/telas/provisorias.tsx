/**
 * Páginas provisórias da casca (F1-4): "Em construção" (tela com design, ainda não feita),
 * "Em breve" (item do menu sem design) e 404.
 */
import { Construction, Hourglass, MapPinOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";

import { CabecalhoPagina } from "@/componentes/CabecalhoPagina";

function Aviso({
  icone: Icone,
  titulo,
  texto,
}: {
  icone: LucideIcon;
  titulo: string;
  texto: string;
}) {
  return (
    <section className="flex items-start gap-esp-16 rounded-xl border border-borda bg-branco p-esp-24">
      <Icone aria-hidden="true" className="size-6 shrink-0 text-ouro-600" />
      <div>
        <h2 className="text-titulo-s text-tinta-900">{titulo}</h2>
        <p className="mt-1 text-corpo-m text-tinta-600">{texto}</p>
      </div>
    </section>
  );
}

export function EmConstrucao({ titulo, passo }: { titulo: string; passo: string }) {
  return (
    <>
      <CabecalhoPagina rotulo="Em construção" titulo={titulo} />
      <Aviso
        icone={Construction}
        titulo="Esta tela ainda está em construção"
        texto={`Ela entra no passo ${passo} do front-end.`}
      />
    </>
  );
}

export function EmBreve({ titulo }: { titulo: string }) {
  return (
    <>
      <CabecalhoPagina rotulo="Em breve" titulo={titulo} />
      <Aviso
        icone={Hourglass}
        titulo="Em breve"
        texto="Esta área ainda não tem tela. Ela aparece aqui quando estiver pronta."
      />
    </>
  );
}

export function NaoEncontrada({ dentroDoApp }: { dentroDoApp: boolean }) {
  const conteudo = (
    <>
      <CabecalhoPagina rotulo="Erro 404" titulo="Página não encontrada" />
      <Aviso
        icone={MapPinOff}
        titulo="Não encontramos esta página"
        texto="O endereço pode ter mudado ou estar escrito errado."
      />
      <Link
        to={dentroDoApp ? "/app/visao-geral" : "/"}
        className="inline-flex min-h-11 items-center self-start font-semibold text-verde-700"
      >
        {dentroDoApp ? "Voltar à Visão geral →" : "Voltar ao início →"}
      </Link>
    </>
  );
  if (dentroDoApp) return conteudo;
  return (
    <main
      id="conteudo"
      className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-7 p-esp-24"
    >
      {conteudo}
    </main>
  );
}

/** Página pública provisória (landing e entrar), fora da casca do app. */
export function PublicaEmConstrucao({ titulo, passo }: { titulo: string; passo: string }) {
  return (
    <main
      id="conteudo"
      className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-7 p-esp-24"
    >
      <EmConstrucao titulo={titulo} passo={passo} />
      <Link
        to="/app/visao-geral"
        className="inline-flex min-h-11 items-center self-start font-semibold text-verde-700"
      >
        Abrir o app →
      </Link>
    </main>
  );
}
