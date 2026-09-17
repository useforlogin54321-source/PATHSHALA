import Link from "next/link";
import { getSubjects, getUnit } from "@/lib/content";
import SubjectList from "@/components/SubjectList";

export default async function HomePage() {
  const subjects = await getSubjects();

  const withCounts = await Promise.all(
    subjects.map(async (s) => {
      const unit = await getUnit(s.slug, "1");
      return { ...s, subtopicCount: unit?.subtopics.length ?? 0 };
    })
  );

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-[var(--font-serif)] text-2xl font-semibold text-[var(--color-ink)]">
          Pathshala
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-faint)]">
          Semester 1 · your syllabus, nothing else.
        </p>
      </header>

      <SubjectList subjects={withCounts} />

      <p className="mt-10 text-xs text-[var(--color-ink-faint)]">
        <Link href="/about" className="hover:text-[var(--color-ink-soft)]">
          How this works
        </Link>
      </p>
    </main>
  );
}
