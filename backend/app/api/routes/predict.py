from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.prediction import Prediction
from app.models.sample import Sample
from app.services.prediction_service import predict_from_sample

router = APIRouter(tags=["predict"])


class PredictBody(BaseModel):
    sample_id: str = Field(..., min_length=1)
    bacteria_name: str | None = None


@router.post("/predict")
def predict_endpoint(body: PredictBody, db: Session = Depends(get_db)) -> dict:
    sample = db.scalar(select(Sample).where(Sample.sample_id == body.sample_id))
    bacteria = body.bacteria_name or (sample.bacteria_name if sample else None)
    sample_type = sample.sample_type if sample else None
    if bacteria is None:
        raise HTTPException(status_code=400, detail="Provide bacteria_name or upload a sample with this sample_id")

    act, mic, label, risk = predict_from_sample(body.sample_id, bacteria, sample_type)
    rec = Prediction(
        sample_id=body.sample_id,
        predicted_activity=act,
        predicted_mic=mic,
        resistance_prediction=label,
        risk_level=risk,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return {
        "id": rec.id,
        "sample_id": rec.sample_id,
        "predicted_activity": rec.predicted_activity,
        "predicted_mic": rec.predicted_mic,
        "resistance_prediction": rec.resistance_prediction,
        "risk_level": rec.risk_level,
        "created_at": rec.created_at.isoformat() if rec.created_at else None,
    }
