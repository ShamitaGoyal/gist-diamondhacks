"""
Ingest a PDF into Supabase (documents + chunks with embeddings).

Run from backend/ with the project venv:
    .venv/bin/python ingest_pdf.py
    .venv/bin/python ingest_pdf.py --force   # re-chunk + re-embed (e.g. after chunk size change)

Pipeline:
    PDF bytes → SHA-256 hash → dedupe check → extract text → insert document
    → chunk text → embed each chunk → insert into chunks table
"""

from __future__ import annotations

import argparse
import hashlib
import sys

from db.supabase import supabase
from services.embedding_service import generate_embedding
from services.pdf_service import CHUNK_OVERLAP, CHUNK_SIZE, chunk_text, extract_pdf_text

DEFAULT_PDF = "meridian.pdf"


def generate_file_hash(file_path: str) -> str:
    with open(file_path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def find_document_by_hash(file_hash: str) -> dict | None:
    res = (
        supabase.table("documents")
        .select("*")
        .eq("file_hash", file_hash)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return rows[0] if rows else None


def delete_chunks_for_document(document_id: str) -> None:
    supabase.table("chunks").delete().eq("document_id", document_id).execute()


def ingest(pdf_path: str, *, title: str, force: bool = False) -> None:
    file_hash = generate_file_hash(pdf_path)
    existing = find_document_by_hash(file_hash)

    if existing and not force:
        print("PDF already exists — skipping ingestion")
        print(f"  document_id={existing['id']}")
        print("  Use --force to delete old chunks and re-ingest with current chunk settings.")
        return

    full_text = extract_pdf_text(pdf_path)
    chunks = chunk_text(full_text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP)
    print(f"Created {len(chunks)} chunks (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})")

    if existing and force:
        document_id = str(existing["id"])
        print(f"Force re-ingest: removing old chunks for document {document_id}")
        delete_chunks_for_document(document_id)
        supabase.table("documents").update(
            {
                "title": title,
                "file_name": pdf_path,
                "full_text": full_text,
            }
        ).eq("id", document_id).execute()
    else:
        doc = (
            supabase.table("documents")
            .insert(
                {
                    "title": title,
                    "file_name": pdf_path,
                    "full_text": full_text,
                    "file_hash": file_hash,
                }
            )
            .execute()
        )
        document_id = doc.data[0]["id"]

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
        if (i + 1) % 10 == 0 or i + 1 == len(chunks):
            print(f"  embedded {i + 1}/{len(chunks)} chunks")

    print("DONE INGESTING PDF")
    print(f"  document_id={document_id}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest a PDF into Supabase for RAG chat.")
    parser.add_argument("pdf", nargs="?", default=DEFAULT_PDF, help="Path to PDF file")
    parser.add_argument("--force", action="store_true", help="Re-ingest even if file hash exists")
    parser.add_argument("--title", default="Meridian PDF", help="Document title in Supabase")
    args = parser.parse_args()
    ingest(args.pdf, title=args.title, force=args.force)


if __name__ == "__main__":
    main()
