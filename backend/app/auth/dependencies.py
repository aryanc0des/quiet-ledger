from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.auth.jwt_handler import decode_access_token
from app.database import get_db
from bson import ObjectId

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Resolve the Bearer JWT to a user document from MongoDB."""
    user_id = decode_access_token(credentials.credentials)

    db = get_db()
    try:
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = None

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user["id"] = str(user["_id"])
    return user
