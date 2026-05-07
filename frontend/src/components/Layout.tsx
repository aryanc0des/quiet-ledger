import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "@/store/AppContext";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "journal", icon: "✦" },
  { to: "/calendar", label: "calendar", icon: "◻" },
  { to: "/settings", label: "settings", icon: "◎" },
];

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { state, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-parchment dark:bg-[#1C1C1A] text-ink dark:text-zinc-200 font-sans">
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-10 flex w-52 flex-col border-r border-border dark:border-border-dark bg-white/60 dark:bg-[#1C1C1A]/80 backdrop-blur-md px-6 py-8">
        {/* Wordmark */}
        <div className="mb-10">
          <h1 className="font-serif text-xl text-ink dark:text-zinc-100 leading-tight tracking-tight">
            Quiet<br />
            <span className="italic text-sage-700 dark:text-sage-200">Ledger</span>
          </h1>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                  isActive
                    ? "bg-sage-50 dark:bg-sage-700/20 text-sage-700 dark:text-sage-200 font-medium"
                    : "text-ink-muted dark:text-zinc-500 hover:text-ink dark:hover:text-zinc-300 hover:bg-sage-50/50 dark:hover:bg-white/5",
                ].join(" ")
              }
            >
              <span className="text-xs opacity-60">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User strip */}
        <div className="mt-auto border-t border-border dark:border-border-dark pt-5">
          {state.user?.picture && (
            <img
              src={state.user.picture}
              alt={state.user.name}
              className="h-7 w-7 rounded-full object-cover mb-3 opacity-80"
            />
          )}
          <p className="text-xs text-ink-muted dark:text-zinc-500 truncate mb-1">
            {state.user?.name}
          </p>
          <button
            onClick={handleLogout}
            className="text-xs text-ink-muted dark:text-zinc-500 hover:text-rose-pastel transition-colors underline underline-offset-2"
          >
            sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      {/* max-w-3xl removed so Dashboard can use a two-column layout freely */}
      <main className="ml-52 flex-1 min-h-screen px-10 py-10">
        {children}
      </main>
    </div>
  );
}