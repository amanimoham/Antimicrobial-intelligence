from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import compounds, dashboard, generate, health, predict, predictions, samples, uploads
from app.db.session import SessionLocal, init_db
from app.services.seed_service import seed_if_empty

init_db()

app = FastAPI(title="Antibacterial Generation and Resistance Prediction Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):3[0-9]{3}",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(predictions.router, prefix="/api")
app.include_router(compounds.router, prefix="/api")
app.include_router(samples.router, prefix="/api")
app.include_router(uploads.router, prefix="/api")
app.include_router(generate.router, prefix="/api")
app.include_router(predict.router, prefix="/api")


@app.on_event("startup")
def startup_seed() -> None:
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
