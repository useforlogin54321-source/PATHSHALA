"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import ProgressRing from "./ProgressRing";
import { getAllProgress, subjectCompletion } from "@/lib/progress";
import type { ProgressMap, SubjectWithSubtopics } from "@/lib/types";

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
};

export default function SubjectList({ subjects }: { subjects: SubjectWithSubtopics[] }) {
  const [progress, setProgress] = useState<ProgressMap>({});

  useEffect(() => {
    setProgress(getAllProgress());
  }, []);

  return (
    <motion.ul
      variants={listVariants}
      initial="hidden"
      animate="show"
      className="divide-y divide-[var(--color-line)] rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-raised)]"
    >
      {subjects.map((s) => (
        <motion.li key={s.slug} variants={rowVariants}>
          <Link
            href={`/subject/${s.slug}`}
            className="flex min-h-16 items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[var(--color-surface)] active:bg-[var(--color-surface)]"
          >
            <div>
              <p className="font-medium text-[var(--color-ink)]">{s.name}</p>
              <p className="text-xs text-[var(--color-ink-faint)]">
                {s.subtopics.length > 0
                  ? `Unit 1 · ${Math.round(subjectCompletion(s, progress) * s.subtopics.length)} of ${s.subtopics.length} studied`
                  : "Coming soon"}
              </p>
            </div>
            {s.subtopics.length > 0 ? (
              <ProgressRing progress={subjectCompletion(s, progress)} />
            ) : null}
          </Link>
        </motion.li>
      ))}
    </motion.ul>
  );
}
