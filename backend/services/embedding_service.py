"""
Local embedding model for RAG chunk vectors (used by ingest_pdf.py).

Uses sentence-transformers + Hugging Face model `all-MiniLM-L6-v2` (384 dimensions).
Supabase `chunks.embedding` must be `vector(384)` — a `vector(1536)` column is for
OpenAI-style embeddings and will reject these vectors.

Override model via EMBEDDING_MODEL in backend/.env. Optional HF_TOKEN speeds downloads.
Run scripts with backend/.venv/bin/python so postgrest/torch deps are available.
"""

import os

from sentence_transformers import SentenceTransformer

MODEL_NAME = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
EMBEDDING_DIM = 384  # must match pgvector column size for all-MiniLM-L6-v2

model = SentenceTransformer(MODEL_NAME)


def embed_text(text: str) -> list[float]:
    """Encode text to a 384-dim float list for pgvector insert or search."""
    vector = model.encode(text)
    return vector.tolist()


# alias used by ingest_pdf.py
generate_embedding = embed_text