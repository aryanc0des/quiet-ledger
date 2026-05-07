from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings
import certifi

settings = get_settings()

client: AsyncIOMotorClient | None = None


async def connect_db() -> None:
    global client
    client = AsyncIOMotorClient(
        settings.mongodb_url,
        tlsCAFile=certifi.where(),
    )


async def close_db() -> None:
    global client
    if client:
        client.close()


def get_db():
    if client is None:
        raise RuntimeError("Database not connected.")
    return client["quietledger"]