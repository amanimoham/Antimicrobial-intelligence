from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.sample import Sample

router = APIRouter(prefix="/samples", tags=["samples"])


@router.get("")
def list_samples(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.execute(select(Sample).order_by(Sample.id.desc()).limit(50)).scalars().all()
    return [
        {
            "id": r.id,
            "sample_id": r.sample_id,
            "sample_type": r.sample_type,
            "collection_date": r.collection_date,
            "bacteria_name": r.bacteria_name,
            "batch_id": r.batch_id,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]
