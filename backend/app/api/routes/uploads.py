from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.upload_service import ingest_samples, parse_upload

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/data")
async def upload_data(file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict:
    df = await parse_upload(file)
    inserted, preview = ingest_samples(db, df)
    return {"message": "ok", "rows_inserted": inserted, "preview": preview}
