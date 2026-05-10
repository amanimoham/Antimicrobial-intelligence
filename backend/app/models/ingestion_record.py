from datetime import datetime

from sqlalchemy import DateTime, Float, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class IngestionRecord(Base):
    __tablename__ = "ingestion_records"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sample_id: Mapped[str] = mapped_column(String(64), index=True)
    sample_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    pathogen: Mapped[str | None] = mapped_column(String(128), nullable=True)
    source: Mapped[str | None] = mapped_column(String(64), nullable=True)
    date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    value: Mapped[float | None] = mapped_column(Float, nullable=True)
    compound_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    compound_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    smiles: Mapped[str | None] = mapped_column(String(512), nullable=True)
    molecular_weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    logp: Mapped[float | None] = mapped_column(Float, nullable=True)
    toxicity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    synthesizability_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    activity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    mic_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    resistance_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

