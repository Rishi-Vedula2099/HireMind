"""
HireMind — Pydantic Schemas
Request/Response models for all API endpoints.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


# ── Shared Enums ─────────────────────────────────────────────────────

class PlanTier(str, Enum):
    FREE = "free"
    PRO = "pro"

class RoundType(str, Enum):
    DSA = "DSA"
    SYSTEM_DESIGN = "System Design"
    BEHAVIORAL = "Behavioral"

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


# ── User Schemas ─────────────────────────────────────────────────────

class UserSyncRequest(BaseModel):
    """Called on first Clerk sign-in to sync user to our DB."""
    clerk_id: str
    email: EmailStr
    name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    avatar_url: Optional[str]
    plan: str
    daily_interviews_used: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Resume Schemas ────────────────────────────────────────────────────

class ResumeUploadResponse(BaseModel):
    resume_id: int
    parsed_data: Dict[str, Any]
    message: str


class ParsedResume(BaseModel):
    skills: List[str] = []
    experience_level: str = "junior"     # junior | mid | senior
    project_domains: List[str] = []
    weak_areas: List[str] = []
    years_of_experience: int = 0
    education: List[str] = []


# ── Interview Schemas ─────────────────────────────────────────────────

class InterviewSetupRequest(BaseModel):
    """Body for creating a new interview session."""
    resume_id: int
    job_role: str = Field(..., min_length=2, max_length=100)
    company: str = Field(..., min_length=2, max_length=100)
    job_description: Optional[str] = None
    voice_mode: bool = False


class InterviewRoundPlan(BaseModel):
    round: RoundType
    difficulty: Difficulty
    focus_topics: List[str] = []
    num_questions: int = 2


class InterviewSessionResponse(BaseModel):
    id: int
    job_role: str
    company: str
    status: str
    interview_plan: List[Dict[str, Any]]
    current_round: int
    created_at: datetime

    class Config:
        from_attributes = True


class NextQuestionRequest(BaseModel):
    """Request next question in the adaptive loop."""
    session_id: int
    previous_score: Optional[float] = None   # triggers difficulty adaptation


class QuestionResponse(BaseModel):
    question_id: int
    question_text: str
    round_type: str
    difficulty: str
    hints: List[str] = []
    follow_up: Optional[str] = None
    round_number: int
    question_number: int


class SubmitAnswerRequest(BaseModel):
    question_id: int
    answer_text: str


class EvaluationResponse(BaseModel):
    score: float
    correctness: str
    depth: str
    communication: str
    real_world: str
    strengths: List[str]
    weaknesses: List[str]
    improvement: str
    follow_up_question: str
    concept_match: List[str] = []
    missing_concepts: List[str] = []


# ── Report Schemas ───────────────────────────────────────────────────

class RoundBreakdown(BaseModel):
    round_type: str
    average_score: float
    questions_answered: int
    highlights: List[str] = []


class ReportResponse(BaseModel):
    id: int
    session_id: int
    overall_score: float
    hire_decision: bool
    strengths: List[str]
    weaknesses: List[str]
    improvement_roadmap: List[str]
    round_breakdown: List[RoundBreakdown]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Auth / Stripe Schemas ─────────────────────────────────────────────

class CheckoutSessionRequest(BaseModel):
    price_id: str
    success_url: str
    cancel_url: str


class CheckoutSessionResponse(BaseModel):
    checkout_url: str


class WebhookPayload(BaseModel):
    """Raw Stripe webhook — we parse this ourselves."""
    payload: bytes
    sig_header: str
