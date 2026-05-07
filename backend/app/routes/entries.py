from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from datetime import datetime, timezone, date
from typing import Optional
from bson import ObjectId
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.entry import EntryCreate, EntryResponse

router = APIRouter(prefix="/entries", tags=["entries"])


def _serialize_entry(doc: dict) -> EntryResponse:
    return EntryResponse(
        id=str(doc["_id"]),
        encrypted_content=doc["encrypted_content"],
        iv=doc["iv"],
        created_at=doc["created_at"],
    )


# ── List entries ───────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=list[EntryResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all entries (optionally filtered by date)",
)
async def list_entries(
    entry_date: Optional[date] = Query(
        None,
        alias="date",
        description="Filter entries for a specific day (YYYY-MM-DD)",
    ),
    limit: int = Query(100, ge=1, le=500, description="Max entries to return"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    current_user: dict = Depends(get_current_user),
) -> list[EntryResponse]:
    """
    Returns entries in reverse-chronological order.
    Optionally filter by a specific calendar date using ?date=YYYY-MM-DD.
    """
    db = get_db()
    query: dict = {"user_id": current_user["id"]}

    if entry_date:
        # Build an inclusive UTC day range for the given local date
        day_start = datetime(entry_date.year, entry_date.month, entry_date.day, 0, 0, 0, tzinfo=timezone.utc)
        day_end = datetime(entry_date.year, entry_date.month, entry_date.day, 23, 59, 59, 999999, tzinfo=timezone.utc)
        query["created_at"] = {"$gte": day_start, "$lte": day_end}

    cursor = (
        db["entries"]
        .find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    return [_serialize_entry(d) for d in docs]


# ── Create entry ───────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=EntryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new encrypted journal entry",
)
async def create_entry(
    body: EntryCreate,
    current_user: dict = Depends(get_current_user),
) -> EntryResponse:
    db = get_db()
    doc = {
        "user_id": current_user["id"],
        "encrypted_content": body.encrypted_content,
        "iv": body.iv,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db["entries"].insert_one(doc)
    created = await db["entries"].find_one({"_id": result.inserted_id})
    if created is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve entry after creation",
        )
    return _serialize_entry(created)


# ── Delete entry ───────────────────────────────────────────────────────────────

@router.delete(
    "/{entry_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an entry by ID",
)
async def delete_entry(
    entry_id: str = Path(..., description="MongoDB ObjectId of the entry"),
    current_user: dict = Depends(get_current_user),
) -> None:
    # Validate ObjectId format before hitting MongoDB
    if not ObjectId.is_valid(entry_id):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="entry_id must be a valid 24-character hex ObjectId",
        )

    db = get_db()
    result = await db["entries"].delete_one(
        {"_id": ObjectId(entry_id), "user_id": current_user["id"]}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found or does not belong to you",
        )
