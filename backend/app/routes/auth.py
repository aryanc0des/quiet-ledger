from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from app.auth.google_auth import verify_google_token
from app.auth.jwt_handler import create_access_token
from app.database import get_db
from app.models.user import UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleAuthRequest(BaseModel):
    credential: str = Field(..., min_length=10, description="Google ID token from frontend")


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


@router.post(
    "/google",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Exchange Google ID token for a QuietLedger JWT",
)
async def google_auth(body: GoogleAuthRequest) -> AuthResponse:
    """
    Verify the Google credential, upsert the user, and return a signed JWT.
    """
    google_info = verify_google_token(body.credential)

    db = get_db()
    users = db["users"]

    existing = await users.find_one({"google_id": google_info["google_id"]})

    if existing:
        user_id = str(existing["_id"])
        # Update name/picture in case they changed on Google
        await users.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "name": google_info["name"],
                    "picture": google_info["picture"],
                }
            },
        )
        user_doc = await users.find_one({"_id": existing["_id"]})
    else:
        new_user = {
            "google_id": google_info["google_id"],
            "email": google_info["email"],
            "name": google_info["name"],
            "picture": google_info["picture"],
            "theme": "light",
            "created_at": datetime.now(timezone.utc),
        }
        result = await users.insert_one(new_user)
        user_id = str(result.inserted_id)
        user_doc = await users.find_one({"_id": result.inserted_id})

    if user_doc is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user after upsert",
        )

    token = create_access_token(user_id)

    return AuthResponse(
        access_token=token,
        user=UserResponse(
            id=str(user_doc["_id"]),
            email=user_doc["email"],
            name=user_doc["name"],
            picture=user_doc.get("picture"),
            theme=user_doc.get("theme", "light"),
            created_at=user_doc["created_at"],
        ),
    )
