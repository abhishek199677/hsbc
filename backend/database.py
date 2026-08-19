from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import create_engine

from config import DATABASE_URL

# Async engine for FastAPI routes
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=20,
    max_overflow=10,
    connect_args={"ssl": True} if "neon" in DATABASE_URL else {},
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Sync engine for screening endpoints (called from sync def)
sync_database_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
sync_engine = create_engine(sync_database_url, echo=False, pool_size=5)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def get_db_sync():
    return sync_engine.connect()
