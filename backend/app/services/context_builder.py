from __future__ import annotations

import json
from app.models.schemas import DatasetAnalysis, Insight


# ── SYSTEM PROMPT: LEELA PERSONA ───────────────────────────────────────────
SYSTEM_PROMPT = """
You are Leela, an authoritative but accessible data analysis guide.
Interpret data with professional rigor, communicating in plain, easy-to-understand English.
Speak decisively and minimize conversational filler. You represent executive intelligence — sharp, clear, and action-oriented.

Rules:
- Maintain a high-end, professional tone. A brief greeting is acceptable if the user initiates.
- Focus on practical implications and clear data insights. Do not be overly dense, but maintain statistical accuracy.
- For data queries, provide direct, practical, and unhedged answers.
- Be concise: focus on the most impactful finding.
- Provide a SINGLE cohesive block of text. Do NOT use markdown sections, headings, or bulleted lists.
- Do NOT include follow-up suggestions, questions, or next steps."""


def _format_raw_stats(insight: Insight) -> str:
    """Serialize raw statistical values for Mistral to interpret."""
    val_str = json.dumps(insight.statistical_value, default=str)
    return (
        f"Metric: {insight.metric_name}\n"
        f"Layer: {insight.layer}\n"
        f"Raw stats: {val_str}\n"
        f"Current template text (replace this): {insight.business_interpretation}"
    )


def build_enrich_insights_prompt(insights: list[Insight], dataset_name: str, dataset_shape: tuple[int, int]) -> str:
    """
    Ask Mistral to rewrite every insight's business_interpretation as a concise,
    plain-English, action-oriented sentence — no raw numbers, no statistical jargon.
    Returns JSON array of strings matching the input insight order.
    """
    items = "\n\n".join(f"[{i}] {_format_raw_stats(ins)}" for i, ins in enumerate(insights))
    return f"""{SYSTEM_PROMPT}

Dataset '{dataset_name}' has {dataset_shape[0]:,} rows and {dataset_shape[1]} columns.

Below are {len(insights)} statistical findings. For each one, write a single sharp insight in plain business English.
Each insight must be 1-2 sentences: what the data shows + what the business should do about it.
Do NOT include percentages, decimals, or statistical terms. Do NOT reference the metric name directly.

FINDINGS:
{items}

Respond ONLY with a valid JSON array of {len(insights)} strings, in the same order as the findings above.
Example format: ["insight 0 text", "insight 1 text", ...]
"""


def build_analysis_prompt(dataset_analysis: DatasetAnalysis, charts_summary: list[str]) -> str:
    """Prompt for generating the smart narrative + recommendations after analysis."""
    all_insights = (
        dataset_analysis.descriptive
        + dataset_analysis.diagnostic
        + dataset_analysis.predictive
        + dataset_analysis.business
    )
    top = sorted(all_insights, key=lambda i: i.confidence_score, reverse=True)[:15]
    insight_text = "\n".join(
        f"- [{ins.layer.upper()}] {ins.metric_name}: {ins.business_interpretation}"
        for ins in top
    )
    charts_text = "\n".join(f"- {c}" for c in charts_summary[:8])

    return f"""{SYSTEM_PROMPT}
    
You have analysed '{dataset_analysis.filename}'. Your goal is to synthesize the most critical 3-4 consistent metrics that define the health of this dataset.
    
KEY FINDINGS FROM ANALYSIS LAYERS:
{insight_text}
    
CHARTS GENERATED:
{charts_text}
    
Write a management-level analysis in this EXACT JSON format:
{{
  "executive_summary": "A confident 3-sentence narrative — what the data reveals, the most important pattern, and the #1 recommended action. Written as if presenting to a CEO.",
  "core_metrics": [
    {{
      "label": "CONCISE_LABEL (e.g., Average Spending)",
      "value": "Calculated value from findings (number or short string)",
      "interpretation": "Single sentence explaining why this metric matters for the business."
    }}
  ],
  "recommendations": ["Action-oriented recommendation 1 (start with a verb)", "recommendation 2", "recommendation 3", "recommendation 4"],
  "risks": ["Specific risk 1 identified from the data", "risk 2"]
}}
    
Rules for core_metrics:
1. Select ONLY the most statistically significant and consistent numbers.
2. Ensure the "value" is derived directly from the analysis context above.
3. Limit to 3 or 4 metrics total."""


def build_chat_prompt(
    session_summary: str,
    conversation_history: list[dict],
    user_message: str,
) -> str:
    history_text = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in conversation_history[-12:]
    )
    return f"""{SYSTEM_PROMPT}

As Leela, review the conversation and the session context above.
Provide a concise response (max 3-4 sentences) that is data-focused.
 You have full context of the analysis below.

FULL ANALYSIS CONTEXT:
{session_summary}

CONVERSATION SO FAR:
{history_text}

USER: {user_message}

Respond as Leela. Be confident, direct, and insightful. Draw meaningful inferences even if not explicitly stated. Speak plainly.
IMPORTANT RULE: Your entire response MUST be EXACTLY ONE coherent paragraph. NO bullet points, NO headings, NO sections, NO lines separating text. Do NOT append follow-up questions or suggestions to the user.

LEELA:"""


def build_proactive_opener_prompt(session_summary: str) -> str:
    """Prompt for Leela's unsolicited opening message when chat is first opened."""
    return f"""{SYSTEM_PROMPT}

You have just finished analysing a dataset. Here is the full analysis:

{session_summary}

Without waiting to be asked, write your opening message to the analyst.
Introduce yourself as Leela and immediately deliver the 3 most surprising or actionable findings you found.
Format: brief intro (1 sentence) + 3 numbered findings, each 1-2 sentences.
End with one question that invites them to dig deeper into the most interesting finding.
Keep the total under 150 words."""


def build_session_summary(analyses: list[DatasetAnalysis]) -> str:
    """Build a rich context block for the chat prompt."""
    parts = []
    for da in analyses:
        all_insights = da.descriptive + da.diagnostic + da.predictive + da.business
        top = sorted(all_insights, key=lambda i: i.confidence_score, reverse=True)[:10]

        # Include column names, core metrics, and recommendations for richer context
        metric_lines = "\n".join(f"  - {m['label']}: {m['value']} ({m['interpretation']})" for m in da.core_metrics)
        insight_lines = "\n".join(
            f"  [{ins.layer.upper()}] {ins.metric_name}: {ins.business_interpretation}"
            for ins in top
        )
        recs = "\n".join(f"  → {r}" for r in da.recommendations[:4])
        summary_block = (
            f"### Dataset: {da.filename}\n"
            f"Executive view: {da.executive_summary}\n\n"
            f"Core Metrics:\n{metric_lines}\n\n"
            f"Key findings:\n{insight_lines}\n\n"
            f"Recommendations:\n{recs}"
        )
        parts.append(summary_block)
    return "\n\n---\n\n".join(parts)
