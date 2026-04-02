"""
HireMind — SQLAlchemy ORM Models
All database tables for users, sessions, interviews, and reports.
"""

from datetime import datetime
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey,
    Integer, JSON, String, Text, Float, Enum
)
from sqlalchemy.orm import DeclarativeBase, relationship
import enum


class Base(DeclarativeBase):
    pass


# ── Enums ────────────────────────────────────────────────────────────

class PlanTier(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    RECRUITER = "recruiter"


class InterviewStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class RoundType(str, enum.Enum):
    DSA = "DSA"
    SYSTEM_DESIGN = "System Design"
    BEHAVIORAL = "Behavioral"


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


# ── Tables ───────────────────────────────────────────────────────────

class User(Base):
    """Mirrors the Clerk user — synced on first sign-in."""
    __tablename__ = "users"

    id = Column(String, primary_key=True)          # Clerk user_id
    email = Column(String, unique=True, nullable=False)
    name = Column(String)
    avatar_url = Column(String)
    plan = Column(Enum(PlanTier), default=PlanTier.FREE)
    stripe_customer_id = Column(String, unique=True, nullable=True)
    stripe_subscription_id = Column(String, unique=True, nullable=True)
    daily_interviews_used = Column(Integer, default=0)
    last_reset_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    resumes = relationship("Resume", back_populates="user", cascade="all,delete")
    sessions = relationship("InterviewSession", back_populates="user", cascade="all,delete")


class Resume(Base):
    """Parsed resume data + embedding reference."""
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    raw_text = Column(Text)
    parsed_data = Column(JSON)          # skills, projects, weaknesses, experience_level
    embedding_id = Column(String)       # FAISS vector ID
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="resumes")


class InterviewSession(Base):
    """One full interview session (multiple rounds)."""
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    job_role = Column(String, nullable=False)
    company = Column(String, nullable=False)
    job_description = Column(Text)
    interview_plan = Column(JSON)       # rounds + difficulties from planner
    current_round = Column(Integer, default=0)
    status = Column(Enum(InterviewStatus), default=InterviewStatus.PENDING)
    voice_mode = Column(Boolean, default=False)
    overall_score = Column(Float, nullable=True)
    hire_decision = Column(Boolean, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="sessions")
    rounds = relationship("InterviewRound", back_populates="session", cascade="all,delete")
    report = relationship("Report", back_populates="session", uselist=False, cascade="all,delete")


class InterviewRound(Base):
    """One round within a session (e.g., DSA round 1)."""
    __tablename__ = "interview_rounds"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    round_type = Column(Enum(RoundType))
    round_number = Column(Integer)
    difficulty = Column(Enum(Difficulty), default=Difficulty.MEDIUM)
    focus_topics = Column(JSON)         # list of topic strings
    num_questions = Column(Integer, default=2)
    completed = Column(Boolean, default=False)

    session = relationship("InterviewSession", back_populates="rounds")
    questions = relationship("QuestionAnswer", back_populates="round", cascade="all,delete")


class QuestionAnswer(Base):
    """One Q&A pair within a round."""
    __tablename__ = "question_answers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    round_id = Column(Integer, ForeignKey("interview_rounds.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_metadata = Column(JSON)    # from dataset: topic, hints, expected_concepts
    answer_text = Column(Text)
    evaluation = Column(JSON)           # full evaluator output
    score = Column(Float, nullable=True)
    follow_up_question = Column(Text, nullable=True)
    order_in_round = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    round = relationship("InterviewRound", back_populates="questions")


class Report(Base):
    """Final hiring report after a completed session."""
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), unique=True, nullable=False)
    overall_score = Column(Float)
    hire_decision = Column(Boolean)
    strengths = Column(JSON)
    weaknesses = Column(JSON)
    improvement_roadmap = Column(JSON)
    round_breakdown = Column(JSON)      # per-round scores
    pdf_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="report")
