from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from fastapi import HTTPException, status
from app.config import get_settings

settings = get_settings()


def create_access_token(user_id: str) -> str:
    """Sign a JWT containing the user's MongoDB _id."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_expire_days)
    payload = {"sub": user_id, "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> str:
    """Verify the token and return the user_id (sub claim)."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exc
        return user_id
    except JWTError:
        raise credentials_exc
