import logging
from sqlalchemy import update
from app.core.database import AsyncSessionLocal
from app.modules.sessions.models import Session, Question
from pipeline.retrieval.retriever import retrieve_chunks
from pipeline.generation.generator import generate_questions

logger = logging.getLogger(__name__)


async def run_generation(
    session_id: str,
    user_id: str,
    target_role: str,
    mode: str,
    document_ids: list,
):
    """
    Retrieval + generation pipeline:
    retrieve chunks → generate questions → store in DB

    NOTE: Creates its own DB sessions — do NOT pass the request session here,
    as it will already be closed by the time a BackgroundTask runs.
    """
    async def update_status(status: str):
        async with AsyncSessionLocal() as db:
            await db.execute(
                update(Session)
                .where(Session.id == session_id)
                .values(status=status)
            )
            await db.commit()

    try:
        logger.info(f"Starting generation for session {session_id}")

        # 1. Build retrieval query from role
        query = f"experience skills {target_role} technical background projects"

        # 2. Retrieve relevant chunks
        chunks = retrieve_chunks(
            user_id=user_id,
            query=query,
            top_k=8,
            document_ids=document_ids if document_ids else None
        )

        if not chunks:
            logger.warning(f"No chunks retrieved for session {session_id}")
            await update_status("failed")
            return

        logger.info(f"Retrieved {len(chunks)} chunks")

        # 3. Generate questions via Claude
        questions = generate_questions(
            chunks=chunks,
            target_role=target_role,
            mode=mode
        )

        logger.info(f"Generated {len(questions)} questions")

        # 4. Store questions in DB
        async with AsyncSessionLocal() as db:
            for i, q in enumerate(questions):
                question = Question(
                    session_id=session_id,
                    question_index=i,
                    text=q.get("text", ""),
                    source=q.get("source", "resume"),
                    section=q.get("section", "experience"),
                    difficulty=q.get("difficulty", "medium")
                )
                db.add(question)
            await db.commit()

        await update_status("ready")
        logger.info(f"Generation complete for session {session_id}")

    except Exception as e:
        logger.error(f"Generation failed for session {session_id}: {e}")
        await update_status("failed")
