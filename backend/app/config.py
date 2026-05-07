from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    mongodb_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 7
    google_client_id: str
    allowed_origins: str = "http://localhost:5173"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
