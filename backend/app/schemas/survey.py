from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List

TRACKER_CURRENCIES = {"PLN", "USD", "EUR", "UAH", "GBP"}


class SurveyBase(BaseModel):
    age: int = Field(..., description="Age of the user", example=0)
    capital: float = Field(..., ge=0, description="Available capital", example=0)
    capital_currency: str = Field(default="PLN", min_length=3, max_length=3, description="Currency of available capital", example="PLN")
    skills: List[str] = Field(..., min_items=1, description="User skills", example=["string"])
    financial_goal: str = Field(..., description="Financial goal", example="string")
    tracker_goal: str = Field(..., description="Main reason for using the tracker", example="Understand where my money goes")
    non_financial_goal: Optional[str] = Field(None, description="Non-financial goal", example="string")

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

    @field_validator("capital_currency")
    def validate_capital_currency(cls, v):
        normalized = v.strip().upper()
        if normalized not in TRACKER_CURRENCIES:
            raise ValueError("capital_currency must be one of PLN, USD, EUR, UAH, GBP")
        return normalized

    @field_validator("financial_goal", "tracker_goal")
    def validate_goal_fields(cls, v):
        if not v or not v.strip():
            raise ValueError("Goal fields must not be empty")
        return v.strip()


class SurveyCreate(SurveyBase):
    pass


class SurveyUpdate(BaseModel):
    age: Optional[int] = None
    capital: Optional[float] = Field(None, ge=0)
    capital_currency: Optional[str] = Field(default=None, min_length=3, max_length=3)
    skills: Optional[List[str]] = None
    financial_goal: Optional[str] = None
    tracker_goal: Optional[str] = None
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

    @field_validator("capital_currency")
    def validate_capital_currency(cls, v):
        if v is None:
            return v
        normalized = v.strip().upper()
        if normalized not in TRACKER_CURRENCIES:
            raise ValueError("capital_currency must be one of PLN, USD, EUR, UAH, GBP")
        return normalized

    @field_validator("financial_goal", "tracker_goal")
    def validate_goal_fields(cls, v):
        if v is None:
            return v
        if not v.strip():
            raise ValueError("Goal fields must not be empty")
        return v.strip()


class SurveyInDB(SurveyBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
