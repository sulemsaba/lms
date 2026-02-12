from __future__ import annotations

import json
from typing import Any

from redis.asyncio import Redis

from app.config import get_settings

settings = get_settings()


async def publish_event(stream: str, payload: dict[str, Any]) -> None:
    redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        await redis.xadd(stream, {"payload": json.dumps(payload)})
    finally:
        await redis.close()
