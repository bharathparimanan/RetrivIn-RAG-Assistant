from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
import json
from app.core.database import get_db
from app.core.security import decode_token
from app.modules.sessions.models import Session, Question, Answer

router = APIRouter()


async def get_current_user(authorization: str = Header(...)) -> str:
    try:
        token = authorization.replace("Bearer ", "")
        return decode_token(token)
    except Exception:
        raise HTTPException(401, "Invalid token")


class CreateSessionRequest(BaseModel):
    mode: str = "trainer"
    target_role: str
    document_ids: Optional[List[str]] = []


class SubmitAnswerRequest(BaseModel):
    question_id: str
    answer_text: str


@router.post("/")
async def create_session(
    body: CreateSessionRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    session = Session(
        user_id=user_id,
        mode=body.mode,
        target_role=body.target_role,
        document_ids=json.dumps(body.document_ids),
        status="generating"
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    from app.modules.sessions.runner import run_generation
    background_tasks.add_task(
        run_generation,
        session_id=session.id,
        user_id=user_id,
        target_role=body.target_role,
        mode=body.mode,
        document_ids=body.document_ids,
    )

    return {"session_id": session.id, "status": session.status}


@router.get("/")
async def list_sessions(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Session)
        .where(Session.user_id == user_id)
        .order_by(Session.created_at.desc())
    )
    sessions = result.scalars().all()
    return [
        {
            "session_id": s.id,
            "mode": s.mode,
            "target_role": s.target_role,
            "status": s.status,
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s in sessions
    ]


@router.get("/{session_id}")
async def get_session(
    session_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Session).where(
            Session.id == session_id,
            Session.user_id == user_id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")

    questions_result = await db.execute(
        select(Question)
        .where(Question.session_id == session_id)
        .order_by(Question.question_index)
    )
    questions = questions_result.scalars().all()

    return {
        "session_id": session.id,
        "mode": session.mode,
        "target_role": session.target_role,
        "status": session.status,
        "questions": [
            {
                "id": q.id,
                "index": q.question_index,
                "text": q.text,
                "source": q.source,
                "section": q.section,
                "difficulty": q.difficulty
            }
            for q in questions
        ]
    }


@router.get("/{session_id}/questions")
async def get_session_questions(
    session_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Session).where(
            Session.id == session_id,
            Session.user_id == user_id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")

    questions_result = await db.execute(
        select(Question)
        .where(Question.session_id == session_id)
        .order_by(Question.question_index)
    )
    questions = questions_result.scalars().all()
    return {
        "session_id": session_id,
        "status": session.status,
        "questions": [
            {
                "id": q.id,
                "text": q.text,
                "source": q.source,
                "section": q.section,
            }
            for q in questions
        ]
    }


@router.post("/{session_id}/answers")
async def submit_answer(
    session_id: str,
    body: SubmitAnswerRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Session).where(
            Session.id == session_id,
            Session.user_id == user_id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")

    answer = Answer(
        session_id=session_id,
        question_id=body.question_id,
        answer_text=body.answer_text
    )
    db.add(answer)
    await db.commit()
    await db.refresh(answer)

    return {"answer_id": answer.id, "status": "submitted"}
