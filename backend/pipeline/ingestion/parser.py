import pdfplumber
from typing import List


def parse_pdf(file_path: str) -> List[str]:
    """Extract text page by page from a PDF. Returns list of page strings."""
    pages = []
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text and text.strip():
                    pages.append(text.strip())
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {e}")
    if not pages:
        raise ValueError("PDF appears to be empty or scanned. Please upload a text-layer PDF.")
    return pages
