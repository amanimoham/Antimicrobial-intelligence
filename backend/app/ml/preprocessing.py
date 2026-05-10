from __future__ import annotations

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.ml.config import CATEGORICAL_FEATURES, NUMERIC_FEATURES
from app.ml.feature_engineering import add_date_features, add_optional_rdkit_features, add_tabular_interactions


def clean_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str], list[str]]:
    out = df.copy()
    out = add_date_features(out)
    out = add_tabular_interactions(out)
    out, rdkit_feats = add_optional_rdkit_features(out)
    cat = CATEGORICAL_FEATURES.copy()
    num = NUMERIC_FEATURES.copy() + rdkit_feats
    # keep only columns that exist
    cat = [c for c in cat if c in out.columns]
    num = [c for c in num if c in out.columns]
    for c in num:
        out[c] = pd.to_numeric(out[c], errors="coerce")
    return out, cat, num


def _cap_rare_categories(out: pd.DataFrame, cat_features: list[str], min_count: int = 5) -> pd.DataFrame:
    for c in cat_features:
        if c not in out.columns:
            continue
        series = out[c].fillna("unknown").astype(str).str.strip().replace("", "unknown")
        freq = series.value_counts()
        rare = set(freq[freq < min_count].index.tolist())
        out[c] = series.apply(lambda x: "__rare__" if x in rare else x)
    return out


def build_preprocessor(cat_features: list[str], num_features: list[str]) -> ColumnTransformer:
    cat_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )
    num_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    return ColumnTransformer(
        transformers=[
            ("cat", cat_pipe, cat_features),
            ("num", num_pipe, num_features),
        ]
    )


def prepare_train_features(df: pd.DataFrame, cat_features: list[str]) -> pd.DataFrame:
    out = df.copy()
    out = _cap_rare_categories(out, cat_features)
    return out

