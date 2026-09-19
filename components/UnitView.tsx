"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Unit, ProgressMap } from "@/lib/types";
import SubtopicNav, { type SectionId } from "./SubtopicNav";
import ReadAloud from "./ReadAloud";
import ChatPanel from "./ChatPanel";
import { getAllProgress, setProgress, subtopicKey, setLastVisited } from "@/lib/progress";

type Props = {
  subjectSlug: string;
  subjectName: string;
  unit: Unit;
  initialSection?: string;
};

const SPECIAL_CONTENT: Record<string, (unit: Unit) => { title: string; body: string }> = {
  summary: (u) => ({ title: "Summary", body: u.summary }),
  keywords: (u) => ({ title: "Keywords", body: u.keywords }),
  saq: (u) => ({ title: "Self-Assessment Questions", body: u.self_assessment_questions }),
  references: (u) => ({ title: "References", body: u.references }),
};

export default function UnitView({ subjectSlug, subjectName, unit, initialSection }: Props) {
  const validInitial =
    initialSection && unit.subtopics.some((s) => s.number === initialSection)
      ? initialSection
      : unit.subtopics[0]?.number ?? "summary";
  const [active, setActive] = useState<SectionId>(validInitial);
  const [progress, setProgressState] = useState<ProgressMap>({});
  const [navOpen, setNavOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const currentProgress = getAllProgress();
    const current = unit.subtopics.find((s) => s.number === validInitial);
    if (current) {
      setLastVisited({
        subjectSlug,
        subjectName,
        unitNumber: unit.unit_number,
        subtopicNumber: current.number,
        subtopicTitle: current.title,
      });
      const key = subtopicKey(subjectSlug, unit.unit_number, current.number);
      if (!currentProgress[key]) {
        setProgress(key, "read");
      }
    }
    setProgressState(getAllProgress());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSubtopic = unit.subtopics.find((s) => s.number === active);
  const activeSpecial = SPECIAL_CONTENT[active]?.(unit);

  const displayTitle = activeSubtopic
    ? `${activeSubtopic.number} ${activeSubtopic.title}`
    : activeSpecial?.title ?? "";
  const displayBody = activeSubtopic ? activeSubtopic.content : activeSpecial?.body ?? "";

  const paragraphs = useMemo(
    () => displayBody.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
    [displayBody]
  );

  function selectSection(id: SectionId) {
    setActive(id);
    setNavOpen(false);
    const subtopic = unit.subtopics.find((s) => s.number === id);
    if (subtopic) {
      setLastVisited({
        subjectSlug,
        subjectName,
        unitNumber: unit.unit_number,
        subtopicNumber: subtopic.number,
        subtopicTitle: subtopic.title,
      });
      const key = subtopicKey(subjectSlug, unit.unit_number, id);
      if (!progress[key]) {
        setProgress(key, "read");
        setProgressState(getAllProgress());
      }
    }
  }

  function markPracticed() {
    if (!activeSubtopic) return;
    const key = subtopicKey(subjectSlug, unit.unit_number, activeSubtopic.number);
    setProgress(key, "practiced");
    setProgressState(getAllProgress());
  }

  const currentStatus = activeSubtopic
    ? progress[subtopicKey(subjectSlug, unit.unit_number, activeSubtopic.number)] ?? "unread"
    : null;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-paper)]/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNavOpen((v) => !v)}
            className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-ink-soft)] md:hidden"
          >
            Contents
          </button>
          <div className="hidden md:block">
            <Link href={`/subject/${subjectSlug}`} className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink-soft)]">
              ← {subjectName}
            </Link>
          </div>
        </div>
        <button
          onClick={() => setChatOpen((v) => !v)}
          className="rounded-full bg-[var(--color-ochre-soft)] px-4 py-1.5 text-xs font-medium text-[var(--color-ochre)]"
        >
          {chatOpen ? "Close assistant" : "Ask about this"}
        </button>
      </header>

      <div className="mx-auto flex max-w-5xl">
        {/* Left nav rail - desktop */}
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-64 shrink-0 overflow-y-auto border-r border-[var(--color-line)] px-3 py-5 md:block">
          <SubtopicNav
            unit={unit}
            subjectSlug={subjectSlug}
            active={active}
            onSelect={selectSection}
            progress={progress}
          />
        </aside>

        {/* Mobile nav drawer */}
        {navOpen && (
          <div className="fixed inset-0 z-30 md:hidden">
            <div className="absolute inset-0 bg-black/20" onClick={() => setNavOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-[var(--color-paper)] px-3 py-5 shadow-xl">
              <Link
                href={`/subject/${subjectSlug}`}
                className="mb-3 block px-2 text-xs text-[var(--color-ink-faint)]"
              >
                ← {subjectName}
              </Link>
              <SubtopicNav
                unit={unit}
                subjectSlug={subjectSlug}
                active={active}
                onSelect={selectSection}
                progress={progress}
              />
            </div>
          </div>
        )}

        {/* Reading pane */}
        <main className="min-w-0 flex-1 px-6 py-8 md:px-10">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
            {subjectName} · {unit.unit_label}
          </p>
          <h1 className="mt-1 font-[var(--font-serif)] text-2xl font-semibold text-[var(--color-ink)]">
            {displayTitle}
          </h1>

          {activeSubtopic && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ReadAloud
                text={displayBody}
                title={displayTitle}
                subtitle={`${subjectName} · ${unit.unit_label}`}
              />
              <button
                onClick={markPracticed}
                disabled={currentStatus === "practiced"}
                className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] disabled:opacity-40"
              >
                {currentStatus === "practiced" ? "Practiced ✓" : "Mark as practiced"}
              </button>
            </div>
          )}

          <article className="prose-reading mt-6">
            {paragraphs.length > 0 ? (
              paragraphs.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <p className="text-[var(--color-ink-faint)]">Nothing here yet.</p>
            )}
          </article>
        </main>

        {/* Chat panel */}
        {chatOpen && (
          <div className="fixed inset-0 z-30 md:static md:inset-auto md:z-auto">
            <div className="absolute inset-0 bg-black/20 md:hidden" onClick={() => setChatOpen(false)} />
            <div className="absolute inset-y-0 right-0 w-full max-w-sm border-l border-[var(--color-line)] bg-[var(--color-paper)] shadow-xl md:sticky md:top-[57px] md:h-[calc(100vh-57px)] md:w-80 md:shadow-none">
              <ChatPanel unitContext={unit.raw_text} subjectName={subjectName} unitTitle={unit.unit_title} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
