from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.currency import convert_from_pln, convert_to_pln
from app.models.survey import SurveyResult
from app.models.transaction import Transaction
from app.schemas.transaction import (
    CategoryBreakdownItem,
    PeriodBreakdownItem,
    SUMMARY_PERIODS,
    TransactionCreate,
    TransactionSummaryResponse,
    TransactionUpdate,
)


def _validate_period(period: str) -> str:
    normalized = (period or "month").strip().lower()
    if normalized not in SUMMARY_PERIODS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid summary period",
        )
    return normalized


def _get_period_range(period: str) -> tuple[datetime, datetime]:
    now = datetime.now().astimezone()
    end = now

    if period == "day":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start = (now - timedelta(days=now.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
    elif period == "year":
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    return start, end


def _format_period_label(dt: datetime, period: str) -> tuple[str, str]:
    local_dt = dt.astimezone()
    if period == "day":
        return local_dt.strftime("%Y-%m-%d-%H"), local_dt.strftime("%H:%M")
    if period == "week":
        return local_dt.strftime("%Y-%m-%d"), local_dt.strftime("%a")
    if period == "year":
        return local_dt.strftime("%Y-%m"), local_dt.strftime("%b")
    return local_dt.strftime("%Y-%m-%d"), local_dt.strftime("%d %b")


async def create_transaction(
    db: AsyncSession, user_id: int, transaction_in: TransactionCreate
) -> Transaction:
    transaction_payload = transaction_in.model_dump()
    amount_pln, exchange_rate, normalized_currency = await convert_to_pln(
        transaction_in.amount,
        transaction_in.currency,
        transaction_in.transaction_date,
    )
    transaction_payload["currency"] = normalized_currency
    db_transaction = Transaction(
        user_id=user_id,
        **transaction_payload,
        amount_pln=amount_pln,
        exchange_rate=exchange_rate,
    )
    db.add(db_transaction)
    await db.commit()
    await db.refresh(db_transaction)
    return db_transaction


async def get_transactions_by_user(
    db: AsyncSession,
    user_id: int,
    period: str | None = None,
) -> list[Transaction]:
    query = (
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
    )

    if period:
        selected_period = _validate_period(period)
        start, end = _get_period_range(selected_period)
        query = query.where(
            Transaction.transaction_date >= start,
            Transaction.transaction_date <= end,
        )

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_transaction_by_id(
    db: AsyncSession, user_id: int, transaction_id: int
) -> Transaction | None:
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == transaction_id, Transaction.user_id == user_id
        )
    )
    return result.scalars().first()


async def update_transaction(
    db: AsyncSession, user_id: int, transaction_id: int, transaction_in: TransactionUpdate
) -> Transaction:
    transaction = await get_transaction_by_id(db, user_id, transaction_id)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    changes = transaction_in.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setattr(transaction, key, value)

    if {"amount", "currency", "transaction_date"} & set(changes.keys()):
        amount_pln, exchange_rate, normalized_currency = await convert_to_pln(
            transaction.amount,
            transaction.currency,
            transaction.transaction_date,
        )
        transaction.currency = normalized_currency
        transaction.amount_pln = amount_pln
        transaction.exchange_rate = exchange_rate

    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    return transaction


async def delete_transaction(db: AsyncSession, user_id: int, transaction_id: int) -> None:
    transaction = await get_transaction_by_id(db, user_id, transaction_id)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    await db.delete(transaction)
    await db.commit()


async def get_tracker_currency_and_starting_balance(
    db: AsyncSession,
    user_id: int,
) -> tuple[Decimal, str]:
    result = await db.execute(select(SurveyResult).where(SurveyResult.user_id == user_id))
    survey = result.scalars().first()
    if not survey or not survey.answers:
        return Decimal("0"), "PLN"

    answers = survey.answers
    tracker_currency = str(answers.get("capital_currency") or "PLN").strip().upper() or "PLN"
    capital = Decimal(str(answers.get("capital") or 0))
    return capital, tracker_currency


async def build_summary(
    db: AsyncSession,
    user_id: int,
    period: str = "month",
) -> TransactionSummaryResponse:
    selected_period = _validate_period(period)
    transactions = await get_transactions_by_user(db, user_id, selected_period)
    starting_balance, tracker_currency = await get_tracker_currency_and_starting_balance(
        db, user_id
    )

    income_total_pln = Decimal("0")
    expense_total_pln = Decimal("0")
    category_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    period_totals: dict[str, dict[str, Decimal | str]] = defaultdict(
        lambda: {"income": Decimal("0"), "expense": Decimal("0"), "label": ""}
    )

    for transaction in transactions:
        amount = Decimal(str(transaction.amount_pln))
        period_key, label = _format_period_label(
            transaction.transaction_date,
            selected_period,
        )

        if transaction.type == "income":
            income_total_pln += amount
        else:
            expense_total_pln += amount
            category_totals[transaction.category] += amount

        period_totals[period_key][transaction.type] += amount
        period_totals[period_key]["label"] = label

    starting_balance_pln, _, tracker_currency = await convert_to_pln(
        starting_balance,
        tracker_currency,
    )
    balance_pln = starting_balance_pln + income_total_pln - expense_total_pln

    if tracker_currency == "PLN":
        summary_balance = balance_pln
        summary_starting_balance = starting_balance
        summary_income_total = income_total_pln
        summary_expense_total = expense_total_pln
        category_breakdown = [
            CategoryBreakdownItem(category=category, amount=amount)
            for category, amount in sorted(
                category_totals.items(), key=lambda item: item[1], reverse=True
            )
        ]
        period_breakdown = [
            PeriodBreakdownItem(
                period=period_key,
                label=str(totals["label"]),
                income=totals["income"],
                expense=totals["expense"],
            )
            for period_key, totals in sorted(period_totals.items())
        ]
    else:
        summary_balance, _, _ = await convert_from_pln(balance_pln, tracker_currency)
        summary_starting_balance, _, _ = await convert_from_pln(
            starting_balance_pln,
            tracker_currency,
        )
        summary_income_total, _, _ = await convert_from_pln(
            income_total_pln,
            tracker_currency,
        )
        summary_expense_total, _, _ = await convert_from_pln(
            expense_total_pln,
            tracker_currency,
        )
        category_breakdown = []
        for category, amount in sorted(
            category_totals.items(), key=lambda item: item[1], reverse=True
        ):
            converted_amount, _, _ = await convert_from_pln(amount, tracker_currency)
            category_breakdown.append(
                CategoryBreakdownItem(category=category, amount=converted_amount)
            )
        period_breakdown = []
        for period_key, totals in sorted(period_totals.items()):
            converted_income, _, _ = await convert_from_pln(
                totals["income"], tracker_currency
            )
            converted_expense, _, _ = await convert_from_pln(
                totals["expense"], tracker_currency
            )
            period_breakdown.append(
                PeriodBreakdownItem(
                    period=period_key,
                    label=str(totals["label"]),
                    income=converted_income,
                    expense=converted_expense,
                )
            )

    return TransactionSummaryResponse(
        balance=summary_balance,
        starting_balance=summary_starting_balance,
        income_total=summary_income_total,
        expense_total=summary_expense_total,
        base_currency=tracker_currency,
        selected_period=selected_period,
        category_breakdown=category_breakdown,
        period_breakdown=period_breakdown,
        transaction_count=len(transactions),
    )
