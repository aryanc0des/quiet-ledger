from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from fastapi import HTTPException, status
from app.config import get_settings

settings = get_settings()

_google_request = google_requests.Request()


def verify_google_token(credential: str) -> dict:
    """
    Verify a Google ID token issued by the frontend (via @react-oauth/google).
    Returns the decoded token claims on success.
    Raises HTTP 401 if the token is invalid or the audience doesn't match.
    """
    try:
        id_info = id_token.verify_oauth2_token(
            credential,
            _google_request,
            settings.google_client_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {exc}",
        )

    return {
        "google_id": id_info["sub"],
        "email": id_info["email"],
        "name": id_info.get("name", ""),
        "picture": id_info.get("picture"),
    }
