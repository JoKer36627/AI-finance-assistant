import asyncio
import json
import re
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation

import openai

from app.config import settings
from app.schemas.transaction import (
    TRANSACTION_CATEGORIES,
    TransactionParseResponse,
)


CATEGORY_KEYWORDS = {
    "food": ["food", "coffee", "groceries", "grocery", "restaurant", "cafe", "lunch", "dinner", "breakfast", "produk", "продукт", "кава", "кав", "їжа"],
    "transport": ["taxi", "uber", "bolt", "bus", "train", "fuel", "metro", "tram", "таксі", "транспорт", "паливо"],
    "housing": ["rent", "mortgage", "housing", "apartment", "flat", "оренда", "квартира"],
    "bills": ["bill", "internet", "phone", "electricity", "water", "gas", "subscription", "рахунок", "комунал", "інтернет"],
    "entertainment": ["movie", "cinema", "game", "netflix", "spotify", "concert", "розваг", "кіно"],
    "shopping": ["shopping", "clothes", "amazon", "store", "shirt", "shoes", "покуп", "одяг"],
    "health": ["doctor", "medicine", "pharmacy", "gym", "health", "лікар", "аптек", "здоров"],
    "education": ["course", "book", "education", "tuition", "study", "курс", "книга", "навчан"],
    "salary": ["salary", "payroll", "wage", "зарплат"],
    "freelance": ["freelance", "invoice", "client", "project", "upwork", "fiverr", "клієнт", "фриланс", "фріланс", "замовник"],
}

INCOME_KEYWORDS = [
    "salary", "bonus", "freelance", "invoice", "earned", "received", "income", "earn"
    "profit", "revenue", "sold", "sale", "refund", "paycheck", "got paid",
    "заробив", "отримав", "дохід", "прибут", "зарплат", "гонорар", "продав", "виплата",
]

PARSER_SYSTEM_PROMPT = """
You are a financial transaction parser.

Your task is to convert a user's natural language description of a financial activity into a structured JSON object.

You must strictly follow these rules:

1. Extract:
- transaction type (income or expense)
- amount (number only)
- currency (default PLN if not specified)
- category (choose ONLY from the allowed list)
- short note (what the transaction is about)
- date (use today's date if not specified)

2. Allowed categories:
- food
- transport
- housing
- bills
- entertainment
- shopping
- health
- education
- salary
- freelance
- other

3. If unclear:
- make the BEST reasonable assumption
- NEVER return null unless absolutely impossible

4. Output format MUST be valid JSON only.
NO text explanation. NO comments.
"""


def _normalize_whitespace(text: str) -> str:
    return " ".join(text.strip().split())


def _extract_amount(text: str) -> Decimal | None:
    match = re.search(r"(\d+[.,]?\d{0,2})", text)
    if not match:
        return None
    raw_amount = match.group(1).replace(",", ".")
    try:
        return Decimal(raw_amount)
    except InvalidOperation:
        return None


def _detect_currency(text: str) -> str:
    lowered = text.lower()
    if "usd" in lowered or "$" in lowered or "dollar" in lowered or "dollars" in lowered or "долар" in lowered:
        return "USD"
    if "eur" in lowered or "€" in lowered or "euro" in lowered or "євро" in lowered:
        return "EUR"
    if "uah" in lowered or "грн" in lowered or "hryvnia" in lowered:
        return "UAH"
    if "gbp" in lowered or "£" in lowered or "pound" in lowered or "фунт" in lowered:
        return "GBP"
    if "pln" in lowered or "zł" in lowered or "zl" in lowered or "злот" in lowered:
        return "PLN"
    return "PLN"


def _detect_type(text: str) -> str:
    lowered = text.lower()
    if any(keyword in lowered for keyword in INCOME_KEYWORDS):
        return "income"
    return "expense"


def _detect_category(text: str, transaction_type: str) -> str:
    if transaction_type == "income":
        lowered = text.lower()
        if any(keyword in lowered for keyword in CATEGORY_KEYWORDS["salary"]):
            return "salary"
        if any(keyword in lowered for keyword in CATEGORY_KEYWORDS["freelance"]):
            return "freelance"
        return "other"

    lowered = text.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if category in {"salary", "freelance"}:
            continue
        if any(keyword in lowered for keyword in keywords):
            return category
    return "other"


def _build_note(text: str, amount: Decimal) -> str:
    cleaned = re.sub(r"\bfor\b", "", text, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bza\b", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(
        r"\b(usd|eur|uah|gbp|pln|dollars?|euro|hryvnia|pounds?|долар(ів|и)?|євро|грн|фунт(ів|и)?|злот(их|і)?)\b",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )
    cleaned = cleaned.replace(str(amount), "").strip(" ,.-")
    return cleaned[:120] or "Parsed from AI input"


def parse_transaction_text_local(text: str) -> TransactionParseResponse:
    normalized_text = _normalize_whitespace(text)
    amount = _extract_amount(normalized_text)
    if amount is None or amount <= 0:
        raise ValueError("Could not detect a valid transaction amount")

    transaction_type = _detect_type(normalized_text)
    category = _detect_category(normalized_text, transaction_type)

    return TransactionParseResponse(
        type=transaction_type,
        amount=amount,
        currency=_detect_currency(normalized_text),
        category=category if category in TRANSACTION_CATEGORIES else "other",
        note=_build_note(normalized_text, amount),
        transaction_date=datetime.now(timezone.utc),
        source="ai_text",
        confidence=0.64,
    )


async def parse_transaction_text_with_llm(text: str) -> TransactionParseResponse:
    today = datetime.now(timezone.utc).date().isoformat()
    prompt = (
        "Example input:\n"
        "\"I bought coffee for 15 zł\"\n\n"
        "Example output:\n"
        "{\n"
        '  "type": "expense",\n'
        '  "amount": 15,\n'
        '  "currency": "PLN",\n'
        '  "category": "food",\n'
        '  "note": "coffee",\n'
        f'  "date": "{today}"\n'
        "}\n\n"
        "Now process the user's input.\n\n"
        f"User input: {text}"
    )

    response = await asyncio.to_thread(
        openai.chat.completions.create,
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": PARSER_SYSTEM_PROMPT,
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0,
        max_tokens=220,
        timeout=getattr(settings, "openai_timeout", 15),
    )

    content = response.choices[0].message.content
    payload = json.loads(content)
    payload["category"] = payload.get("category", "other").strip().lower()
    payload["currency"] = payload.get("currency", "PLN").strip().upper()
    payload["transaction_date"] = payload.pop("transaction_date", payload.pop("date", today))
    payload["source"] = "ai_text"
    payload["confidence"] = 0.82
    return TransactionParseResponse(**payload)


async def parse_transaction_text(text: str) -> TransactionParseResponse:
    try:
        return parse_transaction_text_local(text)
    except ValueError:
        return await parse_transaction_text_with_llm(text)
