from qdrant_client.models import Filter, FieldCondition, MatchValue
from pipeline.ingestion.vector_store import get_client, get_collection_name, ensure_indexes
from pipeline.ingestion.embedder import get_model
from typing import List, Dict


def retrieve_chunks(
    user_id: str,
    query: str,
    top_k: int = 8,
    document_ids: List[str] = None
) -> List[Dict]:
    """
    Embed the query and retrieve top-k similar chunks
    from the user's Qdrant collection.
    """
    client = get_client()
    collection_name = get_collection_name(user_id)

    # Check collection exists
    existing = [c.name for c in client.get_collections().collections]
    if collection_name not in existing:
        return []

    # Ensure indexes exist on existing collections
    ensure_indexes(client, user_id)

    # Embed query
    model = get_model()
    query_vector = model.encode([query], normalize_embeddings=True)[0].tolist()

    # Build filter
    must_conditions = []
    if document_ids:
        for doc_id in document_ids:
            must_conditions.append(
                FieldCondition(key="document_id", match=MatchValue(value=doc_id))
            )

    search_filter = Filter(must=must_conditions) if must_conditions else None

    # Search
    results = client.query_points(
        collection_name=collection_name,
        query=query_vector,
        limit=top_k,
        query_filter=search_filter,
        with_payload=True,
        score_threshold=0.3
    ).points

    return [
        {
            "text": r.payload["text"],
            "score": r.score,
            "chunk_index": r.payload.get("chunk_index", 0),
            "document_id": r.payload.get("document_id", ""),
            "doc_type": r.payload.get("doc_type", "resume"),
        }
        for r in results
    ]
