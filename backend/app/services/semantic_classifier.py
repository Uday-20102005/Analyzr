from __future__ import annotations

import json
from typing import Dict, List
from app.services.ai_engine import _call_ollama_async, _parse_json

# Semantic Roles
# ID: Unique identifier, skip statistics
# AGGREGATABLE_METRIC: Numerical value that makes sense to SUM (Revenue, Cost)
# ATTRIBUTE_METRIC: Numerical value that only makes sense to AVERAGE/COMPARE (Age, Score, Temperature)
# CATEGORICAL: Grouping dimension
# TEMPORAL: Date or time

PROMPT_TEMPLATE = """
You are a data architect. Classify the following columns from a dataset into semantic roles.
For each column, I will provide the name and 3 sample values.

ROLES:
- ID: Primary keys, foreign keys, or unique identifiers.
- AGGREGATABLE_METRIC: Numeric values that represent a quantity (Sales, Profit, Quantity). It MUST make sense to SUM these values.
- ATTRIBUTE_METRIC: Numeric values that represent a state or property (Age, Rating, Score, Year). It makes sense to AVERAGE these but NOT to SUM them (e.g., summing Ages is useless).
- CATEGORICAL: Text-based categories or labels.
- TEMPORAL: Dates or timestamps.

COLUMNS:
{columns_block}

Respond ONLY with a valid JSON object where keys are column names and values are the ROLES.
Example: {{"CustomerID": "ID", "Sales": "AGGREGATABLE_METRIC", "CustomerAge": "ATTRIBUTE_METRIC"}}
"""

async def classify_columns_semantically(columns: List[Dict]) -> Dict[str, str]:
    """
    columns: List of {'name': str, 'samples': list}
    Returns mapping: {col_name: role}
    """
    if not columns:
        return {}

    cols_text = ""
    for col in columns:
        cols_text += f"- {col['name']} (Samples: {', '.join(map(str, col['samples']))})\n"

    prompt = PROMPT_TEMPLATE.format(columns_block=cols_text)
    raw = await _call_ollama_async(prompt, num_predict=1024, temperature=0.1)
    
    if raw.startswith("__OLLAMA"):
        return {}

    parsed = _parse_json(raw)
    return parsed if isinstance(parsed, dict) else {}
