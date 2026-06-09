from pipeline.ingestion.parser import parse_pdf
from pipeline.ingestion.cleaner import clean_pages
from pipeline.ingestion.chunker import chunk_text
from pipeline.ingestion.embedder import embed_chunks
from pipeline.ingestion.vector_store import store_chunks
import logging

logger = logging.getLogger(__name__)


async def run_ingestion(
    user_id: str,
    document_id: str,
    file_path: str,
    doc_type: str,
):
    """
    Full ingestion pipeline:
    parse → clean → chunk → embed → store in Qdrant
    Updates document status in DB throughout.

    NOTE: Creates its own DB session — do NOT pass the request session here,
    as it will already be closed by the time a BackgroundTask runs.
    """
    from sqlalchemy import update
    from app.core.database import AsyncSessionLocal
    from app.modules.documents.models import Document

    async def update_status(status: str):
        async with AsyncSessionLocal() as session:
            await session.execute(
                update(Document)
                .where(Document.id == document_id)
                .values(status=status)
            )
            await session.commit()

    try:
        logger.info(f"Starting ingestion for document {document_id}")
        await update_status("processing")

        # 1. Parse
        pages = parse_pdf(file_path)
        logger.info(f"Parsed {len(pages)} pages")

        # 2. Clean
        full_text = clean_pages(pages)
        logger.info(f"Cleaned text: {len(full_text)} characters")

        # 3. Chunk
        chunks = chunk_text(full_text)
        logger.info(f"Created {len(chunks)} chunks")

        if not chunks:
            logger.error("No chunks created — PDF may be empty")
            await update_status("failed")
            return

        # 4. Embed
        embeddings = embed_chunks(chunks)
        logger.info(f"Embedded {len(embeddings)} chunks")

        # 5. Store in Qdrant
        logger.info(f"Storing in Qdrant for user {user_id}")
        stored = store_chunks(user_id, document_id, chunks, embeddings, doc_type)
        logger.info(f"Stored {stored} vectors in Qdrant successfully")

        await update_status("ready")
        logger.info(f"Ingestion complete for document {document_id}")

    except Exception as e:
        logger.error(f"Ingestion failed at step for document {document_id}: {type(e).__name__}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        await update_status("failed")
