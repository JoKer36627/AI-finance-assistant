from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Імпортуємо всі моделі прямо сюди, щоб Alembic бачив FK
from app.models.user import User
from app.models.survey import SurveyResult
from app.models.message import Message
from app.models.feedback import Feedback
