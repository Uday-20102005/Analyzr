from __future__ import annotations

import json
import uuid
import asyncio
from pathlib import Path
from fastapi import APIRouter, HTTPException
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from app.models.schemas import PlaygroundRequest, PlaygroundResponse, ChartMetadata, Insight
from app.utils.session_store import get_session
from app.services.ai_engine import _call_ollama_async, _parse_json
from app.services.visualization import VIBRANT_PALETTE

router = APIRouter()

async def get_plot_config(columns: list[str], prompt: str) -> dict:
    sys_prompt = f"""
You are an expert data visualization and advanced analytics AI. 
The user has selected the following columns from their dataset: {columns}.
The user has provided this request/prompt: "{prompt}"

Determine the best chart type to visualize this request among: scatter_plot, bar_chart, line_chart, histogram, box_plot, pie_chart, violin_plot, heatmap.
Also pick the exact column names for x_axis and y_axis from the provided columns. If a chart type only needs one axis (like histogram or pie_chart), use it for x_axis and leave y_axis empty. If using heatmap, x_axis and y_axis can be empty.
Write a concise but descriptive title. Generate 3-5 highly detailed key observations that a Senior Data Analyst would likely make.

Output a SINGLE valid JSON object and NOTHING else. Your response will be passed directly to a JSON parser:
Output a SINGLE valid JSON object and NOTHING else. Your response will be passed directly to a JSON parser:
{{
    "plot_type": "...",
    "x_axis": "...",
    "y_axis": "...",
    "title": "...",
    "observations": ["detailed obs 1", "detailed obs 2", "detailed obs 3"],
    "summary": "A comprehensive 4-6 sentence executive summary of the relationship, findings, anomalies, and business implications.",
    "deep_stats": [
        {{
            "metric": "Metric name",
            "stat_value": "Detailed statistical finding",
            "interpretation": "In-depth business meaning and recommended action"
        }}
    ]
}}
    """
    raw = await _call_ollama_async(sys_prompt, num_predict=1500, temperature=0.3)
    print(f"\n[PLAYGROUND API] Raw LLM reply:\n{raw}\n", flush=True)
    parsed = _parse_json(raw)
    if isinstance(parsed, dict) and "plot_type" in parsed:
        return parsed
    
    # Fallback
    return {
        "plot_type": "scatter_plot" if len(columns) > 1 else "histogram",
        "x_axis": columns[0] if columns else "",
        "y_axis": columns[1] if len(columns) > 1 else "",
        "title": "Custom Playground Analysis",
        "observations": ["Plot generated from custom user parameters.", "Review the relationship between selected features."]
    }

