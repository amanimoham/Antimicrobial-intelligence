from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.compound_service import generate_candidates
from app.services.dashboard_service import get_pareto

router = APIRouter(tags=["generate"])


@router.post("/generate/candidates")
def generate_candidates_endpoint(db: Session = Depends(get_db)) -> dict:
    created, rows = generate_candidates(db)
    pareto = get_pareto(db)
    return {"created": created, "compounds": len(rows), "pareto": pareto["points"]}
