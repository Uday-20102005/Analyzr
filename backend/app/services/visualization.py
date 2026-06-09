from __future__ import annotations

import os
import uuid
from pathlib import Path

import matplotlib
matplotlib.use("Agg")  # non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np

from app.models.schemas import ChartMetadata

# Vibrant Modern Theme
plt.rcParams.update({
    "figure.facecolor": "#ffffff",
    "axes.facecolor": "#ffffff",
    "axes.edgecolor": "#000000",
    "axes.labelcolor": "#000000",
    "xtick.color": "#333333",
    "ytick.color": "#333333",
    "text.color": "#000000",
    "grid.color": "#eeeeee",
    "grid.linestyle": "--",
    "font.family": "sans-serif",
})

# Distinct Categorical Palette
VIBRANT_PALETTE = ["#4f46e5", "#0d9488", "#e11d48", "#d97706", "#7c3aed", "#2563eb"]


def _trend_direction(series: pd.Series) -> str:
    if len(series) < 2:
        return "N/A"
    first_half = series.iloc[: len(series) // 2].mean()
    second_half = series.iloc[len(series) // 2 :].mean()
    diff = second_half - (first_half + 1e-9)
    if diff > 0.05 * abs(first_half):
        return "up"
    if diff < -0.05 * abs(first_half):
        return "down"
    return "flat"


def generate_visualizations(
    df: pd.DataFrame, filename: str, session_dir: Path
) -> list[ChartMetadata]:
    charts: list[ChartMetadata] = []
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    datetime_cols = [c for c in df.columns if pd.api.types.is_datetime64_any_dtype(df[c])]
    dataset_key = Path(filename).stem

    def _save(fig: plt.Figure, name: str) -> str:
        img_name = f"{dataset_key}_{name}_{uuid.uuid4().hex[:6]}.png"
        img_path = session_dir / img_name
        fig.savefig(img_path, bbox_inches="tight", dpi=130, facecolor="#f8fafc")
        plt.close(fig)
        return img_name

    # ── 1. Histograms (All Numeric) ──────────────────────────────────
    for col in numeric_cols[:8]:  # Increased limit
        series = df[col].dropna()
        if len(series) < 5: continue
        fig, ax = plt.subplots(figsize=(8, 4.5))
        sns.histplot(series, bins=30, color="#6366f1", alpha=0.8, ax=ax, kde=True, edgecolor="#ffffff")
        ax.set_title(f"Distribution: {col}", fontsize=12, fontweight="900", pad=20)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        img_name = _save(fig, f"hist_{col[:15]}")
        charts.append(ChartMetadata(
            chart_id=uuid.uuid4().hex, dataset=filename, plot_type="histogram",
            title=f"Distribution Analysis: {col}", x_axis=col, y_axis="Frequency",
            trend_direction=_trend_direction(series), statistical_significance="Univariate Analysis",
            key_observations=[f"Concentration around {round(float(series.median()), 2)}.", f"Standard Deviation: {round(float(series.std()), 2)}"],
            image_url=f"/static/{session_dir.name}/{img_name}",
        ))

    # ── 2. Box Plots (Multiple Pairs) ──────────────────────────────
    if numeric_cols and cat_cols:
        for idx in range(min(len(cat_cols), 3)):
            cat = cat_cols[idx]
            num = numeric_cols[idx % len(numeric_cols)]
            top_cats = df[cat].value_counts().head(5).index
            mask = df[cat].isin(top_cats)
            if df[mask].empty: continue

            fig, ax = plt.subplots(figsize=(9, 5.5))
            sns.boxplot(data=df[mask], x=cat, y=num, palette=VIBRANT_PALETTE, ax=ax, showfliers=False, width=0.5)
            sns.stripplot(data=df[mask], x=cat, y=num, color="#0f172a", alpha=0.2, size=3, ax=ax)
            ax.set_title(f"Variance: {num} by {cat}", fontsize=12, fontweight="900", pad=20)
            ax.spines['top'].set_visible(False)
            ax.set_xlabel(cat.upper(), fontsize=9, fontweight="bold", alpha=0.5)
            img_name = _save(fig, f"box_{cat[:10]}_{num[:10]}")
            charts.append(ChartMetadata(
                chart_id=uuid.uuid4().hex, dataset=filename, plot_type="box_plot",
                title=f"Segment Variation: {num} by {cat}", x_axis=cat, y_axis=num,
                trend_direction="N/A", statistical_significance="Interquartile Range",
                key_observations=[f"Significant variance noted across {cat} segments."],
                image_url=f"/static/{session_dir.name}/{img_name}",
            ))

    # ── 3. Categorical Distributions (Pie) ────────────────────────
    for cat in cat_cols[:3]:
        counts = df[cat].value_counts().head(5)
        if len(counts) < 2: continue
        fig, ax = plt.subplots(figsize=(6, 6))
        ax.pie(counts, labels=counts.index, autopct='%1.1f%%', colors=VIBRANT_PALETTE, 
               startangle=140, pctdistance=0.85, wedgeprops={'width': 0.4, 'edgecolor': 'w'})
        ax.set_title(f"Composition: {cat}", fontsize=12, fontweight="900", pad=20)
        img_name = _save(fig, f"pie_{cat[:10]}")
        charts.append(ChartMetadata(
            chart_id=uuid.uuid4().hex, dataset=filename, plot_type="pie_chart",
            title=f"Segment Composition: {cat}", x_axis="Category", y_axis="Percentage",
            trend_direction="N/A", statistical_significance="Frequency Distribution",
            key_observations=[f"Dominant segment: {counts.idxmax()} ({round(counts.max()/counts.sum()*100, 1)}%)"],
            image_url=f"/static/{session_dir.name}/{img_name}",
        ))

    # ── 4. Correlation Heatmap (Refined) ──────────────────────────
    if len(numeric_cols) >= 3:
        cols_to_corr = numeric_cols[:15]
        corr = df[cols_to_corr].corr()
        fig, ax = plt.subplots(figsize=(9, 8))
        sns.heatmap(corr, annot=True, fmt=".2f", cmap="RdBu_r", center=0, ax=ax, square=True,
                    cbar_kws={"shrink": .8}, linewidths=0.5, annot_kws={"size": 8})
        ax.set_title("Metric Inter-dependency Matrix", fontsize=14, fontweight="900", pad=30)
        img_name = _save(fig, "correlation_matrix")
        charts.append(ChartMetadata(
            chart_id=uuid.uuid4().hex, dataset=filename, plot_type="correlation_heatmap",
            title="Statistical Correlation Analysis", x_axis="Variables", y_axis="Variables",
            trend_direction="N/A", statistical_significance="Pearson Coefficient",
            key_observations=["High-dependency nodes identified.", "Red/Blue indicates pos/neg correlation."],
            image_url=f"/static/{session_dir.name}/{img_name}",
        ))

    # ── 5. Advanced Scatter Grids ────────────────────────────────
    if len(numeric_cols) >= 2:
        for i in range(min(len(numeric_cols)-1, 3)):
            x, y = numeric_cols[i], numeric_cols[i+1]
            fig, ax = plt.subplots(figsize=(8, 6))
            sample_size = min(len(df), 1000)
            sample_df = df.sample(sample_size)
            sns.regplot(data=sample_df, x=x, y=y, ax=ax, 
                        scatter_kws={"alpha": 0.4, "color": "#6366f1", "s": 30, "edgecolor": "none"},
                        line_kws={"color": "#0f172a", "linewidth": 2})
            ax.set_title(f"Scatter Analysis: {x} vs {y}", fontsize=12, fontweight="900", pad=20)
            ax.spines['top'].set_visible(False)
            ax.spines['right'].set_visible(False)
            img_name = _save(fig, f"scatter_{x[:10]}_{y[:10]}")
            charts.append(ChartMetadata(
                chart_id=uuid.uuid4().hex, dataset=filename, plot_type="scatter_plot",
                title=f"Relational Flow: {x} vs {y}", x_axis=x, y_axis=y,
                trend_direction="regression_fit", statistical_significance="Bi-variate Analysis",
                key_observations=["Statistical trend line indicates overall direction.", f"Sample of {sample_size} nodes plotted."],
                image_url=f"/static/{session_dir.name}/{img_name}",
            ))

    return charts
