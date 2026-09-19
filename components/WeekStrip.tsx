"use client";

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
        {days.map((d) => {
          const dow = new Date(d.date + "T00:00:00").getDay();
          return (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-[var(--color-ink-faint)]">{DAY_LETTERS[dow]}</span>
              <span
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
        <span className="rounded-full bg-[var(--color-ochre-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-ochre)]">
          {currentStreak} day{currentStreak === 1 ? "" : "s"}
        </span>
      ) : null}
    </div>
  );
}
