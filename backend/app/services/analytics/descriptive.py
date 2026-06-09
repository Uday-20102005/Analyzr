from __future__ import annotations

import numpy as np
import pandas as pd
from scipy import stats

from app.models.schemas import Insight


def run_descriptive(df: pd.DataFrame, filename: str, roles: dict[str, str] | None = None) -> list[Insight]:
    roles = roles or {}
    insights: list[Insight] = []
    
    # Only analyze columns that aren't IDs
    numeric_cols = [c for c in df.select_dtypes(include="number").columns if roles.get(c) != "id"]

    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) < 5:
            continue

        mean = float(series.mean())
        median = float(series.median())
        std = float(series.std())
        variance = float(series.var())

        # Distribution skew
        skew = float(series.skew())
        skew_label = "right-skewed" if skew > 0.5 else ("left-skewed" if skew < -0.5 else "symmetric")

        # Outliers via IQR
        q1, q3 = series.quantile(0.25), series.quantile(0.75)
        iqr = q3 - q1
        outlier_count = int(((series < q1 - 1.5 * iqr) | (series > q3 + 1.5 * iqr)).sum())
        outlier_pct = round(outlier_count / max(len(series), 1) * 100, 2)

        # Confidence via coefficient of variation
        cv = std / abs(mean) if mean != 0 else 1.0
        confidence = round(max(0.0, 1 - min(cv, 1.0)), 2)

        insights.append(Insight(
            metric_name=f"{col} | descriptive stats",
            statistical_value={
                "mean": round(mean, 4),
                "median": round(median, 4),
                "std": round(std, 4),
                "variance": round(variance, 4),
                "skew": round(skew, 4),
                "outliers_pct": outlier_pct,
            },
            confidence_score=confidence,
            business_interpretation=f"Column '{col}' has a mean of {round(mean, 2)} and {skew_label} distribution.",
            recommended_visualization="histogram" if skew_label != "symmetric" else "box_plot",
            layer="descriptive",
        ))

    # Category imbalance
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    for col in cat_cols:
        vc = df[col].value_counts(normalize=True)
        if len(vc) == 0:
            continue
        top_pct = round(float(vc.iloc[0]) * 100, 2)
        imbalanced = top_pct > 70
        insights.append(Insight(
            metric_name=f"{col} | category distribution",
            statistical_value={"top_category": str(vc.index[0]), "top_pct": top_pct, "n_unique": int(df[col].nunique())},
            confidence_score=0.9,
            business_interpretation=(
                f"'{col}' is {'heavily imbalanced' if imbalanced else 'reasonably balanced'}: "
                f"top category '{vc.index[0]}' accounts for {top_pct}% of rows."
            ),
            recommended_visualization="bar_chart",
            layer="descriptive",
        ))

    return insights
