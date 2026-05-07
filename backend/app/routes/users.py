from fastapi import APIRouter, Depends, status
from bson import ObjectId
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get the current authenticated user's profile",
)
async def get_me(current_user: dict = Depends(get_current_user)) -> UserResponse:
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        picture=current_user.get("picture"),
        theme=current_user.get("theme", "light"),
        created_at=current_user["created_at"],
    )


@router.put(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update display name, profile picture, or theme preference",
)
async def update_me(
    body: UserUpdate,
    current_user: dict = Depends(get_current_user),
) -> UserResponse:
    updates = body.model_dump(exclude_none=True)
    if updates:
        db = get_db()
        await db["users"].update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": updates},
        )
        updated = await db["users"].find_one({"_id": ObjectId(current_user["id"])})
    else:
        updated = current_user

    return UserResponse(
        id=str(updated["_id"]),
        email=updated["email"],
        name=updated["name"],
        picture=updated.get("picture"),
        theme=updated.get("theme", "light"),
        created_at=updated["created_at"],
    )


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Permanently delete the current user and all their journal entries",
)
async def delete_me(current_user: dict = Depends(get_current_user)) -> None:
    db = get_db()
    # Delete all entries belonging to this user first
    await db["entries"].delete_many({"user_id": current_user["id"]})
    # Then delete the user document itself
    await db["users"].delete_one({"_id": ObjectId(current_user["id"])})