"""
Lightweight Supabase client for table CRUD via PostgREST.

We use `postgrest` directly instead of the full `supabase` Python package because
the latter pulls in storage/pyiceberg/pyroaring, which failed to build on macOS.
This module is enough for insert + select (e.g. hash dedupe in ingest_pdf.py).

Env (backend/.env):
    VITE_SUPABASE_URL — project URL
    SUPABASE_SERVICE_ROLE_KEY — preferred for server-side writes (bypasses RLS)
    VITE_SUPABASE_PUBLISHABLE_KEY — fallback anon key if no service role
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from postgrest import SyncPostgrestClient

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_BACKEND_ROOT / ".env")

url = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
# Service role first: backend inserts need to bypass RLS on documents/chunks
key = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
)

if not url or not key:
    raise RuntimeError(
        "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in backend/.env"
    )

_rest = SyncPostgrestClient(
    f"{url.rstrip('/')}/rest/v1",
    headers={
        "apikey": key,
        "Authorization": f"Bearer {key}",
    },
)


class _Table:
    """Thin wrapper so callers can chain: table(...).select(...).eq(...).execute()"""

    def __init__(self, name: str) -> None:
        self._name = name

    def _from(self):
        return _rest.from_(self._name)

    def insert(self, row: dict):
        """Returns a builder; call .execute() to run (matches supabase-py style)."""
        return self._from().insert(row)

    def select(self, *columns: str):
        """e.g. .select('*').eq('file_hash', h).execute() for dedupe lookups."""
        return self._from().select(*columns)

    def update(self, row: dict):
        return self._from().update(row)

    def delete(self):
        return self._from().delete()


class _Supabase:
    def table(self, name: str) -> _Table:
        return _Table(name)

    def rpc(self, fn: str, params: dict):
        """Call a Postgres function exposed via PostgREST (e.g. match_chunks)."""
        return _rest.rpc(fn, params)


supabase = _Supabase()
