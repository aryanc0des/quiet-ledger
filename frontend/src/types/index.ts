// ── Domain types ───────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  theme: "light" | "dark";
  created_at: string;
}

/** What the backend stores / returns — content is still ciphertext here */
export interface EntryRaw {
  id: string;
  encrypted_content: string;
  iv: string;
  created_at: string;
}

/** After client-side decryption — what the UI actually renders */
export interface Entry {
  id: string;
  content: string;          // plaintext, decrypted on client
  created_at: string;
}

// ── API payloads ───────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface EntryCreatePayload {
  encrypted_content: string;
  iv: string;
}

export interface UserUpdatePayload {
  name?: string;
  picture?: string;
  theme?: "light" | "dark";
}

// ── State ──────────────────────────────────────────────────────────────────────

export type AsyncStatus = "idle" | "loading" | "success" | "error";
