# AI Finance Assistant (Backend)

This repository contains the **backend of the AI Finance Assistant**, built with **FastAPI** and **PostgreSQL**, including AI assistant logic via OpenAI integration.  
Frontend is not included yet; the backend is fully ready for local development and testing.

---

## Features

- REST API built with FastAPI  
- User, Survey, Message, Feedback, and Assistant models  
- AI assistant logic integrated with OpenAI  
- Database migrations handled via Alembic  
- Logging configuration included  
- Fully ready for local development and testing

---

## How to Run Locally

1. **Create a `.env` file** with required environment variables:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost/dbname
OPENAI_API_KEY=your_openai_key

	2.	Install dependencies:

poetry install

	3.	Run database migrations:

alembic upgrade head

	4.	Start the FastAPI app:

uvicorn app.main:app --reload

	5.	Access API documentation:

http://localhost:8000/docs



Notes
	•	Backend is fully functional; deployment and frontend are not included yet.
	•	Designed for local development and future frontend integration.
