/**
 * api.ts — Centralised API layer
 *
 * All network calls live here. UI components NEVER call fetch/axios directly.
 * The axios instance automatically attaches the Bearer token from localStorage.
 */
import axios, { AxiosError } from "axios";
import type {
  AuthResponse,
  EntryCreatePayload,
  EntryRaw,
  User,
  UserUpdatePayload,
} from "@/types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Auth token injection ───────────────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("ql_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Error normaliser ───────────────────────────────────────────────────────────
function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  }
  return "Something went wrong";
}

// ── Auth ───────────────────────────────────────────────────────────────────────
export async function signInWithGoogle(credential: string): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post<AuthResponse>("/auth/google", { credential });
    return data;
  } catch (err) {
    throw new Error(extractMessage(err));
  }
}

// ── Entries ────────────────────────────────────────────────────────────────────
export async function fetchEntries(date?: string): Promise<EntryRaw[]> {
  try {
    const params = date ? { date } : {};
    const { data } = await apiClient.get<EntryRaw[]>("/entries", { params });
    return data;
  } catch (err) {
    throw new Error(extractMessage(err));
  }
}

export async function createEntry(payload: EntryCreatePayload): Promise<EntryRaw> {
  try {
    const { data } = await apiClient.post<EntryRaw>("/entries", payload);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err));
  }
}

export async function deleteEntry(entryId: string): Promise<void> {
  try {
    await apiClient.delete(`/entries/${entryId}`);
  } catch (err) {
    throw new Error(extractMessage(err));
  }
}

// ── Users ──────────────────────────────────────────────────────────────────────
export async function fetchMe(): Promise<User> {
  try {
    const { data } = await apiClient.get<User>("/users/me");
    return data;
  } catch (err) {
    throw new Error(extractMessage(err));
  }
}

export async function updateMe(payload: UserUpdatePayload): Promise<User> {
  try {
    const { data } = await apiClient.put<User>("/users/me", payload);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err));
  }
}

export async function deleteAccount(): Promise<void> {
  try {
    await apiClient.delete("/users/me");
  } catch (err) {
    throw new Error(extractMessage(err));
  }
}