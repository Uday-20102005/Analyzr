from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import AnalysisResponse, DatasetAnalysis
from app.services.analytics.descriptive import run_descriptive
from app.services.analytics.diagnostic import run_diagnostic
from app.services.analytics.predictive import run_predictive
from app.services.analytics.business import run_business
from app.services.visualization import generate_visualizations
from app.services.ai_engine import interpret_dataset, enrich_insights_async, get_proactive_opener
from app.services.context_builder import build_session_summary
from app.utils.session_store import get_session, update_session

router = APIRouter()


def _cross_dataset_insights(datasets: list[DatasetAnalysis]) -> list[str]:
    if len(datasets) < 2:
        return []
    insights = []
    for i in range(len(datasets)):
        for j in range(i + 1, len(datasets)):
            a, b = datasets[i], datasets[j]
            insights.append(
                f"Datasets '{a.filename}' and '{b.filename}' can be cross-analysed — "
                "look for shared key columns (IDs, dates, categories) to join them for deeper insights."
            )
    return insights


@router.post("/analysis/{session_id}", response_model=AnalysisResponse)
async def run_analysis(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Return cached result if already computed
    if session.get("analysis"):
        return session["analysis"]

    print(f"\n[ANALYZR] ANALYSIS START (Session: {session_id[:8]})")
    dataframes = session["dataframes"]
    session_dir = session["upload_dir"]
    all_datasets: list[DatasetAnalysis] = []
    all_charts = []

    profiles = session.get("profiles", [])
    profile_map = {p.filename: p for p in profiles}

    for filename, df in dataframes.items():
        print(f"\n>>> ANALYSING: {filename} ({df.shape[0]} rows, {df.shape[1]} cols)")
        shape = df.shape
        profile = profile_map.get(filename)
        roles = {c.name: c.role for c in profile.column_info} if profile else {}

        # ── Step 1: Run all 4 statistical analytics layers ─────────────────
        print(f"    - Layer 1: Descriptive Stats...")
        descriptive = run_descriptive(df, filename, roles)
        print(f"    - Layer 2: Diagnostic Correlations...")
        diagnostic  = run_diagnostic(df, filename, roles)
        print(f"    - Layer 3: Predictive Trends...")
        predictive  = run_predictive(df, filename, roles)
        print(f"    - Layer 4: Business KPIs & Anomalies...")
        business    = run_business(df, filename, roles)

        # ── Step 2: Generate visualizations ────────────────────────────────
        print(f"    - Visualization: Generating monochrome diagnostic charts...")
        charts = generate_visualizations(df, filename, session_dir)
        all_charts.extend(charts)
        charts_summary = [f"{c.plot_type}: {c.title}" for c in charts]

        # ── Step 3: AI enrichment — rewrite all insight interpretations ────
        print(f"    - LEELA AI: Batch-enriching {len(descriptive)+len(diagnostic)+len(predictive)+len(business)} insights...")
        descriptive = await enrich_insights_async(descriptive, filename, shape)
        diagnostic  = await enrich_insights_async(diagnostic,  filename, shape)
        predictive  = await enrich_insights_async(predictive,  filename, shape)
        business    = await enrich_insights_async(business,    filename, shape)

        # ── Step 4: Build partial DatasetAnalysis for narrative generation ─
        da = DatasetAnalysis(
            filename=filename,
            columns=df.columns.tolist(),
            descriptive=descriptive,
            diagnostic=diagnostic,
            predictive=predictive,
            business=business,
            executive_summary="",
            recommendations=[],
        )

        # ── Step 5: AI Smart Narrative (exec summary + recommendations) ────
        print(f"    - LEELA AI: Synthesizing executive summary & core metrics...")
        summary, recommendations, core_metrics = await interpret_dataset(da, charts_summary)
        da.executive_summary = summary
        da.recommendations   = recommendations
        da.core_metrics      = core_metrics
        print(f"    - Dataset '{filename}' complete.")

        all_datasets.append(da)

    # ── Step 6: Build proactive opener for chat ─────────────────────────────
    print(f"\n[ANALYZR] Building proactive chat context...")
    session_summary = build_session_summary(all_datasets)
    proactive_msg   = await get_proactive_opener(session_summary)
    print(f"[ANALYZR] Pre-generated proactive opener: '{proactive_msg[:50]}...'")

    cross_insights = _cross_dataset_insights(all_datasets)
    result = AnalysisResponse(
        session_id=session_id,
        datasets=all_datasets,
        cross_dataset_insights=cross_insights,
    )

    update_session(session_id, {
        "analysis":       result,
        "charts":         all_charts,
        "proactive_msg":  proactive_msg,
    })
    return result


@router.get("/analysis/{session_id}/opener")
async def get_chat_opener(session_id: str):
    """Return Aria's pre-generated proactive opening message."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    msg = session.get("proactive_msg", "")
    return {"message": msg}
