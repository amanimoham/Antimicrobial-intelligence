from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.compound_service import generate_candidates
from app.services.dashboard_service import get_pareto

router = APIRouter(tags=["generate"])


class GenerateCandidatesBody(BaseModel):
    sample_id: str | None = None
    pathogen: str | None = None


@router.post("/generate/candidates")
def generate_candidates_endpoint(body: GenerateCandidatesBody | None = None, db: Session = Depends(get_db)) -> dict:
    payload = body or GenerateCandidatesBody()
    created, rows = generate_candidates(db, sample_id=payload.sample_id, pathogen=payload.pathogen)
    pareto = get_pareto(db)
    return {
        "created": created,
        "compounds": len(rows),
        "pareto": pareto["points"],
        "used_sample_id": payload.sample_id,
        "refresh_required": True,
    }
