import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

/** Raiz do projeto frontend/ (onde fica o package.json). */
export const RAIZ_FRONTEND = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export type ArquivoFonte = {
  /** Caminho relativo a frontend/, sempre com "/". */
  caminho: string;
  texto: string;
};

/** Lista recursiva dos arquivos de uma pasta de frontend/, com o conteúdo. */
export function lerArquivos(pasta: string, extensoes: readonly string[]): ArquivoFonte[] {
  const base = join(RAIZ_FRONTEND, pasta);
  const saida: ArquivoFonte[] = [];
  const visitar = (dir: string) => {
    for (const nome of readdirSync(dir)) {
      const completo = join(dir, nome);
      if (statSync(completo).isDirectory()) {
        visitar(completo);
      } else if (extensoes.some((ext) => nome.endsWith(ext))) {
        saida.push({
          caminho: relative(RAIZ_FRONTEND, completo).split(sep).join("/"),
          texto: readFileSync(completo, "utf8"),
        });
      }
    }
  };
  visitar(base);
  return saida;
}
