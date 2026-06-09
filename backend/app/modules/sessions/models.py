from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float, Integer
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class Session(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    mode = Column(String, nullable=False, default="trainer")
    target_role = Column(String, nullable=False)
    document_ids = Column(Text, default="")
    status = Column(String, default="generating")
    created_at = Column(DateTime, server_default=func.now())


class Question(Base):
    __tablename__ = "questions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    question_index = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    source = Column(String, default="resume")
    section = Column(String, default="experience")
    difficulty = Column(String, default="medium")
    created_at = Column(DateTime, server_default=func.now())


class Answer(Base):
    __tablename__ = "answers"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    answer_text = Column(Text, nullable=False)
    score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
