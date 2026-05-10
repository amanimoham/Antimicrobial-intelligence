from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.ingestion_record import IngestionRecord
from app.models.sample import Sample
from app.models.upload_job import UploadJob
from app.services.upload_service import clear_persisted_dataset, ingest_samples, parse_upload

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/data")
async def upload_data(file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict:
    cleared = clear_persisted_dataset(db)
    df = await parse_upload(file)
    inserted, preview, parsing_summary = ingest_samples(db, df)
    upload_job = UploadJob(
        filename=file.filename or "unknown",
        status="completed",
        row_count=parsing_summary.get("rows_in_file", 0),
        valid_rows=parsing_summary.get("valid_rows", 0),
        invalid_rows=parsing_summary.get("invalid_rows", 0),
        created_samples=inserted,
        created_ingestion_rows=parsing_summary.get("ingestion_rows_inserted", 0),
    )
    db.add(upload_job)
    db.commit()
    db.refresh(upload_job)
    total_samples = db.query(Sample).count()
    total_ingestion_rows = db.query(IngestionRecord).count()
    return {
        "message": "ok_replaced",
        "rows_inserted": inserted,
        "preview": preview,
        "refresh_required": True,
        "totals": {"samples": total_samples, "ingestion_rows": total_ingestion_rows},
        "parsing_summary": parsing_summary,
        "replace_mode": True,
        "cleared": cleared,
        "upload_job": {
            "id": upload_job.id,
            "filename": upload_job.filename,
            "status": upload_job.status,
            "row_count": upload_job.row_count,
            "valid_rows": upload_job.valid_rows,
            "invalid_rows": upload_job.invalid_rows,
            "uploaded_at": upload_job.uploaded_at.isoformat() if upload_job.uploaded_at else None,
        },
    }
