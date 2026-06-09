from __future__ import annotations

import numpy as np
import pandas as pd

from app.models.schemas import Insight


def run_business(df: pd.DataFrame, filename: str, roles: dict[str, str] | None = None) -> list[Insight]:
    roles = roles or {}
    insights: list[Insight] = []
    numeric_cols = [c for c in df.select_dtypes(include="number").columns if roles.get(c) != "id"]
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

    # ── KPI extraction: top numeric columns ───────────────────────────────────
    for col in numeric_cols[:5]:
        series = df[col].dropna()
        if len(series) == 0:
            continue
            
        role = roles.get(col, "").upper()
        avg = float(series.mean())
        
        if role == "AGGREGATABLE_METRIC":
            total = float(series.sum())
            kpi = {
                "total": round(total, 2),
                "max": round(float(series.max()), 2),
                "min": round(float(series.min()), 2),
                "mean": round(avg, 2),
            }
            interp = f"Factual performance metrics for '{col}' (Total: {kpi['total']}, Average: {kpi['mean']})."
        else:
            # For ATTRIBUTE_METRIC (Age, Score) or unknown roles, focus on AVGs
            kpi = {
                "average": round(avg, 2),
                "max": round(float(series.max()), 2),
                "min": round(float(series.min()), 2),
            }
            interp = f"Average {col} of customers is {kpi['average']}."

        insights.append(Insight(
            metric_name=f"{col} | KPI",
            statistical_value=kpi,
            confidence_score=0.95,
            business_interpretation=interp,
            recommended_visualization="bar_chart",
            layer="business",
        ))

    # ── Growth rate (requires datetime or sequential rows) ────────────────────
    datetime_cols = [c for c in df.columns if pd.api.types.is_datetime64_any_dtype(df[c])]
    if datetime_cols and numeric_cols:
        dt_col = datetime_cols[0]
        num_col = numeric_cols[0]
        try:
            ts = df[[dt_col, num_col]].dropna().sort_values(dt_col)
            first = ts[num_col].iloc[0]
            last = ts[num_col].iloc[-1]
            growth_pct = round((last - first) / abs(first) * 100, 2) if first != 0 else 0.0
            insights.append(Insight(
                metric_name=f"{num_col} | growth rate",
                statistical_value={"start": round(float(first), 4), "end": round(float(last), 4), "growth_pct": growth_pct},
                confidence_score=0.85,
                business_interpretation=f"'{num_col}' changed by {growth_pct}% from first to last record.",
                recommended_visualization="line_chart",
                layer="business",
            ))
        except Exception:
            pass

    # ── Pareto (80/20) analysis ───────────────────────────────────────────────
    for cat_col in cat_cols[:2]:
        for num_col in numeric_cols[:2]:
            try:
                grouped = df.groupby(cat_col)[num_col].sum().sort_values(ascending=False)
                cumsum = grouped.cumsum() / grouped.sum()
                pareto_cutoff = int((cumsum <= 0.8).sum())
                total_categories = len(grouped)
                pareto_pct = round(pareto_cutoff / max(total_categories, 1) * 100, 1)
                insights.append(Insight(
                    metric_name=f"{cat_col}/{num_col} | Pareto 80/20",
                    statistical_value={
                        "top_n_categories": pareto_cutoff,
                        "total_categories": total_categories,
                        "top_categories_pct": pareto_pct,
                    },
                    confidence_score=0.88,
                    business_interpretation=(
                        f"{pareto_pct}% of '{cat_col}' categories account for 80% of '{num_col}'. "
                        f"Top {pareto_cutoff} segments drive most value."
                    ),
                    recommended_visualization="bar_chart",
                    layer="business",
                ))
            except Exception:
                continue

    # ── Anomaly / Risk flags ──────────────────────────────────────────────────
    for col in numeric_cols[:5]:
        series = df[col].dropna()
        if len(series) < 10:
            continue
        z_scores = np.abs((series - series.mean()) / series.std())
        extreme_count = int((z_scores > 3).sum())
        if extreme_count > 0:
            insights.append(Insight(
                metric_name=f"{col} | anomaly flags",
                statistical_value={"extreme_outliers": extreme_count, "z_threshold": 3},
                confidence_score=0.82,
                business_interpretation=f"Detected {extreme_count} record(s) in '{col}' deviating by more than 3 sigma.",
                recommended_visualization="scatter_plot",
                layer="business",
            ))

    return insights
