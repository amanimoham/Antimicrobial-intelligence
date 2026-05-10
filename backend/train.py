from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

from app.db.session import SessionLocal, init_db
from app.ml.config import METRICS_PATH, MODEL_PATH, REPORT_PATH
from app.models.ingestion_record import IngestionRecord
from app.services.ml_pipeline import train_models


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Train ML models from CSV/XLSX dataset.")
    p.add_argument("--dataset", type=str, required=True, help="Path to CSV/XLSX file")
    p.add_argument("--truncate", action="store_true", help="Clear ingestion_records before loading dataset")
    p.add_argument("--clean-artifacts", action="store_true", help="Delete existing model artifacts before training")
    return p.parse_args()


def _read_dataset(path: Path) -> pd.DataFrame:
    if path.suffix.lower() == ".csv":
        return pd.read_csv(path)
    if path.suffix.lower() in {".xlsx", ".xls"}:
        return pd.read_excel(path)
    raise ValueError("Dataset must be CSV/XLSX")


def _to_float(v):
    try:
        return None if pd.isna(v) else float(v)
    except Exception:
        return None


def main() -> None:
    args = parse_args()
    dataset = Path(args.dataset).expanduser().resolve()
    if not dataset.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset}")

    init_db()
    df = _read_dataset(dataset)
    required = {
        "sample_id",
        "sample_type",
        "pathogen",
        "source",
        "date",
        "value",
        "compound_code",
        "compound_name",
        "smiles",
        "molecular_weight",
        "logp",
        "toxicity_score",
        "synthesizability_score",
        "activity_score",
        "mic_score",
        "resistance_score",
    }
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Dataset missing required columns: {sorted(missing)}")

    db = SessionLocal()
    try:
        if args.clean_artifacts:
            for path in (MODEL_PATH, METRICS_PATH, REPORT_PATH):
                if path.exists():
                    path.unlink()
            print("Deleted old artifacts.")
        if args.truncate:
            db.query(IngestionRecord).delete()
            db.commit()

        inserted = 0
        for _, row in df.iterrows():
            sid = str(row.get("sample_id") or "").strip()
            if not sid:
                continue
            rec = IngestionRecord(
                sample_id=sid,
                sample_type=str(row.get("sample_type")) if row.get("sample_type") is not None else None,
                pathogen=str(row.get("pathogen")) if row.get("pathogen") is not None else None,
                source=str(row.get("source")) if row.get("source") is not None else None,
                date=str(row.get("date")) if row.get("date") is not None else None,
                value=_to_float(row.get("value")),
                compound_code=str(row.get("compound_code")) if row.get("compound_code") is not None else None,
                compound_name=str(row.get("compound_name")) if row.get("compound_name") is not None else None,
                smiles=str(row.get("smiles")) if row.get("smiles") is not None else None,
                molecular_weight=_to_float(row.get("molecular_weight")),
                logp=_to_float(row.get("logp")),
                toxicity_score=_to_float(row.get("toxicity_score")),
                synthesizability_score=_to_float(row.get("synthesizability_score")),
                activity_score=_to_float(row.get("activity_score")),
                mic_score=_to_float(row.get("mic_score")),
                resistance_score=_to_float(row.get("resistance_score")),
            )
            db.add(rec)
            inserted += 1
        db.commit()
        print(f"Loaded rows into ingestion_records: {inserted}")
        metrics = train_models(db)
        print("Training complete.")
        print(metrics)
        if REPORT_PATH.exists():
            print(f"Detailed report: {REPORT_PATH}")
    finally:
        db.close()


if __name__ == "__main__":
    main()

