from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Sample(Base):
    __tablename__ = "samples"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sample_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    sample_type: Mapped[str] = mapped_column(String(32))
    collection_date: Mapped[str] = mapped_column(String(32))
    bacteria_name: Mapped[str] = mapped_column(String(128))
    batch_id: Mapped[str] = mapped_column(String(32), default="4")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
