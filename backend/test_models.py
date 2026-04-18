import os
from pathlib import Path

import httpx
from dotenv import load_dotenv

_REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_REPO_ROOT / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

response = httpx.get(url)

print(response.json())