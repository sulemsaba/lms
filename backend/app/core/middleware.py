from __future__ import annotations

import time
import uuid
from collections.abc import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings

settings = get_settings()


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable[[Request], Response]) -> Response:
        start = time.perf_counter()
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        institution_id = request.headers.get("x-institution-id")

        request.state.request_id = request_id
        request.state.institution_id = institution_id

        response = await call_next(request)
        response.headers["x-request-id"] = request_id
        response.headers["x-latency-ms"] = f"{(time.perf_counter() - start) * 1000:.2f}"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limit for local development."""

    _bucket: dict[str, list[float]] = {}

    async def dispatch(self, request: Request, call_next: Callable[[Request], Response]) -> Response:
        now = time.time()
        key = request.client.host if request.client else "unknown"
        window = 60
        max_requests = 120

        bucket = self._bucket.setdefault(key, [])
        bucket[:] = [value for value in bucket if now - value < window]
        if len(bucket) >= max_requests:
            return Response("Rate limit exceeded", status_code=429)

        bucket.append(now)
        return await call_next(request)
