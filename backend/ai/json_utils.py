"""Extract JSON from Gemini text (may include markdown fences or prose)."""
import json
import re


def safe_json_loads(raw: str) -> dict | list | None:
    if not raw or not raw.strip():
        return None
    text = raw.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        try:
            return json.loads(fence.group(1).strip())
        except json.JSONDecodeError:
            pass
    brace = re.search(r"[\[{][\s\S]*[\]}]", text)
    if brace:
        try:
            return json.loads(brace.group(0))
        except json.JSONDecodeError:
            pass
    return None
