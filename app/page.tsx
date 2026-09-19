import Link from "next/link";
import { getSubjects, getUnit } from "@/lib/content";
import SubjectList from "@/components/SubjectList";
import Dashboard from "@/components/Dashboard";

export default async function HomePage() {
  const subjects = await getSubjects();

  const withCounts = await Promise.all(
    subjects.map(async (s) => {
      const unit = await getUnit(s.slug, "1");
      return { ...s, subtopicCount: unit?.subtopics.length ?? 0 };
    })
  );

  const totalSubtopics = withCounts.reduce((sum, s) => sum + s.subtopicCount, 0);
  const firstSubject = withCounts[0] ? { slug: withCounts[0].slug, name: withCounts[0].name } : null;

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <header className="mb-6">
        <h1 className="font-[var(--font-serif)] text-2xl font-semibold text-[var(--color-ink)]">
          Pathshala
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-faint)]">
          Semester 1 · your syllabus, nothing else.
        </p>
      </header>

      <Dashboard totalSubtopics={totalSubtopics} firstSubject={firstSubject} />

      <p className="mb-3 px-1 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
        All subjects
      </p>
      <SubjectList subjects={withCounts} />

      <p className="mt-10 text-xs text-[var(--color-ink-faint)]">
        <Link href="/about" className="hover:text-[var(--color-ink-soft)]">
          How this works
        </Link>
      </p>
    </main>
  );
}
