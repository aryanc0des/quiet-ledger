from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import connect_db, close_db
from app.routes import auth, entries, users

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="QuietLedger API",
    description="Private journaling backend. Encrypted content is stored as-is — the server cannot read it.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(entries.router)
app.include_router(users.router)


@app.get("/", tags=["health"], summary="Health check")
async def root():
    return {"status": "ok", "service": "QuietLedger API"}
