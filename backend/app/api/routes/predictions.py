from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.prediction import Prediction

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("")
def list_predictions(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.execute(select(Prediction).order_by(Prediction.id.desc()).limit(200)).scalars().all()
    return [
        {
            "id": r.id,
            "sample_id": r.sample_id,
            "predicted_activity": r.predicted_activity,
            "predicted_mic": r.predicted_mic,
            "resistance_prediction": r.resistance_prediction,
            "risk_level": r.risk_level,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]
