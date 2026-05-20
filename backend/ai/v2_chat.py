"""
Gist Lens v2 — RAG chat (vector search + grounded Gemini).

POST /api/v2/chat
"""

from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ai.gemini_client import API_KEY, GeminiAPIError
from services.chat_service import generate_chat_reply

router = APIRouter(prefix="/api/v2", tags=["gist-lens-chat"])


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(..., max_length=8000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)
    """Supabase documents.id — preferred scope for vector search."""
    document_id: str | None = None
    """documents.file_name (e.g. meridian.pdf); resolved to document_id on the server."""
    file_name: str | None = None
    history: list[ChatMessage] = Field(default_factory=list)
    """Search all ingested docs only when true and no document_id/file_name (default: false)."""
    allow_global_search: bool = False


class ChatSource(BaseModel):
    id: str
    content: str
    document_id: str | None = None
    similarity: float | None = None


class ChatResponse(BaseModel):
    reply: str
    sources: list[ChatSource] = Field(default_factory=list)


def _to_sources(chunks: list[dict[str, Any]]) -> list[ChatSource]:
    out: list[ChatSource] = []
    for c in chunks:
        out.append(
            ChatSource(
                id=str(c.get("id", "")),
                content=str(c.get("content", ""))[:2000],
                document_id=str(c["document_id"]) if c.get("document_id") else None,
                similarity=float(c["similarity"]) if c.get("similarity") is not None else None,
            )
        )
    return out


@router.post("/chat", response_model=ChatResponse)
async def v2_chat(req: ChatRequest):
    if not API_KEY:
        raise HTTPException(503, "GEMINI_API_KEY is not configured")

    history = [{"role": m.role, "text": m.text} for m in req.history]

    try:
        reply, chunks = await generate_chat_reply(
            req.message,
            document_id=req.document_id,
            file_name=req.file_name,
            history=history,
            allow_global_search=req.allow_global_search,
        )
    except GeminiAPIError as e:
        status = 429 if e.code == 429 else 503
        raise HTTPException(status_code=status, detail=str(e)) from e

    return ChatResponse(reply=reply, sources=_to_sources(chunks))


@router.get("/documents/resolve")
async def resolve_document(file_name: str):
    """Look up Supabase document id for the open PDF (frontend can cache this)."""
    from services.chat_service import resolve_document_id

    doc_id = resolve_document_id(file_name=file_name)
    if not doc_id:
        raise HTTPException(
            404,
            detail=f'No document indexed with file_name="{file_name}". Run ingest_pdf.py first.',
        )
    return {"document_id": doc_id, "file_name": file_name}
