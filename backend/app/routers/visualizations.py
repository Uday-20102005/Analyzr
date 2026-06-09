from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import VisualizationsResponse
from app.utils.session_store import get_session

router = APIRouter()


@router.get("/visualizations/{session_id}", response_model=VisualizationsResponse)
def get_visualizations(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    charts = session.get("charts", [])
    return VisualizationsResponse(session_id=session_id, charts=charts)
