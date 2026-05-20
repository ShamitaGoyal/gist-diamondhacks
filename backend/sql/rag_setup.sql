-- Run this in Supabase → SQL Editor (once per project).
-- Prereqs: documents + chunks tables with embeddings from ingest_pdf.py

-- 1) pgvector extension (required for vector columns and <=> operator)
create extension if not exists vector;

-- 2) chunks.embedding must be 384 dims (all-MiniLM-L6-v2)
-- If you previously used vector(1536), migrate:
--   alter table chunks alter column embedding type vector(384);

-- 3) Optional: speed up similarity search (run after you have rows in chunks)
-- create index if not exists chunks_embedding_hnsw_idx
--   on chunks using hnsw (embedding vector_cosine_ops);

-- 4) RPC: return top-K chunks closest to a query embedding
create or replace function match_chunks(
  query_embedding vector(384),
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  document_id uuid,
  similarity float
)
language sql
stable
as $$
  select
    c.id,
    c.content,
    c.document_id,
    1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  where c.embedding is not null
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- 5) Let the API call this via PostgREST rpc (service role + anon if needed)
grant execute on function match_chunks(vector, int) to anon, authenticated, service_role;
