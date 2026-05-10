from __future__ import annotations

import os

import pandas as pd

from app.ml.model_loader import load_model_payload
from app.ml.preprocessing import clean_dataframe
from app.services.prediction_service import predict_from_sample


def infer_scores(sample_id: str, sample_type: str | None, pathogen: str | None, source: str | None) -> dict:
    try:
        payload = load_model_payload()
    except Exception as exc:
        raise RuntimeError(
            f"Failed to load trained model artifacts. Re-train models in current environment. Details: {exc}"
        ) from exc
    if payload is None:
        allow_fallback = os.getenv("ALLOW_PREDICTION_FALLBACK", "false").lower() in {"1", "true", "yes"}
        if not allow_fallback:
            raise RuntimeError(
                "Trained model artifacts are missing. Train models first or set ALLOW_PREDICTION_FALLBACK=true for dev fallback."
            )
        act, mic, label, risk = predict_from_sample(sample_id, pathogen, sample_type)
        score = {"Susceptible": 0.0, "Intermediate": 1.0, "Resistant": 2.0}[label]
        return {
            "activity_score": float(act),
            "mic_score": float(mic),
            "resistance_class": label,
            "resistance_score": score,
            "risk_level": risk,
            "model_source": "fallback-rule",
        }

    X = pd.DataFrame(
        [
            {
                "sample_type": sample_type,
                "pathogen": pathogen,
                "source": source,
                "value": None,
                "molecular_weight": None,
                "logp": None,
                "toxicity_score": None,
                "synthesizability_score": None,
                "date": None,
            }
        ]
    )
    X, _, _ = clean_dataframe(X)
    for f in payload["features"]:
        if f not in X.columns:
            X[f] = None
    X = X[payload["features"]]

    activity = float(payload["activity_model"].predict(X)[0])
    mic = float(payload["mic_model"].predict(X)[0])
    res_score = float(payload["resistance_model"].predict(X)[0])
    if res_score >= 1.5:
        label = "Resistant"
        risk = "High"
    elif res_score >= 0.5:
        label = "Intermediate"
        risk = "Moderate"
    else:
        label = "Susceptible"
        risk = "Low"
    return {
        "activity_score": round(activity, 3),
        "mic_score": round(mic, 3),
        "resistance_class": label,
        "resistance_score": round(res_score, 3),
        "risk_level": risk,
        "model_source": "trained-ml",
    }

