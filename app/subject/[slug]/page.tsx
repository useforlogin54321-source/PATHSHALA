import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@/components/Icons";
import { notFound } from "next/navigation";
import { getSubjectSummaries } from "@/lib/content";

export default async function SubjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const subjects = await getSubjectSummaries();
  const subject = subjects.find((s) => s.slug === slug);
  if (!subject) notFound();

  return (
    <main id="main" className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <Link href="/" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)]">
        <ArrowLeft width={16} height={16} /> All subjects
      </Link>
      <h1 className="mt-3 font-[var(--font-serif)] text-2xl font-semibold text-[var(--color-ink)]">
        {subject.name}
      </h1>

      <div className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-raised)]">
        {subject.subtopics.length > 0 ? (
          <Link
            href={`/subject/${slug}/${subject.unitNumber}`}
            className="flex min-h-16 items-center justify-between px-5 py-4 hover:bg-[var(--color-surface)]"
          >
            <div>
              <p className="font-medium text-[var(--color-ink)]">
                {subject.unitLabel}: {subject.unitTitle}
              </p>
              <p className="text-xs text-[var(--color-ink-faint)]">
                {subject.subtopics.length} sections
              </p>
            </div>
            <ArrowRight className="text-[var(--color-ink-faint)]" />
          </Link>
        ) : (
          <p className="px-5 py-4 text-sm text-[var(--color-ink-faint)]">
            No units added for this subject yet.
          </p>
        )}
        <div className="border-t border-[var(--color-line)] px-5 py-3 text-xs text-[var(--color-ink-faint)]">
          More units land here as you add them.
        </div>
      </div>
    </main>
  );
}
