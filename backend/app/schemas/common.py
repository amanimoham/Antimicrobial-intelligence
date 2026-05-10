from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PredictIn(BaseModel):
    sample_id: str = Field(..., min_length=1)
    bacteria_name: str | None = None


class PredictionOut(BaseModel):
    id: int
    sample_id: str
    predicted_activity: float
    predicted_mic: float
    resistance_prediction: str
    risk_level: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class DashboardSummary(BaseModel):
    completion_rate: float = Field(..., alias="completionRate")
    current_batch: str = Field(..., alias="currentBatch")
    risk_level: str = Field(..., alias="riskLevel")
    sample_count: int = Field(..., alias="sampleCount")
    prediction_count: int = Field(..., alias="predictionCount")
    risk_up: bool = Field(True, alias="riskUp")

    model_config = {"populate_by_name": True}


class ProgressResponse(BaseModel):
    points: list[dict[str, Any]]


class CompoundOut(BaseModel):
    id: int
    compound_id: str
    compound_name: str
    predicted_activity_score: float
    predicted_toxicity_score: float
    novelty_score: float
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class UploadResponse(BaseModel):
    message: str
    rows_inserted: int
    preview: list[dict[str, Any]]
    refresh_required: bool = True
    totals: dict[str, int] | None = None
    parsing_summary: dict[str, Any] | None = None
    upload_job: dict[str, Any] | None = None
