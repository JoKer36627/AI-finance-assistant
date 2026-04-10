from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.currency import convert_to_pln
from app.core.security import get_current_user_from_token
from app.core.transaction_parser import parse_transaction_text
from app.crud import event as crud_event
from app.crud import transaction as crud_transaction
from app.db.session import get_session
from app.schemas.event import EventCreate
from app.schemas.transaction import (
    InsightItem,
    InsightsResponse,
    TransactionCreate,
    TransactionParseRequest,
    TransactionParseResponse,
    TransactionRead,
    TransactionSummaryResponse,
    TransactionUpdate,
)


router = APIRouter(prefix="/transactions", tags=["transactions"])


async def safe_log_event(
    db: AsyncSession,
    user_id: int,
    event_type: str,
    meta: dict | None = None,
) -> None:
    try:
        await crud_event.create_event(
            db,
            user_id,
            EventCreate(event_type=event_type, meta=meta or {}),
        )
    except Exception:
        await db.rollback()


@router.post("/", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_in: TransactionCreate,
    db: AsyncSession = Depends(get_session),
    user_id: int = Depends(get_current_user_from_token),
):
    transaction = await crud_transaction.create_transaction(db, user_id, transaction_in)
    event_type = (
        "transaction_confirmed_ai"
        if transaction.source == "ai_text"
        else "transaction_created_manual"
    )
    await safe_log_event(
        db,
        user_id,
        event_type,
        {"transaction_id": transaction.id, "category": transaction.category},
    )
    return transaction


@router.get("/me", response_model=list[TransactionRead])
async def get_my_transactions(
    db: AsyncSession = Depends(get_session),
    user_id: int = Depends(get_current_user_from_token),
):
    return await crud_transaction.get_transactions_by_user(db, user_id)


@router.get("/summary", response_model=TransactionSummaryResponse)
async def get_transactions_summary(
    db: AsyncSession = Depends(get_session),
    user_id: int = Depends(get_current_user_from_token),
):
    return await crud_transaction.build_summary(db, user_id)


@router.post("/parse-text", response_model=TransactionParseResponse)
async def parse_transaction(
    payload: TransactionParseRequest,
    db: AsyncSession = Depends(get_session),
    user_id: int = Depends(get_current_user_from_token),
):
    parsed = await parse_transaction_text(payload.text)
    amount_pln, exchange_rate, normalized_currency = await convert_to_pln(
        parsed.amount,
        parsed.currency,
        parsed.transaction_date,
    )
    parsed.currency = normalized_currency
    parsed.amount_pln = amount_pln
    parsed.exchange_rate = exchange_rate
    await safe_log_event(
        db,
        user_id,
        "transaction_parsed_ai",
        {"category": parsed.category, "type": parsed.type},
    )
    return parsed


@router.get("/insights", response_model=InsightsResponse)
async def get_transaction_insights(
    db: AsyncSession = Depends(get_session),
    user_id: int = Depends(get_current_user_from_token),
):
    summary = await crud_transaction.build_summary(db, user_id)
    insights: list[InsightItem] = []

    if summary.transaction_count == 0:
        insights.append(
            InsightItem(
                title="No data yet",
                message="Add your first manual or AI transaction to unlock spending insights.",
            )
        )
    else:
        if summary.category_breakdown:
            top_category = summary.category_breakdown[0]
            insights.append(
                InsightItem(
                    title="Top expense category",
                    message=(
                        f"Most of your expense volume is in {top_category.category} "
                        f"with {top_category.amount} PLN tracked so far."
                    ),
                )
            )
        if summary.expense_total > summary.income_total and summary.income_total > 0:
            insights.append(
                InsightItem(
                    title="Expenses are ahead",
                    message="Your expenses are currently higher than your income in the tracked data.",
                )
            )
        elif summary.income_total > 0:
            insights.append(
                InsightItem(
                    title="Positive balance",
                    message="Your tracked income is still ahead of your expenses.",
                )
            )

    await safe_log_event(db, user_id, "ai_insight_viewed", {"count": len(insights)})
    return InsightsResponse(insights=insights)


@router.put("/{transaction_id}", response_model=TransactionRead)
async def update_transaction(
    transaction_id: int,
    transaction_in: TransactionUpdate,
    db: AsyncSession = Depends(get_session),
    user_id: int = Depends(get_current_user_from_token),
):
    transaction = await crud_transaction.update_transaction(
        db, user_id, transaction_id, transaction_in
    )
    await safe_log_event(
        db,
        user_id,
        "transaction_updated",
        {"transaction_id": transaction.id, "category": transaction.category},
    )
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_session),
    user_id: int = Depends(get_current_user_from_token),
):
    await crud_transaction.delete_transaction(db, user_id, transaction_id)
    await safe_log_event(db, user_id, "transaction_deleted", {"transaction_id": transaction_id})
