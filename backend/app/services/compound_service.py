from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.compound import Compound


def generate_candidates(db: Session) -> tuple[int, list[Compound]]:
    created = 0
    for i in range(1, 8):
        cid = f"CMP-{200 + i}"
        if db.scalar(select(Compound).where(Compound.compound_id == cid)):
            continue
        db.add(
            Compound(
                compound_id=cid,
                compound_name=f"Compumunde-{i}",
                predicted_activity_score=round(0.55 + i * 0.04, 3),
                predicted_toxicity_score=round(0.42 - i * 0.02, 3),
                novelty_score=round(0.5 + i * 0.05, 3),
            )
        )
        created += 1
    db.commit()
    rows = db.execute(select(Compound).order_by(Compound.id.desc()).limit(40)).scalars().all()
    return created, list(rows)
