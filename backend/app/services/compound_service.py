from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.compound import Compound


def generate_candidates(db: Session, sample_id: str | None = None, pathogen: str | None = None) -> tuple[int, list[Compound]]:
    base_seed = 200
    if sample_id:
        try:
            base_seed += int("".join(ch for ch in sample_id if ch.isdigit())[-2:] or "0")
        except Exception:
            base_seed += 0
    name_hint = (pathogen or "Compumunde").split(" ")[0].strip().title() or "Compumunde"
    created = 0
    for i in range(1, 8):
        cid = f"CMP-{base_seed + i}"
        if db.scalar(select(Compound).where(Compound.compound_id == cid)):
            continue
        db.add(
            Compound(
                compound_id=cid,
                compound_name=f"{name_hint}-{i}",
                predicted_activity_score=round(0.55 + i * 0.04, 3),
                predicted_toxicity_score=round(0.42 - i * 0.02, 3),
                novelty_score=round(0.5 + i * 0.05, 3),
            )
        )
        created += 1
    db.commit()
    rows = db.execute(select(Compound).order_by(Compound.id.desc()).limit(40)).scalars().all()
    return created, list(rows)
