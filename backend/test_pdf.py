from services.pdf_service import (
    extract_pdf_text,
    chunk_text
)

text = extract_pdf_text("meridian.pdf")

chunks = chunk_text(text)

print("NUM CHUNKS:", len(chunks))

print(chunks[0])