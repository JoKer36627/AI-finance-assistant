from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.survey import SurveyCreate, SurveyUpdate, SurveyInDB
from app.crud import survey as crud_survey
from app.core.security import get_current_user_from_token

router = APIRouter(prefix="/survey", tags=["survey"])


# --- CREATE ---
@router.post("/", response_model=SurveyInDB)
async def create_survey(
    survey: SurveyCreate,
    db: AsyncSession = Depends(get_session),
    user_id: int = Depends(get_current_user_from_token),
):
    db_survey = await crud_survey.create_survey(db, user_id, survey)
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
    return SurveyInDB(
        id=db_survey.id,
        user_id=db_survey.user_id,
        created_at=db_survey.created_at,
        **db_survey.answers
    )