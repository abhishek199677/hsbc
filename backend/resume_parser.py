import io
import logging
from pathlib import Path

import pdfplumber
import pymupdf4llm
import pymupdf
from docx import Document

logger = logging.getLogger(__name__)


def extract_text_with_pymupdf(file_bytes: bytes) -> str:
    """Extract text using PyMuPDF + pymupdf4llm (handles tables, complex layouts, OCR-ready)."""
    try:
        # Write to temp file since pymupdf4llm needs a file path
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        md_text = pymupdf4llm.to_markdown(tmp_path)

        # Clean up temp file
        Path(tmp_path).unlink(missing_ok=True)

        return md_text.strip() if md_text else ""
    except Exception as e:
        logger.warning(f"PyMuPDF extraction failed: {e}")
        return ""


def extract_text_with_pdfplumber(file_bytes: bytes) -> str:
    """Extract text using pdfplumber (fast, good for text-based PDFs)."""
    text_parts: list[str] = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Tiered PDF extraction:
    1. Try pdfplumber first (fast, free, handles text PDFs well)
    2. If too little text extracted → likely scanned/image PDF → use PyMuPDF (better extraction)
    """
    # Step 1: Try pdfplumber (fast)
    text = extract_text_with_pdfplumber(file_bytes)

    # Step 2: If extracted text is too short, try PyMuPDF (handles more complex PDFs)
    if len(text.strip()) < 100:
        logger.info("pdfplumber extracted too little text, trying PyMuPDF...")
        pymupdf_text = extract_text_with_pymupdf(file_bytes)
        if pymupdf_text and len(pymupdf_text) > len(text):
            text = pymupdf_text

    return text


def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    return "\n".join(para.text for para in doc.paragraphs if para.text.strip())


def extract_text(file_bytes: bytes, filename: str) -> str:
    ext = Path(filename).suffix.lower()

    if ext == ".pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in (".docx", ".doc"):
        return extract_text_from_docx(file_bytes)
    else:
        return file_bytes.decode("utf-8", errors="ignore")
