/**
 * Botão do produto. Mesma base do shadcn (src/components/ui/button.tsx), com os nomes do
 * F1: variant default (verde-700, ação principal do produto), cta (ouro-500, só comprar,
 * assinar ou testar), secundario, fantasma, perigo. size default (44px), grande (52px),
 * icone (44×44). Um único botão principal por tela.
 * Para ação de escrita, envolva com <AcaoProtegida permissao="...">.
 */
export { Button as Botao, buttonVariants as variantesBotao } from "@/components/ui/button";
