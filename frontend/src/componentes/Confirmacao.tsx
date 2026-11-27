/**
 * Confirmação (shadcn AlertDialog revisado). Ações destrutivas ficam longe da principal
 * (lei de Fitts). Com palavraExigida (ex.: "EXCLUIR"), o botão só libera ao digitar a
 * palavra exatamente.
 */
import { useId, useState, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  aberta: boolean;
  aoMudar: (aberta: boolean) => void;
  titulo: string;
  descricao: ReactNode;
  textoConfirmar: string;
  textoCancelar?: string;
  /** "perigo" para excluir/remover; "default" para confirmar uma ação comum. */
  variante?: "default" | "perigo";
  /** Exige digitar esta palavra para liberar (ex.: "EXCLUIR"). */
  palavraExigida?: string;
  /** Rótulo do campo da palavra (acima do campo). */
  rotuloPalavra?: string;
  aoConfirmar: () => void;
};

export function Confirmacao({
  aberta,
  aoMudar,
  titulo,
  descricao,
  textoConfirmar,
  textoCancelar = "Cancelar",
  variante = "default",
  palavraExigida,
  rotuloPalavra,
  aoConfirmar,
}: Props) {
  const [digitado, setDigitado] = useState("");
  const idCampo = useId();
  const liberado = palavraExigida === undefined || digitado === palavraExigida;

  const mudar = (aberto: boolean) => {
    if (!aberto) setDigitado("");
    aoMudar(aberto);
  };

  return (
    <AlertDialog open={aberta} onOpenChange={mudar}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        {palavraExigida !== undefined && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={idCampo}>
              {rotuloPalavra ?? `Digite ${palavraExigida} para confirmar`}
            </Label>
            <Input
              id={idCampo}
              value={digitado}
              onChange={(e) => setDigitado(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>{textoCancelar}</AlertDialogCancel>
          <AlertDialogAction
            variant={variante === "perigo" ? "perigo" : "default"}
            disabled={!liberado}
            onClick={(e) => {
              if (!liberado) {
                e.preventDefault();
                return;
              }
              aoConfirmar();
            }}
          >
            {textoConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
