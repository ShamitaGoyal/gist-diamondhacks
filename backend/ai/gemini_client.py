import os
from pathlib import Path

import httpx
from dotenv import load_dotenv

# Load `.env` from repository root (parent of `backend/`) so `python backend/run.py` works from any cwd.
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(_REPO_ROOT / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")

# Gemini 3.5 Flash (GA) — override in root `.env` if needed
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
FALLBACK_MODELS = os.getenv(
    "GEMINI_FALLBACK_MODELS",
    "gemini-3.5-flash,gemini-2.0-flash,gemini-2.5-flash,gemini-1.5-flash",
)
# Gemini 3.x: minimal | low | medium (default) | high — see Google docs
DEFAULT_THINKING_LEVEL = os.getenv("GEMINI_THINKING_LEVEL", "low")

VALID_THINKING_LEVELS = frozenset({"minimal", "low", "medium", "high"})


class GeminiAPIError(Exception):
    """Raised when the Generative Language API returns an error object (e.g. 429 quota)."""

    def __init__(self, message: str, *, code: int | None = None):
        super().__init__(message)
        self.code = code


def _model_url(model: str) -> str:
    return f"https://generativelanguage.googleapis.com/v1beta/models/{model.strip()}:generateContent"


def _is_gemini_3(model_name: str) -> bool:
    """Gemini 3.x uses thinking_level and omits temperature/top_p/top_k."""
    return model_name.startswith("gemini-3")


def _models_to_try(primary: str | None = None) -> list[str]:
    ordered: list[str] = []
    for name in [primary or DEFAULT_MODEL, *FALLBACK_MODELS.split(",")]:
        name = name.strip()
        if name and name not in ordered:
            ordered.append(name)
    return ordered


def _resolve_thinking_level(
    model_name: str,
    *,
    thinking_level: str | None,
    thinking_budget: int | None,
) -> str | None:
    if not _is_gemini_3(model_name):
        return None
    if thinking_level and thinking_level in VALID_THINKING_LEVELS:
        return thinking_level
    if thinking_budget == 0:
        return "minimal"
    return DEFAULT_THINKING_LEVEL if DEFAULT_THINKING_LEVEL in VALID_THINKING_LEVELS else "low"


def _build_generation_config(
    model_name: str,
    *,
    max_output_tokens: int,
    response_mime_type: str | None,
    temperature: float | None,
    thinking_level: str | None,
    thinking_budget: int | None,
) -> dict:
    gen: dict = {"maxOutputTokens": max_output_tokens}
    if response_mime_type:
        gen["responseMimeType"] = response_mime_type

    if _is_gemini_3(model_name):
        level = _resolve_thinking_level(
            model_name,
            thinking_level=thinking_level,
            thinking_budget=thinking_budget,
        )
        if level:
            gen["thinkingConfig"] = {"thinkingLevel": level}
    else:
        # Gemini 2.x / 1.5 — legacy sampling + optional thinking_budget
        if temperature is not None:
            gen["temperature"] = temperature
            gen["topP"] = 0.9
        if thinking_budget is not None:
            gen["thinkingConfig"] = {"thinkingBudget": thinking_budget}

    return gen


def _parse_error(data: dict) -> tuple[str, int | None]:
    err = data.get("error", {})
    if not isinstance(err, dict):
        return "Gemini API error", None
    msg = err.get("message", "Gemini API error")
    if not isinstance(msg, str):
        msg = str(msg)
    msg = msg.strip()[:2500]
    raw_code = err.get("code")
    code: int | None
    if isinstance(raw_code, int):
        code = raw_code
    elif isinstance(raw_code, str) and raw_code.isdigit():
        code = int(raw_code)
    else:
        code = None
    return msg, code


def _is_retryable(msg: str, code: int | None) -> bool:
    if code in (429, 503):
        return True
    lower = msg.lower()
    return any(
        phrase in lower
        for phrase in ("high demand", "quota", "resource exhausted", "overloaded", "try again")
    )


async def call_gemini(
    prompt: str,
    *,
    model: str | None = None,
    max_output_tokens: int = 512,
    response_mime_type: str | None = None,
    thinking_level: str | None = None,
    thinking_budget: int | None = None,
    temperature: float | None = None,
    raise_api_errors: bool = False,
):
    """
    Call Gemini generateContent (REST). Tries GEMINI_MODEL then fallbacks on capacity errors.

    Gemini 3.x (e.g. gemini-3.5-flash):
      - Use thinking_level: minimal | low | medium | high (not thinking_budget).
      - Do not set temperature / top_p / top_k (Google recommends defaults).

    Gemini 2.x fallbacks:
      - temperature + thinking_budget still supported.

    thinking_budget=0 on 3.x is mapped to thinking_level=minimal (legacy callers).
    """
    last_msg = "Gemini API error"
    last_code: int | None = None

    async with httpx.AsyncClient(timeout=90.0) as client:
        for model_name in _models_to_try(model):
            gen = _build_generation_config(
                model_name,
                max_output_tokens=max_output_tokens,
                response_mime_type=response_mime_type,
                temperature=temperature,
                thinking_level=thinking_level,
                thinking_budget=thinking_budget,
            )
            try:
                response = await client.post(
                    f"{_model_url(model_name)}?key={API_KEY}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": gen,
                    },
                )
                data = response.json()

                if "error" in data:
                    last_msg, last_code = _parse_error(data)
                    if _is_retryable(last_msg, last_code):
                        print(f"Gemini [{model_name}] busy, trying next model…")
                        continue
                    if raise_api_errors:
                        raise GeminiAPIError(last_msg, code=last_code)
                    return ""

                candidates = data.get("candidates", [])
                if not candidates:
                    continue

                content = candidates[0].get("content", {})
                parts = content.get("parts", [])
                if not parts:
                    continue

                text_output = parts[0].get("text", "")
                if text_output:
                    return text_output.strip()

            except GeminiAPIError:
                raise
            except Exception as e:
                last_msg = f"Network error calling Gemini ({model_name}): {e}"
                last_code = None
                print(last_msg)
                continue

    if raise_api_errors:
        raise GeminiAPIError(last_msg, code=last_code)
    return ""
