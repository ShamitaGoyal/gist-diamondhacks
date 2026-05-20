import fitz  # pymupdf
import tiktoken

def extract_pdf_text(pdf_path: str):
    '''
    It:
    - opens PDF
    - loops pages
    - extracts text
    - combines into one string
    '''

    doc = fitz.open(pdf_path)

    full_text = ""

    for page in doc:
        text = page.get_text()
        full_text += text + "\n"

    return full_text



tokenizer = tiktoken.get_encoding("cl100k_base")

def chunk_text(
    
    text,
    chunk_size=800,
    overlap=100
):

    '''
    - Imagine text split into Lego blocks.

    chunk_size=800

    - Each chunk:

    max 800 tokens
    overlap=100

    - chunks overlap slightly:

    Chunk A: words 1–800
    Chunk B: words 700–1500

    Why?

    Because meaning often spans boundaries.

    Without overlap:
    ❌ context gets cut awkwardly
    '''

    tokens = tokenizer.encode(text)

    chunks = []

    start = 0

    while start < len(tokens):

        end = start + chunk_size

        chunk_tokens = tokens[start:end]

        chunk_text = tokenizer.decode(chunk_tokens)

        chunks.append(chunk_text)

        start += chunk_size - overlap

    return chunks

