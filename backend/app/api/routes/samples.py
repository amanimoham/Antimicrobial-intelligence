from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.sample import Sample

router = APIRouter(prefix="/samples", tags=["samples"])


class SampleUpdateBody(BaseModel):
    sample_type: str = Field(..., min_length=1, max_length=32)
    collection_date: str = Field(..., min_length=1, max_length=32)
    bacteria_name: str = Field(..., min_length=1, max_length=128)
    batch_id: str = Field(..., min_length=1, max_length=32)


@router.get("")
def list_samples(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> dict:
    total = db.query(Sample).count()
    offset = (page - 1) * page_size
    rows = (
        db.execute(select(Sample).order_by(Sample.id.desc()).offset(offset).limit(page_size))
        .scalars()
        .all()
    )
    return {
        "items": [
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
        ],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size if total else 0,
        },
    }


@router.put("/{sample_id}")
def update_sample(sample_id: int, body: SampleUpdateBody, db: Session = Depends(get_db)) -> dict:
    row = db.scalar(select(Sample).where(Sample.id == sample_id))
    if row is None:
        raise HTTPException(status_code=404, detail="Sample not found")
    row.sample_type = body.sample_type.strip()
    row.collection_date = body.collection_date.strip()
    row.bacteria_name = body.bacteria_name.strip()
    row.batch_id = body.batch_id.strip()
    db.commit()
    db.refresh(row)
    return {
        "message": "updated",
        "item": {
            "id": row.id,
            "sample_id": row.sample_id,
            "sample_type": row.sample_type,
            "collection_date": row.collection_date,
            "bacteria_name": row.bacteria_name,
            "batch_id": row.batch_id,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        },
        "refresh_required": True,
    }


@router.delete("/{sample_id}")
def delete_sample(sample_id: int, db: Session = Depends(get_db)) -> dict:
    row = db.scalar(select(Sample).where(Sample.id == sample_id))
    if row is None:
        raise HTTPException(status_code=404, detail="Sample not found")
    db.delete(row)
    db.commit()
    return {"message": "deleted", "id": sample_id, "refresh_required": True}
