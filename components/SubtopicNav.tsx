"use client";

import type { Unit, ProgressMap } from "@/lib/types";
import { subtopicKey } from "@/lib/progress";

export type SectionId = string; // subtopic number, or "summary" | "keywords" | "saq" | "references"

type Props = {
  unit: Unit;
  subjectSlug: string;
  active: SectionId;
  onSelect: (id: SectionId) => void;
  progress: ProgressMap;
};

const statusDot: Record<string, string> = {
  unread: "bg-[var(--color-line)]",
  read: "bg-[var(--color-ochre)]",
  practiced: "bg-[var(--color-moss)]",
};

export default function SubtopicNav({ unit, subjectSlug, active, onSelect, progress }: Props) {
  const extras: { id: SectionId; label: string; present: boolean }[] = [
    { id: "summary", label: "Summary", present: Boolean(unit.summary) },
    { id: "keywords", label: "Keywords", present: Boolean(unit.keywords) },
    { id: "saq", label: "Self-Assessment Questions", present: Boolean(unit.self_assessment_questions) },
    { id: "references", label: "References", present: Boolean(unit.references) },
  ];

  return (
    <nav className="space-y-1">
      <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
        {unit.unit_label}
      </p>
      {unit.subtopics.map((st) => {
        const key = subtopicKey(subjectSlug, unit.unit_number, st.number);
        const status = progress[key] ?? "unread";
        const isActive = active === st.number;
        return (
          <button
            key={st.number}
            onClick={() => onSelect(st.number)}
            className={`flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
              isActive
                ? "bg-[var(--color-surface)] text-[var(--color-ink)]"
                : "text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)]/60"
            }`}
          >
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[status]}`} />
            <span>
              <span className="text-[var(--color-ink-faint)]">{st.number}</span> {st.title}
            </span>
          </button>
        );
      })}

      {extras.some((e) => e.present) && (
        <div className="mt-3 border-t border-[var(--color-line)] pt-3">
          {extras
            .filter((e) => e.present)
            .map((e) => (
              <button
                key={e.id}
                onClick={() => onSelect(e.id)}
                className={`block w-full rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                  active === e.id
                    ? "bg-[var(--color-surface)] text-[var(--color-ink)]"
                    : "text-[var(--color-ink-faint)] hover:bg-[var(--color-surface)]/60"
                }`}
              >
                {e.label}
              </button>
            ))}
        </div>
      )}
    </nav>
  );
}
