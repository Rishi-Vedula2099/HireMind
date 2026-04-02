"""
HireMind — Celery Background Tasks
Async evaluation jobs dispatched from the API after each answer.
"""

import asyncio
from workers.celery_worker import celery_app


@celery_app.task(name="score_answer", bind=True, max_retries=3)
def score_answer_task(self, question_id: int, question_text: str, answer_text: str, metadata: dict, round_type: str):
    """
    Background task to evaluate an answer and update the DB.
    Falls back to sync evaluation using asyncio.run().
    """
    try:
        from services.scoring_service import evaluate_answer
        from db.session import AsyncSessionLocal
        from db.models import QuestionAnswer
        from sqlalchemy import select

        async def _run():
            evaluation = await evaluate_answer(
                question=question_text,
                answer=answer_text,
                question_metadata=metadata,
                round_type=round_type,
            )
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(QuestionAnswer).where(QuestionAnswer.id == question_id))
                qa = result.scalar_one_or_none()
                if qa:
                    qa.evaluation = evaluation
                    qa.score = evaluation.get("score")
                    qa.follow_up_question = evaluation.get("follow_up_question")
                    await db.commit()
            return evaluation

        return asyncio.run(_run())

    except Exception as exc:
        raise self.retry(exc=exc, countdown=5)


@celery_app.task(name="generate_report_task", bind=True, max_retries=2)
def generate_report_task(self, session_id: int):
    """Background task to build the final report after session ends."""
    try:
        from services.interview_service import generate_report
        from db.session import AsyncSessionLocal
        from db.models import InterviewSession, InterviewRound, QuestionAnswer, Report
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload

        async def _run():
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(InterviewSession)
                    .options(
                        selectinload(InterviewSession.rounds)
                        .selectinload(InterviewRound.questions)
                    )
                    .where(InterviewSession.id == session_id)
                )
                session = result.scalar_one_or_none()
                if not session:
                    return

                report_data = await generate_report(session, db)
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
                await db.commit()

        asyncio.run(_run())

    except Exception as exc:
        raise self.retry(exc=exc, countdown=10)
