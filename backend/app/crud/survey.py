from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from app.models.survey import SurveyResult
from app.schemas.survey import SurveyCreate, SurveyUpdate
from fastapi import HTTPException, status
from sqlalchemy.orm.attributes import flag_modified


# --- CREATE ---
async def create_survey(db: AsyncSession, user_id: int, survey: SurveyCreate):
    result = await db.execute(select(SurveyResult).where(SurveyResult.user_id == user_id))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Survey already exists for this user"
        )

    new_survey = SurveyResult(
        user_id=user_id,
        answers=survey.dict()
    )
    db.add(new_survey)
    try:
        await db.commit()
        await db.refresh(new_survey)
    except IntegrityError:
        await db.rollback()
        raise
    return new_survey


# --- GET ---
async def get_survey_by_user(db: AsyncSession, user_id: int):
    result = await db.execute(select(SurveyResult).where(SurveyResult.user_id == user_id))
    return result.scalars().first()


# --- UPDATE ---
async def update_survey(db: AsyncSession, user_id: int, survey_update: SurveyUpdate):
    result = await db.execute(select(SurveyResult).where(SurveyResult.user_id == user_id))
    survey = result.scalars().first()
    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Survey not found")

    update_data = survey_update.dict(exclude_unset=True)

    # --- Validate before update ---
    if "age" in update_data and update_data["age"] <= 0:
        raise HTTPException(status_code=422, detail="Age must be greater than 0")
    if "capital" in update_data and update_data["capital"] < 0:
        raise HTTPException(status_code=422, detail="Capital must be >= 0")
    if "skills" in update_data and not update_data["skills"]:
        raise HTTPException(status_code=422, detail="Skills must be a non-empty list")
    if update_data.get("sport") and not update_data.get("sport_type"):
        raise HTTPException(status_code=422, detail="sport_type is required if sport=True")

    current_data = survey.answers or {}
    current_data.update(update_data)
    survey.answers = current_data
    flag_modified(survey, "answers")

    db.add(survey)
    await db.commit()
    await db.refresh(survey)
    return survey
