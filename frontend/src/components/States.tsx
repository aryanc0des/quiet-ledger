// ── LoadingSpinner ─────────────────────────────────────────────────────────────

export function LoadingSpinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin text-sage-500"
      aria-label="Loading"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="40 20"
      />
    </svg>
  );
}

// ── Full-page loading ──────────────────────────────────────────────────────────

export function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-parchment dark:bg-[#1C1C1A]">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size={28} />
        <p className="font-sans text-sm text-ink-muted dark:text-zinc-500 tracking-wide">
          one moment…
        </p>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
}

export function EmptyState({ title, description, icon = "○" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 animate-fade-in">
      <span className="text-4xl text-ink-muted/40 dark:text-zinc-600 select-none">
        {icon}
      </span>
      <p className="font-serif text-lg text-ink-soft dark:text-zinc-400 italic">
        {title}
      </p>
      {description && (
        <p className="font-sans text-sm text-ink-muted dark:text-zinc-500 text-center max-w-xs">
          {description}
        </p>
      )}
    </div>
  );
}

// ── Error state ────────────────────────────────────────────────────────────────

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 animate-fade-in">
      <p className="font-sans text-sm text-rose-pastel dark:text-rose-400">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink transition-colors"
        >
          try again
        </button>
      )}
    </div>
  );
}
