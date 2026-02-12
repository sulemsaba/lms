from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings

settings = get_settings()

engine: AsyncEngine = create_async_engine(settings.ASYNC_DATABASE_URL, pool_pre_ping=True, future=True)
AsyncSessionFactory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionFactory() as session:
        yield session


async def set_tenant_context(session: AsyncSession, institution_id: str) -> None:
    # Used by RLS policies in PostgreSQL.
    await session.execute(text("SELECT set_config('app.current_institution_id', :institution_id, true)"), {"institution_id": institution_id})
