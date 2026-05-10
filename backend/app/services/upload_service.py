from __future__ import annotations

from io import BytesIO
from typing import Any

import pandas as pd
from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ingestion_record import IngestionRecord
from app.models.compound import Compound
from app.models.prediction import Prediction
from app.models.sample import Sample
from app.services.column_normalizer import (
    accepted_aliases_for,
    normalize_headers,
    normalize_row_values,
)


REQUIRED_CANONICAL = {"sample_id"}


def _to_float(v: Any) -> float | None:
    if v is None:
        return None
    try:
        if pd.isna(v):
            return None
    except Exception:
        pass
    try:
        return float(v)
    except Exception:
        return None


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


def _validate_required_canonical(df: pd.DataFrame) -> list[str]:
    missing = [f for f in REQUIRED_CANONICAL if f not in df.columns]
    return missing


def ingest_samples(db: Session, df: pd.DataFrame) -> tuple[int, list[dict[str, Any]], dict[str, Any]]:
    normalized_df, summary = normalize_headers(df)
    normalized_df = normalize_row_values(normalized_df)

    missing = _validate_required_canonical(normalized_df)
    if missing:
        accepted = {m: accepted_aliases_for(m) for m in missing}
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Missing required canonical fields after normalization.",
                "missing_required_fields": missing,
                "accepted_aliases": accepted,
                "parsing_summary": summary,
            },
        )

    preview: list[dict[str, Any]] = []
    inserted = 0
    valid_rows = 0
    invalid_rows = 0
    ingestion_rows = 0
    for i, row in normalized_df.iterrows():
        rec = {k: row.get(k) for k in normalized_df.columns}
        if i < 5:
            preview.append({str(k): str(v) if v is not None else "" for k, v in rec.items()})
        sid = str(row.get("sample_id") or "").strip()
        if not sid:
            invalid_rows += 1
            continue
        valid_rows += 1
        db.add(
            IngestionRecord(
                sample_id=sid,
                sample_type=(str(row.get("sample_type")) if row.get("sample_type") is not None else None),
                pathogen=(str(row.get("pathogen")) if row.get("pathogen") is not None else None),
                source=(str(row.get("source")) if row.get("source") is not None else None),
                date=(str(row.get("date")) if row.get("date") is not None else None),
                value=_to_float(row.get("value")),
                compound_code=(str(row.get("compound_code")) if row.get("compound_code") is not None else None),
                compound_name=(str(row.get("compound_name")) if row.get("compound_name") is not None else None),
                smiles=(str(row.get("smiles")) if row.get("smiles") is not None else None),
                molecular_weight=_to_float(row.get("molecular_weight")),
                logp=_to_float(row.get("logp")),
                toxicity_score=_to_float(row.get("toxicity_score")),
                synthesizability_score=_to_float(row.get("synthesizability_score")),
                activity_score=_to_float(row.get("activity_score")),
                mic_score=_to_float(row.get("mic_score")),
                resistance_score=_to_float(row.get("resistance_score")),
            )
        )
        ingestion_rows += 1
        if db.scalar(select(Sample).where(Sample.sample_id == sid)):
            continue
        sample_type = row.get("sample_type") or "Unknown"
        pathogen = row.get("pathogen") or "Unknown"
        # Keep internal DB schema unchanged.
        date_value = row.get("date") or pd.Timestamp.today().strftime("%Y-%m-%d")
        batch_id = row.get("source") or "4"
        db.add(
            Sample(
                sample_id=sid,
                sample_type=str(sample_type),
                collection_date=str(date_value),
                bacteria_name=str(pathogen),
                batch_id=str(batch_id),
            )
        )
        inserted += 1
    db.commit()
    summary["missing_required_fields"] = missing
    summary["rows_in_file"] = int(len(normalized_df))
    summary["rows_inserted"] = inserted
    summary["valid_rows"] = valid_rows
    summary["invalid_rows"] = invalid_rows
    summary["ingestion_rows_inserted"] = ingestion_rows
    return inserted, preview, summary


def clear_persisted_dataset(db: Session) -> dict[str, int]:
    # Replace-mode upload: old persisted dataset and derived records are removed.
    removed_ingestion = db.query(IngestionRecord).delete()
    removed_samples = db.query(Sample).delete()
    removed_predictions = db.query(Prediction).delete()
    removed_compounds = db.query(Compound).delete()
    db.commit()
    return {
        "removed_ingestion_rows": int(removed_ingestion or 0),
        "removed_samples": int(removed_samples or 0),
        "removed_predictions": int(removed_predictions or 0),
        "removed_compounds": int(removed_compounds or 0),
    }
