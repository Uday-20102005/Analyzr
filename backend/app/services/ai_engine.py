from __future__ import annotations

import asyncio
import json
import os
from concurrent.futures import ThreadPoolExecutor

import ollama

from app.models.schemas import DatasetAnalysis, Insight
from app.services.context_builder import (
    build_analysis_prompt,
    build_enrich_insights_prompt,
    build_proactive_opener_prompt,
)


OLLAMA_MODEL   = os.getenv("OLLAMA_MODEL",   "mistral")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "180"))

_executor = ThreadPoolExecutor(max_workers=2)


def _call_ollama_sync(prompt: str, num_predict: int = 1024, temperature: float = 0.4) -> str:
    """Blocking call to Ollama — always run in a thread pool."""
    print(f"      [OLLAMA] Querying {OLLAMA_MODEL}...")
    try:
        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": temperature, "num_predict": num_predict},
        )
        return response["message"]["content"].strip()
    except Exception as e:
        return f"__OLLAMA_ERROR__: {e}"


async def _call_ollama_async(prompt: str, num_predict: int = 1024, temperature: float = 0.4) -> str:
    """Async wrapper with timeout."""
    loop = asyncio.get_event_loop()
    try:
        return await asyncio.wait_for(
            loop.run_in_executor(
                _executor,
                lambda: _call_ollama_sync(prompt, num_predict, temperature),
            ),
            timeout=OLLAMA_TIMEOUT,
        )
    except asyncio.TimeoutError:
        return "__OLLAMA_TIMEOUT__"


def _parse_json(raw: str) -> dict | list | None:
    """Resilient JSON parser for potentially truncated AI responses."""
    # Try to find the first JSON-like block
    for start_char, end_char in [("{", "}"), ("[", "]")]:
        start = raw.find(start_char)
        if start == -1: continue
        
        # Try to find the matching end char
        # If the response is truncated, we might need to "force close" it
        sub = raw[start:]
        try:
            # Try standard parsing first
            end = sub.rfind(end_char) + 1
            if end > 0:
                return json.loads(sub[:end])
        except json.JSONDecodeError:
            # Attempt to fix common truncation issues by adding closing braces
            for fix in [end_char, f'"}}', f'"]', f'}}', f']']:
                try:
                    return json.loads(sub + fix)
                except: continue
    return None


async def enrich_insights_async(
    insights: list[Insight],
    dataset_name: str,
    dataset_shape: tuple[int, int],
) -> list[Insight]:
    """
    Send all insights to Mistral in one call and get back AI-written
    business_interpretation for each. Falls back to the original template text
    if Mistral fails or times out.
    """
    if not insights:
        return insights

    prompt = build_enrich_insights_prompt(insights, dataset_name, dataset_shape)
    raw    = await _call_ollama_async(prompt, num_predict=2048, temperature=0.5)

    if raw.startswith("__OLLAMA"):
        return insights  # graceful fallback — keep template text

    parsed = _parse_json(raw)
    if isinstance(parsed, list) and len(parsed) >= len(insights):
        enriched = []
        for i, ins in enumerate(insights):
            new_interp = str(parsed[i]).strip() if i < len(parsed) else ins.business_interpretation
            enriched.append(ins.model_copy(update={"business_interpretation": new_interp}))
        return enriched

    return insights  # fallback


async def interpret_dataset(
    dataset_analysis: DatasetAnalysis,
    charts_summary: list[str],
) -> tuple[str, list[str], list[dict]]:
    """Returns (executive_summary, recommendations_list, core_metrics_list)."""
    prompt = build_analysis_prompt(dataset_analysis, charts_summary)
    # Increase num_predict to 2048 to prevent truncation
    raw    = await _call_ollama_async(prompt, num_predict=2048, temperature=0.3)

    if raw.startswith("__OLLAMA"):
        return (
            "AI interpretation is temporarily unavailable. Statistical analysis is complete above.",
            ["Re-run analysis or check that Ollama is running with the mistral model."],
            []
        )

    parsed = _parse_json(raw)
    if isinstance(parsed, dict):
        summary = parsed.get("executive_summary", "")
        recs    = parsed.get("recommendations", [])
        metrics = parsed.get("core_metrics", [])
        return summary, [r for r in recs if r], metrics

    # Fallback: Clean up raw text if JSON keys leak through
    clean = raw.strip()
    if '"executive_summary":' in clean:
        try:
            # Extract content between first and second quote after the key
            parts = clean.split('"executive_summary":')[1].split('"')
            clean = parts[1] if len(parts) > 1 else clean
        except: pass
    
    return clean[:800], [], []


async def get_proactive_opener(session_summary: str) -> str:
    """Generate Leela's unsolicited opening message for the chat bubble."""
    prompt = build_proactive_opener_prompt(session_summary)
    raw    = await _call_ollama_async(prompt, num_predict=300, temperature=0.6)
    if raw.startswith("__OLLAMA"):
        return "Hi, I'm Leela — your AI analyst. I've reviewed your dataset and I'm ready to answer any questions you have about the data."
    return raw


async def chat_with_context(prompt: str) -> str:
    """Send a full chat prompt (already built by context_builder) to Ollama."""
    raw = await _call_ollama_async(prompt, num_predict=800, temperature=0.5)
    if raw.startswith("__OLLAMA_ERROR__"):
        return f"Leela is temporarily unavailable. Please ensure Ollama is running with the '{OLLAMA_MODEL}' model."
    if raw.startswith("__OLLAMA_TIMEOUT__"):
        return "That question required more context than I could process in time. Try asking something more specific."
    return raw
