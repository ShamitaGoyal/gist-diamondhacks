"""
Semantic search over ingested PDF chunks (RAG retrieval step).

    question → embed_text → match_chunks (pgvector) → ranked chunk rows
"""

from db.supabase import supabase
from services.embedding_service import embed_text


def search_chunks(query: str, *, match_count: int = 5) -> list[dict]:
    """
    Return top `match_count` chunks by cosine similarity to `query`.

    Each row: id, content, document_id, similarity (float 0–1, higher = closer).
    """
    embedding = embed_text(query)
    res = supabase.rpc(
        "match_chunks",
        {"query_embedding": embedding, "match_count": match_count},
    ).execute()
    return res.data or []
