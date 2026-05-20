import re

import fitz  # pymupdf
import tiktoken

# RAG-friendly defaults: smaller chunks + more overlap → better retrieval similarity
CHUNK_SIZE = 512
CHUNK_OVERLAP = 128
MIN_CHUNK_CHARS = 80


def extract_pdf_text(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    pages: list[str] = []
    for page in doc:
        pages.append(page.get_text())
    return normalize_extracted_text("\n".join(pages))


def normalize_extracted_text(text: str) -> str:
    """Collapse PDF noise (extra spaces, broken lines) before chunking."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()


tokenizer = tiktoken.get_encoding("cl100k_base")


def chunk_text(
    text: str,
    *,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
    min_chunk_chars: int = MIN_CHUNK_CHARS,
) -> list[str]:
    """
    Split text into overlapping token windows for embedding.

    Smaller chunks (512) with 128-token overlap improve vector match scores vs 800/100.
    Re-ingest PDFs after changing these defaults.
    """
    tokens = tokenizer.encode(text)
    if not tokens:
        return []

    chunks: list[str] = []
    start = 0
    step = max(1, chunk_size - overlap)

    while start < len(tokens):
        end = start + chunk_size
        piece = tokenizer.decode(tokens[start:end]).strip()
        if len(piece) >= min_chunk_chars:
            chunks.append(piece)
        start += step

    return chunks
