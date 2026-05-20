"""
Test semantic search: embed a question → match_chunks RPC → print top hits.

Prerequisites:
  1. Run backend/sql/rag_setup.sql in Supabase SQL editor
  2. Ingest at least one PDF: .venv/bin/python ingest_pdf.py
  3. chunks.embedding is vector(384)

Run:
    cd backend && .venv/bin/python test_search.py
"""

from db.supabase import supabase
from services.embedding_service import embed_text

# Try a question related to your ingested PDF (Meridian is about overview-detail UIs)
query = "What is an overview-detail interface?"

embedding = embed_text(query)

res = supabase.rpc(
    "match_chunks",
    {
        "query_embedding": embedding,
        "match_count": 5,
    },
).execute()

if not res.data:
    print("No results — ingest a PDF first or check match_chunks / RLS in Supabase.")
else:
    for r in res.data:
        print("\n---")
        print(r["content"][:500])
        print("similarity:", round(r["similarity"], 4))
