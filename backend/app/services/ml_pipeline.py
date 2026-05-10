"""Trainable ML pipeline for activity/mic/resistance predictions."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import RandomizedSearchCV, train_test_split
from sklearn.pipeline import Pipeline
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ml.config import RANDOM_SEED, TEST_SIZE, TUNING_ITER, VAL_SIZE
from app.ml.model_loader import load_metrics, load_model_payload, load_report, save_artifacts
from app.ml.preprocessing import build_preprocessor, clean_dataframe, prepare_train_features
from app.models.ingestion_record import IngestionRecord

try:
    from xgboost import XGBRegressor  # type: ignore
except Exception:  # pragma: no cover
    XGBRegressor = None

try:
    from lightgbm import LGBMRegressor  # type: ignore
except Exception:  # pragma: no cover
    LGBMRegressor = None

def load_training_dataframe(db: Session) -> tuple[pd.DataFrame, list[str], list[str]]:
    rows = db.execute(select(IngestionRecord).order_by(IngestionRecord.id.asc())).scalars().all()
    if not rows:
        return pd.DataFrame(), [], []
    data = pd.DataFrame(
        [
            {
                "sample_id": r.sample_id,
                "sample_type": r.sample_type,
                "pathogen": r.pathogen,
                "source": r.source,
                "value": r.value,
                "molecular_weight": r.molecular_weight,
                "logp": r.logp,
                "toxicity_score": r.toxicity_score,
                "synthesizability_score": r.synthesizability_score,
                "smiles": r.smiles,
                "date": r.date,
                "activity_score": r.activity_score,
                "mic_score": r.mic_score,
                "resistance_score": r.resistance_score,
            }
            for r in rows
        ]
    )
    if data.empty:
        return data, [], []
    data, cat_features, num_features = clean_dataframe(data)
    data["activity_score"] = pd.to_numeric(data["activity_score"], errors="coerce")
    data["mic_score"] = pd.to_numeric(data["mic_score"], errors="coerce")
    data["resistance_score"] = pd.to_numeric(data["resistance_score"], errors="coerce")
    data = data.dropna(subset=["activity_score", "mic_score", "resistance_score"]).copy()
    features = cat_features + num_features
    return data, features, num_features


def _regression_candidates(random_state: int) -> dict[str, Any]:
    models: dict[str, Any] = {
        "rf": RandomForestRegressor(n_estimators=300, random_state=random_state, n_jobs=-1),
        "gbr": GradientBoostingRegressor(random_state=random_state),
    }
    if XGBRegressor is not None:
        models["xgb"] = XGBRegressor(
            n_estimators=400,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            random_state=random_state,
            n_jobs=-1,
        )
    if LGBMRegressor is not None:
        models["lgbm"] = LGBMRegressor(
            n_estimators=400,
            learning_rate=0.05,
            random_state=random_state,
        )
    return models


def _regression_param_distributions(name: str) -> dict[str, list[Any]]:
    if name == "rf":
        return {
            "model__n_estimators": [200, 300, 500, 700],
            "model__max_depth": [None, 6, 10, 14, 20],
            "model__min_samples_split": [2, 4, 8],
            "model__min_samples_leaf": [1, 2, 4],
            "model__max_features": ["sqrt", "log2", None],
        }
    if name == "gbr":
        return {
            "model__n_estimators": [150, 250, 400, 600],
            "model__learning_rate": [0.02, 0.05, 0.08, 0.1],
            "model__max_depth": [2, 3, 4, 5],
            "model__subsample": [0.7, 0.85, 1.0],
            "model__min_samples_split": [2, 4, 8],
        }
    if name == "xgb":
        return {
            "model__n_estimators": [250, 400, 600, 800],
            "model__max_depth": [4, 6, 8],
            "model__learning_rate": [0.02, 0.05, 0.08],
            "model__subsample": [0.7, 0.85, 1.0],
            "model__colsample_bytree": [0.7, 0.85, 1.0],
            "model__reg_alpha": [0.0, 0.1, 1.0],
            "model__reg_lambda": [1.0, 2.0, 4.0],
        }
    if name == "lgbm":
        return {
            "model__n_estimators": [250, 400, 600, 800],
            "model__learning_rate": [0.02, 0.05, 0.08],
            "model__num_leaves": [15, 31, 63],
            "model__subsample": [0.7, 0.85, 1.0],
            "model__colsample_bytree": [0.7, 0.85, 1.0],
            "model__min_child_samples": [10, 20, 40],
        }
    return {}


def _score_regression(y_true: pd.Series, pred: np.ndarray) -> dict[str, float]:
    return {
        "mae": float(mean_absolute_error(y_true, pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_true, pred))),
        "r2": float(r2_score(y_true, pred)),
    }


def _fit_tuned_model(
    base_pipe: Pipeline,
    name: str,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    n_iter: int = TUNING_ITER,
) -> tuple[Pipeline, dict[str, Any]]:
    params = _regression_param_distributions(name)
    if not params:
        base_pipe.fit(X_train, y_train)
        return base_pipe, {"mode": "no_tuning", "best_params": {}}
    tuner = RandomizedSearchCV(
        estimator=base_pipe,
        param_distributions=params,
        n_iter=min(n_iter, sum(len(v) for v in params.values())),
        scoring="neg_root_mean_squared_error",
        cv=3,
        random_state=RANDOM_SEED,
        n_jobs=-1,
    )
    tuner.fit(X_train, y_train)
    return tuner.best_estimator_, {
        "mode": "random_search_cv",
        "best_params": tuner.best_params_,
        "best_cv_rmse": float(-tuner.best_score_),
    }


def _select_and_tune_regressor(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: pd.DataFrame,
    y_val: pd.Series,
    num_features: list[str],
) -> tuple[str, Pipeline, dict[str, Any], list[dict[str, Any]]]:
    prep = build_preprocessor(["sample_type", "pathogen", "source"], num_features)
    candidates = _regression_candidates(random_state=RANDOM_SEED)
    best_name = ""
    best_pipe: Pipeline | None = None
    best_val_rmse = float("inf")
    best_tuning: dict[str, Any] = {}
    leaderboard: list[dict[str, Any]] = []

    for name, model in candidates.items():
        pipe = Pipeline([("prep", prep), ("model", model)])
        tuned_pipe, tuning_info = _fit_tuned_model(pipe, name, X_train, y_train)
        val_pred = tuned_pipe.predict(X_val)
        val_scores = _score_regression(y_val, val_pred)
        row = {"model": name, "validation": val_scores, "tuning": tuning_info}
        leaderboard.append(row)
        if val_scores["rmse"] < best_val_rmse:
            best_val_rmse = val_scores["rmse"]
            best_name = name
            best_pipe = tuned_pipe
            best_tuning = tuning_info
    assert best_pipe is not None
    return best_name, best_pipe, best_tuning, leaderboard


def train_models(db: Session) -> dict[str, Any]:
    data, features, num_features = load_training_dataframe(db)
    if data.empty or len(data) < 20:
        raise ValueError("Not enough data to train. Need at least 20 ingestion rows.")

    X = data[features].copy()
    y_act = data["activity_score"].astype(float)
    y_mic = data["mic_score"].astype(float)
    y_res = data["resistance_score"].astype(float)
    X = prepare_train_features(X, ["sample_type", "pathogen", "source"])
    train_ratio = 1.0 - TEST_SIZE - VAL_SIZE
    if train_ratio <= 0:
        raise ValueError("Invalid split ratios: train ratio must be positive")

    X_train, X_temp, y_act_train, y_act_temp = train_test_split(
        X, y_act, test_size=(TEST_SIZE + VAL_SIZE), random_state=RANDOM_SEED
    )
    _, _, y_mic_train, y_mic_temp = train_test_split(
        X, y_mic, test_size=(TEST_SIZE + VAL_SIZE), random_state=RANDOM_SEED
    )
    _, _, y_res_train, y_res_temp = train_test_split(
        X, y_res, test_size=(TEST_SIZE + VAL_SIZE), random_state=RANDOM_SEED
    )
    val_fraction_of_temp = VAL_SIZE / (TEST_SIZE + VAL_SIZE)
    X_val, X_test, y_act_val, y_act_test = train_test_split(
        X_temp, y_act_temp, test_size=(1.0 - val_fraction_of_temp), random_state=RANDOM_SEED
    )
    _, _, y_mic_val, y_mic_test = train_test_split(
        X_temp, y_mic_temp, test_size=(1.0 - val_fraction_of_temp), random_state=RANDOM_SEED
    )
    _, _, y_res_val, y_res_test = train_test_split(
        X_temp, y_res_temp, test_size=(1.0 - val_fraction_of_temp), random_state=RANDOM_SEED
    )

    act_name, act_model, act_tuning, act_leaderboard = _select_and_tune_regressor(
        X_train, y_act_train, X_val, y_act_val, num_features
    )
    mic_name, mic_model, mic_tuning, mic_leaderboard = _select_and_tune_regressor(
        X_train, y_mic_train, X_val, y_mic_val, num_features
    )
    res_name, res_model, res_tuning, res_leaderboard = _select_and_tune_regressor(
        X_train, y_res_train, X_val, y_res_val, num_features
    )

    act_test_scores = _score_regression(y_act_test, act_model.predict(X_test))
    mic_test_scores = _score_regression(y_mic_test, mic_model.predict(X_test))
    res_test_scores = _score_regression(y_res_test, res_model.predict(X_test))

    artifact = {
        "activity_model": act_model,
        "mic_model": mic_model,
        "resistance_model": res_model,
        "features": features,
        "categorical_features": ["sample_type", "pathogen", "source"],
        "labels": {0: "Susceptible", 1: "Intermediate", 2: "Resistant"},
        "split": {"train_ratio": train_ratio, "val_size": VAL_SIZE, "test_size": TEST_SIZE},
    }
    metrics = {
        "rows_used": int(len(data)),
        "split": {
            "train_rows": int(len(X_train)),
            "val_rows": int(len(X_val)),
            "test_rows": int(len(X_test)),
        },
        "models": {
            "activity_score": {"selected": act_name, **act_test_scores},
            "mic_score": {"selected": mic_name, **mic_test_scores},
            "resistance_score": {"selected": res_name, **res_test_scores},
        },
    }
    report = {
        "rows_used": int(len(data)),
        "feature_count": len(features),
        "features": features,
        "split": metrics["split"],
        "comparisons": {
            "activity_score": {"leaderboard": act_leaderboard, "selected": act_name, "tuning": act_tuning},
            "mic_score": {"leaderboard": mic_leaderboard, "selected": mic_name, "tuning": mic_tuning},
            "resistance_score": {"leaderboard": res_leaderboard, "selected": res_name, "tuning": res_tuning},
        },
        "test_scores": metrics["models"],
    }
    save_artifacts(artifact, metrics, report)
    return metrics


def _fallback_scores(sample_id: str, bacteria_name: str | None, sample_type: str | None) -> dict[str, Any]:
    from app.services.prediction_service import predict_from_sample

    act, mic, label, risk = predict_from_sample(sample_id, bacteria_name, sample_type)
    return {
        "activity_score": float(act),
        "mic_score": float(mic),
        "resistance_class": label,
        "resistance_score": float({ "Susceptible": 0, "Intermediate": 1, "Resistant": 2 }[label]),
        "risk_level": risk,
        "model_source": "fallback-rule",
    }


def predict_with_trained_model(sample_id: str, sample_type: str | None, pathogen: str | None, source: str | None) -> dict[str, Any]:
    payload = load_model_payload()
    if payload is None:
        return _fallback_scores(sample_id, pathogen, sample_type)
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
        res_label = "Resistant"
    elif res_score >= 0.5:
        res_label = "Intermediate"
    else:
        res_label = "Susceptible"
    risk = {"Susceptible": "Low", "Intermediate": "Moderate", "Resistant": "High"}[res_label]
    return {
        "activity_score": round(activity, 3),
        "mic_score": round(mic, 3),
        "resistance_class": res_label,
        "resistance_score": round(res_score, 3),
        "risk_level": risk,
        "model_source": "trained-ml",
    }


def load_latest_metrics() -> dict[str, Any]:
    return load_metrics()


def load_latest_report() -> dict[str, Any]:
    return load_report()

