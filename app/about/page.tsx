import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-10">
      <Link href="/" className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink-soft)]">
        ← Home
      </Link>
      <h1 className="mt-3 font-[var(--font-serif)] text-2xl font-semibold text-[var(--color-ink)]">
        How this works
      </h1>
      <div className="prose-reading mt-4 text-[var(--color-ink-soft)]">
        <p>
          Everything you read here comes directly from your own syllabus material — nothing is
          added or invented. The assistant only ever sees the unit you currently have open, and
          is told plainly to say so if you ask something outside it, rather than guess.
        </p>
        <p>
          Progress and streaks are stored on this device for now, so they won&apos;t follow you
          between your phone and PC until Supabase sync is switched on.
        </p>
      </div>
    </main>
  );
}
