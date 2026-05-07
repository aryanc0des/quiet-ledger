import { useState, useRef, useEffect } from "react";
import { useApp } from "@/store/AppContext";
import { EntryCard } from "@/components/EntryCard";
import { EmptyState, ErrorState, LoadingSpinner } from "@/components/States";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Entry {
  id: string;
  content: string;
  created_at: string;
}

// ── Quotes ────────────────────────────────────────────────────────────────────
const QUOTES: { text: string; author: string }[] = [
  { text: "Fill your paper with the breathings of your heart.", author: "William Wordsworth" },
  { text: "Journal writing is a voyage to the interior.", author: "Christina Baldwin" },
  { text: "In the journal I do not just express myself more openly than I could to any person; I create myself.", author: "Susan Sontag" },
  { text: "The life of every man is a diary in which he means to write one story and writes another.", author: "J.M. Barrie" },
  { text: "A good journal entry leaves you with a clearer head.", author: "Michael Connelly" },
  { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou" },
  { text: "Write what disturbs you, what you fear, what you have not been willing to speak about.", author: "Natalie Goldberg" },
  { text: "Almost all good writing begins with terrible first efforts.", author: "Anne Lamott" },
  { text: "I write to discover what I know.", author: "Flannery O'Connor" },
  { text: "Writing is the painting of the voice.", author: "Voltaire" },
  { text: "The act of writing is the act of discovering what you believe.", author: "David Hare" },
  { text: "Writing in a journal reminds you of your goals and of your learning in life.", author: "Robin Sharma" },
  { text: "Be faithful to that which exists within yourself.", author: "André Gide" },
  { text: "Wherever you are, be all there.", author: "Jim Elliot" },
  { text: "Know thyself.", author: "Socrates" },
  { text: "The unexamined life is not worth living.", author: "Socrates" },
  { text: "We do not learn from experience. We learn from reflecting on experience.", author: "John Dewey" },
  { text: "Without reflection, we go blindly on our way.", author: "Margaret Wheatley" },
  { text: "What we achieve inwardly will change outer reality.", author: "Plutarch" },
  { text: "Quiet the mind and the soul will speak.", author: "Ma Jaya Sati Bhagavati" },
  { text: "In silence there is eloquence.", author: "Rumi" },
  { text: "Almost everything will work again if you unplug it for a few minutes — including you.", author: "Anne Lamott" },
  { text: "Slow down and everything you are chasing will come around and catch you.", author: "John De Paola" },
  { text: "Within you there is a stillness and a sanctuary to which you can retreat at any time.", author: "Hermann Hesse" },
  { text: "Solitude is where I place my chaos to rest and awaken my inner peace.", author: "Nikki Rowe" },
  { text: "The quieter you become, the more you can hear.", author: "Ram Dass" },
  { text: "He who knows others is wise. He who knows himself is enlightened.", author: "Lao Tzu" },
  { text: "Your vision will become clear only when you can look into your own heart.", author: "Carl Jung" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "To write is to think. To think is to see.", author: "Gustave Flaubert" },
  { text: "Writing organizes and clarifies our thoughts.", author: "Joan Didion" },
  { text: "Feelings are just visitors. Let them come and go.", author: "Mooji" },
  { text: "You can't calm the storm, so stop trying. What you can do is calm yourself.", author: "Timber Hawkeye" },
  { text: "Breath is the bridge which connects life to consciousness.", author: "Thich Nhat Hanh" },
  { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
  { text: "Gratitude turns what we have into enough.", author: "Anonymous" },
  { text: "Be kind to yourself. You are a child of the universe.", author: "Max Ehrmann" },
  { text: "Growth begins where comfort ends.", author: "Anonymous" },
  { text: "What you resist, persists. What you accept, transforms.", author: "Carl Jung" },
  { text: "You are allowed to be both a masterpiece and a work in progress.", author: "Sophia Bush" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha" },
  { text: "It always seems impossible until it is done.", author: "Nelson Mandela" },
  { text: "One day or day one. You decide.", author: "Anonymous" },
  { text: "Small steps every day.", author: "Anonymous" },
  { text: "Rest is not idleness.", author: "John Lubbock" },
  { text: "We are what we repeatedly do.", author: "Aristotle" },
  { text: "This above all: to thine own self be true.", author: "Shakespeare" },
  { text: "The present moment always will have been.", author: "Anonymous" },
  { text: "Wherever you are is called Here.", author: "David Wagoner" },
  { text: "A moment of patience in a moment of anger saves a thousand moments of regret.", author: "Anonymous" },
];

/** Returns the same quote for the entire calendar day. */
function getDailyQuote(): { text: string; author: string } {
  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  return QUOTES[seed % QUOTES.length];
}

const MAX_CHARS = 1000;

// ── Component ─────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { state, addEntry } = useApp();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dailyQuote = getDailyQuote();

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [draft]);

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedEntry(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await addEntry(trimmed);
      setDraft("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  const charsLeft = MAX_CHARS - draft.length;

  return (
    <>
      <div className="animate-fade-in">

        {/* Page title */}
        <div className="mb-8">
          <h2 className="font-serif text-3xl text-ink dark:text-zinc-100 italic">
            {greeting()}
          </h2>
          <p className="font-sans text-sm text-ink-muted dark:text-zinc-500 mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* ── Row 1: compose + quote (same height via items-stretch) ─────────── */}
        <div className="flex gap-6 items-stretch mb-8">

          {/* Compose box */}
          <div className="flex-1 rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-[#252523] shadow-sm flex flex-col">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) setDraft(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind today?"
              rows={4}
              className="flex-1 w-full resize-none bg-transparent px-6 pt-5 pb-2 font-sans text-[15px] leading-relaxed text-ink dark:text-zinc-200 placeholder:text-ink-muted/50 dark:placeholder:text-zinc-600 focus:outline-none"
              aria-label="Write a journal entry"
            />

            <div className="flex items-center justify-between px-6 pb-4">
              <span
                className={`font-sans text-xs tabular-nums ${
                  charsLeft < 50
                    ? "text-rose-pastel"
                    : "text-ink-muted dark:text-zinc-500"
                }`}
              >
                {charsLeft}
              </span>

              <div className="flex items-center gap-3">
                {saveError && (
                  <span className="text-xs text-rose-pastel animate-fade-in">
                    {saveError}
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={!draft.trim() || saving}
                  className="flex items-center gap-2 rounded-full bg-sage-500 px-5 py-2 font-sans text-sm text-white transition-all hover:bg-sage-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? <LoadingSpinner size={14} /> : null}
                  {saving ? "saving…" : "save entry"}
                </button>
              </div>
            </div>

            <p className="px-6 pb-3 font-sans text-[10px] text-ink-muted/50 dark:text-zinc-600">
              ⌘ + Enter to save · encrypted before leaving your device
            </p>
          </div>

          {/* Quote box — stretches to match compose box height */}
          <div className="hidden lg:flex w-64 shrink-0 rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-[#252523] shadow-sm flex-col justify-between px-6 py-6">
            <p className="font-sans text-[10px] uppercase tracking-widest text-ink-muted dark:text-zinc-500">
              today's quote
            </p>
            <blockquote className="font-serif text-[15px] leading-relaxed text-ink dark:text-zinc-200 italic my-4">
              "{dailyQuote.text}"
            </blockquote>
            <p className="font-sans text-xs text-ink-muted dark:text-zinc-500">
              — {dailyQuote.author}
            </p>
          </div>
        </div>

        {/* ── Row 2: past entries — spans full width of both columns ─────────── */}
        <section>
          <h3 className="font-sans text-xs uppercase tracking-widest text-ink-muted dark:text-zinc-500 mb-4">
            past entries
          </h3>

          {!state.entriesLoaded ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size={22} />
            </div>
          ) : state.entriesError ? (
            <ErrorState message={state.entriesError} />
          ) : state.entries.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              description="Write your first entry above. It will never leave your device unencrypted."
              icon="✦"
            />
          ) : (
            <div className="flex flex-col gap-4">
              {state.entries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry as Entry)}
                  className="text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 rounded-2xl"
                  aria-label="Open entry"
                >
                  <EntryCard entry={entry} />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Entry modal ───────────────────────────────────────────────────────── */}
      {selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Journal entry"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedEntry(null)}
          />

          {/* Modal card */}
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-[#252523] shadow-xl px-8 py-7 animate-fade-in">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="font-serif text-sm italic text-ink dark:text-zinc-300">
                  {new Date(selectedEntry.created_at).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="font-sans text-xs text-ink-muted dark:text-zinc-500 mt-0.5">
                  {new Date(selectedEntry.created_at).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <button
                onClick={() => setSelectedEntry(null)}
                className="text-ink-muted dark:text-zinc-500 hover:text-ink dark:hover:text-zinc-200 transition-colors text-lg leading-none ml-4 mt-0.5"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="font-sans text-[15px] leading-relaxed text-ink dark:text-zinc-200 whitespace-pre-wrap">
              {selectedEntry.content}
            </p>

            <p className="mt-6 font-sans text-[10px] text-ink-muted/50 dark:text-zinc-600">
              Press Esc to close
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "late night";
  if (h < 12) return "good morning";
  if (h < 17) return "good afternoon";
  if (h < 21) return "good evening";
  return "good night";
}