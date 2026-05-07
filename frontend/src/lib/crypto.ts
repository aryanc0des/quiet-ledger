/**
 * crypto.ts — Client-side AES-256-GCM encryption layer
 *
 * HOW IT WORKS
 * ────────────
 * 1. On first login, we generate a random 256-bit AES-GCM key using the
 *    browser's native `crypto.subtle` (CSPRNG — cryptographically secure).
 * 2. The raw key bytes are exported and stored in localStorage under the key
 *    `ql_enc_key_<userId>`. localStorage is scoped to the origin and never
 *    sent to the server.
 * 3. When creating an entry we:
 *    a. Generate a fresh 12-byte IV (randomly) for every message.
 *    b. Encrypt the plaintext with AES-GCM using that key + IV.
 *    c. Base64url-encode both the ciphertext and the IV.
 *    d. Send only the encoded ciphertext + IV to the backend.
 * 4. On retrieval, we decode the IV + ciphertext and decrypt locally.
 *
 * TRADE-OFFS
 * ──────────
 * • The server sees only opaque base64 strings — it cannot read your journal.
 * • If the user clears localStorage (or switches browsers), the key is lost
 *   and old entries become unreadable. A production system would add a
 *   key-backup step (e.g. password-derived key wrapping), but that is out of
 *   scope for this MVP.
 */

const STORAGE_PREFIX = "ql_enc_key_";
const ALGO = { name: "AES-GCM", length: 256 } as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function toBase64Url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  return new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
}

// ── Key management ─────────────────────────────────────────────────────────────

async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(ALGO, true, ["encrypt", "decrypt"]);
}

async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return toBase64Url(raw);
}

async function importKey(encoded: string): Promise<CryptoKey> {
  const raw = fromBase64Url(encoded);
  return crypto.subtle.importKey("raw", raw, ALGO, true, ["encrypt", "decrypt"]);
}

/**
 * Retrieve or create the encryption key for a given user.
 * The key is stored as a raw base64url string in localStorage.
 */
export async function getOrCreateKey(userId: string): Promise<CryptoKey> {
  const storageKey = `${STORAGE_PREFIX}${userId}`;
  const stored = localStorage.getItem(storageKey);

  if (stored) {
    return importKey(stored);
  }

  const key = await generateKey();
  const exported = await exportKey(key);
  localStorage.setItem(storageKey, exported);
  return key;
}

// ── Encrypt / Decrypt ──────────────────────────────────────────────────────────

export interface EncryptedPayload {
  encrypted_content: string; // Base64url AES-GCM ciphertext
  iv: string;                // Base64url 12-byte IV
}

export async function encryptText(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  return {
    encrypted_content: toBase64Url(cipherBuffer),
    iv: toBase64Url(iv.buffer),
  };
}

export async function decryptText(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<string> {
  const iv = fromBase64Url(payload.iv);
  const cipherBytes = fromBase64Url(payload.encrypted_content);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipherBytes
  );

  return new TextDecoder().decode(plainBuffer);
}
