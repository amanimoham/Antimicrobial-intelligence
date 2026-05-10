from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.ml_pipeline import load_latest_metrics, load_latest_report, train_models

router = APIRouter(prefix="/train", tags=["train"])


@router.post("/models")
def train_models_endpoint(db: Session = Depends(get_db)) -> dict:
    try:
        metrics = train_models(db)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"message": "training_complete", "metrics": metrics, "refresh_required": True}


@router.get("/metrics")
def get_training_metrics() -> dict:
    return load_latest_metrics()


@router.get("/report")
def get_training_report() -> dict:
    return load_latest_report()

