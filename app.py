from fastapi import FastAPI
from pydantic import BaseModel
from ai.pipeline import process_highlight

app = FastAPI()

class HighlightRequest(BaseModel):
    text: str
    context: str | None = None
    paper_title: str | None = None

@app.post("/analyze")
async def analyze(req: HighlightRequest):
    result = await process_highlight(req.text, req.context)
    return result