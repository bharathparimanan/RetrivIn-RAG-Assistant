from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, Filter,
    FieldCondition, MatchValue
)
from app.core.config import settings
from typing import List
import uuid

VECTOR_SIZE = 384  # all-MiniLM-L6-v2 output dimension


def get_client() -> QdrantClient:
    return QdrantClient(
        url=settings.QDRANT_URL,
        api_key=settings.QDRANT_API_KEY,
    )


def get_collection_name(user_id: str) -> str:
    return f"retrivin_user_{user_id.replace('-', '_')}"


def ensure_collection(client: QdrantClient, user_id: str):
    """Create collection for user if it doesn't exist. Create payload indexes."""
    from qdrant_client.models import PayloadSchemaType

    collection_name = get_collection_name(user_id)
    existing = [c.name for c in client.get_collections().collections]

    if collection_name not in existing:
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
        )
        client.create_payload_index(
            collection_name=collection_name,
            field_name="document_id",
            field_schema=PayloadSchemaType.KEYWORD
        )
        client.create_payload_index(
            collection_name=collection_name,
            field_name="user_id",
            field_schema=PayloadSchemaType.KEYWORD
        )

    return collection_name


def ensure_indexes(client: QdrantClient, user_id: str):
    """Ensure payload indexes exist on existing collection."""
    from qdrant_client.models import PayloadSchemaType

    collection_name = get_collection_name(user_id)
    try:
        client.create_payload_index(
            collection_name=collection_name,
            field_name="document_id",
            field_schema=PayloadSchemaType.KEYWORD
        )
        client.create_payload_index(
            collection_name=collection_name,
            field_name="user_id",
            field_schema=PayloadSchemaType.KEYWORD
        )
    except Exception:
        pass  # Index already exists


def store_chunks(
    user_id: str,
    document_id: str,
    chunks: List[str],
    embeddings: List[List[float]],
    doc_type: str = "resume"
):
    """Store embedded chunks in Qdrant under user's collection."""
    client = get_client()
    collection_name = ensure_collection(client, user_id)

    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=embedding,
            payload={
                "document_id": document_id,
                "user_id": user_id,
                "chunk_index": i,
                "text": chunk,
                "doc_type": doc_type,
            }
        )
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
    ]

    client.upsert(collection_name=collection_name, points=points)
    return len(points)


def delete_document_chunks(user_id: str, document_id: str):
    """Remove all chunks for a document from Qdrant."""
    client = get_client()
    collection_name = get_collection_name(user_id)
    client.delete(
        collection_name=collection_name,
        points_selector=Filter(
            must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
        )
    )
