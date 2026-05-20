"""
Semantic search over ingested PDF chunks (RAG retrieval step).

    question → embed_text → match_chunks (pgvector) → ranked chunk rows
"""

import os

from db.supabase import supabase
from services.embedding_service import embed_text

# MiniLM on academic PDFs often peaks ~0.55–0.70; tune via RAG_MIN_SIMILARITY
DEFAULT_MIN_SIMILARITY = float(os.getenv("RAG_MIN_SIMILARITY", "0.55"))
# If nothing passes the floor, still use top hits when best score is at least this
FALLBACK_MIN_BEST_SCORE = float(os.getenv("RAG_FALLBACK_MIN_BEST", "0.45"))


def search_chunks(
    query: str,
    *,
    match_count: int = 5,
    document_id: str | None = None,
    require_document: bool = False,
    min_similarity: float | None = None,
) -> list[dict]:
    """
    Return top chunks by cosine similarity to `query`.

    When `require_document` is True, `document_id` must be set or returns [].
    When `document_id` is set, only that document's chunks are searched (never global).

    Each row: id, content, document_id, similarity (0–1, higher = closer).
    """
    if require_document and not document_id:
        return []

    embedding = embed_text(query)
    params: dict = {
        "query_embedding": embedding,
        "match_count": match_count,
    }
    if document_id:
        params["filter_document_id"] = document_id

    res = supabase.rpc("match_chunks", params).execute()
    rows = res.data or []
    if not rows:
        return []

    floor = DEFAULT_MIN_SIMILARITY if min_similarity is None else min_similarity
    filtered = [r for r in rows if float(r.get("similarity") or 0) >= floor]
    if filtered:
        return filtered[:match_count]

    best = float(rows[0].get("similarity") or 0)
    if best >= FALLBACK_MIN_BEST_SCORE:
        return rows[:match_count]

    return []
