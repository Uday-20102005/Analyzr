from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import ChatRequest, ChatResponse
from app.services.chatbot import handle_chat
from app.utils.session_store import get_session, update_session

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    session = get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Please upload datasets first.")

    analysis = session.get("analysis")
    if not analysis:
        raise HTTPException(status_code=400, detail="Analysis not yet run. Call /api/analysis/{session_id} first.")

    reply = await handle_chat(
        session_id=request.session_id,
        user_message=request.message,
        history=request.history,
        analyses=analysis.datasets,
    )

    # Persist to session history
    history = session.get("chat_history", [])
    history.append({"role": "user", "content": request.message})
    history.append({"role": "assistant", "content": reply})
    update_session(request.session_id, {"chat_history": history})

    return ChatResponse(reply=reply)
