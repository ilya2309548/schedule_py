import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/university_app",
)

# Create async engine
engine = create_async_engine(DATABASE_URL)
SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Create declarative base for models
Base = declarative_base()


async def connect_to_postgres():
    """Connect to PostgreSQL database."""
    # Create tables if they don't exist
    async with engine.begin() as conn:
        # Only create tables in development
        if os.getenv("ENVIRONMENT", "development") == "development":
            await conn.run_sync(Base.metadata.create_all)

    print("Connected to PostgreSQL")


async def close_postgres_connection():
    """Close PostgreSQL connection."""
    await engine.dispose()
    print("Disconnected from PostgreSQL")


async def get_db():
    """Get database session."""
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
