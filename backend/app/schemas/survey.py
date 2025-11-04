from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List


class SurveyBase(BaseModel):
    age: int = Field(..., description="Age of the user", example=26)
    capital: float = Field(..., ge=0, description="Available capital", example=12000)
    skills: List[str] = Field(..., min_items=1, description="User skills", example=["Python", "SQL"])
    financial_goal: str = Field(..., description="Financial goal", example="Buy a car")

    sport: Optional[bool] = Field(None, description="Does user do sport?", example=True)
    sport_type: Optional[str] = Field(None, description="Type of sport if sport=True", example="Basketball")
    non_financial_goal: Optional[str] = Field(None, description="Non-financial goal", example="Travel more")

    # --- Validators ---
    @field_validator("age")
    def validate_age(cls, v):
        if v <= 0:
            raise ValueError("Age must be greater than 0")
        return v

    @field_validator("skills")
    def validate_skills(cls, v):
        if not v:
            raise ValueError("Skills must be a non-empty list")
        return v

    @field_validator("sport_type", mode="before")
    def validate_sport_type(cls, v, info):
        sport = info.data.get("sport")
        if sport and not v:
            raise ValueError("sport_type must be set if sport=True")
        return v


class SurveyCreate(SurveyBase):
    pass


class SurveyUpdate(BaseModel):
    age: Optional[int] = None
    capital: Optional[float] = Field(None, ge=0)
    skills: Optional[List[str]] = None
    financial_goal: Optional[str] = None
    sport: Optional[bool] = None
    sport_type: Optional[str] = None
    non_financial_goal: Optional[str] = None

    @field_validator("age")
    def validate_age(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Age must be greater than 0")
        return v

    @field_validator("skills")
    def validate_skills(cls, v):
        if v is not None and not v:
            raise ValueError("Skills must be a non-empty list")
        return v

    @field_validator("sport_type", mode="before")
    def validate_sport_type(cls, v, info):
        sport = info.data.get("sport")
        if sport and not v:
            raise ValueError("sport_type must be set if sport=True")
        return v


class SurveyInDB(SurveyBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
