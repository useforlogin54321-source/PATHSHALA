import Link from "next/link";
import { getSubjectSummaries } from "@/lib/content";
import SubjectList from "@/components/SubjectList";
import Dashboard from "@/components/Dashboard";

export default async function HomePage() {
  const withUnits = await getSubjectSummaries();
  const totalSubtopics = withUnits.reduce((sum, s) => sum + s.subtopics.length, 0);

  return (
    <main id="main" className="mx-auto min-h-screen max-w-2xl px-5 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="font-[var(--font-serif)] text-2xl font-semibold text-[var(--color-ink)]">
          Pathshala
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Semester 1 · your syllabus, nothing else.
        </p>
      </header>

      <Dashboard subjects={withUnits} totalSubtopics={totalSubtopics} />

      <h2 className="mb-3 px-1 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
        All subjects
      </h2>
      <SubjectList subjects={withUnits} />

      <p className="mt-10 text-xs text-[var(--color-ink-faint)]">
        <Link href="/about" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
          How this works
        </Link>
      </p>
    </main>
  );
}
