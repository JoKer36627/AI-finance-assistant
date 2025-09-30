# check_tables.py
import asyncio
from app.db.session import get_session
from app.models.user import User
from app.models.survey import SurveyResult
from app.models.message import Message
from app.models.feedback import Feedback
from sqlalchemy.future import select

async def check_table(model, name):
    async with get_session() as session:
        result = await session.execute(select(model))
        records = result.scalars().all()
        print(f"Table '{name}' has {len(records)} records.")
        if records:
            print(records[:5])  # виведе перші 5 записів
        print("-" * 40)

async def main():
    await check_table(User, "users")
    await check_table(SurveyResult, "survey_results")
    await check_table(Message, "messages")
    await check_table(Feedback, "feedback")

if __name__ == "__main__":
    asyncio.run(main())
