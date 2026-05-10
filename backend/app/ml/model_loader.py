from __future__ import annotations

import json
import platform
import sys
from typing import Any

import joblib
import numpy as np
import sklearn

from app.ml.config import ARTIFACT_DIR, METRICS_PATH, MODEL_PATH, REPORT_PATH

ARTIFACT_META_KEY = "__artifact_meta__"
META_SCHEMA_VERSION = 1


def _runtime_versions() -> dict[str, str]:
    return {
        "python": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        "numpy": np.__version__,
        "scikit_learn": sklearn.__version__,
        "joblib": joblib.__version__,
    }


def _runtime_metadata() -> dict[str, Any]:
    return {
        "schema_version": META_SCHEMA_VERSION,
        "runtime": _runtime_versions(),
        "platform": platform.platform(),
    }


def _major_minor(version: str) -> str:
    parts = version.split(".")
    if len(parts) < 2:
        return version
    return f"{parts[0]}.{parts[1]}"


def _assert_compatible(meta: dict[str, Any]) -> None:
    trained_runtime = meta.get("runtime") or {}
    current_runtime = _runtime_versions()
    # Strict on sklearn/numpy major.minor to avoid unpickle runtime errors.
    critical = ("numpy", "scikit_learn")
    mismatches = []
    for key in critical:
        trained_v = str(trained_runtime.get(key, ""))
        current_v = str(current_runtime.get(key, ""))
        if not trained_v or _major_minor(trained_v) != _major_minor(current_v):
            mismatches.append(f"{key}: trained={trained_v or 'unknown'} current={current_v}")
    if mismatches:
        joined = "; ".join(mismatches)
        raise RuntimeError(
            "Incompatible trained model artifact for current runtime. "
            f"{joined}. Delete/retrain artifacts in this environment."
        )


def save_artifacts(payload: dict[str, Any], metrics: dict[str, Any], report: dict[str, Any] | None = None) -> None:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    payload_with_meta = {**payload, ARTIFACT_META_KEY: _runtime_metadata()}
    joblib.dump(payload_with_meta, MODEL_PATH)
    METRICS_PATH.write_text(json.dumps(metrics, indent=2))
    if report is not None:
        REPORT_PATH.write_text(json.dumps(report, indent=2))


def load_model_payload() -> dict[str, Any] | None:
    if not MODEL_PATH.exists():
        return None
    try:
        payload = joblib.load(MODEL_PATH)
    except Exception as exc:
        raise RuntimeError(
            f"Could not deserialize model artifact at {MODEL_PATH}. Retrain in current environment. Details: {exc}"
        ) from exc
    if not isinstance(payload, dict):
        raise RuntimeError("Invalid artifact format. Expected dict payload. Retrain models.")
    meta = payload.get(ARTIFACT_META_KEY)
    if not isinstance(meta, dict):
        raise RuntimeError("Legacy artifact without compatibility metadata. Retrain models in current environment.")
    _assert_compatible(meta)
    return payload


def load_metrics() -> dict[str, Any]:
    if not METRICS_PATH.exists():
        return {"message": "No training metrics yet."}
    return json.loads(METRICS_PATH.read_text())


def load_report() -> dict[str, Any]:
    if not REPORT_PATH.exists():
        return {"message": "No detailed report yet."}
    return json.loads(REPORT_PATH.read_text())

