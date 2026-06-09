from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Header, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import aiofiles
import os
import uuid
from app.core.database import get_db
from app.core.security import decode_token
from app.core.config import settings
from app.modules.documents.models import Document

router = APIRouter()


async def get_current_user(authorization: str = Header(...)) -> str:
    try:
        token = authorization.replace("Bearer ", "")
        return decode_token(token)
    except Exception:
        raise HTTPException(401, "Invalid token")


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files accepted")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_id = str(uuid.uuid4())
    file_path = f"{settings.UPLOAD_DIR}/{file_id}.pdf"

    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    doc = Document(
        user_id=user_id,
        filename=file.filename,
        file_path=file_path,
        doc_type="resume",
        status="uploaded"
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    from pipeline.ingestion.runner import run_ingestion
    background_tasks.add_task(
        run_ingestion,
        user_id=user_id,
        document_id=doc.id,
        file_path=file_path,
        doc_type="resume",
    )

    return {
        "document_id": doc.id,
        "filename": doc.filename,
        "status": doc.status
    }


@router.get("/{document_id}/status")
async def get_document_status(
    document_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == user_id
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Document not found")
    return {"document_id": doc.id, "status": doc.status, "filename": doc.filename}


@router.get("/")
async def list_documents(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Document).where(Document.user_id == user_id)
    )
    docs = result.scalars().all()
    return [
        {
            "document_id": d.id,
            "filename": d.filename,
            "status": d.status,
            "doc_type": d.doc_type
        }
        for d in docs
    ]
