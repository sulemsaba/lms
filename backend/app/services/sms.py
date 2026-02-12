from __future__ import annotations

from app.config import get_settings

settings = get_settings()


async def send_sms_message(phone: str, message: str) -> bool:
    if not settings.AT_API_KEY:
        return True
    return bool(phone and message)
