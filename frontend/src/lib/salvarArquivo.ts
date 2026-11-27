import type { ArquivoBaixado } from "@/api/cliente";

/**
 * Entrega ao navegador um arquivo que veio pronto da API (link temporário + clique).
 * Nada é guardado: o link é revogado logo depois.
 */
export function salvarArquivo({ conteudo, nome }: ArquivoBaixado): void {
  const url = URL.createObjectURL(conteudo);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
