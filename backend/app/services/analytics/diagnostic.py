from __future__ import annotations

import itertools

import numpy as np
import pandas as pd
from scipy import stats

from app.models.schemas import Insight


def _vif(df: pd.DataFrame, col: str) -> float:
    """Variance Inflation Factor for a given column."""
    from sklearn.linear_model import LinearRegression
    others = [c for c in df.columns if c != col]
    if not others:
        return 1.0
    X = df[others].values
    y = df[col].values
    if len(X) < 3 or np.std(y) == 0:
        return 1.0
    r2 = LinearRegression().fit(X, y).score(X, y)
    return round(1 / (1 - r2) if r2 < 1.0 else float("inf"), 2)


def run_diagnostic(df: pd.DataFrame, filename: str, roles: dict[str, str] | None = None) -> list[Insight]:
    roles = roles or {}
    insights: list[Insight] = []
    
    # Exclude IDs from correlation matrix
    numeric_df = df.select_dtypes(include="number").drop(columns=[c for c in df.columns if roles.get(c) == "id"], errors="ignore").dropna(axis=1)
    num_cols = numeric_df.columns.tolist()

    if len(num_cols) < 2:
        return insights

    # ── Correlation matrix ────────────────────────────────────────────────────
    corr = numeric_df.corr()
    for c1, c2 in itertools.combinations(num_cols, 2):
        r = corr.loc[c1, c2]
        if np.isnan(r):
            continue
        # Pearson p-value
        _, pval = stats.pearsonr(numeric_df[c1].dropna(), numeric_df[c2].dropna())
        significant = pval < 0.05
        strength = (
            "strong" if abs(r) > 0.7
            else "moderate" if abs(r) > 0.4
            else "weak"
        )
        direction = "positive" if r > 0 else "negative"
        if abs(r) < 0.3:
            continue  # skip near-zero correlations
        insights.append(Insight(
            metric_name=f"{c1} ↔ {c2} | correlation",
            statistical_value={"pearson_r": round(float(r), 4), "p_value": round(float(pval), 6)},
            confidence_score=round(1 - float(pval), 4) if pval < 1 else 0.0,
            business_interpretation=f"Correlation of {round(r, 2)} detected between '{c1}' and '{c2}'.",
            recommended_visualization="scatter_plot",
            layer="diagnostic",
        ))

    # ── VIF / Multicollinearity ───────────────────────────────────────────────
    if len(num_cols) > 2:
        vif_data = {}
        for col in num_cols:
            try:
                vif_data[col] = _vif(numeric_df, col)
            except Exception:
                vif_data[col] = 1.0

        high_vif = {k: v for k, v in vif_data.items() if v > 5}
        if high_vif:
            insights.append(Insight(
                metric_name="multicollinearity | VIF",
                statistical_value=high_vif,
                confidence_score=0.85,
                business_interpretation=(
                    f"High multicollinearity detected in: {', '.join(high_vif.keys())}. "
                    "These features may cause instability in predictive models."
                ),
                recommended_visualization="correlation_heatmap",
                layer="diagnostic",
            ))

    # ── Hypothesis tests (t-test on top 2 numeric vs binary categorical) ──────
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    for cat_col in cat_cols[:2]:
        groups = df[cat_col].dropna().unique()
        if len(groups) != 2:
            continue
        for num_col in num_cols[:3]:
            g1 = df.loc[df[cat_col] == groups[0], num_col].dropna()
            g2 = df.loc[df[cat_col] == groups[1], num_col].dropna()
            if len(g1) < 5 or len(g2) < 5:
                continue
            t_stat, pval = stats.ttest_ind(g1, g2)
            significant = pval < 0.05
            insights.append(Insight(
                metric_name=f"{num_col} by {cat_col} | t-test",
                statistical_value={"t_statistic": round(float(t_stat), 4), "p_value": round(float(pval), 6)},
                confidence_score=round(1 - float(pval), 4) if pval < 1 else 0.0,
                business_interpretation=f"Difference in '{num_col}' mean between '{groups[0]}' and '{groups[1]}'.",
                recommended_visualization="box_plot",
                layer="diagnostic",
            ))

    return insights
