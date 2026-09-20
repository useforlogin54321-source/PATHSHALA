export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <header className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-3">
        <div className="h-6 w-20 animate-pulse rounded-full bg-[var(--color-line)] md:hidden" />
        <div className="hidden h-3 w-24 animate-pulse rounded bg-[var(--color-line)] md:block" />
        <div className="h-6 w-28 animate-pulse rounded-full bg-[var(--color-line)]" />
      </header>

      <div className="mx-auto flex max-w-5xl">
        <aside className="hidden w-64 shrink-0 border-r border-[var(--color-line)] px-3 py-5 md:block">
          <div className="mb-3 h-3 w-16 animate-pulse rounded bg-[var(--color-line)]" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="mb-2 h-8 animate-pulse rounded-lg bg-[var(--color-line)]/60" />
          ))}
        </aside>

        <main className="min-w-0 flex-1 px-6 py-8 md:px-10">
          <div className="h-3 w-40 animate-pulse rounded bg-[var(--color-line)]" />
          <div className="mt-2 h-8 w-72 animate-pulse rounded bg-[var(--color-line)]" />
          <div className="mt-4 h-9 w-48 animate-pulse rounded-full bg-[var(--color-line)]" />
          <div className="prose-reading mt-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-3 animate-pulse rounded bg-[var(--color-line)]/60" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
