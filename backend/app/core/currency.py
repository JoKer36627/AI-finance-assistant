from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP

import httpx


FRANKFURTER_API_BASE = "https://api.frankfurter.dev/v1"
PLN = "PLN"
FALLBACK_RATES_TO_PLN = {
    "PLN": Decimal("1"),
    "USD": Decimal("3.95"),
    "EUR": Decimal("4.28"),
    "GBP": Decimal("5.01"),
    "UAH": Decimal("0.095"),
}


def quantize_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def normalize_currency(currency: str | None) -> str:
    normalized = (currency or PLN).strip().upper()
    return normalized or PLN


def _normalize_date(transaction_date: datetime | date | None) -> date | None:
    if transaction_date is None:
        return None
    if isinstance(transaction_date, datetime):
        return transaction_date.date()
    return transaction_date


async def fetch_rate_to_pln(
    currency: str,
    transaction_date: datetime | date | None = None,
) -> Decimal:
    normalized_currency = normalize_currency(currency)
    if normalized_currency == PLN:
        return Decimal("1")

    query_date = _normalize_date(transaction_date)
    endpoint = f"{FRANKFURTER_API_BASE}/latest"
    if query_date:
        endpoint = f"{FRANKFURTER_API_BASE}/{query_date.isoformat()}"

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                endpoint,
                params={"from": normalized_currency, "to": PLN},
            )
            response.raise_for_status()
            payload = response.json()
            rate = Decimal(str(payload["rates"][PLN]))
            if rate > 0:
                return rate
    except Exception:
        pass

    return FALLBACK_RATES_TO_PLN.get(normalized_currency, Decimal("1"))


async def convert_to_pln(
    amount: Decimal,
    currency: str,
    transaction_date: datetime | date | None = None,
) -> tuple[Decimal, Decimal, str]:
    normalized_currency = normalize_currency(currency)
    rate = await fetch_rate_to_pln(normalized_currency, transaction_date)
    amount_decimal = Decimal(str(amount))
    converted_amount = quantize_money(amount_decimal * rate)
    return converted_amount, rate, normalized_currency
