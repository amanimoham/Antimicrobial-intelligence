from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.compound import Compound
from app.models.prediction import Prediction
from app.models.sample import Sample


def get_summary(db: Session) -> dict:
    sample_count = db.scalar(select(func.count()).select_from(Sample)) or 0
    pred_count = db.scalar(select(func.count()).select_from(Prediction)) or 0
    completion = 70.0 if sample_count == 0 else round((pred_count / max(sample_count, 1)) * 100, 1)
    latest_risk = db.scalar(select(Prediction.risk_level).order_by(Prediction.id.desc()).limit(1)) or "Moderate"
    batch = db.scalar(select(Sample.batch_id).order_by(Sample.id.desc()).limit(1)) or "4"
    # risk "up" if latest prediction is not Low
    risk_up = latest_risk in ("High", "Moderate")
    return {
        "completionRate": min(100.0, completion),
        "currentBatch": str(batch),
        "riskLevel": latest_risk,
        "sampleCount": sample_count,
        "predictionCount": pred_count,
        "riskUp": risk_up,
    }


def get_progress(db: Session) -> dict:
    samples = db.scalar(select(func.count()).select_from(Sample)) or 0
    preds = db.scalar(select(func.count()).select_from(Prediction)) or 0
    base = [12, 20, 32, 44, 52, 64, 72]
    boost = min(18, samples + preds)
    points = [{"name": d, "value": min(100, v + boost // 3)} for d, v in zip(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], base)]
    return {"points": points}


def get_pareto(db: Session) -> dict:
    rows = db.execute(select(Compound).order_by(Compound.id.desc()).limit(30)).scalars().all()
    if not rows:
        return {
            "points": [
                {"x": 0.45, "y": 0.55, "group": "A", "label": "sim-1"},
                {"x": 0.62, "y": 0.38, "group": "B", "label": "sim-2"},
                {"x": 0.58, "y": 0.42, "group": "B", "label": "sim-3"},
            ]
        }
    pts = []
    for c in rows:
        pts.append(
            {
                "x": round(c.predicted_activity_score, 3),
                "y": round(c.predicted_toxicity_score, 3),
                "group": "B" if c.predicted_toxicity_score < 0.32 else "A",
                "label": c.compound_id,
            }
        )
    return {"points": pts}
