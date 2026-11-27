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

## Tema (tokens do design)

`src/index.css` é o tema. Os valores vêm de `docs/design/tokens/tokens.css`, a fonte da verdade.

- **Cores:** só as dos tokens, com o nome do token: `bg-verde-900`, `text-ouro-700`, `text-status-ruptura-texto`, `bg-branco`, `border-borda`. As variáveis semânticas do shadcn (`bg-primary`, `text-muted-foreground`, `bg-sidebar`...) apontam para os tokens. A paleta padrão do Tailwind está desligada (`--color-*: initial`), então `bg-red-500`, `text-gray-600`, `bg-black` e `text-white` não geram CSS nenhum. `bg-transparent` e `text-current` continuam funcionando.
- **Texto:** `text-display-xl`, `text-display-l`, `text-titulo-m`, `text-numero-l`, `text-titulo-s`, `text-corpo-l`, `text-corpo-m`, `text-corpo-s`, `text-rotulo`, `text-botao`. Cada um já traz tamanho, entrelinha, peso e letter-spacing. A família vem à parte: `font-display` (Plus Jakarta Sans) em títulos e números grandes, `font-sans` (Inter, padrão do corpo) no resto. O utilitário `numero` aplica a família display e algarismos tabulares de uma vez.
- **Raios:** `rounded-sm` (8), `rounded-md` (10), `rounded-lg` (12, botões), `rounded-xl` (16, cartões), `rounded-pill`.
- **Sombras:** `shadow-foco` (halo do foco) e `shadow-previa` (só a prévia da landing). Cartões não têm sombra.
- **Espaçamentos:** `p-esp-24`, `gap-esp-16`, `mt-esp-48`... A escala numérica do Tailwind (`p-4` etc.) também continua disponível.
- **Fontes:** vêm de `@fontsource-variable` e entram no build. Nada de Google Fonts por CDN.
- **Testes:** `tests/tokens.test.ts` confere cada token do `tokens.json` no `index.css`, com o mesmo valor e o hex comparado sem diferenciar maiúscula. `tests/tema-sem-cores-padrao.test.ts` confere o reset e compila o tema com o Tailwind para provar que as cores padrão não existem.
- **`cn()`:** o `src/lib/utils.ts` ensina ao tailwind-merge a escala do tema. Sem isso, `cn("text-titulo-m", "text-tinta-900")` perderia uma das duas classes.

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

## Camada de API

- `src/api/cliente.ts`: `request<T>()` sobre `fetch`, com base `/api/v1`, `credentials: "include"` (sessão por cookie HttpOnly), JSON, timeout e erro tipado `ApiErro { status, codigo, mensagem }`. A mensagem é sempre curta e humana. Em 5xx, nada do servidor aparece na tela. 401 e 403 são distintos: `sessao_expirada` derruba a sessão, e `sem_permissao` é o plano que não permite a ação.
- `src/api/tipos.ts`: tipos de todas as respostas. Cada Decimal é `Decimal` (string), cada ausência é `T | null`, e cada tipo diz de onde vem (rota do protótipo ou "a criar no backend"). A frase de conclusão é `ConclusaoTela { tipo, valores }`, com uma união fechada de códigos por tela.
- `src/api/<dominio>.ts`: uma função por chamada (`obterSessao`, `buscarPosicoes`, `obterVisaoGeral`, `listarMateriais`, `criarMaterial`...).
- `src/api/hooks/`: hooks do TanStack Query. Leitura tenta de novo só em falha de rede ou tempo esgotado. Escrita nunca repete sozinha.

## Sessão, plano e permissões

- `RotaProtegida` envolve `/app/*` e busca `GET /api/v1/me`. Enquanto carrega, mostra o skeleton da casca. Se o `/me` responder 401, leva para `/entrar?volta=<rota atual>`. Um 401 em qualquer outra rota limpa o cache e também redireciona.
- `useSessao()` devolve `{ usuario, espaco, plano, permissoes }`. Tudo fica na memória: nada vai para `localStorage` nem `sessionStorage`.
- Toda ação de escrita usa `<AcaoProtegida permissao="importar | simular | validar | exportar_excel | editar_regras">`. Quem decide o bloqueio é só `permissoes[x]`, que vem do backend. **Nenhuma tela lê `plano.estado` para decidir botão.** Bloqueada, a ação fica com `aria-disabled`, continua focável, mostra o motivo em texto e num tooltip acessível, e o clique não faz nada.
- A frase de conclusão sai de `fraseDaConclusao(conclusao, modelos)`. A API manda `conclusao.tipo`, e a tela tem um modelo de frase por código. Se chegar um código desconhecido, a faixa aparece sem frase e o aviso vai para o console, só em dev.

