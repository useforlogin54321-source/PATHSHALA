"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProgressRing from "./ProgressRing";
import WeekStrip from "./WeekStrip";
import {
  getAllProgress,
  getLastVisited,
  overallCompletion,
  leastProgressSubject,
  findNextUp,
  getWeekActivity,
  getStreak,
  getTodayRecap,
} from "@/lib/progress";
import type { ProgressMap, LastVisited, SubjectWithSubtopics, NextUp, DayActivity } from "@/lib/types";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good evening";
}

function recapLine(recap: DayActivity) {
  const parts: string[] = [];
  if (recap.read > 0) parts.push(`${recap.read} read`);
  if (recap.practiced > 0) parts.push(`${recap.practiced} practiced`);
  if (recap.asked > 0) parts.push(`${recap.asked} question${recap.asked === 1 ? "" : "s"} asked`);
  return parts.length > 0 ? `Today: ${parts.join(" · ")}` : null;
}

export default function Dashboard({
  subjects,
  totalSubtopics,
}: {
  subjects: SubjectWithSubtopics[];
  totalSubtopics: number;
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
  const leastProgress = leastProgressSubject(subjects, progress);
  const nextUp = findNextUp(subjects, progress);
  const weekDays = getWeekActivity();
  const streak = getStreak();
  const todayRecap = recapLine(getTodayRecap());

  const lastVisitedStatus = lastVisited
    ? progress[`${lastVisited.subjectSlug}:${lastVisited.unitNumber}:${lastVisited.subtopicNumber}`]
    : undefined;
  const continueTarget: NextUp | null =
    lastVisited && lastVisitedStatus !== "practiced"
      ? {
          subjectSlug: lastVisited.subjectSlug,
          subjectName: lastVisited.subjectName,
          unitNumber: lastVisited.unitNumber,
          subtopicNumber: lastVisited.subtopicNumber,
          subtopicTitle: lastVisited.subtopicTitle,
        }
      : null;

  const sameTarget =
    continueTarget !== null &&
    nextUp !== null &&
    continueTarget.subjectSlug === nextUp.subjectSlug &&
    continueTarget.subtopicNumber === nextUp.subtopicNumber;

  return (
    <section className="mb-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-[var(--font-serif)] text-lg text-[var(--color-ink)]">{greeting()}</p>
        {mounted ? <WeekStrip days={weekDays} currentStreak={streak.current_streak} /> : null}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <ProgressRing progress={fraction} size={56} strokeWidth={5} />
        <div>
          <p className="text-sm font-medium text-[var(--color-ink)]">
            {mounted ? `${done} of ${totalSubtopics} sections studied` : "Loading your progress…"}
          </p>
          <p className="text-xs text-[var(--color-ink-faint)]">
            {mounted && leastProgress
              ? `Least progress: ${leastProgress.name} (${Math.round(leastProgress.fraction * 100)}%)`
              : "Across all of Semester 1"}
          </p>
          {mounted && todayRecap ? (
            <p className="mt-0.5 text-xs text-[var(--color-moss)]">{todayRecap}</p>
          ) : null}
        </div>
      </div>

      {mounted && continueTarget ? (
        <DashboardActionLink label="Continue" target={continueTarget} />
      ) : null}

      {mounted && nextUp && !sameTarget ? (
        <DashboardActionLink label={continueTarget ? "Next up" : "Start here"} target={nextUp} />
      ) : null}

      {mounted && !nextUp && totalSubtopics > 0 ? (
        <p className="mt-4 rounded-xl bg-[var(--color-moss-soft)] px-4 py-3 text-sm text-[var(--color-ink)]">
          You've been through every section in Semester 1. 🎉
        </p>
      ) : null}
    </section>
  );
}

function DashboardActionLink({ label, target }: { label: string; target: NextUp }) {
  return (
    <Link
      href={`/subject/${target.subjectSlug}/${target.unitNumber}?section=${target.subtopicNumber}`}
      className="mt-3 flex items-center justify-between rounded-xl bg-[var(--color-ochre-soft)] px-4 py-3 transition-opacity hover:opacity-90"
    >
      <span className="min-w-0">
        <span className="block text-xs font-medium uppercase tracking-wide text-[var(--color-ochre)]">
          {label}
        </span>
        <span className="block truncate text-sm text-[var(--color-ink)]">
          {target.subjectName} · {target.subtopicTitle}
        </span>
      </span>
      <span className="shrink-0 text-[var(--color-ochre)]">→</span>
    </Link>
  );
}
