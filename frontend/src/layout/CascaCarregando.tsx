/** Skeleton da casca enquanto GET /me carrega (menu e barra superior sem conteúdo). */
export function CascaCarregando() {
  return (
    <div
      role="status"
      aria-label="Carregando sua sessão"
      className="flex min-h-screen bg-background"
    >
      <div className="h-screen w-[248px] shrink-0 bg-verde-900 px-esp-16 pt-7">
        <div className="mx-2 size-10 rounded-[11px] bg-verde-800 motion-safe:animate-pulse" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="mt-4 h-11 rounded-md bg-verde-800 motion-safe:animate-pulse" />
        ))}
      </div>
      <div className="flex-1 px-10 pt-8">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-7">
          <div className="h-12 max-w-[460px] rounded-md bg-borda motion-safe:animate-pulse" />
          <div className="h-20 rounded-xl bg-borda motion-safe:animate-pulse" />
          <div className="h-28 rounded-xl bg-borda motion-safe:animate-pulse" />
        </div>
      </div>
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
