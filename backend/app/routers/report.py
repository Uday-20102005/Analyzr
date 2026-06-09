from fastapi import APIRouter, HTTPException, Query, Response
from app.utils.session_store import get_session
from app.services.report_generator import (
    generate_json_report,
    generate_pdf_report,
    generate_html_report
)

router = APIRouter()

@router.get("/report/{session_id}")
async def export_report(
    session_id: str,
    format: str = Query("json", regex="^(json|html|pdf)$"),
    report_type: str = "executive"
):
    session = get_session(session_id)
    if not session or "analysis" not in session:
        raise HTTPException(status_code=404, detail="Analysis result not found")
    
    analysis = session["analysis"]
    
    if format == "json":
        content = generate_json_report(analysis)
        media_type = "application/json"
        filename = f"Analyzr_{session_id[:8]}.json"
    elif format == "html":
        content = generate_html_report(analysis)
        media_type = "text/html"
        filename = f"Analyzr_Executive_Report_{session_id[:8]}.html"
    elif format == "pdf":
        content = generate_pdf_report(analysis, report_type)
        media_type = "application/pdf"
        filename = f"Analyzr_Executive_Report_{session_id[:8]}.pdf"
    else:
        raise HTTPException(status_code=400, detail="Invalid format")

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
