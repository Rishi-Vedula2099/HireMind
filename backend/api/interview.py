"""
HireMind — Interview API Routes
POST /api/interview/setup      → Create session + plan
POST /api/interview/next       → Get next adaptive question
POST /api/interview/answer     → Submit answer + evaluate
GET  /api/interview/{id}       → Get session details
POST /api/interview/{id}/end   → Complete session
POST /api/interview/voice      → Upload audio for Whisper STT
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.session import get_db
from db.models import (
    InterviewSession, InterviewRound, QuestionAnswer,
    RoundType, Difficulty, InterviewStatus, Resume
)
from schemas.schemas import (
    InterviewSetupRequest, InterviewSessionResponse,
    NextQuestionRequest, QuestionResponse,
    SubmitAnswerRequest, EvaluationResponse, InterviewRoundPlan
)
from services.interview_service import (
    create_interview_plan, generate_report, get_session_context
)
from services.dataset_service import get_next_question
from services.scoring_service import evaluate_answer, adapt_difficulty
from services.ai_service import transcribe_audio
from core.security import verify_clerk_token, CurrentUser

router = APIRouter(prefix="/api/interview", tags=["Interview"])


@router.post("/setup", response_model=InterviewSessionResponse)
async def setup_interview(
    body: InterviewSetupRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(verify_clerk_token),
):
    """Create a new interview session with AI-generated round plan."""
    user_id = user["sub"]

    # Fetch resume
    result = await db.execute(
        select(Resume).where(Resume.id == body.resume_id, Resume.user_id == user_id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Generate interview plan
    plan = await create_interview_plan(
        resume_data=resume.parsed_data or {},
        job_role=body.job_role,
        company=body.company,
        job_description=body.job_description or "",
    )

    # Persist session
    session = InterviewSession(
        user_id=user_id,
        resume_id=body.resume_id,
        job_role=body.job_role,
        company=body.company,
        job_description=body.job_description,
        interview_plan=plan,
        voice_mode=body.voice_mode,
        status=InterviewStatus.IN_PROGRESS,
    )
    db.add(session)
    await db.flush()

    # Create round records
    for i, round_plan in enumerate(plan):
        rnd = InterviewRound(
            session_id=session.id,
            round_type=RoundType(round_plan.get("round", "DSA")),
            round_number=i + 1,
            difficulty=Difficulty(round_plan.get("difficulty", "medium")),
            focus_topics=round_plan.get("focus_topics", []),
            num_questions=round_plan.get("num_questions", 2),
        )
        db.add(rnd)

    await db.commit()
    await db.refresh(session)
    return session


@router.post("/next", response_model=QuestionResponse)
async def get_next_question_route(
    body: NextQuestionRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(verify_clerk_token),
):
    """
    Return the next adaptive question.
    If previous_score is provided, difficulty adapts automatically.
    """
    result = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == body.session_id,
            InterviewSession.user_id == user["sub"]
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Load rounds
    rounds_result = await db.execute(
        select(InterviewRound)
        .where(InterviewRound.session_id == session.id)
        .order_by(InterviewRound.round_number)
    )
    rounds = rounds_result.scalars().all()

    # Find current active round
    current_round = None
    for rnd in rounds:
        qas_result = await db.execute(
            select(QuestionAnswer).where(QuestionAnswer.round_id == rnd.id)
        )
        qas = qas_result.scalars().all()
        if len(qas) < rnd.num_questions and not rnd.completed:
            current_round = rnd
            current_qas = qas
            break

    if not current_round:
        raise HTTPException(status_code=400, detail="All rounds completed. Call /end to finish.")

    # Adapt difficulty if score provided
    if body.previous_score is not None:
        new_diff = adapt_difficulty(current_round.difficulty.value, body.previous_score)
        current_round.difficulty = Difficulty(new_diff)

    # Build context
    context = await get_session_context(session, db)
    context["difficulty"] = current_round.difficulty.value

    # Get question from hybrid engine
    question_data = await get_next_question(current_round.round_type.value, context)

    # Persist Q&A record (answer filled later)
    qa = QuestionAnswer(
        round_id=current_round.id,
        question_text=question_data.get("question", ""),
        question_metadata=question_data,
        order_in_round=len(current_qas),
    )
    db.add(qa)
    await db.commit()
    await db.refresh(qa)

    return QuestionResponse(
        question_id=qa.id,
        question_text=qa.question_text,
        round_type=current_round.round_type.value,
        difficulty=current_round.difficulty.value,
        hints=question_data.get("hints", []),
        follow_up=None,
        round_number=current_round.round_number,
        question_number=len(current_qas) + 1,
    )


@router.post("/answer", response_model=EvaluationResponse)
async def submit_answer(
    body: SubmitAnswerRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(verify_clerk_token),
):
    """Submit an answer and get back immediate AI evaluation."""
    result = await db.execute(
        select(QuestionAnswer).where(QuestionAnswer.id == body.question_id)
    )
    qa = result.scalar_one_or_none()
    if not qa:
        raise HTTPException(status_code=404, detail="Question not found")

    # Load round type for context
    rnd_result = await db.execute(
        select(InterviewRound).where(InterviewRound.id == qa.round_id)
    )
    rnd = rnd_result.scalar_one()

    # Evaluate
    evaluation = await evaluate_answer(
        question=qa.question_text,
        answer=body.answer_text,
        question_metadata=qa.question_metadata or {},
        round_type=rnd.round_type.value,
    )

    # Persist
    qa.answer_text = body.answer_text
    qa.evaluation = evaluation
    qa.score = evaluation.get("score")
    qa.follow_up_question = evaluation.get("follow_up_question")
    await db.commit()

    return EvaluationResponse(**evaluation)


@router.get("/{session_id}", response_model=InterviewSessionResponse)
async def get_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(verify_clerk_token),
):
    result = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user["sub"]
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/{session_id}/end")
async def end_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(verify_clerk_token),
):
    """Complete the session and generate the final report."""
    from datetime import datetime
    from db.models import Report

    result = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user["sub"]
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Load rounds + QAs eagerly
    from sqlalchemy.orm import selectinload
    result2 = await db.execute(
        select(InterviewSession)
        .options(
            selectinload(InterviewSession.rounds).selectinload(InterviewRound.questions)
        )
        .where(InterviewSession.id == session_id)
    )
    session_full = result2.scalar_one()

    report_data = await generate_report(session_full, db)

    # Persist report
    report = Report(
        session_id=session_id,
        overall_score=report_data.get("overall_score", 0),
        hire_decision=report_data.get("hire_decision", False),
        strengths=report_data.get("strengths", []),
        weaknesses=report_data.get("weaknesses", []),
        improvement_roadmap=report_data.get("improvement_roadmap", []),
        round_breakdown=report_data.get("round_breakdown", []),
    )
    db.add(report)

    session.status = InterviewStatus.COMPLETED
    session.completed_at = datetime.utcnow()
    session.overall_score = report_data.get("overall_score")
    session.hire_decision = report_data.get("hire_decision")
    await db.commit()

    return {"report_id": report.id, "overall_score": report.overall_score}


@router.post("/voice")
async def voice_to_text(audio: UploadFile):
    """Transcribe voice input via Whisper and return text."""
    content = await audio.read()
    text = await transcribe_audio(content, audio.filename or "audio.webm")
    return {"transcription": text}
