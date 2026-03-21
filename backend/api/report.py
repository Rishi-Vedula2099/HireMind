"""
HireMind — Report API Routes
GET  /api/report/{session_id}   → Get final report for a session
GET  /api/report/history        → List all user reports
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.session import get_db
from db.models import Report, InterviewSession
from schemas.schemas import ReportResponse, RoundBreakdown
from core.security import verify_clerk_token, CurrentUser

router = APIRouter(prefix="/api/report", tags=["Report"])


@router.get("/history")
async def list_reports(
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(verify_clerk_token),
):
    """List all completed interview reports for the current user."""
    result = await db.execute(
        select(Report, InterviewSession)
        .join(InterviewSession, Report.session_id == InterviewSession.id)
        .where(InterviewSession.user_id == user["sub"])
        .order_by(Report.created_at.desc())
    )
    rows = result.all()
    return [
        {
            "report_id": r.id,
            "session_id": r.session_id,
            "job_role": s.job_role,
            "company": s.company,
            "overall_score": r.overall_score,
            "hire_decision": r.hire_decision,
            "created_at": r.created_at,
        }
        for r, s in rows
    ]


@router.get("/{session_id}", response_model=ReportResponse)
async def get_report(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(verify_clerk_token),
):
    """Get the full detailed report for a specific interview session."""
    # Verify ownership
    sess_result = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user["sub"]
        )
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    report_result = await db.execute(
        select(Report).where(Report.session_id == session_id)
    )
    report = report_result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not ready yet. Complete the interview first.")

    # Build round breakdown objects
    breakdown = []
    for item in (report.round_breakdown or []):
        breakdown.append(RoundBreakdown(
            round_type=item.get("round_type", ""),
            average_score=item.get("average_score", 0),
            questions_answered=item.get("questions_answered", 0),
            highlights=[],
        ))

    return ReportResponse(
        id=report.id,
        session_id=report.session_id,
        overall_score=report.overall_score,
        hire_decision=report.hire_decision,
        strengths=report.strengths or [],
        weaknesses=report.weaknesses or [],
        improvement_roadmap=report.improvement_roadmap or [],
        round_breakdown=breakdown,
        created_at=report.created_at,
    )
