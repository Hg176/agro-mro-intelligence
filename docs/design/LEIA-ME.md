# Referência das telas aprovadas (para o front-end)

Pacote de entrada do Prompt F1 (`agromro/PROMPT-F1-FRONTEND.md`). O passo F1-0 do prompt copia esta pasta para `docs/design/` do repositório.

| Pasta / arquivo | O que é |
|---|---|
| `ESPECIFICACAO-TELAS.md` | Especificação das 19 pranchetas (convenções, mapa tela × código, regras, pendências). Convertida do .docx do Hugo de 26/11/2026. |
| `telas/*.dc.html` | O HTML de cada prancheta do canvas "Agro MRO Intelligence: telas aprovadas" (Claude Design). Formato próprio do Claude Design: `{{variáveis}}`, `<sc-if>`, `<sc-for>` e uma classe `Component` com a lógica. **Não abre sozinho no navegador** (falta o `support.js` do Claude Design). Serve para ler layout, textos, valores ilustrativos e comportamento. |
| `telas/canvas.json` | Ordem, título e tamanho de cada prancheta. |
| `tokens/tokens.css` e `tokens.json` | Tokens do sistema de design como estão no canvas. **Fonte da verdade das cores.** |
| `leis-ux-agro-mro.html` | As 18 leis de UX adotadas no projeto, com exemplos. |

Para ver as telas renderizadas, abra o canvas: https://claude.ai/artifact/KcLRi31WdQCUhXLmRUtNmA

Atenção: o `agromro/frontend/tema-agro-mro.css` (18/11) está desatualizado em relação a `tokens/tokens.css`: tem tinta-500 #6D7B75 (o certo é #66746E) e não tem verde-300, ouro-700 nem os `status-*-texto`. O prompt manda reconciliar a favor do `tokens.css`.
