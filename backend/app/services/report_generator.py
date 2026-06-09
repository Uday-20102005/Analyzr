from __future__ import annotations

import io
import json
from datetime import datetime

from app.models.schemas import AnalysisResponse


# ─── JSON Report ──────────────────────────────────────────────────────────────

def generate_json_report(analysis: AnalysisResponse) -> bytes:
    return json.dumps(analysis.model_dump(), indent=2, default=str).encode("utf-8")


# ─── PDF Report ───────────────────────────────────────────────────────────────

def generate_pdf_report(analysis: AnalysisResponse, report_type: str) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
    )

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=2.2*cm, rightMargin=2.2*cm,
        topMargin=2.4*cm, bottomMargin=2.4*cm
    )

    # ── Brand colours ──
    ORANGE      = colors.HexColor("#e8572a")
    ORANGE_DARK = colors.HexColor("#c73f14")
    DARK        = colors.HexColor("#141412")
    DARK_MID    = colors.HexColor("#1e1c19")
    WARM_GRAY   = colors.HexColor("#9a9891")
    BORDER      = colors.HexColor("#e4e3dd")
    BG_WARM     = colors.HexColor("#fafaf8")
    BG_CARD     = colors.HexColor("#fef5f0")
    WHITE       = colors.white

    styles = getSampleStyleSheet()

    # ── Custom paragraph styles ──
    def make_style(name, **kwargs):
        return ParagraphStyle(name, parent=styles["Normal"], **kwargs)

    style_brand = make_style("Brand",
        fontSize=7.5, textColor=ORANGE,
        fontName="Helvetica-Bold", letterSpacing=1.4,
        spaceAfter=6)

    style_h1 = make_style("H1",
        fontSize=28, textColor=DARK,
        fontName="Helvetica-Bold", leading=32,
        spaceAfter=4, letterSpacing=-0.5)

    style_session = make_style("Session",
        fontSize=8, textColor=WARM_GRAY,
        spaceAfter=24, letterSpacing=0.4)

    style_h2 = make_style("H2",
        fontSize=13, textColor=DARK,
        fontName="Helvetica-Bold", leading=17,
        spaceBefore=24, spaceAfter=10, letterSpacing=0.2)

    style_h3 = make_style("H3",
        fontSize=7.5, textColor=WARM_GRAY,
        fontName="Helvetica-Bold",
        spaceBefore=16, spaceAfter=8,
        letterSpacing=1.2)

    style_body = make_style("Body",
        fontSize=9.5, textColor=colors.HexColor("#3d3b35"),
        leading=15, spaceAfter=4)

    style_quote = make_style("Quote",
        fontSize=10, textColor=colors.HexColor("#4a4845"),
        leading=16, leftIndent=14, spaceAfter=8,
        fontName="Helvetica-Oblique")

    style_bullet = make_style("Bullet",
        fontSize=9.5, textColor=colors.HexColor("#3d3b35"),
        leading=14, leftIndent=12, spaceAfter=5)

    story = []

    # ── Cover block ──
    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph("ANALYZR", style_brand))
    story.append(Paragraph("Intelligence Report", style_h1))
    story.append(Paragraph(
        f"Session {analysis.session_id[:16]}…  ·  "
        f"Generated {datetime.utcnow().strftime('%d %b %Y, %H:%M UTC')}  ·  "
        f"Type: {report_type.upper()}",
        style_session
    ))

    # Orange rule
    story.append(HRFlowable(
        width="100%", thickness=2,
        color=ORANGE, spaceAfter=24, spaceBefore=0
    ))

    # ── Per-dataset sections ──
    for da in analysis.datasets:
        # Dataset heading
        story.append(Paragraph(da.filename.upper(), style_h2))
        story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=12))

        # Executive summary blockquote
        if da.executive_summary:
            story.append(Paragraph("EXECUTIVE SUMMARY", style_h3))
            summary_data = [[Paragraph(da.executive_summary, style_quote)]]
            summary_table = Table(summary_data, colWidths=[16.6*cm])
            summary_table.setStyle(TableStyle([
                ("BACKGROUND",    (0, 0), (-1, -1), BG_CARD),
                ("LEFTPADDING",   (0, 0), (-1, -1), 14),
                ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
                ("TOPPADDING",    (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
                ("LINEBEFORE",    (0, 0), (0, -1), 3, ORANGE),
                ("ROUNDEDCORNERS", [4]),
            ]))
            story.append(summary_table)
            story.append(Spacer(1, 0.5*cm))

        # Core metrics KPI grid (2 columns)
        if da.core_metrics:
            story.append(Paragraph("KEY METRICS", style_h3))
            metric_rows = []
            for i in range(0, len(da.core_metrics), 2):
                pair = []
                for m in da.core_metrics[i:i+2]:
                    cell = Paragraph(
                        f'<font size="7" color="#9a9891"><b>{m["label"].upper()}</b></font>'
                        f'<br/><font size="20" color="#e8572a"><b>{m["value"]}</b></font>'
                        f'<br/><font size="8" color="#6b6a65">{m["interpretation"]}</font>',
                        style_body
                    )
                    pair.append(cell)
                while len(pair) < 2:
                    pair.append("")
                metric_rows.append(pair)

            metric_table = Table(metric_rows, colWidths=[8.3*cm, 8.3*cm])
            metric_table.setStyle(TableStyle([
                ("BACKGROUND",    (0, 0), (-1, -1), WHITE),
                ("GRID",          (0, 0), (-1, -1), 0.5, BORDER),
                ("TOPPADDING",    (0, 0), (-1, -1), 14),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
                ("LEFTPADDING",   (0, 0), (-1, -1), 16),
                ("RIGHTPADDING",  (0, 0), (-1, -1), 16),
                ("VALIGN",        (0, 0), (-1, -1), "TOP"),
            ]))
            story.append(metric_table)
            story.append(Spacer(1, 0.5*cm))

        # Recommendations
        if da.recommendations:
            story.append(Paragraph("STRATEGIC RECOMMENDATIONS", style_h3))
            for rec in da.recommendations:
                story.append(Paragraph(f"→  {rec}", style_bullet))
            story.append(Spacer(1, 0.4*cm))

        # Top insights table
        all_insights = da.descriptive + da.diagnostic + da.predictive + da.business
        top = sorted(all_insights, key=lambda i: i.confidence_score, reverse=True)[:10]

        if top:
            story.append(Paragraph("PRIORITY FINDINGS", style_h3))

            LAYER_COLORS = {
                "descriptive": colors.HexColor("#6366f1"),
                "diagnostic":  colors.HexColor("#f97316"),
                "predictive":  colors.HexColor("#22c55e"),
                "business":    colors.HexColor("#d946ef"),
            }

            table_data = [[
                Paragraph('<font size="7" color="white"><b>LAYER</b></font>', style_body),
                Paragraph('<font size="7" color="white"><b>METRIC</b></font>', style_body),
                Paragraph('<font size="7" color="white"><b>CONF.</b></font>', style_body),
                Paragraph('<font size="7" color="white"><b>INTERPRETATION</b></font>', style_body),
            ]]

            for ins in top:
                interp = ins.business_interpretation
                if len(interp) > 110:
                    interp = interp[:110] + "…"
                layer_color = LAYER_COLORS.get(ins.layer, WARM_GRAY)
                table_data.append([
                    Paragraph(f'<font size="7" color="{layer_color.hexval()}">'
                              f'<b>{ins.layer.upper()}</b></font>', style_body),
                    Paragraph(f'<font size="7.5">{ins.metric_name[:38]}</font>', style_body),
                    Paragraph(f'<font size="8"><b>{ins.confidence_score:.0%}</b></font>', style_body),
                    Paragraph(f'<font size="8">{interp}</font>', style_body),
                ])

            insights_table = Table(table_data, colWidths=[2.4*cm, 3.4*cm, 1.8*cm, 9.0*cm])
            insights_table.setStyle(TableStyle([
                ("BACKGROUND",    (0, 0), (-1, 0), DARK),
                ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, BG_WARM]),
                ("GRID",          (0, 0), (-1, -1), 0.4, BORDER),
                ("VALIGN",        (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING",   (0, 0), (-1, -1), 8),
                ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
                ("TOPPADDING",    (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]))
            story.append(insights_table)

        story.append(PageBreak())

    # ── Cross-dataset insights ──
    if analysis.cross_dataset_insights:
        story.append(Paragraph("CROSS-DATASET INSIGHTS", style_h2))
        story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=12))
        for item in analysis.cross_dataset_insights:
            story.append(Paragraph(f"→  {item}", style_bullet))

    # ── Footer note ──
    story.append(Spacer(1, 1*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=8))
    story.append(Paragraph(
        f"Generated by Analyzr AI Intelligence Engine  ·  {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        make_style("Footer", fontSize=7.5, textColor=WARM_GRAY, alignment=1)
    ))

    doc.build(story)
    return buf.getvalue()


# ─── HTML Report ──────────────────────────────────────────────────────────────

def generate_html_report(analysis: AnalysisResponse) -> bytes:
    generated_at = datetime.utcnow().strftime("%d %b %Y, %H:%M UTC")

    datasets_html = ""
    for da in analysis.datasets:
        # Metrics
        metrics_html = "".join(f"""
            <div class="metric-card">
                <div class="metric-label">{m['label']}</div>
                <div class="metric-value">{m['value']}</div>
                <div class="metric-note">{m['interpretation']}</div>
            </div>""" for m in da.core_metrics)

        # Recommendations
        recs_html = "".join(
            f'<li>{rec}</li>' for rec in da.recommendations
        ) if da.recommendations else "<li>No recommendations generated.</li>"

        # Insight layers
        layer_meta = {
            "descriptive": ("📊", "#6366f1", "#eef2ff"),
            "diagnostic":  ("🔍", "#f97316", "#fff7ed"),
            "predictive":  ("🔮", "#22c55e", "#f0fdf4"),
            "business":    ("💼", "#d946ef", "#fdf4ff"),
        }
        all_insights = da.descriptive + da.diagnostic + da.predictive + da.business
        top_insights = sorted(all_insights, key=lambda i: i.confidence_score, reverse=True)[:8]

        insights_html = ""
        for ins in top_insights:
            emoji, color, bg = layer_meta.get(ins.layer, ("•", "#9a9891", "#fafaf8"))
            interp = ins.business_interpretation
            if len(interp) > 180:
                interp = interp[:180] + "…"
            insights_html += f"""
            <div class="insight-card" style="border-left-color:{color};background:{bg};">
                <div class="insight-layer" style="color:{color};">{emoji} {ins.layer.upper()}</div>
                <div class="insight-metric">{ins.metric_name}</div>
                <div class="insight-text">{interp}</div>
                <div class="insight-conf" style="color:{color};">{ins.confidence_score:.0%} confidence</div>
            </div>"""

        datasets_html += f"""
        <section class="dataset-section">
            <div class="section-eyebrow">Dataset</div>
            <h2 class="dataset-title">{da.filename}</h2>

            <blockquote class="exec-summary">{da.executive_summary or "Analysis pending."}</blockquote>

            <div class="subsection-label">Key Metrics</div>
            <div class="metric-grid">{metrics_html}</div>

            <div class="subsection-label">Priority Findings</div>
            <div class="insights-grid">{insights_html}</div>

            <div class="subsection-label">Strategic Recommendations</div>
            <ul class="rec-list">{recs_html}</ul>
        </section>
        <hr class="section-divider">
        """

    cross_html = ""
    if analysis.cross_dataset_insights:
        items = "".join(f"<li>{i}</li>" for i in analysis.cross_dataset_insights)
        cross_html = f"""
        <section class="dataset-section">
            <div class="subsection-label">Cross-Dataset Insights</div>
            <ul class="rec-list">{items}</ul>
        </section>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analyzr Intelligence Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

        :root {{
            --orange:      #e8572a;
            --orange-dark: #c73f14;
            --dark:        #141412;
            --warm-gray:   #9a9891;
            --border:      #e4e3dd;
            --bg:          #f5f4f0;
            --bg-card:     #ffffff;
            --text:        #3d3b35;
            --text-light:  #6b6a65;
        }}

        body {{
            font-family: 'DM Sans', sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.7;
            padding: 0;
        }}

        /* ── Header ── */
        .report-header {{
            background: linear-gradient(135deg, #0f0e0c 0%, #1a1814 55%, #211d14 100%);
            padding: 4rem 3rem 3.5rem;
            position: relative;
            overflow: hidden;
        }}
        .report-header::before {{
            content: '';
            position: absolute;
            top: -80px; right: 10%;
            width: 400px; height: 400px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(232,87,42,0.12) 0%, transparent 65%);
            pointer-events: none;
        }}
        .header-inner {{ max-width: 900px; margin: 0 auto; position: relative; z-index: 1; }}
        .header-badge {{
            display: inline-flex; align-items: center; gap: 6px;
            padding: 4px 12px; border-radius: 999px;
            background: rgba(232,87,42,0.15);
            border: 1px solid rgba(232,87,42,0.30);
            font-size: 0.6875rem; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.12em;
            color: var(--orange); margin-bottom: 1.25rem;
        }}
        .report-title {{
            font-family: 'Syne', sans-serif;
            font-weight: 700;
            font-size: clamp(2.25rem, 5vw, 3.25rem);
            line-height: 1.1;
            letter-spacing: -0.02em;
            color: rgba(250,250,248,0.65);
            margin-bottom: 0.25rem;
        }}
        .report-title-accent {{
            font-family: 'Syne', sans-serif;
            font-weight: 700;
            font-size: clamp(2.25rem, 5vw, 3.25rem);
            line-height: 1.1;
            letter-spacing: -0.02em;
            background: linear-gradient(110deg, #e8572a 10%, #f59e0b 85%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1.5rem;
            display: block;
        }}
        .report-meta {{
            font-size: 0.8125rem;
            color: rgba(250,250,248,0.35);
            letter-spacing: 0.03em;
        }}
        .report-meta span {{ color: rgba(250,250,248,0.55); }}

        /* ── Content ── */
        .content {{ max-width: 900px; margin: 0 auto; padding: 3rem 2rem 5rem; }}

        .dataset-section {{ margin-bottom: 3rem; }}

        .section-eyebrow {{
            font-size: 0.6875rem; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.12em;
            color: var(--warm-gray); margin-bottom: 6px;
        }}
        .dataset-title {{
            font-family: 'Syne', sans-serif;
            font-weight: 700; font-size: 1.5rem;
            color: var(--dark); letter-spacing: -0.01em;
            margin-bottom: 1.5rem;
        }}
        .subsection-label {{
            font-size: 0.6875rem; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.12em;
            color: var(--warm-gray);
            margin: 2rem 0 0.875rem;
        }}

        /* ── Blockquote ── */
        .exec-summary {{
            padding: 1.25rem 1.5rem;
            background: #fef5f0;
            border-left: 3px solid var(--orange);
            border-radius: 0 12px 12px 0;
            font-size: 0.9375rem;
            font-style: italic;
            font-weight: 400;
            color: #4a4845;
            line-height: 1.8;
            letter-spacing: 0.01em;
            margin-bottom: 0.5rem;
        }}

        /* ── Metrics ── */
        .metric-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
            gap: 1rem;
        }}
        .metric-card {{
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 1.375rem;
        }}
        .metric-label {{
            font-size: 0.6875rem; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.10em;
            color: #b8b7b0; margin-bottom: 10px;
        }}
        .metric-value {{
            font-family: 'Syne', sans-serif;
            font-size: 2rem; font-weight: 700;
            color: var(--orange); letter-spacing: -0.02em;
            line-height: 1.15; margin-bottom: 8px;
        }}
        .metric-note {{
            font-size: 0.8125rem; color: var(--text-light);
            line-height: 1.55; letter-spacing: 0.01em;
        }}

        /* ── Insight cards ── */
        .insights-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 0.875rem;
        }}
        .insight-card {{
            border-radius: 12px;
            border: 1px solid transparent;
            border-left-width: 3px;
            padding: 1rem 1.125rem;
        }}
        .insight-layer {{
            font-size: 0.6875rem; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.09em;
            margin-bottom: 5px;
        }}
        .insight-metric {{
            font-size: 0.8125rem; font-weight: 600;
            color: var(--dark); margin-bottom: 5px;
            letter-spacing: 0.005em;
        }}
        .insight-text {{
            font-size: 0.8125rem; font-weight: 400;
            color: var(--text); line-height: 1.65;
            letter-spacing: 0.01em; margin-bottom: 8px;
        }}
        .insight-conf {{
            font-size: 0.6875rem; font-weight: 600;
            letter-spacing: 0.04em;
        }}

        /* ── Recommendations ── */
        .rec-list {{ list-style: none; padding: 0; }}
        .rec-list li {{
            padding: 0.625rem 0.875rem 0.625rem 2rem;
            position: relative;
            font-size: 0.9rem; line-height: 1.65;
            color: var(--text); letter-spacing: 0.01em;
            border-bottom: 1px solid var(--border);
        }}
        .rec-list li:last-child {{ border-bottom: none; }}
        .rec-list li::before {{
            content: '→';
            position: absolute; left: 0;
            color: var(--orange); font-weight: 600;
        }}

        /* ── Divider ── */
        .section-divider {{
            border: none;
            border-top: 1px solid var(--border);
            margin: 2.5rem 0;
        }}

        /* ── Footer ── */
        .report-footer {{
            text-align: center;
            padding: 1.5rem;
            font-size: 0.75rem;
            color: var(--warm-gray);
            letter-spacing: 0.04em;
            border-top: 1px solid var(--border);
        }}
    </style>
</head>
<body>

    <header class="report-header">
        <div class="header-inner">
            <div class="header-badge">✦ Analysis Complete</div>
            <div class="report-title">Intelligence</div>
            <span class="report-title-accent">Report</span>
            <div class="report-meta">
                Session <span>{analysis.session_id[:16]}…</span>
                &nbsp;·&nbsp; {generated_at}
                &nbsp;·&nbsp; Type: <span>{report_type.upper()}</span>
            </div>
        </div>
    </header>

    <div class="content">
        {datasets_html}
        {cross_html}
    </div>

    <footer class="report-footer">
        Generated by Analyzr AI Intelligence Engine &nbsp;·&nbsp; {generated_at}
    </footer>

</body>
</html>"""

    return html.encode("utf-8")


# ─── DOCX (kept for compatibility) ───────────────────────────────────────────

def generate_docx_report(analysis: AnalysisResponse, report_type: str) -> bytes:
    return b""