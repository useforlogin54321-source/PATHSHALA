"use client";

import type { ProgressMap, SubtopicProgressStatus, StreakState, LastVisited } from "./types";

// v1: progress and streaks live in localStorage (per device). This keeps
// the first build simple and dependency-free. Syncing this to Supabase
// for cross-device progress is a natural next step once the core app is
// working - see the README.

const PROGRESS_KEY = "pathshala:progress";
const STREAK_KEY = "pathshala:streak";
const LAST_VISITED_KEY = "pathshala:last-visited";

export function subtopicKey(subjectSlug: string, unitNumber: string, subtopicNumber: string) {
  return `${subjectSlug}:${unitNumber}:${subtopicNumber}`;
}

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
  recordActivityToday();
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

export function getStreak(): StreakState {
  if (typeof window === "undefined") {
    return { current_streak: 0, longest_streak: 0, last_active_date: null };
  }
  try {
    const raw = window.localStorage.getItem(STREAK_KEY);
    return raw
      ? JSON.parse(raw)
      : { current_streak: 0, longest_streak: 0, last_active_date: null };
  } catch {
    return { current_streak: 0, longest_streak: 0, last_active_date: null };
  }
}

function saveStreak(streak: StreakState) {
  window.localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
}

/** Call whenever the student does something study-relevant (reads,
 * marks practiced, asks the assistant a question). Advances the streak
 * once per calendar day. */
export function recordActivityToday(): StreakState {
  const streak = getStreak();
  const today = todayISO();

  if (streak.last_active_date === today) {
    return streak; // already counted today
  }

  let current = 1;
  if (streak.last_active_date && daysBetween(streak.last_active_date, today) === 1) {
    current = streak.current_streak + 1;
  }

  const next: StreakState = {
    current_streak: current,
    longest_streak: Math.max(current, streak.longest_streak),
    last_active_date: today,
  };
  saveStreak(next);
  return next;
}

/** Rough per-subject completion, for the home page progress indicator. */
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
