import asyncio
from app.db.base import Base
from app.db.session import engine
from app.models.user import User  # імпортуємо, щоб SQLAlchemy знав модель

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created!")

if __name__ == "__main__":
    asyncio.run(init_db())
