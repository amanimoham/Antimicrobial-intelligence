from __future__ import annotations

import re
from typing import Any

import pandas as pd

# Canonical fields expected by ingestion pipeline.
CANONICAL_FIELDS = {
    "sample_id",
    "sample_type",
    "pathogen",
    "source",
    "date",
    "value",
    "compound_code",
    "compound_name",
    "smiles",
    "molecular_weight",
    "logp",
    "toxicity_score",
    "synthesizability_score",
    "activity_score",
    "mic_score",
    "resistance_score",
}


ALIAS_MAP: dict[str, tuple[str, ...]] = {
    "sample_id": (
        "sample_id",
        "sample id",
        "sampleID",
        "sample",
        "sample_code",
        "sample code",
        "specimen_id",
        "specimen id",
        "specimen_code",
        "specimen code",
        "id",
        "record_id",
        "record id",
        "test_id",
        "assay_id",
    ),
    "sample_type": (
        "sample_type",
        "sample type",
        "type",
        "specimen_type",
        "specimen type",
        "source_type",
        "fluid_type",
        "body_fluid",
        "body fluid",
        "material",
    ),
    "pathogen": (
        "pathogen",
        "organism",
        "bacteria",
        "bacteria_name",
        "bacteria name",
        "bacterial_species",
        "bacterial species",
        "microbe",
        "strain",
        "isolate",
        "target_organism",
        "target organism",
    ),
    "source": (
        "source",
        "origin",
        "batch_id",
        "batch id",
        "department",
        "ward",
        "clinic",
        "unit",
        "location",
        "sample_source",
        "collection_source",
    ),
    "date": (
        "date",
        "test_date",
        "collection_date",
        "collection date",
        "assay_date",
        "run_date",
        "run date",
        "created_at",
        "timestamp",
        "recorded_at",
        "measurement_date",
    ),
    "value": (
        "value",
        "result",
        "score",
        "measurement",
        "reading",
        "activity",
        "activity_score",
        "assay_value",
        "response",
        "observed_value",
        "predicted_value",
    ),
    "compound_code": (
        "compound_code",
        "compound code",
        "compound_id",
        "compound id",
        "candidate_id",
        "candidate code",
        "molecule_id",
        "molecule code",
    ),
    "compound_name": (
        "compound_name",
        "compound name",
        "name",
        "molecule_name",
        "molecule name",
        "candidate_name",
        "candidate name",
        "drug_name",
    ),
    "smiles": (
        "smiles",
        "smiles_string",
        "smiles string",
        "structure",
        "molecular_structure",
        "molecular structure",
    ),
    "molecular_weight": (
        "molecular_weight",
        "molecular weight",
        "mw",
        "mol_weight",
        "mol weight",
    ),
    "logp": (
        "logp",
        "log_p",
        "log p",
        "partition_coefficient",
        "partition coefficient",
    ),
    "toxicity_score": (
        "toxicity_score",
        "toxicity",
        "tox_score",
        "tox",
        "safety_score",
        "safety score",
    ),
    "synthesizability_score": (
        "synthesizability_score",
        "synthesizability",
        "synthesis_score",
        "synthesis score",
        "manufacturability",
        "feasibility_score",
    ),
    "activity_score": (
        "activity_score",
        "activity score",
        "activity",
        "predicted_activity",
    ),
    "mic_score": (
        "mic_score",
        "mic score",
        "mic",
        "predicted_mic",
    ),
    "resistance_score": (
        "resistance_score",
        "resistance score",
        "resistance",
        "res_score",
    ),
}

_EMPTY_TOKENS = {"", "n/a", "na", "null", "none", "-", "nan"}

_SAMPLE_TYPE_MAP = {
    "blood": "Blood",
    "urine": "Urine",
    "sputum": "Sputum",
    "plasma": "Blood",
    "serum": "Blood",
    "respiratory": "Sputum",
}

NUMERIC_FIELDS = {
    "value",
    "molecular_weight",
    "logp",
    "toxicity_score",
    "synthesizability_score",
    "activity_score",
    "mic_score",
    "resistance_score",
}


def _key(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"[\s\-_]+", "_", s)
    s = re.sub(r"[^a-z0-9_]", "", s)
    return s


def _alias_lookup() -> dict[str, str]:
    lookup: dict[str, str] = {}
    for canonical, aliases in ALIAS_MAP.items():
        lookup[_key(canonical)] = canonical
        for a in aliases:
            lookup[_key(a)] = canonical
    return lookup


ALIAS_LOOKUP = _alias_lookup()


def fuzzy_canonical_match(raw: str) -> str | None:
    """Best-effort match for minor typos by canonical tokens."""
    k = _key(raw)
    if k in ALIAS_LOOKUP:
        return ALIAS_LOOKUP[k]
    # tiny tolerance: direct startswith/contains with canonical names
    for c in CANONICAL_FIELDS:
        ck = _key(c)
        if k.startswith(ck) or ck.startswith(k):
            return c
    return None


def normalize_column_name(raw: str) -> str | None:
    return fuzzy_canonical_match(raw)


def normalize_headers(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
    detected = list(map(str, df.columns))
    normalized: dict[str, str] = {}
    ignored: list[str] = []
    duplicates: dict[str, list[str]] = {}
    chosen_source_for_canonical: dict[str, str] = {}

    for col in detected:
        canonical = normalize_column_name(col)
        if canonical is None:
            ignored.append(col)
            continue
        if canonical in chosen_source_for_canonical:
            duplicates.setdefault(canonical, [chosen_source_for_canonical[canonical]]).append(col)
            continue
        chosen_source_for_canonical[canonical] = col
        normalized[col] = canonical

    out = df.rename(columns=normalized).copy()
    # keep only first canonical mapping when duplicates happened
    out = out[[c for c in out.columns if c in CANONICAL_FIELDS]]

    summary = {
        "detected_columns": detected,
        "normalized_columns": {k: v for k, v in normalized.items()},
        "ignored_columns": ignored,
        "duplicate_aliases": duplicates,
    }
    return out, summary


def _normalize_empty(v: Any) -> Any:
    if v is None:
        return None
    if pd.isna(v):
        return None
    s = str(v).strip()
    if s.lower() in _EMPTY_TOKENS:
        return None
    return v


def normalize_row_values(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    for col in out.columns:
        out[col] = out[col].map(_normalize_empty)

    if "sample_type" in out.columns:
        out["sample_type"] = out["sample_type"].map(
            lambda v: _SAMPLE_TYPE_MAP.get(str(v).strip().lower(), str(v).strip()) if v is not None else None
        )

    if "date" in out.columns:
        out["date"] = pd.to_datetime(out["date"], errors="coerce").dt.strftime("%Y-%m-%d")
        out.loc[out["date"] == "NaT", "date"] = None

    for ncol in NUMERIC_FIELDS:
        if ncol in out.columns:
            out[ncol] = pd.to_numeric(out[ncol], errors="coerce")
            out.loc[out[ncol].isna(), ncol] = None

    return out


def accepted_aliases_for(canonical_field: str) -> list[str]:
    aliases = list(ALIAS_MAP.get(canonical_field, ()))
    if canonical_field not in aliases:
        aliases.insert(0, canonical_field)
    return aliases

