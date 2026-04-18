from __future__ import annotations

from io import BytesIO
from typing import Any

import pandas as pd
from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.sample import Sample


REQUIRED = {"sample_id", "sample_type", "collection_date", "bacteria_name", "batch_id"}


async def parse_upload(file: UploadFile) -> pd.DataFrame:
    name = file.filename or ""
    data = await file.read()
    try:
        if name.lower().endswith(".csv"):
            return pd.read_csv(BytesIO(data))
        if name.lower().endswith(".xlsx"):
            return pd.read_excel(BytesIO(data))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {exc}") from exc
    raise HTTPException(status_code=400, detail="Use CSV or XLSX")


def ingest_samples(db: Session, df: pd.DataFrame) -> tuple[int, list[dict[str, Any]]]:
    missing = REQUIRED - set(df.columns)
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing columns: {sorted(missing)}")
    preview: list[dict[str, Any]] = []
    inserted = 0
    for i, row in df.iterrows():
        rec = {k: row.get(k) for k in REQUIRED}
        if i < 5:
            preview.append({str(k): str(v) if v is not None else "" for k, v in rec.items()})
        sid = str(row["sample_id"])
        if db.scalar(select(Sample).where(Sample.sample_id == sid)):
            continue
        db.add(
            Sample(
                sample_id=sid,
                sample_type=str(row["sample_type"]),
                collection_date=str(row["collection_date"]),
                bacteria_name=str(row["bacteria_name"]),
                batch_id=str(row["batch_id"]),
            )
        )
        inserted += 1
    db.commit()
    return inserted, preview
