from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, field_validator


TRANSACTION_CATEGORIES = [
    "food",
    "transport",
    "housing",
    "bills",
    "entertainment",
    "shopping",
    "health",
    "education",
    "salary",
    "freelance",
    "other",
]

TRANSACTION_SOURCES = ["manual", "ai_text", "future_bank_import"]


class TransactionBase(BaseModel):
    type: Literal["income", "expense"]
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(default="PLN", min_length=3, max_length=3)
    category: str
    note: str | None = None
    transaction_date: datetime
    source: str = "manual"

    @field_validator("category")
    def validate_category(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in TRANSACTION_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(TRANSACTION_CATEGORIES)}")
        return normalized

    @field_validator("currency")
    def validate_currency(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("source")
    def validate_source(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in TRANSACTION_SOURCES:
            raise ValueError(f"Source must be one of: {', '.join(TRANSACTION_SOURCES)}")
        return normalized


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    type: Literal["income", "expense"] | None = None
    amount: Decimal | None = Field(default=None, gt=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    category: str | None = None
    note: str | None = None
    transaction_date: datetime | None = None
    source: str | None = None

    @field_validator("category")
    def validate_category(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip().lower()
        if normalized not in TRANSACTION_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(TRANSACTION_CATEGORIES)}")
        return normalized

    @field_validator("currency")
    def validate_currency(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return value.strip().upper()

    @field_validator("source")
    def validate_source(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip().lower()
        if normalized not in TRANSACTION_SOURCES:
            raise ValueError(f"Source must be one of: {', '.join(TRANSACTION_SOURCES)}")
        return normalized


class TransactionRead(TransactionBase):
    id: int
    user_id: int
    amount_pln: Decimal
    exchange_rate: Decimal
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class TransactionParseRequest(BaseModel):
    text: str = Field(..., min_length=2, max_length=500)


class TransactionParseResponse(BaseModel):
    type: Literal["income", "expense"]
    amount: Decimal = Field(..., gt=0)
    currency: str = "PLN"
    category: str
    note: str
    transaction_date: datetime
    source: str = "ai_text"
    amount_pln: Decimal | None = None
    exchange_rate: Decimal | None = None
    confidence: float = Field(default=0.0, ge=0, le=1)


class CategoryBreakdownItem(BaseModel):
    category: str
    amount: Decimal


class PeriodBreakdownItem(BaseModel):
    period: str
    income: Decimal
    expense: Decimal


class TransactionSummaryResponse(BaseModel):
    balance: Decimal
    starting_balance: Decimal = Decimal("0")
    income_total: Decimal
    expense_total: Decimal
    base_currency: str = "PLN"
    category_breakdown: list[CategoryBreakdownItem]
    period_breakdown: list[PeriodBreakdownItem]
    transaction_count: int


class InsightItem(BaseModel):
    title: str
    message: str


class InsightsResponse(BaseModel):
    insights: list[InsightItem]
