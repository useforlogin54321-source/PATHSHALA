"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProgressRing from "./ProgressRing";
import { getAllProgress, subjectCompletion } from "@/lib/progress";
import type { ProgressMap } from "@/lib/types";

type SubjectWithCount = { slug: string; name: string; order: number; subtopicCount: number };

export default function SubjectList({ subjects }: { subjects: SubjectWithCount[] }) {
  const [progress, setProgress] = useState<ProgressMap>({});

  useEffect(() => {
    setProgress(getAllProgress());
  }, []);

  return (
    <ul className="divide-y divide-[var(--color-line)] rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-raised)]">
      {subjects.map((s) => (
        <li key={s.slug}>
          <Link
            href={`/subject/${s.slug}`}
            className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[var(--color-surface)]"
          >
            <div>
              <p className="font-medium text-[var(--color-ink)]">{s.name}</p>
              <p className="text-xs text-[var(--color-ink-faint)]">
                {s.subtopicCount > 0 ? `${s.subtopicCount} sections · Unit 1` : "Coming soon"}
              </p>
            </div>
            {s.subtopicCount > 0 ? (
              <ProgressRing progress={subjectCompletion(s.slug, s.subtopicCount, progress)} />
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
