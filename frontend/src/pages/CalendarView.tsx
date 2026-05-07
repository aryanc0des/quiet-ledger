import { useState } from "react";
import { useApp } from "@/store/AppContext";
import { Calendar } from "@/components/Calendar";
import { EntryCard } from "@/components/EntryCard";
import { EmptyState, LoadingSpinner } from "@/components/States";

function formatSelectedDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function CalendarPage() {
  const { state, datesWithEntries, entriesForDate } = useApp();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const dayEntries = selectedDate ? entriesForDate(selectedDate) : [];

  return (
    <div className="animate-fade-in">
      {/* Title */}
      <div className="mb-8">
        <h2 className="font-serif text-3xl text-ink dark:text-zinc-100 italic">
          History
        </h2>
        <p className="font-sans text-sm text-ink-muted dark:text-zinc-500 mt-1">
          {state.entries.length} {state.entries.length === 1 ? "entry" : "entries"} total
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Calendar widget */}
        {!state.entriesLoaded ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size={22} />
          </div>
        ) : (
          <Calendar
            datesWithEntries={datesWithEntries}
            selectedDate={selectedDate}
            onSelectDate={(d) =>
              setSelectedDate((prev) => (prev === d ? null : d))
            }
          />
        )}

        {/* Selected-day entries */}
        {selectedDate && (
          <section className="animate-slide-up">
            <h3 className="font-sans text-xs uppercase tracking-widest text-ink-muted dark:text-zinc-500 mb-4">
              {formatSelectedDate(selectedDate)}
            </h3>

            {dayEntries.length === 0 ? (
              <EmptyState
                title="No entries on this day"
                icon="◻"
              />
            ) : (
              <div className="flex flex-col gap-4">
                {dayEntries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* No date selected: show hint */}
        {!selectedDate && state.entriesLoaded && (
          <p className="font-sans text-sm text-ink-muted dark:text-zinc-500 text-center py-4">
            Select a highlighted date to read your entries
          </p>
        )}
      </div>
    </div>
  );
}
