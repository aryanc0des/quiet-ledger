# QuietLedger

> A private, minimal digital journaling app. Your words stay yours.

**Live links**
- Frontend: `https://quietledger.vercel.app` ← replace after deploy
- Backend: `https://quietledger-api.onrender.com` ← replace after deploy

---

## Architecture Overview

```
quietledger/
├── backend/              # FastAPI + MongoDB
│   ├── app/
│   │   ├── main.py       # App entrypoint, CORS, lifespan
│   │   ├── config.py     # Pydantic Settings (env vars)
│   │   ├── database.py   # Async Motor connection
│   │   ├── models/       # Pydantic request/response models
│   │   │   ├── user.py
│   │   │   └── entry.py
│   │   ├── auth/
│   │   │   ├── google_auth.py    # Verify Google ID token
│   │   │   ├── jwt_handler.py    # Sign / verify JWT
│   │   │   └── dependencies.py  # FastAPI Depends(get_current_user)
│   │   └── routes/
│   │       ├── auth.py    # POST /auth/google
│   │       ├── entries.py # GET/POST/DELETE /entries
│   │       └── users.py   # GET/PUT /users/me
│   └── requirements.txt
│
└── frontend/             # React + TypeScript
    └── src/
        ├── types/         # Shared TypeScript interfaces
        ├── lib/
        │   ├── crypto.ts  # AES-256-GCM encrypt / decrypt
        │   └── api.ts     # All Axios calls — one place
        ├── store/
        │   └── AppContext.tsx  # useReducer global state
        ├── components/
        │   ├── Layout.tsx     # Sidebar shell
        │   ├── EntryCard.tsx  # Individual entry display
        │   ├── Calendar.tsx   # Custom calendar (no library)
        │   └── States.tsx     # Loading / Empty / Error
        └── pages/
            ├── Login.tsx
            ├── Dashboard.tsx
            ├── CalendarView.tsx
            └── Settings.tsx
```

---

## Encryption Flow

### Why it matters

The backend stores journal entries in MongoDB. If the server were compromised,
those entries would be exposed. QuietLedger prevents this by encrypting every
entry on the client *before* it travels over the network.

**The server never receives plaintext. It cannot decrypt entries.**

### Algorithm

**AES-256-GCM** via the browser-native `window.crypto.subtle` API.

- 256-bit key (32 bytes of CSPRNG randomness)
- 12-byte IV generated fresh for every entry (GCM recommendation)
- Authentication tag is included in the ciphertext automatically by the Web
  Crypto API — this detects any tampering.

### Key lifecycle

```
First login
    │
    ▼
getOrCreateKey(userId)
    │
    ├─ Key exists in localStorage?
    │       └─ Yes → import key bytes from "ql_enc_key_<userId>"
    │
    └─ No → generateKey() → store base64url-encoded raw bytes
                             in localStorage["ql_enc_key_<userId>"]
```

The key is stored as a base64url string in `localStorage`, which is
**origin-scoped** (never sent to any server by the browser).

### Encrypt (write path)

```
User types entry
    │
    ▼
encryptText(plaintext, key)
    │   1. Generate random 12-byte IV
    │   2. crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded)
    │   3. Base64url-encode ciphertext + IV
    ▼
POST /entries { encrypted_content, iv }   ← backend sees only opaque strings
```

### Decrypt (read path)

```
GET /entries  ← server returns { encrypted_content, iv, created_at, id }
    │
    ▼
decryptAll(raws, key)
    │   for each raw entry:
    │     1. Base64url-decode IV + ciphertext
    │     2. crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherBytes)
    │     3. TextDecoder → plaintext string
    ▼
Entry[] displayed in UI  ← plaintext never left the browser
```

### Trade-offs & known limitations

| Trade-off | Reason |
|-----------|--------|
| Key lives in localStorage | Simple for MVP; a production system would add PBKDF2 key-wrapping with a master password or a hardware-backed store |
| Clearing localStorage loses old entries | Acceptable for MVP scope; key export/backup UX is a future feature |
| No key rotation | Out of scope; would require re-encrypting all entries |
| Single key per user | Simpler than per-entry keys; acceptable given GCM's fresh-IV-per-message guarantee |

---

## State Management

Global state lives in a single `AppContext` using **`useReducer`** — no
external library.

```
AppState
├── user            – authenticated User (or null)
├── encKey          – CryptoKey (or null)
├── entries         – Entry[] — fetched once, kept in memory
├── entriesLoaded   – boolean, prevents double-fetching
├── entriesError    – string | null
└── authLoading     – true while session restore is in progress
```

### Why no redundant refetch?

Entries are loaded once after login (triggered by the `useEffect` that watches
`user` + `encKey`). After that:

- **New entry** → prepended to `state.entries` client-side (no GET needed)
- **Delete** → filtered from `state.entries` client-side
- **Calendar** → `entriesForDate(dateStr)` filters the in-memory array
- **Switching pages** → React Router keeps the component tree mounted,
  context survives

### Derived state

`datesWithEntries` (a `Set<string>`) and `entriesForDate` are computed with
`useMemo` / `useCallback` from `state.entries` — the calendar highlights
correct days without any extra network call.

---

## Backend API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/google` | Exchange Google ID token → JWT |
| `GET` | `/entries` | List all entries (auth required) |
| `GET` | `/entries?date=YYYY-MM-DD` | Filter by date |
| `POST` | `/entries` | Create encrypted entry |
| `DELETE` | `/entries/{entry_id}` | Delete by ObjectId |
| `GET` | `/users/me` | Get own profile |
| `PUT` | `/users/me` | Update name / picture / theme |

All protected routes require `Authorization: Bearer <jwt>`.

Validation highlights:
- `entry_id` path param → `ObjectId.is_valid()` checked before DB hit (422 if invalid)
- `date` query param → typed as `datetime.date` by FastAPI/Pydantic
- `iv` field → regex length constraint (12-byte IV = 16 base64 chars)
- `theme` field → `pattern="^(light|dark)$"` enum guard
- Body fields → `min_length`, `max_length` on all string fields

---

## Local Setup

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in values
python -m uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # fill in values
npm run dev
```

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create an OAuth 2.0 Client ID (Web application)
3. Add `http://localhost:5173` and your Vercel domain to Authorised origins
4. Copy the Client ID into both `.env` files

---

## Deployment

### Backend → Render

1. Push `backend/` to a repo
2. Create a **Web Service** on Render, root dir = `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Set env vars from `.env.example`

### Frontend → Vercel

1. Push `frontend/` (or monorepo) to GitHub
2. Import to Vercel, framework preset = Vite
3. Set `VITE_API_BASE_URL` and `VITE_GOOGLE_CLIENT_ID`
4. Deploy
