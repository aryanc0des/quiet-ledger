/**
 * AppContext.tsx — Single source of truth for global state
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import type { Entry, EntryRaw, User } from "@/types";
import {
  createEntry as apiCreateEntry,
  deleteEntry as apiDeleteEntry,
  deleteAccount as apiDeleteAccount,
  fetchEntries,
  fetchMe,
  signInWithGoogle,
  updateMe,
} from "@/lib/api";
import { decryptText, encryptText, getOrCreateKey } from "@/lib/crypto";

// ── State shape ────────────────────────────────────────────────────────────────

interface AppState {
  user: User | null;
  encKey: CryptoKey | null;
  entries: Entry[];
  entriesLoaded: boolean;
  entriesError: string | null;
  authLoading: boolean;
}

const initialState: AppState = {
  user: null,
  encKey: null,
  entries: [],
  entriesLoaded: false,
  entriesError: null,
  authLoading: true,
};

// ── Actions ────────────────────────────────────────────────────────────────────

type Action =
  | { type: "AUTH_RESOLVED"; user: User; encKey: CryptoKey }
  | { type: "AUTH_CLEARED" }
  | { type: "ENTRIES_LOADED"; entries: Entry[] }
  | { type: "ENTRIES_ERROR"; error: string }
  | { type: "ENTRY_ADDED"; entry: Entry }
  | { type: "ENTRY_REMOVED"; entryId: string }
  | { type: "USER_UPDATED"; user: User }
  | { type: "THEME_TOGGLED" };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "AUTH_RESOLVED":
      return { ...state, user: action.user, encKey: action.encKey, authLoading: false };
    case "AUTH_CLEARED":
      return { ...initialState, authLoading: false };
    case "ENTRIES_LOADED":
      return { ...state, entries: action.entries, entriesLoaded: true, entriesError: null };
    case "ENTRIES_ERROR":
      return { ...state, entriesError: action.error, entriesLoaded: true };
    case "ENTRY_ADDED":
      return { ...state, entries: [action.entry, ...state.entries] };
    case "ENTRY_REMOVED":
      return { ...state, entries: state.entries.filter((e) => e.id !== action.entryId) };
    case "USER_UPDATED":
      return { ...state, user: action.user };
    case "THEME_TOGGLED": {
      if (!state.user) return state;
      const next = state.user.theme === "light" ? "dark" : "light";
      return { ...state, user: { ...state.user, theme: next } };
    }
    default:
      return state;
  }
}

// ── Context value ──────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  login: (credential: string) => Promise<void>;
  logout: () => void;
  loadEntries: () => Promise<void>;
  addEntry: (content: string) => Promise<void>;
  removeEntry: (entryId: string) => Promise<void>;
  updateUser: (payload: { name?: string; picture?: string }) => Promise<void>;
  toggleTheme: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  entriesForDate: (dateStr: string) => Entry[];
  datesWithEntries: Set<string>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ── Helper ─────────────────────────────────────────────────────────────────────

async function decryptAll(raws: EntryRaw[], key: CryptoKey): Promise<Entry[]> {
  return Promise.all(
    raws.map(async (raw) => {
      try {
        const content = await decryptText(
          { encrypted_content: raw.encrypted_content, iv: raw.iv },
          key
        );
        return { id: raw.id, content, created_at: raw.created_at };
      } catch {
        return { id: raw.id, content: "[decryption failed]", created_at: raw.created_at };
      }
    })
  );
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const theme = state.user?.theme ?? "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [state.user?.theme]);

  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem("ql_token");
      const userId = localStorage.getItem("ql_user_id");
      if (!token || !userId) {
        dispatch({ type: "AUTH_CLEARED" });
        return;
      }
      try {
        const user = await fetchMe();
        const encKey = await getOrCreateKey(user.id);
        dispatch({ type: "AUTH_RESOLVED", user, encKey });
      } catch {
        localStorage.removeItem("ql_token");
        localStorage.removeItem("ql_user_id");
        dispatch({ type: "AUTH_CLEARED" });
      }
    };
    restore();
  }, []);

  useEffect(() => {
    if (state.user && state.encKey && !state.entriesLoaded) {
      loadEntries();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user, state.encKey]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const login = useCallback(async (credential: string) => {
    const { access_token, user } = await signInWithGoogle(credential);
    localStorage.setItem("ql_token", access_token);
    localStorage.setItem("ql_user_id", user.id);
    const encKey = await getOrCreateKey(user.id);
    dispatch({ type: "AUTH_RESOLVED", user, encKey });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ql_token");
    localStorage.removeItem("ql_user_id");
    dispatch({ type: "AUTH_CLEARED" });
  }, []);

  const loadEntries = useCallback(async () => {
    if (!state.encKey) return;
    try {
      const raws = await fetchEntries();
      const entries = await decryptAll(raws, state.encKey);
      dispatch({ type: "ENTRIES_LOADED", entries });
    } catch (err) {
      dispatch({
        type: "ENTRIES_ERROR",
        error: err instanceof Error ? err.message : "Failed to load entries",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.encKey]);

  const addEntry = useCallback(
    async (content: string) => {
      if (!state.encKey) throw new Error("No encryption key");
      const payload = await encryptText(content, state.encKey);
      const raw = await apiCreateEntry(payload);
      const entry: Entry = { id: raw.id, content, created_at: raw.created_at };
      dispatch({ type: "ENTRY_ADDED", entry });
    },
    [state.encKey]
  );

  const removeEntry = useCallback(async (entryId: string) => {
    await apiDeleteEntry(entryId);
    dispatch({ type: "ENTRY_REMOVED", entryId });
  }, []);

  const updateUser = useCallback(
    async (payload: { name?: string; picture?: string }) => {
      const updated = await updateMe(payload);
      dispatch({ type: "USER_UPDATED", user: updated });
    },
    []
  );

  const toggleTheme = useCallback(async () => {
    if (!state.user) return;
    const nextTheme = state.user.theme === "light" ? "dark" : "light";
    dispatch({ type: "THEME_TOGGLED" });
    await updateMe({ theme: nextTheme });
  }, [state.user]);

  const deleteAccount = useCallback(async () => {
    await apiDeleteAccount();
    // Wipe local storage and clear all state — same as logout
    localStorage.removeItem("ql_token");
    localStorage.removeItem("ql_user_id");
    dispatch({ type: "AUTH_CLEARED" });
  }, []);

  // ── Derived selectors ──────────────────────────────────────────────────────

  const datesWithEntries = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    state.entries.forEach((e) => s.add(e.created_at.slice(0, 10)));
    return s;
  }, [state.entries]);

  const entriesForDate = useCallback(
    (dateStr: string): Entry[] =>
      state.entries.filter((e) => e.created_at.slice(0, 10) === dateStr),
    [state.entries]
  );

  const value: AppContextValue = {
    state,
    login,
    logout,
    loadEntries,
    addEntry,
    removeEntry,
    updateUser,
    toggleTheme,
    deleteAccount,
    entriesForDate,
    datesWithEntries,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}