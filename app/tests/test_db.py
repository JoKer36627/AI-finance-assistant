from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session

router = APIRouter()

@router.get("/test-db")
async def test_db(session: AsyncSession = Depends(get_session)):
    # просто виконаємо запит до Postgres
    result = await session.execute("SELECT 1")
    value = result.scalar()  # отримаємо число
    return {"db_connection": value}
