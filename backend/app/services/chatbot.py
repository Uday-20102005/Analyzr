from __future__ import annotations

from app.models.schemas import ChatMessage
from app.services.context_builder import build_chat_prompt, build_session_summary
from app.services.ai_engine import chat_with_context


GUARDRAIL_RESPONSE = (
    "I can only answer questions about the uploaded datasets and their analysis. "
    "Please ask something related to the data you have uploaded."
)

OUT_OF_SCOPE_KEYWORDS = [
    "weather", "stock price", "sports", "movie", "recipe", "general knowledge",
    "who is", "what is the capital", "write me a poem",
]


GREETING_KEYWORDS = ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "morning"]
META_KEYWORDS = ["layers", "how do you work", "what are you", "who are you", "overview", "help"]

def _is_out_of_scope(message: str) -> bool:
    lower = message.lower().strip()
    return any(kw in lower for kw in OUT_OF_SCOPE_KEYWORDS)


def _get_intent(message: str) -> str:
    lower = message.lower().strip()
    if any(kw == lower or lower.startswith(kw + " ") for kw in GREETING_KEYWORDS):
        return "GREETING"
    if any(kw in lower for kw in META_KEYWORDS):
        return "META_QUERY"
    return "DATA_QUERY"


async def handle_chat(
    session_id: str,
    user_message: str,
    history: list[ChatMessage],
    analyses,
) -> str:
    intent = _get_intent(user_message)
    
    if intent == "GREETING":
        return "Leela online. Analysis context is active and loaded. How can I assist with your data findings?"
    
    if intent == "META_QUERY":
        return (
            "Analyzr uses a 4-layer statistical framework (Descriptive, Diagnostic, Predictive, Business) "
            "to synthesize dataset findings into executive metrics."
        )

    if _is_out_of_scope(user_message):
        return GUARDRAIL_RESPONSE

    session_summary = build_session_summary(analyses)
    history_dicts = [{"role": m.role, "content": m.content} for m in history]
    prompt = build_chat_prompt(session_summary, history_dicts, user_message)
    return await chat_with_context(prompt)
