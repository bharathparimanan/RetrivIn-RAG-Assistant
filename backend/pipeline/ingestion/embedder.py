from sentence_transformers import SentenceTransformer
from typing import List

_model = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model


def embed_chunks(chunks: List[str]) -> List[List[float]]:
    """Embed a list of text chunks. Returns list of vectors."""
    model = get_model()
    embeddings = model.encode(chunks, show_progress_bar=False, normalize_embeddings=True)
    return embeddings.tolist()
