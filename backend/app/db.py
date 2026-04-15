import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import redis.asyncio as redis

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(DATABASE_URL, echo=True)

# This is the "Session Factory" that creates a new DB session for every request
async_session = async_sessionmaker(
    bind=engine, 
    expire_on_commit=False, 
    class_=AsyncSession
)

class Base(DeclarativeBase):
    pass

# Connection for your Ghost Tokens and Active Queue
redis_client = redis.Redis(
    host="localhost", 
    port=6379, 
    decode_responses=True
)

# This helper function handles opening/closing the DB session automatically
async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()