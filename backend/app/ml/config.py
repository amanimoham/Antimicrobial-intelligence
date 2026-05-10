from __future__ import annotations

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
ARTIFACT_DIR = BASE_DIR / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "trained_models.joblib"
METRICS_PATH = ARTIFACT_DIR / "model_metrics.json"
REPORT_PATH = ARTIFACT_DIR / "model_report.json"

RANDOM_SEED = 42
TEST_SIZE = 0.15
VAL_SIZE = 0.15
TUNING_ITER = 12

FEATURES = [
    "sample_type",
    "pathogen",
    "source",
    "value",
    "molecular_weight",
    "logp",
    "toxicity_score",
    "synthesizability_score",
    "date_year",
    "date_month",
    "date_dayofweek",
    "value_x_logp",
    "toxicity_x_synth",
    "mw_over_logp",
]

CATEGORICAL_FEATURES = ["sample_type", "pathogen", "source"]
NUMERIC_FEATURES = [
    "value",
    "molecular_weight",
    "logp",
    "toxicity_score",
    "synthesizability_score",
    "date_year",
    "date_month",
    "date_dayofweek",
    "value_x_logp",
    "toxicity_x_synth",
    "mw_over_logp",
]