def draw_custom_plot(df, config: dict, session_dir: Path, dataset_filename: str) -> ChartMetadata:
    plt.clf()
    fig, ax = plt.subplots(figsize=(8, 5))
    plot_type = config.get("plot_type", "scatter_plot")
    x = config.get("x_axis", "")
    y = config.get("y_axis", "")
    title = config.get("title", "Playground Plot")
    
    # Coerce to string if LLM accidentally returns a list
    if isinstance(plot_type, list): plot_type = plot_type[0] if plot_type else "scatter_plot"
    if isinstance(x, list): x = x[0] if x else ""
    if isinstance(y, list): y = y[0] if y else ""
    
    # Ensure columns exist in DataFrame
    if x not in df.columns and plot_type != "heatmap": x = df.columns[0]
    if y and y not in df.columns and plot_type != "heatmap": y = df.columns[1] if len(df.columns) > 1 else x
    
    try:
        if plot_type == "scatter_plot":
            sns.scatterplot(data=df, x=x, y=y, ax=ax, color=VIBRANT_PALETTE[0], alpha=0.6)
        elif plot_type == "bar_chart":
            sns.barplot(data=df, x=x, y=y, ax=ax, palette=VIBRANT_PALETTE)
        elif plot_type == "line_chart":
            sns.lineplot(data=df, x=x, y=y, ax=ax, color=VIBRANT_PALETTE[1], linewidth=2)
        elif plot_type == "histogram":
            sns.histplot(data=df, x=x, ax=ax, color=VIBRANT_PALETTE[2], kde=True)
        elif plot_type == "box_plot":
            sns.boxplot(data=df, x=x, y=y, ax=ax, palette=VIBRANT_PALETTE)
        elif plot_type == "pie_chart":
            counts = df[x].value_counts().head(5)
            ax.pie(counts, labels=counts.index, autopct='%1.1f%%', colors=VIBRANT_PALETTE)
        elif plot_type == "violin_plot":
            sns.violinplot(data=df, x=x, y=y, ax=ax, palette=VIBRANT_PALETTE)
        elif plot_type == "heatmap":
            numeric_df = df.select_dtypes(include=['number'])
            sns.heatmap(numeric_df.corr(), annot=True, cmap="coolwarm", ax=ax, fmt=".2f")
            ax.set_title("Correlation Heatmap", fontsize=12, fontweight="900", pad=20)
        else:
            sns.scatterplot(data=df, x=x, y=y, ax=ax)
    except Exception as e:
        print(f"Error drawing {plot_type}: {e}")
        sns.scatterplot(data=df, x=x, y=y, ax=ax) # Safe fallback
        
    ax.set_title(title, fontsize=12, fontweight="900", pad=20)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    img_name = f"playground_{uuid.uuid4().hex[:6]}.png"
    img_path = session_dir / img_name
    fig.savefig(img_path, bbox_inches="tight", dpi=130, facecolor="#f8fafc")
    plt.close(fig)
    
    return ChartMetadata(
        chart_id=uuid.uuid4().hex,
        dataset=dataset_filename,
        plot_type=plot_type,
        title=title,
        x_axis=x,
        y_axis=y,
        trend_direction="N/A",
        statistical_significance="User Directed Query",
        key_observations=config.get("observations", []),
        image_url=f"/static/{session_dir.name}/{img_name}"
    )

@router.post("/playground", response_model=PlaygroundResponse)
async def playground_analysis(request: PlaygroundRequest):
    session = get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    df_dict = session.get("dataframes", {})
    if request.dataset not in df_dict:
        raise HTTPException(status_code=400, detail="Dataset not found in session")
        
    df = df_dict[request.dataset]
    valid_cols = [c for c in request.columns if c in df.columns]
    if not valid_cols:
        raise HTTPException(status_code=400, detail="No valid columns selected")
        
    # Get configuration from AI
    config = await get_plot_config(valid_cols, request.prompt)
    
    # Generate plot based on AI config
    session_dir = Path(session.get("upload_dir", "./uploads"))
    chart_meta = draw_custom_plot(df, config, session_dir, request.dataset)
    
    # Add chart to session charts array to be easily accessible by chatbot
    charts = session.get("charts", [])
    charts.append(chart_meta)
    
    summary_text = config.get("summary", "Custom playground analysis completed.")
    deep_stats = config.get("deep_stats", [])
    
    insights = []
    for stat in deep_stats:
        insights.append(Insight(
            metric_name=stat.get("metric", "Custom Metric"),
            statistical_value={"value": stat.get("stat_value", ""), "prompt": request.prompt},
            confidence_score=0.9,
            business_interpretation=stat.get("interpretation", "No interpretation provided."),
            recommended_visualization=config.get("plot_type", "scatter_plot"),
            layer="predictive"
        ))
        
    if not insights:
        insights.append(Insight(
            metric_name=", ".join(valid_cols),
            statistical_value={"prompt": request.prompt, "selected_columns": valid_cols, "chart_type_chosen": config.get("plot_type")},
            confidence_score=0.9,
            business_interpretation=config.get("observations", ["No specific observations generated."])[0] if config.get("observations") else "Custom playground analysis completed.",
            recommended_visualization=config.get("plot_type", "scatter_plot"),
            layer="diagnostic"
        ))
    
    return PlaygroundResponse(chart=chart_meta, insights=insights, summary=summary_text)
