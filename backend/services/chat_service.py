"""
RAG chat: embed question → scoped vector search → grounded Gemini answer.

No full PDF is sent to the model — only retrieved chunk text.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from ai.gemini_client import call_gemini
from db.supabase import supabase
from services.embedding_service import embed_text
from services.search_service import search_chunks

# When user opens a PDF in the UI, search is limited to that document (no global fallback)
DEFAULT_MATCH_COUNT = int(os.getenv("RAG_MATCH_COUNT", "5"))


def resolve_document_id(
    *,
    document_id: str | None = None,
    file_name: str | None = None,
) -> str | None:
    """
    Resolve Supabase documents.id from UUID or file_name (basename match).
    """
    if document_id:
        return document_id.strip()

    if not file_name:
        return None

    basename = Path(file_name.strip()).name
    candidates = [file_name.strip(), basename]
    seen: set[str] = set()
    for name in candidates:
        if not name or name in seen:
            continue
        seen.add(name)
        res = (
            supabase.table("documents")
            .select("id")
            .eq("file_name", name)
            .limit(1)
            .execute()
        )
        rows = res.data or []
        if rows:
            return str(rows[0]["id"])

    return None


def build_context(chunks: list[dict]) -> str:
    """Format retrieved chunks for the LLM prompt."""
    if not chunks:
        return ""
    parts: list[str] = []
    for i, chunk in enumerate(chunks, start=1):
        sim = chunk.get("similarity")
        header = f"[Excerpt {i}]"
        if sim is not None:
            header += f" (relevance {float(sim):.2f})"
        parts.append(f"{header}\n{chunk.get('content', '').strip()}")
    return "\n\n---\n\n".join(parts)


def build_prompt(
    question: str,
    context: str,
    *,
    history: list[dict[str, str]] | None = None,
) -> str:
    history_block = ""
    if history:
        lines = [
            f"{'User' if m.get('role') == 'user' else 'Assistant'}: {m.get('text', '')}"
            for m in history[-8:]
        ]
        history_block = (
            "Recent conversation (for follow-up tone only — facts must still come from excerpts):\n"
            + "\n".join(lines)
            + "\n\n"
        )

    return f"""You are a technical research assistant. You must answer using ONLY the document excerpts below.

Strict rules:
1. Use ONLY the provided context. Do not use outside knowledge, training data, or inference beyond the excerpts.
2. If the excerpts do not contain enough information for a full answer, say: "Not fully in document." Then state only what the excerpts do support.
3. If nothing in the excerpts relates to the question, say exactly: "Not found in document."
4. Be precise and technical. Prefer terminology from the excerpts. Use short paragraphs or bullets when helpful.
5. Do not invent citations, numbers, or claims not present in the excerpts.

{history_block}Document excerpts:
{context}

Question:
{question}

Answer:"""


async def generate_chat_reply(
    message: str,
    *,
    document_id: str | None = None,
    file_name: str | None = None,
    history: list[dict[str, str]] | None = None,
    match_count: int | None = None,
    allow_global_search: bool = False,
) -> tuple[str, list[dict[str, Any]]]:
    """
    Run full RAG pipeline. Returns (reply_text, source_chunks).

    When file_name or document_id is provided, search is scoped to that document only.
    Global search happens only if allow_global_search=True and no document scope was given.
    """
    k = match_count if match_count is not None else DEFAULT_MATCH_COUNT
    scoped = bool(document_id or file_name)
    doc_id = resolve_document_id(document_id=document_id, file_name=file_name)

    if scoped and not doc_id:
        name = file_name or document_id or "this document"
        return (
            f'No indexed document found for "{name}". '
            "Ingest the PDF with `backend/.venv/bin/python ingest_pdf.py` "
            "(file_name in the database must match the open PDF).",
            [],
        )

    if scoped:
        chunks = search_chunks(
            message,
            match_count=k,
            document_id=doc_id,
            require_document=True,
        )
    elif allow_global_search:
        chunks = search_chunks(message, match_count=k)
    else:
        return (
            "Open a document or pass document_id / file_name so chat can search that PDF's chunks.",
            [],
        )

    if not chunks:
        return (
            "No relevant passages found for this question in the indexed PDF. "
            "Try rephrasing or run `ingest_pdf.py --force` if the document was never embedded.",
            [],
        )

    context = build_context(chunks)
    prompt = build_prompt(message, context, history=history)
    reply = await call_gemini(
        prompt,
        max_output_tokens=1024,
        thinking_level="low",
        raise_api_errors=True,
    )
    if not reply:
        return "The model returned an empty response. Try again.", chunks

    return reply.strip(), chunks
