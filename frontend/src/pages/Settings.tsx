import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/store/AppContext";
import { LoadingSpinner } from "@/components/States";

export function SettingsPage() {
  const { state, toggleTheme, updateUser, deleteAccount, logout } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState(state.user?.name ?? "");
  const [picture, setPicture] = useState(state.user?.picture ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [themeLoading, setThemeLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleThemeToggle = async () => {
    setThemeLoading(true);
    try { await toggleTheme(); } finally { setThemeLoading(false); }
  };

  const handleProfileSave = async () => {
    if (!name.trim()) return;
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);
    try {
      await updateUser({ name: name.trim(), picture: picture.trim() || undefined });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleExport = () => {
    if (!state.entries.length) return;
    const lines = state.entries.map((e) => {
      const date = new Date(e.created_at).toLocaleString("en-US", {
        weekday: "long", year: "numeric", month: "long",
        day: "numeric", hour: "numeric", minute: "2-digit",
      });
      return `── ${date} ──\n\n${e.content}\n`;
    });
    const blob = new Blob([lines.join("\n\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quietledger-export-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "delete") return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      navigate("/login");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account");
      setDeleting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isDark = state.user?.theme === "dark";

  // Reusable panels so they render in both mobile and desktop layouts
  const DataPanel = (
    <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-[#252523] px-5 py-5 flex flex-col gap-3">
      <p className="font-sans text-xs text-ink-muted dark:text-zinc-400 leading-relaxed">
        Export all your journal entries as a plain text file. Decrypted locally before download.
      </p>
      <button
        onClick={handleExport}
        disabled={!state.entries.length}
        className="w-full rounded-xl border border-border dark:border-border-dark bg-parchment dark:bg-[#1C1C1A] px-4 py-2 font-sans text-sm text-ink dark:text-zinc-200 hover:bg-sage-50 dark:hover:bg-white/5 transition disabled:opacity-40 disabled:cursor-not-allowed text-left"
      >
        ↓ export entries
        {state.entries.length > 0 && (
          <span className="ml-2 font-sans text-xs text-ink-muted dark:text-zinc-500">
            ({state.entries.length})
          </span>
        )}
      </button>
    </div>
  );

  const DangerPanel = (
    <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 px-5 py-5 flex flex-col gap-3">
      <p className="font-sans text-xs text-rose-700/80 dark:text-rose-300/70 leading-relaxed">
        Permanently delete your account and all journal entries. This cannot be undone.
      </p>
      <button
        onClick={() => setShowDeleteModal(true)}
        className="w-full rounded-xl border border-rose-200 dark:border-rose-800/50 bg-white dark:bg-rose-950/30 px-4 py-2 font-sans text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition text-left"
      >
        delete account
      </button>
    </div>
  );

  return (
    <>
      <div className="animate-fade-in flex gap-8 items-start">

        {/* ── Left / main column ────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="mb-10">
            <h2 className="font-serif text-3xl text-ink dark:text-zinc-100 italic">
              Settings
            </h2>
          </div>

          {/* Appearance */}
          <section className="mb-10">
            <h3 className="font-sans text-xs uppercase tracking-widest text-ink-muted dark:text-zinc-500 mb-4">
              Appearance
            </h3>
            <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-[#252523] px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-sm text-ink dark:text-zinc-200">Theme</p>
                  <p className="font-sans text-xs text-ink-muted dark:text-zinc-500 mt-0.5">
                    Currently {isDark ? "dark" : "light"}
                  </p>
                </div>
                <button
                  onClick={handleThemeToggle}
                  disabled={themeLoading}
                  aria-label="Toggle theme"
                  style={{
                    position: "relative", width: 44, height: 24, borderRadius: 12,
                    backgroundColor: isDark ? "#8BA888" : "#E8E4DD", border: "none",
                    cursor: themeLoading ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s", flexShrink: 0,
                    opacity: themeLoading ? 0.6 : 1,
                  }}
                >
                  <span style={{
                    position: "absolute", top: 2, left: 2, width: 20, height: 20,
                    borderRadius: "50%", backgroundColor: "white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "transform 0.2s",
                    transform: isDark ? "translateX(20px)" : "translateX(0px)",
                  }} />
                </button>
              </div>
            </div>
          </section>

          {/* Profile */}
          <section className="mb-10">
            <h3 className="font-sans text-xs uppercase tracking-widest text-ink-muted dark:text-zinc-500 mb-4">
              Profile
            </h3>
            <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-[#252523] px-6 py-5 flex flex-col gap-5">
              {(picture || state.user?.picture) && (
                <div className="flex items-center gap-3">
                  <img
                    src={picture || state.user?.picture} alt="Profile"
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-border dark:ring-border-dark"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <p className="font-sans text-xs text-ink-muted dark:text-zinc-500">profile picture</p>
                </div>
              )}
              <div>
                <label className="block font-sans text-xs text-ink-muted dark:text-zinc-500 mb-1.5">Display name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={100}
                  className="w-full rounded-xl border border-border dark:border-border-dark bg-parchment dark:bg-[#1C1C1A] px-4 py-2.5 font-sans text-sm text-ink dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sage-500 transition" />
              </div>
              <div>
                <label className="block font-sans text-xs text-ink-muted dark:text-zinc-500 mb-1.5">
                  Picture URL <span className="opacity-50">(optional)</span>
                </label>
                <input type="url" value={picture} onChange={(e) => setPicture(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full rounded-xl border border-border dark:border-border-dark bg-parchment dark:bg-[#1C1C1A] px-4 py-2.5 font-sans text-sm text-ink dark:text-zinc-200 placeholder:text-ink-muted/40 focus:outline-none focus:ring-1 focus:ring-sage-500 transition" />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleProfileSave} disabled={profileSaving || !name.trim()}
                  className="flex items-center gap-2 rounded-full bg-sage-500 px-5 py-2 font-sans text-sm text-white transition-all hover:bg-sage-700 disabled:opacity-40 disabled:cursor-not-allowed">
                  {profileSaving && <LoadingSpinner size={14} />}
                  {profileSaving ? "saving…" : "save changes"}
                </button>
                {profileSuccess && <span className="font-sans text-xs text-sage-700 dark:text-sage-300 animate-fade-in">✓ saved</span>}
                {profileError && <span className="font-sans text-xs text-rose-400 animate-fade-in">{profileError}</span>}
              </div>
            </div>
          </section>

          {/* Account */}
          <section className="mb-10">
            <h3 className="font-sans text-xs uppercase tracking-widest text-ink-muted dark:text-zinc-500 mb-4">
              Account
            </h3>
            <div className="rounded-2xl border border-border dark:border-border-dark bg-white dark:bg-[#252523] px-6 py-5 flex flex-col gap-2">
              <Row label="Email" value={state.user?.email ?? "—"} />
              <Row label="Member since" value={state.user ? new Date(state.user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"} />
              {/* Logout — only visible on mobile (sidebar handles it on desktop) */}
              <div className="lg:hidden pt-3 mt-1 border-t border-border dark:border-border-dark">
                <button onClick={handleLogout}
                  className="font-sans text-sm text-ink-muted dark:text-zinc-500 hover:text-rose-pastel transition-colors underline underline-offset-2">
                  sign out
                </button>
              </div>
            </div>
          </section>

          {/* Data + Danger — shown on mobile only (desktop shows in right col) */}
          <div className="lg:hidden flex flex-col gap-6">
            <section>
              <h3 className="font-sans text-xs uppercase tracking-widest text-ink-muted dark:text-zinc-500 mb-4">Data</h3>
              {DataPanel}
            </section>
            <section>
              <h3 className="font-sans text-xs uppercase tracking-widest text-rose-400/70 mb-4">Danger zone</h3>
              {DangerPanel}
            </section>
          </div>
        </div>

        {/* ── Right column — desktop only ───────────────────────────────────── */}
        <div className="hidden lg:flex flex-col gap-6 w-64 shrink-0 mt-[76px]">
          <div>
            <h3 className="font-sans text-xs uppercase tracking-widest text-ink-muted dark:text-zinc-500 mb-4">Data</h3>
            {DataPanel}
          </div>
          <div>
            <h3 className="font-sans text-xs uppercase tracking-widest text-rose-400/70 mb-4">Danger zone</h3>
            {DangerPanel}
          </div>
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
            onClick={() => { if (!deleting) { setShowDeleteModal(false); setDeleteConfirm(""); setDeleteError(null); } }} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-[#252523] shadow-xl px-7 py-7 animate-fade-in">
            <h3 className="font-serif text-lg italic text-ink dark:text-zinc-100 mb-2">Delete account</h3>
            <p className="font-sans text-xs text-ink-muted dark:text-zinc-400 leading-relaxed mb-5">
              This will permanently erase your account and every journal entry. There is no recovery. Type{" "}
              <span className="font-medium text-rose-500">delete</span> to confirm.
            </p>
            <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="delete" disabled={deleting}
              className="w-full rounded-xl border border-rose-200 dark:border-rose-800/50 bg-rose-50/40 dark:bg-rose-950/20 px-4 py-2.5 font-sans text-sm text-ink dark:text-zinc-200 placeholder:text-rose-300 dark:placeholder:text-rose-800 focus:outline-none focus:ring-1 focus:ring-rose-400 transition mb-4" />
            {deleteError && <p className="font-sans text-xs text-rose-500 mb-3 animate-fade-in">{deleteError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); setDeleteError(null); }}
                disabled={deleting}
                className="flex-1 rounded-full border border-border dark:border-border-dark px-4 py-2 font-sans text-sm text-ink-muted dark:text-zinc-400 hover:text-ink transition disabled:opacity-40">
                cancel
              </button>
              <button onClick={handleDeleteAccount} disabled={deleteConfirm !== "delete" || deleting}
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-rose-500 px-4 py-2 font-sans text-sm text-white hover:bg-rose-600 transition disabled:opacity-40 disabled:cursor-not-allowed">
                {deleting && <LoadingSpinner size={13} />}
                {deleting ? "deleting…" : "confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="font-sans text-xs text-ink-muted dark:text-zinc-500">{label}</span>
      <span className="font-sans text-sm text-ink dark:text-zinc-300">{value}</span>
    </div>
  );
}