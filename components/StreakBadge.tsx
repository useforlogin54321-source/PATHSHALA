"use client";

import { useEffect, useState } from "react";
import { getStreak } from "@/lib/progress";
import type { StreakState } from "@/lib/types";

export default function StreakBadge() {
  const [streak, setStreak] = useState<StreakState | null>(null);

  useEffect(() => {
    setStreak(getStreak());
  }, []);

  if (!streak || streak.current_streak === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-ochre-soft)] px-3 py-1 text-xs font-medium text-[var(--color-ochre)]">
      {streak.current_streak} day{streak.current_streak === 1 ? "" : "s"} in a row
    </span>
  );
}
