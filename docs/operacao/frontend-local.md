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

O mock (MSW) entra no passo F1-3. Funcionamento:

- **Ligado** (padrão no `npm run dev`): as chamadas a `/api/v1/...` são respondidas no navegador pelo MSW, com os dados ilustrativos do design.
- **Desligado**: rode `VITE_API_MOCK=false npm run dev` (no PowerShell: `$env:VITE_API_MOCK="false"; npm run dev`). As chamadas vão para `/api/v1` de verdade.
- No **build de produção** o mock nunca entra, nem o código nem o `mockServiceWorker.js`. O `npm run verificar-build` confere isso.

Não crie arquivo `.env` no repositório: o CI reprova qualquer `.env*` versionado, exceto `.env.example`. O padrão do mock está no código, e a variável é só para desligá-lo.

Os parâmetros de URL para forçar estados (`?mock=carregando|erro|vazio`, `?plano=demonstracao|ativo|somente_leitura`, `?sessao=expirada`) serão descritos aqui no F1-3.
