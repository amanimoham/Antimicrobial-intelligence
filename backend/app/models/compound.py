from datetime import datetime

from sqlalchemy import DateTime, Float, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Compound(Base):
    __tablename__ = "compounds"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    compound_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    compound_name: Mapped[str] = mapped_column(String(128))
    predicted_activity_score: Mapped[float] = mapped_column(Float)
    predicted_toxicity_score: Mapped[float] = mapped_column(Float)
    novelty_score: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
