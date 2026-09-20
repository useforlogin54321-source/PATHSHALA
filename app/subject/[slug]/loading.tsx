export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-line)]" />
      <div className="mt-3 h-8 w-56 animate-pulse rounded bg-[var(--color-line)]" />
      <div className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-5">
        <div className="h-4 w-40 animate-pulse rounded bg-[var(--color-line)]" />
        <div className="mt-2 h-3 w-24 animate-pulse rounded bg-[var(--color-line)]" />
      </div>
    </main>
  );
}
