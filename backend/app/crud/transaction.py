from collections import defaultdict
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.currency import convert_to_pln
from app.models.transaction import Transaction
from app.schemas.transaction import (
    CategoryBreakdownItem,
    PeriodBreakdownItem,
    TransactionCreate,
    TransactionSummaryResponse,
    TransactionUpdate,
)


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


async def get_transactions_by_user(db: AsyncSession, user_id: int) -> list[Transaction]:
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
    )
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


async def build_summary(db: AsyncSession, user_id: int) -> TransactionSummaryResponse:
    transactions = await get_transactions_by_user(db, user_id)

    income_total = Decimal("0")
    expense_total = Decimal("0")
    category_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    period_totals: dict[str, dict[str, Decimal]] = defaultdict(
        lambda: {"income": Decimal("0"), "expense": Decimal("0")}
    )

    for transaction in transactions:
        amount = Decimal(str(transaction.amount_pln))
        period_key = transaction.transaction_date.strftime("%Y-%m")

        if transaction.type == "income":
            income_total += amount
        else:
            expense_total += amount
            category_totals[transaction.category] += amount

        period_totals[period_key][transaction.type] += amount

    category_breakdown = [
        CategoryBreakdownItem(category=category, amount=amount)
        for category, amount in sorted(
            category_totals.items(), key=lambda item: item[1], reverse=True
        )
    ]
    period_breakdown = [
        PeriodBreakdownItem(period=period, income=totals["income"], expense=totals["expense"])
        for period, totals in sorted(period_totals.items())
    ]

    return TransactionSummaryResponse(
        balance=income_total - expense_total,
        income_total=income_total,
        expense_total=expense_total,
        base_currency="PLN",
        category_breakdown=category_breakdown,
        period_breakdown=period_breakdown,
        transaction_count=len(transactions),
    )
