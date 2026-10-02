"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { Unit, ProgressMap } from "@/lib/types";
import SubtopicNav, { type SectionId } from "./SubtopicNav";
import AudioPlayer from "./AudioPlayer";
import ChatPanel from "./ChatPanel";
import { ArrowLeft, ArrowRight, Check, Chat, Close, List } from "./Icons";
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

const SIZES = [1, 1.0625, 1.1875, 1.3125]; // rem, reading text size steps
const SIZE_KEY = "pathshala:reading-size";

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

export default function UnitView({ subjectSlug, subjectName, unit, initialSection }: Props) {
  const validInitial =
    initialSection && unit.subtopics.some((s) => s.number === initialSection)
      ? initialSection
      : unit.subtopics[0]?.number ?? "summary";
  const [active, setActive] = useState<SectionId>(validInitial);
  const [progress, setProgressState] = useState<ProgressMap>({});
  const [navOpen, setNavOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [sizeIdx, setSizeIdx] = useState(1);
  const mainRef = useRef<HTMLElement>(null);

  useEscape(navOpen, () => setNavOpen(false));
  useEscape(chatOpen, () => setChatOpen(false));

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
      if (!currentProgress[key]) setProgress(key, "read");
    }
    setProgressState(getAllProgress());
    try {
      const saved = Number(localStorage.getItem(SIZE_KEY));
      if (Number.isInteger(saved) && saved >= 0 && saved < SIZES.length) setSizeIdx(saved);
    } catch {}
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

  // Reading order: numbered sections, then Summary / Keywords / SAQ / References.
  const order = useMemo(() => {
    const extras = Object.keys(SPECIAL_CONTENT).filter((id) => SPECIAL_CONTENT[id](unit).body);
    return [...unit.subtopics.map((s) => s.number), ...extras];
  }, [unit]);
  const labelFor = (id: string) => {
    const st = unit.subtopics.find((s) => s.number === id);
    return st ? `${st.number} ${st.title}` : SPECIAL_CONTENT[id]?.(unit).title ?? id;
  };
  const idx = order.indexOf(active);
  const prevId = idx > 0 ? order[idx - 1] : null;
  const nextId = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;

  function selectSection(id: SectionId) {
    setActive(id);
    setNavOpen(false);
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
    // Keep the URL in sync so refresh / share / reinstall lands on the same section.
    window.history.replaceState(null, "", `?section=${encodeURIComponent(id)}`);
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

  function changeSize(delta: number) {
    const next = Math.max(0, Math.min(SIZES.length - 1, sizeIdx + delta));
    setSizeIdx(next);
    try {
      localStorage.setItem(SIZE_KEY, String(next));
    } catch {}
  }

  const currentStatus = activeSubtopic
    ? progress[subtopicKey(subjectSlug, unit.unit_number, activeSubtopic.number)] ?? "unread"
    : null;

  const iconBtn =
    "flex h-11 min-w-11 items-center justify-center gap-2 rounded-full text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface)] active:bg-[var(--color-surface)]";

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <header className="sticky top-0 z-20 flex h-[57px] items-center justify-between gap-2 border-b border-[var(--color-line)] bg-[var(--color-paper)]/95 px-2 backdrop-blur md:px-4">
        <div className="flex min-w-0 items-center gap-1">
          <Link href={`/subject/${subjectSlug}`} className={iconBtn} aria-label={`Back to ${subjectName}`}>
            <ArrowLeft />
            <span className="hidden pr-3 text-sm md:inline">{subjectName}</span>
          </Link>
          <button
            onClick={() => setNavOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={navOpen}
            className={`${iconBtn} px-3 md:hidden`}
          >
            <List />
            <span className="text-sm">Contents</span>
          </button>
        </div>
        <div className="flex items-center gap-1">
          <div className="hidden items-center sm:flex" role="group" aria-label="Reading text size">
            <button onClick={() => changeSize(-1)} disabled={sizeIdx === 0} aria-label="Smaller text" className={`${iconBtn} text-sm disabled:opacity-40`}>
              A<span className="text-xs">−</span>
            </button>
            <button onClick={() => changeSize(1)} disabled={sizeIdx === SIZES.length - 1} aria-label="Larger text" className={`${iconBtn} text-base disabled:opacity-40`}>
              A<span className="text-xs">+</span>
            </button>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setChatOpen((v) => !v)}
            aria-expanded={chatOpen}
            className="flex h-11 items-center gap-2 rounded-full bg-[var(--color-ochre-soft)] px-4 text-sm font-medium text-[var(--color-ochre)]"
          >
            <Chat />
            {chatOpen ? "Close assistant" : "Ask about this"}
          </motion.button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[90rem]">
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-64 shrink-0 overflow-y-auto border-r border-[var(--color-line)] px-3 py-5 md:block">
          <SubtopicNav unit={unit} subjectSlug={subjectSlug} active={active} onSelect={selectSection} progress={progress} />
        </aside>

        <AnimatePresence>
          {navOpen && (
            <div className="fixed inset-0 z-30 md:hidden" role="dialog" aria-modal="true" aria-label="Unit contents">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-[var(--color-scrim)]"
                onClick={() => setNavOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col bg-[var(--color-paper)] shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-[var(--color-line)] px-2 py-1.5">
                  <Link href={`/subject/${subjectSlug}`} className={`${iconBtn} px-3 text-sm`}>
                    <ArrowLeft /> {subjectName}
                  </Link>
                  <button autoFocus onClick={() => setNavOpen(false)} aria-label="Close contents" className={iconBtn}>
                    <Close />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-4">
                  <SubtopicNav unit={unit} subjectSlug={subjectSlug} active={active} onSelect={selectSection} progress={progress} />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <main
          id="main"
          ref={mainRef}
          tabIndex={-1}
          style={{ ["--reading-size" as string]: `${SIZES[sizeIdx]}rem` }}
          className="min-w-0 flex-1 px-5 py-8 outline-none md:px-10"
        >
          <p className="mx-auto max-w-[68ch] text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
            {subjectName} · {unit.unit_label} · {idx + 1} of {order.length}
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <h1 className="mx-auto mt-1 max-w-[68ch] font-[var(--font-serif)] text-2xl font-semibold text-[var(--color-ink)] md:text-3xl">
                {displayTitle}
              </h1>

              {activeSubtopic && (
                <div className="mx-auto mt-4 flex max-w-[68ch] flex-wrap items-center gap-3">
                  {activeSubtopic.audio_url ? (
                    <AudioPlayer audioUrl={activeSubtopic.audio_url} title={displayTitle} subtitle={`${subjectName} · ${unit.unit_label}`} />
                  ) : (
                    <span className="text-sm text-[var(--color-ink-faint)]">Audio isn&apos;t available for this section yet.</span>
                  )}
                </div>
              )}

              <article className="prose-reading mt-6">
                {paragraphs.length > 0 ? (
                  paragraphs.map((p, i) => <p key={i}>{p}</p>)
                ) : (
                  <p className="text-[var(--color-ink-faint)]">Nothing here yet.</p>
                )}
              </article>

              <nav aria-label="Section navigation" className="mx-auto mt-10 max-w-[68ch] border-t border-[var(--color-line)] pt-6">
                {activeSubtopic && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={markPracticed}
                    disabled={currentStatus === "practiced"}
                    aria-pressed={currentStatus === "practiced"}
                    className={`mb-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors ${
                      currentStatus === "practiced"
                        ? "border-transparent bg-[var(--color-moss-soft)] text-[var(--color-ink)]"
                        : "border-[var(--color-line-strong)] text-[var(--color-ink)] hover:bg-[var(--color-surface)]"
                    }`}
                  >
                    {currentStatus === "practiced" ? <><Check /> Practiced</> : "Mark as practiced"}
                  </motion.button>
                )}
                <div className="flex gap-3">
                  {prevId ? (
                    <button onClick={() => selectSection(prevId)} className="flex min-h-14 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-raised)] px-3 text-left hover:bg-[var(--color-surface)]">
                      <ArrowLeft className="shrink-0" />
                      <span className="min-w-0"><span className="block text-xs text-[var(--color-ink-faint)]">Previous</span><span className="block truncate text-sm">{labelFor(prevId)}</span></span>
                    </button>
                  ) : <span className="flex-1" />}
                  {nextId ? (
                    <button onClick={() => selectSection(nextId)} className="flex min-h-14 min-w-0 flex-1 items-center justify-end gap-2 rounded-xl bg-[var(--color-moss)] px-3 text-right text-[var(--color-on-moss)]">
                      <span className="min-w-0"><span className="block text-xs opacity-80">Next</span><span className="block truncate text-sm font-medium">{labelFor(nextId)}</span></span>
                      <ArrowRight className="shrink-0" />
                    </button>
                  ) : <span className="flex-1" />}
                </div>
              </nav>
            </motion.div>
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {chatOpen && (
            <div className="fixed inset-0 z-30 xl:static xl:inset-auto xl:z-auto" role="dialog" aria-label="Study assistant">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-[var(--color-scrim)] xl:hidden"
                onClick={() => setChatOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="absolute inset-y-0 right-0 w-full max-w-md border-l border-[var(--color-line)] bg-[var(--color-paper)] shadow-xl xl:sticky xl:top-[57px] xl:h-[calc(100vh-57px)] xl:w-80 xl:max-w-none xl:shadow-none"
              >
                <ChatPanel unitContext={unit.raw_text} subjectName={subjectName} unitTitle={unit.unit_title} onClose={() => setChatOpen(false)} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
