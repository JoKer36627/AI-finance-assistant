# Monefy AI Tracker - PRD

## Problem Statement
Переробити існуючий веб-додаток фінансового трекера (Xoraq Finance) у мобільну версію у стилі Monefy з AI чатом та неформальним записом транзакцій.

## Architecture
- **Backend**: FastAPI + PostgreSQL + Redis + OpenAI (через emergentintegrations)
- **Frontend**: Vanilla JS + Chart.js (mobile-first)
- **Auth**: JWT email/password
- **AI**: GPT-4o-mini через Emergent LLM Key

## What's Been Implemented (2026-04-11)
- Мобільний інтерфейс у стилі Monefy (зелена тема, кругова діаграма)
- Кнопки +/- для швидкого додавання доходів/витрат
- AI чат як спливаюче вікно (FAB справа внизу)
- AI запис неформальних транзакцій (парсинг тексту)
- Бічне меню з навігацією
- Список транзакцій з видаленням
- Вибір періоду (День/Тиждень/Місяць/Рік)
- Numpad калькулятор
- Seed-дані для демо
- Auth flow: реєстрація → верифікація → автологін

## Testing Status
- Backend: 12/12 endpoints (100%)
- Frontend: All core flows (100%)
- AI Chat: Working via emergentintegrations

## Backlog
- P1: Редагування транзакцій (inline edit)
- P1: Експорт даних (CSV)
- P2: Мультивалютність з конвертацією
- P2: Кастомні категорії
- P3: Push-сповіщення про бюджет
- P3: Графіки трендів (line/bar charts)
