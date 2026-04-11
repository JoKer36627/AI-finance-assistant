import asyncio
import json
import re
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation

import openai

from app.config import settings
from app.schemas.transaction import (
    TRANSACTION_CATEGORIES,
    TransactionParseResponse,
)


CATEGORY_KEYWORDS = {
    "food": [
        "food", "coffee", "groceries", "grocery", "restaurant", "cafe", "lunch", "dinner", "breakfast",
        "snack", "brunch", "delivery", "takeout", "produk", "продукт", "кава", "кав", "їжа", "суші",
        "піц", "pizza", "burger", "бар", "кафе", "обід", "вечеря"
    ],
    "transport": [
        "taxi", "uber", "bolt", "bus", "train", "fuel", "metro", "tram", "parking", "car wash", "diesel",
        "petrol", "gasoline", "таксі", "транспорт", "паливо", "бензин", "парков", "проїзд", "автобус"
    ],
    "housing": [
        "rent", "mortgage", "housing", "apartment", "flat", "deposit", "оренда", "квартира", "житло", "іпотека"
    ],
    "bills": [
        "bill", "internet", "phone", "electricity", "water", "gas", "subscription", "utility", "utilities",
        "рахунок", "комунал", "інтернет", "світло", "вода", "газ", "мобільний"
    ],
    "entertainment": [
        "movie", "cinema", "game", "netflix", "spotify", "concert", "party", "bar", "club", "розваг", "кіно", "ігри"
    ],
    "shopping": [
        "shopping", "clothes", "amazon", "store", "shirt", "shoes", "mall", "ikea", "покуп", "одяг", "взуття", "магазин"
    ],
    "health": [
        "doctor", "medicine", "pharmacy", "gym", "health", "therapy", "dentist", "лікар", "аптек", "здоров", "зал", "спортзал"
    ],
    "education": [
        "course", "book", "education", "tuition", "study", "lesson", "workshop", "курс", "книга", "навчан", "урок"
    ],
    "salary": ["salary", "payroll", "wage", "зарплат", "salary payment", "заробітна плата"],
    "freelance": [
        "freelance", "invoice", "client", "project", "upwork", "fiverr", "side job", "gig",
        "клієнт", "фриланс", "фріланс", "замовник", "проєкт", "підробіток"
    ],
}

INCOME_KEYWORDS = [
    "salary", "bonus", "freelance", "invoice", "earned", "received", "income", "earn",
    "profit", "revenue", "sold", "sale", "refund", "paycheck", "got paid", "payout",
    "cashback", "returned", "заробив", "отримав", "дохід", "прибут", "зарплат",
    "гонорар", "продав", "виплата", "повернули", "кешбек", "переказали", "зайшло",
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
- date (support relative references like today, yesterday, last week; use today's date only if not specified)

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

4. Understand informal language, slang, mixed Ukrainian/Polish/English phrasing, and shorthand notes.

5. Output format MUST be valid JSON only.
NO text explanation. NO comments.
"""

RELATIVE_DAY_KEYWORDS = {
    "today": 0,
    "сьогодні": 0,
    "today.": 0,
    "yesterday": -1,
    "вчора": -1,
    "yday": -1,
    "day before yesterday": -2,
    "the day before yesterday": -2,
    "позавчора": -2,
    "tomorrow": 1,
    "завтра": 1,
}


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


def _parse_relative_date(text: str) -> datetime:
    lowered = text.lower()
    now = datetime.now().astimezone()

    for phrase, offset in sorted(RELATIVE_DAY_KEYWORDS.items(), key=lambda item: len(item[0]), reverse=True):
        if phrase in lowered:
            return (now + timedelta(days=offset)).replace(hour=12, minute=0, second=0, microsecond=0)

    if "last week" in lowered or "минулого тижня" in lowered:
        return (now - timedelta(days=7)).replace(hour=12, minute=0, second=0, microsecond=0)
    if "this week" in lowered or "цього тижня" in lowered:
        return now.replace(hour=12, minute=0, second=0, microsecond=0)
    if "last month" in lowered or "минулого місяця" in lowered:
        return (now - timedelta(days=30)).replace(hour=12, minute=0, second=0, microsecond=0)

    iso_match = re.search(r"\b(20\d{2}-\d{2}-\d{2})\b", text)
    if iso_match:
        parsed = datetime.fromisoformat(iso_match.group(1))
        return parsed.replace(hour=12, minute=0, second=0, microsecond=0, tzinfo=now.tzinfo)

    numeric_match = re.search(r"\b(\d{1,2})[./-](\d{1,2})(?:[./-](20\d{2}))?\b", text)
    if numeric_match:
        day = int(numeric_match.group(1))
        month = int(numeric_match.group(2))
        year = int(numeric_match.group(3) or now.year)
        return datetime(year, month, day, 12, 0, tzinfo=now.tzinfo)

    return now.replace(hour=12, minute=0, second=0, microsecond=0)


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


def _clean_text_for_category(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def parse_transaction_text_local(text: str) -> TransactionParseResponse:
    normalized_text = _normalize_whitespace(text)
    amount = _extract_amount(normalized_text)
    if amount is None or amount <= 0:
        raise ValueError("Could not detect a valid transaction amount")

    transaction_type = _detect_type(normalized_text)
    category = _detect_category(_clean_text_for_category(normalized_text), transaction_type)

    return TransactionParseResponse(
        type=transaction_type,
        amount=amount,
        currency=_detect_currency(normalized_text),
        category=category if category in TRANSACTION_CATEGORIES else "other",
        note=_build_note(normalized_text, amount),
        transaction_date=_parse_relative_date(normalized_text).astimezone(timezone.utc),
        source="ai_text",
        confidence=0.7,
    )


async def parse_transaction_text_with_llm(text: str) -> TransactionParseResponse:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    import os

    EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY", settings.openai_api_key)
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
        "Relative date examples:\n"
        "\"I bought coffee yesterday\" => date should be yesterday\n"
        "\"заробив на фрілансі позавчора\" => date should be the day before yesterday\n\n"
        "Now process the user's input.\n\n"
        f"User input: {text}"
    )

    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=f"parser_{datetime.now().timestamp()}",
        system_message=PARSER_SYSTEM_PROMPT
    ).with_model("openai", "gpt-4o-mini")

    user_message = UserMessage(text=prompt)
    content = await chat.send_message(user_message)

    payload = json.loads(str(content))
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
