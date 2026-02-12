#!/usr/bin/env python
from __future__ import annotations

import asyncio

from app.database import Base
from app.database.session import engine


async def init() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


if __name__ == "__main__":
    asyncio.run(init())
