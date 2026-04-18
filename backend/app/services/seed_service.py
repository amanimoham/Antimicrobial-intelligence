"""Seed SQLite with demo rows if empty."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.compound import Compound
from app.models.sample import Sample


def seed_if_empty(db: Session) -> dict:
    if db.scalar(select(Sample).limit(1)):
        return {"seeded": False}
    samples = [
        ("SAMP123", "Blood", "01/02/24", "Escherichia coli", "4"),
        ("123456789", "Urine", "01/02/24", "Klebsiella pneumoniae", "4"),
        ("SMP-003", "Sputum", "01/03/24", "Staphylococcus aureus", "4"),
    ]
    for sid, st, cd, bac, bid in samples:
        db.add(Sample(sample_id=sid, sample_type=st, collection_date=cd, bacteria_name=bac, batch_id=bid))
    for i in range(1, 4):
        db.add(
            Compound(
                compound_id=f"CMP-SEED-{i}",
                compound_name="Compumunde",
                predicted_activity_score=0.72 + i * 0.02,
                predicted_toxicity_score=0.28,
                novelty_score=0.61,
            )
        )
    db.commit()
    return {"seeded": True, "samples": len(samples), "compounds": 3}
