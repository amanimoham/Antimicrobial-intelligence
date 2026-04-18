from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.dashboard_service import get_pareto, get_progress, get_summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)) -> dict:
    return get_summary(db)


@router.get("/progress")
def dashboard_progress(db: Session = Depends(get_db)) -> dict:
    return get_progress(db)


@router.get("/pareto")
def dashboard_pareto(db: Session = Depends(get_db)) -> dict:
    return get_pareto(db)
