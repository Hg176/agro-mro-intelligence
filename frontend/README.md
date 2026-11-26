# Front-end do Agro MRO Intelligence

React 19 + TypeScript estrito + Vite, Tailwind CSS v4 + shadcn/ui. No F1 os dados vêm de um mock (MSW) atrás de uma camada de API tipada; o backend real (FastAPI, `/api/v1`) entra rota a rota depois.

Como instalar, rodar e testar na máquina: [`docs/operacao/frontend-local.md`](../docs/operacao/frontend-local.md).
Referência das telas aprovadas: [`docs/design/`](../docs/design/README.md).

## Scripts

| Script                    | O que faz                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`             | Servidor de desenvolvimento em http://localhost:5173                                                                  |
| `npm run build`           | Build de produção em `dist/`                                                                                          |
| `npm run preview`         | Serve o `dist/` localmente                                                                                            |
| `npm run typecheck`       | `tsc -b` (app, testes e configuração do Vite)                                                                         |
| `npm run lint`            | ESLint (typescript-eslint, react-hooks, jsx-a11y) + `prettier --check`                                                |
| `npm run format`          | Formata tudo com o Prettier                                                                                           |
| `npm run test`            | Vitest uma vez (jsdom + Testing Library)                                                                              |
| `npm run test:watch`      | Vitest em modo observação                                                                                             |
| `npm run verificar-build` | Confere que `dist/` não tem o mock (ver abaixo)                                                                       |
| `npm run check`           | typecheck + lint + test + build + verificar-build. **Rode antes de cada commit.** É o que o CI roda (job `frontend`). |

## Estrutura

```
frontend/
  src/
    components/ui/   componentes do shadcn (revisados: só tokens, foco do tema)
    componentes/     componentes do produto (Botao, SeloStatus, TabelaDados...)
    telas/           uma pasta por tela
    api/             cliente fetch, tipos das respostas, funções e hooks do TanStack Query
    mocks/           MSW: handlers e dados ilustrativos (só no dev)
    lib/             utilitários (cn, formatadores)
  tests/             testes de guarda e setup do Vitest
  scripts/           verificar-build.mjs
```

Testes de componente ficam ao lado do arquivo (`*.test.tsx`). Os testes de guarda ficam em `tests/`.

## Regras que os testes de guarda cobrem

`tests/guarda-cores.test.ts` varre `src/` inteiro, inclusive `src/components/ui/`. Ficam de fora só `src/index.css`, onde os tokens são definidos, e `src/mocks/`. A varredura reprova:

- hex de cor solto (`#1f5135`, maiúscula ou minúscula) em `.ts`/`.tsx`;
- cores padrão do Tailwind (`bg-red-500`, `text-gray-600`, `var(--color-blue-200)`...) e `black`/`white` (`bg-black/50`, `text-white`);
- cor em `style={{ color: ... }}` e parecidos;
- `localStorage.setItem`/`sessionStorage.setItem` com token, auth ou sessão (o ESLint também proíbe usar `localStorage` e `sessionStorage`);
- `parseFloat(` em `src/` e `Number(` em `src/telas` e `src/componentes`.

Cada verificador tem casos negativos no próprio teste: trechos errados de exemplo, que provam que ele reprova. Uma linha pode ser liberada com o comentário `// guarda-ok: <motivo>`. O motivo é obrigatório e passa pela revisão do PR.

### Limite: "o front não calcula" não se garante só por análise estática

A guarda pega o que dá para ver com segurança: converter um Decimal (que chega como string) em número com `parseFloat` ou `Number`. Ela **não** pega soma, média, percentual, divisão ou arredondamento feitos de outro jeito (por exemplo, `a.length / b.length`, `Math.round`, `reduce` somando campos, `365 / dias`). Isso fica com a **revisão do PR**. A regra para quem escreve e para quem revisa:

- todo número que a tela mostra vem pronto da API (no F1, do mock);
- o front só formata (`Intl` pt-BR em `src/lib/formato.ts`) e monta frases com campos recebidos;
- se a tela precisa de um número que a API não tem, ele entra no tipo da resposta e no mock, nunca numa conta no componente.

## Mock (MSW)

O mock entra no F1-3. Liga com `VITE_API_MOCK=true` (padrão no `npm run dev`) e nunca vai para o build de produção: `npm run verificar-build` falha se `dist/` tiver `mockServiceWorker.js` ou qualquer arquivo com "msw" ou "mockServiceWorker". Os parâmetros de URL para forçar estados (`?mock=`, `?plano=`, `?sessao=`) e a troca do mock pela API real rota a rota serão documentados aqui no F1-3.
