"use client";

import type {
  ProgressMap,
  SubtopicProgressStatus,
  StreakState,
  LastVisited,
  DailyLog,
  DayActivity,
  SubjectWithSubtopics,
  NextUp,
} from "./types";

// v1: progress, streaks, and activity history live in localStorage (per
// device). This keeps the first build simple and dependency-free. Syncing
// this to Supabase for cross-device progress is a natural next step once
// the core app is working - see the README.

const PROGRESS_KEY = "pathshala:progress";
const DAILY_LOG_KEY = "pathshala:daily-log";
const LAST_VISITED_KEY = "pathshala:last-visited";
const DAILY_LOG_RETENTION_DAYS = 60;

export function subtopicKey(subjectSlug: string, unitNumber: string, subtopicNumber: string) {
  return `${subjectSlug}:${unitNumber}:${subtopicNumber}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

// ---- subtopic progress -----------------------------------------------

export function getAllProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setProgress(key: string, status: SubtopicProgressStatus) {
  const map = getAllProgress();
  map[key] = status;
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
  if (status === "read" || status === "practiced") {
    recordActivity(status);
  }
}

// ---- daily activity log (backs streak, week strip, today's recap) -----

export function getDailyLog(): DailyLog {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DAILY_LOG_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDailyLog(log: DailyLog) {
  const cutoff = isoDaysAgo(DAILY_LOG_RETENTION_DAYS);
  const pruned: DailyLog = {};
  for (const [date, activity] of Object.entries(log)) {
    if (date >= cutoff) pruned[date] = activity;
  }
  window.localStorage.setItem(DAILY_LOG_KEY, JSON.stringify(pruned));
}

/** Call whenever the student does something study-relevant: reading a
 * section, marking one practiced, or asking the assistant a question. */
export function recordActivity(kind: keyof DayActivity) {
  const log = getDailyLog();
  const today = todayISO();
  const entry: DayActivity = log[today] ?? { read: 0, practiced: 0, asked: 0 };
  entry[kind] += 1;
  log[today] = entry;
  saveDailyLog(log);
}

export function getTodayRecap(): DayActivity {
  const log = getDailyLog();
  return log[todayISO()] ?? { read: 0, practiced: 0, asked: 0 };
}

/** Last 7 calendar days, oldest first, each with whether the student did
 * anything that day - for the week activity strip. */
export function getWeekActivity(): { date: string; active: boolean; isToday: boolean }[] {
  const log = getDailyLog();
  const today = todayISO();
  const days: { date: string; active: boolean; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = isoDaysAgo(i);
    const entry = log[date];
    const active = Boolean(entry && (entry.read > 0 || entry.practiced > 0 || entry.asked > 0));
    days.push({ date, active, isToday: date === today });
  }
  return days;
}

/** Consecutive-day streak, computed from the activity log itself rather
 * than a separately-tracked counter, so it can never drift out of sync. */
export function getStreak(): StreakState {
  const log = getDailyLog();
  const activeDates = Object.entries(log)
    .filter(([, a]) => a.read > 0 || a.practiced > 0 || a.asked > 0)
    .map(([date]) => date)
    .sort();

  if (activeDates.length === 0) {
    return { current_streak: 0, longest_streak: 0, last_active_date: null };
  }

  let longest = 1;
  let run = 1;
  for (let i = 1; i < activeDates.length; i++) {
    run = daysBetween(activeDates[i - 1], activeDates[i]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const lastActive = activeDates[activeDates.length - 1];
  const today = todayISO();
  const gap = daysBetween(lastActive, today);
  // Streak is still "current" if the student was active today or
  // yesterday (gives until end of day before it resets).
  const current = gap <= 1 ? run : 0;

  return { current_streak: current, longest_streak: longest, last_active_date: lastActive };
}

// ---- last visited (continue card) --------------------------------------

export function setLastVisited(entry: Omit<LastVisited, "visitedAt">) {
  const full: LastVisited = { ...entry, visitedAt: new Date().toISOString() };
  window.localStorage.setItem(LAST_VISITED_KEY, JSON.stringify(full));
}

export function getLastVisited(): LastVisited | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_VISITED_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ---- derived stats for the dashboard ------------------------------------

/** Rough per-subject completion, for the subject list's progress ring. */
export function subjectCompletion(
  subjectSlug: string,
  totalSubtopics: number,
  progress: ProgressMap
): number {
  if (totalSubtopics === 0) return 0;
  const done = Object.entries(progress).filter(
    ([key, status]) => key.startsWith(`${subjectSlug}:`) && status !== "unread"
  ).length;
  return Math.min(1, done / totalSubtopics);
}

/** Across every subject: how many subtopics have been touched at all
 * (read or practiced) vs. the total that exist - for the dashboard's
 * overall progress ring. */
export function overallCompletion(
  totalSubtopics: number,
  progress: ProgressMap
): { done: number; total: number; fraction: number } {
  const done = Object.values(progress).filter((s) => s !== "unread").length;
  return {
    done,
    total: totalSubtopics,
    fraction: totalSubtopics === 0 ? 0 : Math.min(1, done / totalSubtopics),
  };
}

/** Whichever subject has made the least relative progress, so the
 * dashboard can point at it directly instead of making you compare 8
 * rows yourself. Ties broken by subject order. Returns null once there's
 * not enough variance to be useful (e.g. everything's still at 0%). */
export function leastProgressSubject(
  subjects: SubjectWithSubtopics[],
  progress: ProgressMap
): { name: string; fraction: number } | null {
  const withProgress = subjects
    .filter((s) => s.subtopics.length > 0)
    .map((s) => ({
      name: s.name,
      fraction: subjectCompletion(s.slug, s.subtopics.length, progress),
    }));

  if (withProgress.length < 2) return null;

  const fractions = withProgress.map((s) => s.fraction);
  const max = Math.max(...fractions);
  const min = Math.min(...fractions);
  // Nothing meaningful to point at if everything's roughly even
  // (e.g. all untouched, or all finished).
  if (max - min < 0.15) return null;

  return withProgress.reduce((least, s) => (s.fraction < least.fraction ? s : least));
}

/** The next thing worth studying: first subtopic, in syllabus order,
 * that hasn't been marked practiced yet. Null once everything has. */
export function findNextUp(subjects: SubjectWithSubtopics[], progress: ProgressMap): NextUp | null {
  for (const subject of subjects) {
    for (const st of subject.subtopics) {
      const key = subtopicKey(subject.slug, subject.unitNumber, st.number);
      if (progress[key] !== "practiced") {
        return {
          subjectSlug: subject.slug,
          subjectName: subject.name,
          unitNumber: subject.unitNumber,
          subtopicNumber: st.number,
          subtopicTitle: st.title,
        };
      }
    }
  }
  return null;
}
