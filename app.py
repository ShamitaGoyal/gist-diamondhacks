from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai.pipeline import process_highlight
from ai.v2_handlers import register_v2_routes

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_v2_routes(app)

class HighlightRequest(BaseModel):
    text: str
    context: str | None = None
    paper_title: str | None = None

@app.post("/analyze")
async def analyze(req: HighlightRequest):
    result = await process_highlight(req.text, req.context)
    return result