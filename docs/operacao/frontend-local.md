# Front-end na máquina local

Como instalar, rodar e testar o front-end (`frontend/`). Detalhes de código e das guardas: [`frontend/README.md`](../../frontend/README.md).

## Pré-requisitos

- **Node 22** (o CI usa 22). Confira com `node -v`.
- npm 10 ou mais novo (vem com o Node).

Não precisa de backend, banco nem Docker para o front no F1: os dados vêm do mock.

## Instalar

```bash
cd frontend
npm ci
```

Use `npm ci`, não `npm install`: ele instala exatamente o que está no `package-lock.json`. Para adicionar uma dependência, use `npm install <pacote>`. O `.npmrc` já grava a versão exata, sem `^` nem `~`, e o lock atualizado vai no mesmo commit.

## Rodar

```bash
npm run dev
```

Abre em http://localhost:5173. A porta é fixa: se estiver ocupada, o Vite avisa em vez de trocar de porta.

## Testar

```bash
npm run test         # testes uma vez
npm run test:watch   # testes em modo observação
npm run check        # tudo que o CI roda: typecheck, lint, testes, build e verificar-build
```

Rode `npm run check` antes de cada commit. Commit só com ele verde.

## Ligar e desligar o mock

- **Ligado** (padrão no `npm run dev`): as chamadas a `/api/v1/...` são respondidas no navegador pelo MSW, com os dados ilustrativos do design. No console do navegador aparece `[MSW] Mocking enabled`.
- **Desligado**: `VITE_API_MOCK=false npm run dev`. No PowerShell: `$env:VITE_API_MOCK="false"; npm run dev`. As chamadas vão para `/api/v1`, e o Vite as encaminha para o backend em `http://127.0.0.1:8000`. Para usar outro endereço, defina `VITE_API_ALVO`. Suba o backend antes, como em [`backend-local.md`](backend-local.md).
- **Só algumas rotas no backend real**: `VITE_API_REAL="/me,/busca" npm run dev`. No PowerShell: `$env:VITE_API_REAL="/me,/busca"; npm run dev`. Essas rotas vão para o backend e o resto fica no mock.
- No **build de produção** o mock nunca entra, nem o código nem o `mockServiceWorker.js`. O `npm run verificar-build` confere isso.

Não crie arquivo `.env` no repositório: o CI reprova qualquer `.env*` versionado, exceto `.env.example`. As variáveis acima vão na linha de comando ou num `.env.local` seu, que o `.gitignore` já ignora.

## Forçar estados das telas (só com o mock)

Acrescente na URL. Os parâmetros podem ser combinados:

| Parâmetro                                          | Efeito                                                       |
| -------------------------------------------------- | ------------------------------------------------------------ |
| `?mock=carregando`                                 | A tela fica carregando (skeleton).                           |
| `?mock=erro`                                       | A rota da tela responde 500.                                 |
| `?mock=vazio`                                      | A rota da tela responde lista vazia.                         |
| `?plano=demonstracao` · `ativo` · `somente_leitura` | O plano que o `GET /api/v1/me` devolve. Padrão: `ativo`.     |
| `?sessao=expirada`                                 | O `GET /api/v1/me` responde 401 (a casca leva para /entrar). |

Exemplo: http://localhost:5173/app/materiais?plano=somente_leitura&mock=vazio
