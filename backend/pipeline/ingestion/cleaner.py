import re
from typing import List


def clean_text(text: str) -> str:
    """Normalise whitespace, remove junk characters."""
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)
    text = re.sub(r'\.{3,}', '...', text)
    text = text.strip()
    return text


def clean_pages(pages: List[str]) -> str:
    """Clean and join all pages into one document string."""
    cleaned = [clean_text(p) for p in pages if p.strip()]
    return ' '.join(cleaned)
