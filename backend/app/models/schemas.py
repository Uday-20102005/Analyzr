from __future__ import annotations

from typing import Any
from pydantic import BaseModel


# ─── Upload ────────────────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    session_id: str
    datasets: list[DatasetProfile]


class DatasetProfile(BaseModel):
    filename: str
    rows: int
    columns: int
    column_info: list[ColumnInfo]
    missing_pct: float
    duplicate_rows: int
    quality_score: float          # 0-100
    relationships: list[str]      # related dataset filenames


class ColumnInfo(BaseModel):
    name: str
    dtype: str
    role: str                    # id | categorical | numerical | datetime | target_candidate
    missing_pct: float
    unique_count: int
    sample_values: list[Any]


# ─── Analysis ─────────────────────────────────────────────────────────────────

class AnalysisRequest(BaseModel):
    session_id: str


class Insight(BaseModel):
    metric_name: str
    statistical_value: Any
    confidence_score: float       # 0-1
    business_interpretation: str
    recommended_visualization: str
    layer: str                   # descriptive | diagnostic | predictive | business


class DatasetAnalysis(BaseModel):
    filename: str
    descriptive: list[Insight]
    diagnostic: list[Insight]
    predictive: list[Insight]
    business: list[Insight]
    core_metrics: list[dict[str, Any]] = []  # AI-selected dashboard metrics
    executive_summary: str
    recommendations: list[str]
    columns: list[str] = []


class AnalysisResponse(BaseModel):
    session_id: str
    datasets: list[DatasetAnalysis]
    cross_dataset_insights: list[str]


# ─── Visualizations ───────────────────────────────────────────────────────────

class ChartMetadata(BaseModel):
    chart_id: str
    dataset: str
    plot_type: str
    title: str
    x_axis: str
    y_axis: str
    trend_direction: str         # up | down | flat | mixed | N/A
    statistical_significance: str
    key_observations: list[str]
    image_url: str               # /static/<session>/<filename>.png


class VisualizationsResponse(BaseModel):
    session_id: str
    charts: list[ChartMetadata]


# ─── Chat ────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str                    # user | assistant
    content: str


class ChatRequest(BaseModel):
    session_id: str
    message: str
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str
    sources: list[str] = []      # insight metric names referenced


# ─── Report ───────────────────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    session_id: str
    format: str = "pdf"          # pdf | docx | json
    report_type: str = "executive"  # executive | technical | audit

# ─── Playground ────────────────────────────────────────────────────────────────

class PlaygroundRequest(BaseModel):
    session_id: str
    dataset: str
    columns: list[str]
    prompt: str

class PlaygroundResponse(BaseModel):
    chart: ChartMetadata | None
    insights: list[Insight]
    summary: str = ""
