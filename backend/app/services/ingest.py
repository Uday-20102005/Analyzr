from __future__ import annotations

import hashlib
import os
from pathlib import Path

import numpy as np
import pandas as pd

from app.models.schemas import ColumnInfo, DatasetProfile
from app.services.semantic_classifier import classify_columns_semantically


def _infer_role(col: str, series: pd.Series, semantic_role: str | None = None) -> str:
    if semantic_role:
        return semantic_role.lower()
        
    col_lower = col.lower()
    if series.dtype == "object" and series.nunique() / max(len(series), 1) > 0.95:
        return "id"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    if series.dtype == "object" or series.dtype.name == "category":
        return "categorical"
    if pd.api.types.is_numeric_dtype(series):
        # Candidate target: single numeric col with high variance & not obviously an ID
        return "numerical"
    return "unknown"


def _quality_score(df: pd.DataFrame) -> float:
    """
    Score 0-100 based on:
      - Missing value ratio (40%)
      - Duplicate row ratio (30%)
      - Variance in dtypes (30%)
    """
    missing_ratio = df.isnull().mean().mean()
    dup_ratio = df.duplicated().sum() / max(len(df), 1)
    unique_dtypes = len(df.dtypes.unique())
    dtype_score = min(unique_dtypes / 5, 1.0)  # more varied types → richer data

    score = (
        (1 - missing_ratio) * 40
        + (1 - dup_ratio) * 30
        + dtype_score * 30
    )
    return round(float(score), 2)


def _detect_relationships(profiles: dict[str, pd.DataFrame]) -> dict[str, list[str]]:
    """Detect shared column names between datasets."""
    relationships: dict[str, list[str]] = {name: [] for name in profiles}
    names = list(profiles.keys())
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            a, b = names[i], names[j]
            shared = set(profiles[a].columns) & set(profiles[b].columns)
            if shared:
                relationships[a].append(b)
                relationships[b].append(a)
    return relationships


def profile_dataset(filename: str, df: pd.DataFrame, semantic_roles: dict[str, str] | None = None) -> DatasetProfile:
    semantic_roles = semantic_roles or {}
    columns_info: list[ColumnInfo] = []
    for col in df.columns:
        series = df[col]
        # Try datetime parsing
        if series.dtype == "object":
            try:
                parsed = pd.to_datetime(series, infer_datetime_format=True)
                series = parsed
            except Exception:
                pass

        col_info = ColumnInfo(
            name=col,
            dtype=str(series.dtype),
            role=_infer_role(col, series, semantic_roles.get(col)),
            missing_pct=round(series.isnull().mean() * 100, 2),
            unique_count=int(series.nunique()),
            sample_values=[str(v) for v in series.dropna().head(3).tolist()],
        )
        columns_info.append(col_info)

    return DatasetProfile(
        filename=filename,
        rows=int(len(df)),
        columns=int(len(df.columns)),
        column_info=columns_info,
        missing_pct=round(float(df.isnull().mean().mean() * 100), 2),
        duplicate_rows=int(df.duplicated().sum()),
        quality_score=_quality_score(df),
        relationships=[],  # filled by ingest_files
    )


async def ingest_files(file_paths: list[tuple[str, Path]]) -> tuple[dict[str, pd.DataFrame], list[DatasetProfile]]:
    """
    Load CSV files, profile each dataset, detect relationships.
    Returns raw DataFrames dict and a list of DatasetProfile.
    """
    dataframes: dict[str, pd.DataFrame] = {}
    profiles_raw: dict[str, DatasetProfile] = {}

    for filename, path in file_paths:
        df = pd.read_csv(path, low_memory=False)
        # Attempt type coercion
        for col in df.columns:
            if df[col].dtype == "object":
                try:
                    df[col] = pd.to_datetime(df[col], infer_datetime_format=True, errors="ignore")
                except Exception:
                    pass
            if df[col].dtype == "object":
                try:
                    df[col] = pd.to_numeric(df[col], errors="ignore")
                except Exception:
                    pass
        dataframes[filename] = df
        
        # ── Semantic Classification ──────────────────────────────────────────
        # Pull samples for AI to categorize
        col_samples = []
        for col in df.columns:
            samples = df[col].dropna().head(3).tolist()
            col_samples.append({"name": col, "samples": samples})
            
        semantic_roles = await classify_columns_semantically(col_samples)
        profiles_raw[filename] = profile_dataset(filename, df, semantic_roles)

    relationships = _detect_relationships(dataframes)
    profiles: list[DatasetProfile] = []
    for name, profile in profiles_raw.items():
        profile.relationships = relationships[name]
        profiles.append(profile)

    return dataframes, profiles
