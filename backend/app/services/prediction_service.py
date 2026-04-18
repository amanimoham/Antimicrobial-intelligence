"""Rule-based prediction — replace with ML model later."""

from __future__ import annotations

import hashlib


def _seed_float(sample_id: str, salt: str) -> float:
    h = hashlib.sha256(f"{sample_id}:{salt}".encode()).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF


def predict_from_sample(sample_id: str, bacteria_name: str | None, sample_type: str | None) -> tuple[float, float, str, str]:
    """
    Returns: predicted_activity, predicted_mic, resistance_label, risk_level
    """
    b = (bacteria_name or "").lower()
    st = (sample_type or "").lower()

    # Higher risk for certain patterns (demo rules)
    blood_risk = st == "blood" and any(x in b for x in ("pseudomonas", "acinetobacter", "klebsiella"))
    mic_base = 2.0 + _seed_float(sample_id, "mic") * 6.0
    if blood_risk:
        mic_base += 2.5
    if "staphylococcus" in b or "aureus" in b:
        mic_base += 0.8

    activity = max(4.0, min(10.0, 10.5 - mic_base * 0.35 + _seed_float(sample_id, "act") * 1.2))

    if mic_base > 6.0:
        label = "Resistant"
        risk = "High"
    elif mic_base > 3.5:
        label = "Intermediate"
        risk = "Moderate"
    else:
        label = "Susceptible"
        risk = "Low"

    return round(activity, 2), round(mic_base, 2), label, risk
