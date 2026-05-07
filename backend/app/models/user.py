from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


# ── Stored in MongoDB ──────────────────────────────────────────────────────────

class UserInDB(BaseModel):
    id: str
    google_id: str
    email: str
    name: str
    picture: Optional[str] = None
    theme: str = "light"
    created_at: datetime

    class Config:
        populate_by_name = True


# ── API Response ───────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    theme: str = "light"
    created_at: datetime


# ── Request bodies ─────────────────────────────────────────────────────────────

class UserUpdate(BaseModel):
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="Display name (1–100 characters)",
    )
    picture: Optional[str] = Field(
        None,
        max_length=2048,
        description="Profile picture URL",
    )
    theme: Optional[str] = Field(
        None,
        pattern="^(light|dark)$",
        description="UI theme: 'light' or 'dark'",
    )
