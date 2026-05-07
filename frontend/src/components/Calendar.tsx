import { useState } from "react";

interface CalendarProps {
  datesWithEntries: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toLocaleDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function Calendar({ datesWithEntries, selectedDate, onSelectDate }: CalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayStr = toLocaleDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  // First day of the month and total days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build calendar grid (6 rows × 7 cols)
  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-[#252523] p-6 w-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={prevMonth}
          aria-label="Previous month"
          className="w-7 h-7 flex items-center justify-center rounded-full text-ink-muted dark:text-zinc-500 hover:bg-sage-50 dark:hover:bg-white/5 transition-colors text-sm"
        >
          ‹
        </button>

        <span className="font-serif text-base text-ink dark:text-zinc-200 italic">
          {MONTHS[viewMonth]} {viewYear}
        </span>

        <button
          onClick={nextMonth}
          aria-label="Next month"
          className="w-7 h-7 flex items-center justify-center rounded-full text-ink-muted dark:text-zinc-500 hover:bg-sage-50 dark:hover:bg-white/5 transition-colors text-sm"
        >
          ›
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] text-ink-muted dark:text-zinc-500 tracking-widest uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;

          const dateStr = toLocaleDateStr(viewYear, viewMonth, day);
          const hasEntries = datesWithEntries.has(dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={[
                "relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all duration-150",
                isSelected
                  ? "bg-sage-500 text-white"
                  : isToday
                  ? "ring-1 ring-sage-500 text-sage-700 dark:text-sage-200"
                  : "text-ink dark:text-zinc-300 hover:bg-sage-50 dark:hover:bg-white/5",
              ].join(" ")}
            >
              {day}
              {/* Dot indicator for days with entries */}
              {hasEntries && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-dust-500 dark:bg-dust-200" />
              )}
              {hasEntries && isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-white/60" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
