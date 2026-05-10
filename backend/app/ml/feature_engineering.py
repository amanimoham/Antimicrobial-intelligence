from __future__ import annotations

import pandas as pd


def add_date_features(df: pd.DataFrame, date_col: str = "date") -> pd.DataFrame:
    out = df.copy()
    if date_col not in out.columns:
        out["date_year"] = None
        out["date_month"] = None
        out["date_dayofweek"] = None
        return out
    d = pd.to_datetime(out[date_col], errors="coerce")
    out["date_year"] = d.dt.year
    out["date_month"] = d.dt.month
    out["date_dayofweek"] = d.dt.dayofweek
    return out


def add_tabular_interactions(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    for col in ("value", "molecular_weight", "logp", "toxicity_score", "synthesizability_score"):
        if col in out.columns:
            out[col] = pd.to_numeric(out[col], errors="coerce")
    value = out["value"] if "value" in out.columns else pd.Series([None] * len(out), index=out.index)
    logp = out["logp"] if "logp" in out.columns else pd.Series([None] * len(out), index=out.index)
    mw = out["molecular_weight"] if "molecular_weight" in out.columns else pd.Series([None] * len(out), index=out.index)
    tox = out["toxicity_score"] if "toxicity_score" in out.columns else pd.Series([None] * len(out), index=out.index)
    syn = out["synthesizability_score"] if "synthesizability_score" in out.columns else pd.Series([None] * len(out), index=out.index)
    out["value_x_logp"] = value * logp
    out["toxicity_x_synth"] = tox * syn
    out["mw_over_logp"] = mw / (logp.abs() + 1.0)
    return out


def add_optional_rdkit_features(df: pd.DataFrame, smiles_col: str = "smiles") -> tuple[pd.DataFrame, list[str]]:
    out = df.copy()
    if smiles_col not in out.columns:
        return out, []
    try:
        from rdkit import Chem  # type: ignore
        from rdkit.Chem import Descriptors  # type: ignore
    except Exception:
        return out, []
    feats = []
    atoms = []
    tpsa = []
    hbd = []
    for s in out[smiles_col].fillna(""):
        m = Chem.MolFromSmiles(str(s)) if s else None
        if m is None:
            atoms.append(None)
            tpsa.append(None)
            hbd.append(None)
        else:
            atoms.append(float(m.GetNumAtoms()))
            tpsa.append(float(Descriptors.TPSA(m)))
            hbd.append(float(Descriptors.NumHDonors(m)))
    out["rd_num_atoms"] = atoms
    out["rd_tpsa"] = tpsa
    out["rd_hbd"] = hbd
    feats.extend(["rd_num_atoms", "rd_tpsa", "rd_hbd"])
    return out, feats

