import os
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

# ✅ Use a model YOU confirmed works
URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


class GeminiAPIError(Exception):
    """Raised when the Generative Language API returns an error object (e.g. 429 quota)."""

    def __init__(self, message: str, *, code: int | None = None):
        super().__init__(message)
        self.code = code


async def call_gemini(
    prompt: str,
    *,
    temperature: float = 0.2,
    max_output_tokens: int = 512,
    response_mime_type: str | None = None,
    thinking_budget: int | None = None,
    raise_api_errors: bool = False,
):
    """
    Calls Gemini API with stable generation settings.
    Returns text output safely.

    For Gemini 2.5 Flash, internal "thinking" can consume the output budget.
    Pass thinking_budget=0 to disable thinking when you need full JSON output.

    If raise_api_errors=True, API error responses raise GeminiAPIError instead of returning "".
    """
    gen: dict = {
        "temperature": temperature,
        "topP": 0.9,
        "maxOutputTokens": max_output_tokens,
    }
    if response_mime_type:
        gen["responseMimeType"] = response_mime_type
    if thinking_budget is not None:
        gen["thinkingConfig"] = {"thinkingBudget": thinking_budget}

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                f"{URL}?key={API_KEY}",
                json={
                    "contents": [
                        {
                            "parts": [
                                {"text": prompt}
                            ]
                        }
                    ],
                    "generationConfig": gen,
                },
            )

            data = response.json()

            print("GEMINI RAW RESPONSE:", data)

            if "error" in data:
                err = data["error"]
                print("Gemini API Error:", err)
                if raise_api_errors and isinstance(err, dict):
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
                    raise GeminiAPIError(msg, code=code)
                return ""

            candidates = data.get("candidates", [])
            if not candidates:
                return ""

            content = candidates[0].get("content", {})
            parts = content.get("parts", [])

            if not parts:
                return ""

            text_output = parts[0].get("text", "")

            return text_output.strip()

        except GeminiAPIError:
            raise
        except Exception as e:
            print("Gemini request failed:", e)
            if raise_api_errors:
                raise GeminiAPIError(f"Network error calling Gemini: {e}", code=None) from e
            return ""
