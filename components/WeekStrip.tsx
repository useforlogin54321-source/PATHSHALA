"use client";

import { motion } from "motion/react";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export default function WeekStrip({
  days,
  currentStreak,
}: {
  days: { date: string; active: boolean; isToday: boolean }[];
  currentStreak: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        {days.map((d, i) => {
          const dow = new Date(d.date + "T00:00:00").getDay();
          return (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-[var(--color-ink-faint)]">{DAY_LETTERS[dow]}</span>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.25, delay: i * 0.035, ease: "backOut" }}
                className={`h-2.5 w-2.5 rounded-full ${
                  d.active
                    ? "bg-[var(--color-moss)]"
                    : d.isToday
                      ? "border border-dashed border-[var(--color-ink-faint)]"
                      : "bg-[var(--color-line)]"
                }`}
                title={d.date}
              />
            </div>
          );
        })}
      </div>
      {currentStreak > 0 ? (
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.2 }}
          className="rounded-full bg-[var(--color-ochre-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-ochre)]"
        >
          {currentStreak} day{currentStreak === 1 ? "" : "s"}
        </motion.span>
      ) : null}
    </div>
  );
}