## Mock (MSW)

O mock fica em `src/mocks/`: handlers por domínio em `handlers/`, dados ilustrativos em `dados/` (fonte única, coerente com o design) e latência simulada de 300 a 800 ms (zero nos testes). Os testes usam os mesmos handlers, em Node (`src/mocks/servidor.ts`).

### Parâmetros de URL para forçar estados

Dois assuntos separados, que podem ser combinados:

| Parâmetro                                           | Efeito                                                                                 |
| --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `?mock=carregando`                                  | A rota da tela nunca responde (skeleton).                                              |
| `?mock=erro`                                        | A rota da tela responde 500.                                                           |
| `?mock=vazio`                                       | A rota da tela responde lista vazia.                                                   |
| `?plano=demonstracao` · `ativo` · `somente_leitura` | Muda o que `GET /api/v1/me` devolve em `plano.estado` e `permissoes`. Padrão: `ativo`. |
| `?sessao=expirada`                                  | `GET /api/v1/me` responde 401.                                                         |

Exemplo: `/app/materiais?plano=somente_leitura&mock=vazio`. O `?mock=` só afeta a rota da tela, não o `/me` nem a busca.

Exceção de propósito: em Materiais, `?mock=erro` é o estado **erro de métricas** do design (o catálogo responde, sem saldo, PP nem classe). A falha do catálogo inteiro (500) é coberta pelo teste da tela.

### Filtros de Materiais na URL

Materiais lê a busca e os filtros da URL. É por ela que a Visão geral, a busca global e os cartões abrem a lista já filtrada (`src/rotas/links.ts`, `linkMateriais()`).

| Parâmetro    | Valores                                                                 | De onde vem o link                             |
| ------------ | ----------------------------------------------------------------------- | ---------------------------------------------- |
| `q`          | texto; código com ou sem espaços                                        | busca global, "Abrir" da tabela de prioridades |
| `filtro`     | `abaixo_pp` · `saldo_negativo` · `parados` · `classe_a` · `sem_calculo` | chips, KPIs, sinais com filtro pronto          |
| `abc`, `pqr` | `A`–`D`, `N` · `P`–`S`, `N`                                             | célula da matriz ABC × PQR, "Ver os 5 itens A" |
| `sinal`      | código do sinal                                                         | sinais sem filtro pronto (ex.: `acima_maximo`) |
| `pagina`     | 1, 2…                                                                   | paginação de 100                               |

### Ligar, desligar e trocar pela API real

- `npm run dev` liga o mock (padrão).
- `VITE_API_MOCK=false npm run dev` desliga tudo: as chamadas vão para `/api/v1` e o proxy do Vite as encaminha para o backend (`VITE_API_ALVO`, padrão `http://127.0.0.1:8000`).
- **Rota a rota:** `VITE_API_REAL="/me,/busca" npm run dev` manda só essas rotas (e as filhas) para o backend real. O resto continua no mock. Para trocar uma rota de vez:
  1. o backend implementa a rota com o formato de `src/api/tipos.ts`;
  2. o desenvolvedor testa com `VITE_API_REAL`;
  3. o handler sai de `src/mocks/handlers/`, que é o mock usado nos testes. Os testes da tela passam a montar a resposta com `servidorMock.use(...)`.

### O mock nunca vai para produção

- O mock só é importado por `import()` dinâmico dentro de `if (import.meta.env.DEV && ...)` em `src/main.tsx`. No build, `DEV` é `false` e o código some.
- O worker (`mockServiceWorker.js`) fica em `mock-worker/`, **fora de `public/`**, então o Vite nunca o copia para `dist/`. Um plugin do `vite.config.ts` com `apply: "serve"` o serve em `/mockServiceWorker.js`, e só no `npm run dev`. Para atualizar o worker depois de subir a versão do MSW: `npx msw init mock-worker --no-save`.
- `npm run verificar-build` (no `check` e no CI) falha se `dist/` tiver `mockServiceWorker.js` ou qualquer arquivo com "msw" ou "mockServiceWorker" no nome ou no conteúdo. Ele é testado em `tests/verificar-build.test.ts`.
