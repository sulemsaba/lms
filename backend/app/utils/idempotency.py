import json
from typing import Any

from fastapi import Request
from redis.asyncio import Redis

from app.config import get_settings

settings = get_settings()


async def check_idempotency(key: str) -> dict[str, Any] | None:
    redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        value = await redis.get(f"idempotency:{key}")
        return json.loads(value) if value else None
    finally:
        await redis.close()


async def store_idempotency(key: str, payload: dict[str, Any], ttl_seconds: int = 86400) -> None:
    redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        await redis.setex(f"idempotency:{key}", ttl_seconds, json.dumps(payload))
    finally:
        await redis.close()


def get_idempotency_key(request: Request) -> str | None:
    return request.headers.get("x-idempotency-key")
