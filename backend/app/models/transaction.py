from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # income | expense
    amount = Column(Numeric(12, 2), nullable=False)
    amount_pln = Column(Numeric(12, 2), nullable=False, server_default="0")
    exchange_rate = Column(Numeric(12, 6), nullable=False, server_default="1")
    currency = Column(String, nullable=False, server_default="PLN")
    category = Column(String, nullable=False)
    note = Column(String, nullable=True)
    transaction_date = Column(DateTime(timezone=True), nullable=False)
    source = Column(String, nullable=False, server_default="manual")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    user = relationship("User", backref="transactions")
