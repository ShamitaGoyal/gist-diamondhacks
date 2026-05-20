"""
Ingest a PDF into Supabase (documents + chunks with embeddings).

Run from backend/ with the project venv (system python won't have deps):
    .venv/bin/python ingest_pdf.py

Pipeline:
    PDF bytes → SHA-256 hash → dedupe check → extract text → insert document
    → chunk text → embed each chunk → insert into chunks table
"""

import hashlib
import sys

from db.supabase import supabase
from services.embedding_service import generate_embedding
from services.pdf_service import chunk_text, extract_pdf_text

PDF_PATH = "meridian.pdf"


def generate_file_hash(file_path: str) -> str:
    """
    SHA-256 of raw file bytes. Same file always yields the same hash even if
    renamed; unlike filename/title checks, this is deterministic and cheap.
    Requires a `file_hash` column on `documents` (unique index recommended).
    """
    with open(file_path, "rb") as f:
        file_bytes = f.read()
    return hashlib.sha256(file_bytes).hexdigest()


# --- Dedupe: run before extract/embed so re-ingesting the same PDF is cheap ---
file_hash = generate_file_hash(PDF_PATH)

existing = (
    supabase.table("documents")
    .select("*")
    .eq("file_hash", file_hash)
    .execute()
)

if existing.data:
    print("PDF already exists — skipping ingestion")
    sys.exit(0)

# STEP 1 — extract full text from PDF (PyMuPDF via pdf_service)
full_text = extract_pdf_text(PDF_PATH)

# STEP 2 — insert parent row; store hash so future runs can skip
doc = (
    supabase.table("documents")
    .insert(
        {
            "title": "Meridian PDF",
            "file_name": PDF_PATH,
            "full_text": full_text,
            "file_hash": file_hash,
        }
    )
    .execute()
)

document_id = doc.data[0]["id"]

# STEP 3 — split text into overlapping token windows for RAG retrieval
chunks = chunk_text(full_text)

# STEP 4 — embed each chunk and link to document (pgvector on chunks.embedding)
for i, chunk in enumerate(chunks):
    embedding = generate_embedding(chunk)

    supabase.table("chunks").insert(
        {
            "document_id": document_id,
            "content": chunk,
            "page_number": i + 1,
            "embedding": embedding,
        }
    ).execute()

print("DONE INGESTING PDF")
