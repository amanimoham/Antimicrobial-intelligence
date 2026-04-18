from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.compound import Compound

router = APIRouter(prefix="/compounds", tags=["compounds"])


@router.get("")
def list_compounds(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.execute(select(Compound).order_by(Compound.id.desc()).limit(100)).scalars().all()
    return [
        {
            "id": r.id,
            "compound_id": r.compound_id,
            "compound_name": r.compound_name,
            "predicted_activity_score": r.predicted_activity_score,
            "predicted_toxicity_score": r.predicted_toxicity_score,
            "novelty_score": r.novelty_score,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]
