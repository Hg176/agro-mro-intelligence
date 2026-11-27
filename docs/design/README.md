# docs/design — referência das telas aprovadas

Cópia fiel, byte a byte, de `../frontend-referencia/` (pacote de entrada do Prompt F1), feita no passo F1-0. **Não edite estes arquivos**: eles são o design aprovado. O `.gitattributes` marca `docs/design/**` como `-text` para o git não normalizar fim de linha. A partir do F1-0, o front-end consulta sempre esta cópia, não a pasta de fora do repositório.

Canvas com as telas renderizadas (Claude Design): https://claude.ai/artifact/KcLRi31WdQCUhXLmRUtNmA

## O que é cada arquivo

| Arquivo | O que é | Como usar |
|---|---|---|
| `ESPECIFICACAO-TELAS.md` | Especificação das 19 pranchetas: convenções comuns, mapa tela × código, regras por tela, leis de UX, **lista de animações permitidas** e pendências. | Ler antes de cada tela. A seção "Leis de UX e animações" é a única lista de animações aceitas. |
| `LEIA-ME.md` | Índice original do pacote. | Contexto. |
| `leis-ux-agro-mro.html` | As 18 leis de UX adotadas, com exemplos. É igual a `docs/referencia/ux/leis-ux-agro-mro.html`. | Obrigatório em qualquer tela ou componente. |
| `telas/*.dc.html` | HTML de cada prancheta, no formato do Claude Design (`{{variáveis}}`, `<sc-if>`, `<sc-for>` e uma classe `Component` com a lógica). **Não abre sozinho no navegador.** | Fonte de layout, medidas, textos aprovados, valores ilustrativos e comportamento. Não copie o markup nem os estilos inline: reconstrua com React + Tailwind + shadcn/ui. |
| `telas/canvas.json` | Ordem, título e tamanho (1440 px de largura) de cada prancheta. | Conferir a altura e a ordem das telas. |
| `tokens/tokens.css` | Tokens do sistema de design (cores, tipografia, sombras, espaçamentos, raios). | **Fonte da verdade** do tema do Tailwind (F1-2). |
| `tokens/tokens.json` | Os mesmos tokens em JSON. | Usado pelo teste `tests/tokens.test.ts`, que confere se `src/index.css` tem os mesmos valores. |

## Tela do design → rota → componente → passo do F1

Os caminhos de componente são relativos a `frontend/src/`. Estados de uma mesma tela são forçados por parâmetro de URL no mock (`?mock=carregando|erro|vazio`, `?plano=demonstracao|ativo|somente_leitura`, `?sessao=expirada`), não por rota própria.

| # | Prancheta (arquivo) | Rota | Componente | Como abrir o estado | Passo |
|---|---|---|---|---|---|
| 1 | Landing comercial (`Main.dc.html`) | `/` | `telas/landing/TelaLanding.tsx` | — | F1-18 |
| 2a | Login (`Login.dc.html`) | `/entrar` | `telas/entrar/TelaEntrar.tsx` | normal | F1-17 |
| 2b | Login com erro (`LoginErro.dc.html`) | `/entrar` | `telas/entrar/TelaEntrar.tsx` | credenciais erradas no formulário | F1-17 |
| 3 | Visão geral (`VisaoGeral.dc.html`) | `/app/visao-geral` | `telas/visao-geral/TelaVisaoGeral.tsx` | `?mock=` | F1-7 |
| 4 | Importar dados mestres (`ImportarDados.dc.html`) | `/app/importar` | `telas/importar/TelaImportar.tsx` | passos do stepper | F1-9 |
| 5a | Plano · demonstração (`Planos.dc.html`) | `/app/plano` | `telas/plano/TelaPlano.tsx` | `?plano=demonstracao` | F1-15 |
| 5b | Plano · Intelligence ativo (`PlanosAtivo.dc.html`) | `/app/plano` | `telas/plano/TelaPlano.tsx` | `?plano=ativo` (padrão) | F1-15 |
| 5c | Plano · somente leitura (`PlanosLeitura.dc.html`) | `/app/plano` | `telas/plano/TelaPlano.tsx` | `?plano=somente_leitura` | F1-15 |
| 6a | Materiais (`Materiais.dc.html`) | `/app/materiais` | `telas/materiais/TelaMateriais.tsx` | normal; `?mock=erro` (erro de métricas) | F1-8 |
| 6b | Materiais · carregando (`MateriaisCarregando.dc.html`) | `/app/materiais` | `telas/materiais/TelaMateriais.tsx` | `?mock=carregando` | F1-8 |
| 6c | Materiais · catálogo vazio (`MateriaisVazio.dc.html`) | `/app/materiais` | `telas/materiais/TelaMateriais.tsx` | `?mock=vazio` | F1-8 |
| 7a | Planejamento (`Planejamento.dc.html`) | `/app/planejamento` | `telas/planejamento/TelaPlanejamento.tsx` | normal | F1-10 |
| 7b | Planejamento · nenhum caso (`PlanejamentoVazio.dc.html`) | `/app/planejamento` | `telas/planejamento/TelaPlanejamento.tsx` | `?mock=vazio` | F1-10 |
| 8 | Tipos de movimento (`TiposMovimento.dc.html`) | `/app/tipos-movimento` | `telas/tipos-movimento/TelaTiposMovimento.tsx` | — | F1-13 |
| 9 | Regras e letras (`RegrasLetras.dc.html`) | `/app/regras` | `telas/regras/TelaRegras.tsx` | 6 abas | F1-11 |
| 10 | Nível de serviço (`NivelServico.dc.html`) | `/app/nivel-servico` | `telas/nivel-servico/TelaNivelServico.tsx` | 5 abas PQR | F1-12 |
| 11 | Matriz TMER (`MatrizTmer.dc.html`) | `/app/tmer` | `telas/tmer/TelaMatrizTmer.tsx` | 5 abas PQR; só com `recursos.matrizTmer` | F1-14 |
| 12 | Minha conta (`Conta.dc.html`) | `/app/conta` | `telas/conta/TelaConta.tsx` | — | F1-16 |
| — | Busca global (`BuscaGlobal.dc.html`) | barra superior de todo `/app/*` | `componentes/busca/BuscaGlobal.tsx` | — | F1-6 |

### Sem prancheta própria

| O quê | Rota | Componente | Passo |
|---|---|---|---|
| Casca do app (menu lateral, barra superior, cabeçalho, faixa de conclusão, sessão e plano) | `/app/*` | `layout/LayoutApp.tsx`, `sessao/` | F1-4 |
| Casos de controle, Academia, Suporte (no menu, sem design) | `/app/casos-controle`, `/app/academia`, `/app/suporte` | página "Em breve" | F1-4 |
| Página não encontrada | qualquer outra | página 404 própria | F1-4 |
| Fundamentos (tokens e componentes em todos os estados; só no dev) | `/_fundamentos` | `telas/fundamentos/TelaFundamentos.tsx` | F1-5 |

Os nomes de componente acima são o plano do F1. Se algum mudar durante a implementação, esta tabela é atualizada no mesmo commit.
