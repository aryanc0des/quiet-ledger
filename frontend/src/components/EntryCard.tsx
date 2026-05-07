import { useState } from "react";
import type { Entry } from "@/types";
import { useApp } from "@/store/AppContext";
import { LoadingSpinner } from "./States";

interface EntryCardProps {
  entry: Entry;
}

function toUTC(iso: string): Date {
  return new Date(iso.endsWith("Z") ? iso : iso + "Z");
}

function formatDate(iso: string): string {
  return toUTC(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function formatTime(iso: string): string {
  return toUTC(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });
}

export function EntryCard({ entry }: EntryCardProps) {
  const { removeEntry } = useApp();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await removeEntry(entry.id);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(false);
  };

  return (
    <article className="group relative animate-slide-up rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-[#252523] px-5 py-4 md:px-6 md:py-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-serif text-sm text-ink-soft dark:text-zinc-400 italic">
            {formatDate(entry.created_at)}
          </p>
          <p className="font-sans text-xs text-ink-muted dark:text-zinc-500 mt-0.5">
            {formatTime(entry.created_at)}
          </p>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={[
              "flex items-center gap-1.5 text-xs rounded-full px-3 py-1 transition-all",
              confirmDelete
                ? "bg-rose-light dark:bg-rose-900/30 text-rose-pastel"
                : "text-ink-muted hover:text-rose-pastel dark:text-zinc-500",
            ].join(" ")}
          >
            {deleting ? <LoadingSpinner size={12} /> : confirmDelete ? "sure?" : "delete"}
          </button>
          {confirmDelete && !deleting && (
            <button
              onClick={handleCancel}
              className="text-xs text-ink-muted dark:text-zinc-500 hover:text-ink transition-colors"
            >
              cancel
            </button>
          )}
        </div>
      </div>

      <p className="font-sans text-[15px] leading-relaxed text-ink dark:text-zinc-200 whitespace-pre-wrap">
        {entry.content}
      </p>
    </article>
  );
}