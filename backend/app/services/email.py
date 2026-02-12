from __future__ import annotations

import aiosmtplib

from app.config import get_settings

settings = get_settings()


async def send_email_message(email_to: str, subject: str, body: str) -> bool:
    if not settings.EMAIL_ENABLED:
        return True

    message = f"From: {settings.SMTP_USER}\nTo: {email_to}\nSubject: {subject}\n\n{body}"
    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        start_tls=True,
    )
    return True
