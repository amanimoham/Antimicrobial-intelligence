from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker

from app.config import DATABASE_URL
from app.db.base import Base

engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def init_db() -> None:
    import app.models  # noqa: F401 — register models on Base.metadata
    try:
        Base.metadata.create_all(bind=engine)
    except OperationalError as exc:
        # In reload/race startup scenarios on SQLite, tolerate "already exists".
        if "already exists" not in str(exc).lower():
            raise
    _ensure_ingestion_record_columns()


def _ensure_ingestion_record_columns() -> None:
    # Lightweight SQLite-safe schema evolution for local dev.
    with engine.begin() as conn:
        try:
            columns = {
                row[1]
                for row in conn.execute(text("PRAGMA table_info('ingestion_records')")).fetchall()
            }
        except Exception:
            return
        for col in ("activity_score", "mic_score", "resistance_score"):
            if col not in columns:
                conn.execute(text(f"ALTER TABLE ingestion_records ADD COLUMN {col} FLOAT"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
