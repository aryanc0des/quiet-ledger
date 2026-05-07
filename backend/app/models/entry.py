from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Stored in MongoDB ──────────────────────────────────────────────────────────
# The backend NEVER touches plaintext. It stores the AES-GCM ciphertext
# and the IV (initialisation vector) returned by the client.

class EntryInDB(BaseModel):
    id: str
    user_id: str
    encrypted_content: str   # Base64url-encoded AES-GCM ciphertext
    iv: str                  # Base64url-encoded 12-byte IV
    created_at: datetime


# ── API Response ───────────────────────────────────────────────────────────────

class EntryResponse(BaseModel):
    id: str
    encrypted_content: str
    iv: str
    created_at: datetime


# ── Request bodies ─────────────────────────────────────────────────────────────

class EntryCreate(BaseModel):
    encrypted_content: str = Field(
        ...,
        min_length=1,
        max_length=50_000,
        description="Base64url AES-GCM ciphertext of the journal entry",
    )
    iv: str = Field(
        ...,
        min_length=16,
        max_length=24,
        description="Base64url-encoded 12-byte AES-GCM IV (exactly 16 base64 chars)",
    )
