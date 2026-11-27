interface ImportMetaEnv {
  /** "false" desliga o mock no `npm run dev`. Qualquer outro valor (ou ausente) liga. */
  readonly VITE_API_MOCK?: string;
  /** Rotas que vão para a API real mesmo com o mock ligado (ex.: "/me,/busca"). */
  readonly VITE_API_REAL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
