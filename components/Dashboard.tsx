"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProgressRing from "./ProgressRing";
import StreakBadge from "./StreakBadge";
import { getAllProgress, getLastVisited, overallCompletion } from "@/lib/progress";
import type { ProgressMap, LastVisited } from "@/lib/types";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good evening";
}

type FirstSubject = { slug: string; name: string } | null;

export default function Dashboard({
  totalSubtopics,
  firstSubject,
}: {
  totalSubtopics: number;
  firstSubject: FirstSubject;
}) {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [lastVisited, setLastVisitedState] = useState<LastVisited | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProgress(getAllProgress());
    setLastVisitedState(getLastVisited());
    setMounted(true);
  }, []);

  const { done, fraction } = overallCompletion(totalSubtopics, progress);

  return (
    <section className="mb-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-5">
      <div className="flex items-center justify-between">
        <p className="font-[var(--font-serif)] text-lg text-[var(--color-ink)]">{greeting()}</p>
        <StreakBadge />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <ProgressRing progress={fraction} size={56} strokeWidth={5} />
        <div>
          <p className="text-sm font-medium text-[var(--color-ink)]">
            {mounted ? `${done} of ${totalSubtopics} sections studied` : "Loading your progress…"}
          </p>
          <p className="text-xs text-[var(--color-ink-faint)]">Across all of Semester 1</p>
        </div>
      </div>

      {mounted && lastVisited ? (
        <Link
          href={`/subject/${lastVisited.subjectSlug}/${lastVisited.unitNumber}?section=${lastVisited.subtopicNumber}`}
          className="mt-4 flex items-center justify-between rounded-xl bg-[var(--color-ochre-soft)] px-4 py-3 transition-opacity hover:opacity-90"
        >
          <span className="min-w-0">
            <span className="block text-xs font-medium uppercase tracking-wide text-[var(--color-ochre)]">
              Continue
            </span>
            <span className="block truncate text-sm text-[var(--color-ink)]">
              {lastVisited.subjectName} · {lastVisited.subtopicTitle}
            </span>
          </span>
          <span className="shrink-0 text-[var(--color-ochre)]">→</span>
        </Link>
      ) : mounted && firstSubject ? (
        <Link
          href={`/subject/${firstSubject.slug}`}
          className="mt-4 flex items-center justify-between rounded-xl bg-[var(--color-ochre-soft)] px-4 py-3 transition-opacity hover:opacity-90"
        >
          <span className="text-sm text-[var(--color-ink)]">
            New here — start with <span className="font-medium">{firstSubject.name}</span>
          </span>
          <span className="shrink-0 text-[var(--color-ochre)]">→</span>
        </Link>
      ) : null}
    </section>
  );
}
