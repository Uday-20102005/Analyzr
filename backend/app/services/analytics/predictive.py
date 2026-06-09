from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.dummy import DummyClassifier, DummyRegressor

from app.models.schemas import Insight


def run_predictive(df: pd.DataFrame, filename: str, roles: dict[str, str] | None = None) -> list[Insight]:
    roles = roles or {}
    insights: list[Insight] = []

    # Heuristic for target selection
    num_cols = [c for c in df.select_dtypes(include="number").columns if roles.get(c) != "id"]
    candidates = [c for c in num_cols if df[c].nunique() > 5]
    
    if not candidates:
        return insights
        
    # Pick candidate with highest variance
    variances = df[candidates].var().sort_values(ascending=False)
    target = str(variances.index[0])

    target_series = df[target].dropna()
    n = len(target_series)

    # ── Regression vs Classification suitability ─────────────────────────────
    unique_ratio = target_series.nunique() / max(n, 1)
    is_classification = unique_ratio < 0.05 or target_series.nunique() <= 10
    task_type = "classification" if is_classification else "regression"

    insights.append(Insight(
        metric_name=f"target: {target} | task type",
        statistical_value={"recommended_task": task_type, "unique_values": int(target_series.nunique()), "n_rows": n},
        confidence_score=0.8,
        business_interpretation=f"Column '{target}' identified as suitable prediction target for {task_type}.",
        recommended_visualization="histogram",
        layer="predictive",
    ))

    # ── Data sufficiency ──────────────────────────────────────────────────────
    num_features = df.select_dtypes(include="number").shape[1] - 1
    sufficient = n >= 10 * max(num_features, 1)
    insights.append(Insight(
        metric_name="data sufficiency",
        statistical_value={"rows": n, "numeric_features": num_features, "ratio": round(n / max(num_features, 1), 1)},
        confidence_score=0.9,
        business_interpretation=(
            f"Dataset has {n} rows and {num_features} numeric features. "
            + ("Sufficient data for modeling." if sufficient else "May be insufficient — consider gathering more data.")
        ),
        recommended_visualization="bar_chart",
        layer="predictive",
    ))

    # ── Baseline model performance ────────────────────────────────────────────
    try:
        feature_cols = [c for c in df.select_dtypes(include="number").columns if c != target]
        if len(feature_cols) >= 1 and n >= 20:
            X = df[feature_cols].fillna(df[feature_cols].median())
            y = df[target].fillna(df[target].median())

            if is_classification:
                le = LabelEncoder()
                y_enc = le.fit_transform(y.astype(str))
                baseline = DummyClassifier(strategy="most_frequent")
                scores = cross_val_score(baseline, X, y_enc, cv=min(5, n // 5), scoring="accuracy")
                metric = "accuracy"
            else:
                baseline = DummyRegressor(strategy="mean")
                scores = cross_val_score(baseline, X, y, cv=min(5, n // 5), scoring="r2")
                metric = "R²"

            baseline_score = round(float(np.mean(scores)), 4)
            insights.append(Insight(
                metric_name=f"baseline model | {metric}",
                statistical_value={metric: baseline_score, "cv_folds": min(5, n // 5)},
                confidence_score=0.75,
                business_interpretation=(
                    f"A naive baseline {task_type} model achieves {metric}={baseline_score}. "
                    "Any trained model should significantly exceed this."
                ),
                recommended_visualization="bar_chart",
                layer="predictive",
            ))
    except Exception:
        pass

    return insights
