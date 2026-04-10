from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import get_session
from app.schemas.survey import SurveyCreate, SurveyUpdate, SurveyInDB
from app.crud import survey as crud_survey
from app.crud.event import create_event
from app.core.security import get_current_user_from_token
from app.schemas.event import EventCreate

router = APIRouter(prefix="/survey", tags=["survey"])


async def safe_create_survey_event(db: AsyncSession, user_id: int, source: str):
    try:
        await create_event(
            db,
            user_id,
            EventCreate(event_type="survey_completed", meta={"source": source}),
        )
    except SQLAlchemyError:
        await db.rollback()


# --- CREATE ---
@router.post("/", response_model=SurveyInDB)
async def create_survey(
    survey: SurveyCreate,
    db: AsyncSession = Depends(get_session),
    user_id: int = Depends(get_current_user_from_token),
):
    db_survey = await crud_survey.create_survey(db, user_id, survey)
    await safe_create_survey_event(db, user_id, "create")
    return SurveyInDB(
        id=db_survey.id,
        user_id=user_id,
        created_at=db_survey.created_at,
        **survey.dict()
    )


# --- GET ---
@router.get("/me", response_model=SurveyInDB)
async def read_my_survey(
    db: AsyncSession = Depends(get_session),
    user_id: int = Depends(get_current_user_from_token),
):
    db_survey = await crud_survey.get_survey_by_user(db, user_id)
    if not db_survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found"
        )
    return SurveyInDB(
        id=db_survey.id,
        user_id=user_id,
        created_at=db_survey.created_at,
        **db_survey.answers
    )


# --- UPDATE ---
@router.put("/me", response_model=SurveyInDB)
async def update_my_survey(
    survey_update: SurveyUpdate,
    db: AsyncSession = Depends(get_session),
    user_id: int = Depends(get_current_user_from_token),
):
    db_survey = await crud_survey.update_survey(db, user_id, survey_update)
    await safe_create_survey_event(db, user_id, "update")
    return SurveyInDB(
        id=db_survey.id,
        user_id=db_survey.user_id,
        created_at=db_survey.created_at,
        **db_survey.answers
    )
