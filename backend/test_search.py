"""
Test semantic search: embed a question → match_chunks → print top hits.

Run:
    cd backend && .venv/bin/python test_search.py
"""

from services.search_service import search_chunks

query = "What is an overview-detail interface?"
file_name = "meridian.pdf"

from services.chat_service import resolve_document_id

doc_id = resolve_document_id(file_name=file_name)
chunks = search_chunks(
    query,
    match_count=5,
    document_id=doc_id,
    require_document=bool(doc_id),
)

if not chunks:
    print("No results — ingest meridian.pdf or lower RAG_MIN_SIMILARITY.")
else:
    print(f"document_id={doc_id}, hits={len(chunks)}")
    for r in chunks:
        print("\n---")
        print(r["content"][:500])
        print("similarity:", round(r["similarity"], 4))
