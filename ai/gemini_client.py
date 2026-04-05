import os
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

# ✅ Use a model YOU confirmed works
URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


async def call_gemini(prompt: str):
    """
    Calls Gemini API with stable generation settings.
    Returns text output safely.
    """

    async with httpx.AsyncClient(timeout=30.0) as client:
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
                    # 🔥 FIX 1: Make outputs consistent and structured
                    "generationConfig": {
                        "temperature": 0.2,
                        "topP": 0.9,
                        "maxOutputTokens": 512
                    }
                }
            )

            data = response.json()

            # 🔍 Debug output (VERY useful)
            print("GEMINI RAW RESPONSE:", data)

            # ❌ Handle API errors cleanly
            if "error" in data:
                print("Gemini API Error:", data["error"])
                return ""

            # ✅ Safe extraction
            candidates = data.get("candidates", [])
            if not candidates:
                return ""

            content = candidates[0].get("content", {})
            parts = content.get("parts", [])

            if not parts:
                return ""

            text_output = parts[0].get("text", "")

            return text_output.strip()

        except Exception as e:
            print("Gemini request failed:", e)
            return ""