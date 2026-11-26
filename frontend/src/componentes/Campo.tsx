/**
 * Campo de formulário: rótulo SEMPRE acima, erro colado ao campo (lei da Proximidade),
 * borda status-ruptura no erro e tremida no erro (só com motion-safe).
 * CampoSenha: o mesmo, com o olho para mostrar/ocultar.
 */
import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type PropsCampo = Omit<ComponentProps<"input">, "id"> & {
  rotulo: string;
  /** Mensagem de erro (texto status-ruptura-texto colado ao campo). */
  erro?: string | null;
  /** Ajuda abaixo do campo (tinta-500). */
  ajuda?: ReactNode;
  /** Conteúdo à direita dentro do campo (ex.: botão do olho). */
  adorno?: ReactNode;
  id?: string;
};

export function Campo({ rotulo, erro, ajuda, adorno, id, className, ...input }: PropsCampo) {
  const gerado = useId();
  const idCampo = id ?? gerado;
  const idErro = `${idCampo}-erro`;
  const idAjuda = `${idCampo}-ajuda`;
  const descritores = [erro ? idErro : null, ajuda ? idAjuda : null].filter(Boolean).join(" ");

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={idCampo}>{rotulo}</Label>
      <div
        // key muda quando o erro muda: a tremida roda de novo a cada erro novo.
        key={erro ?? "sem-erro"}
        className={cn("relative", erro && "motion-safe:animate-tremida")}
      >
        <Input
          id={idCampo}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descritores || undefined}
          className={cn(adorno && "pr-12")}
          {...input}
        />
        {adorno && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-0.5">{adorno}</div>
        )}
      </div>
      {erro && (
        <p id={idErro} className="text-corpo-s font-medium text-status-ruptura-texto">
          {erro}
        </p>
      )}
      {ajuda && (
        <p id={idAjuda} className="text-corpo-s text-tinta-500">
          {ajuda}
        </p>
      )}
    </div>
  );
}

export function CampoSenha(props: Omit<PropsCampo, "type" | "adorno">) {
  const [visivel, setVisivel] = useState(false);
  return (
    <Campo
      {...props}
      type={visivel ? "text" : "password"}
      adorno={
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visivel}
          className="grid size-11 cursor-pointer place-items-center rounded-md text-tinta-500 hover:text-tinta-900"
        >
          {visivel ? (
            <EyeOff aria-hidden="true" className="size-5" />
          ) : (
            <Eye aria-hidden="true" className="size-5" />
          )}
        </button>
      }
    />
  );
}
