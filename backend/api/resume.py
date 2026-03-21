"""
HireMind — Resume API Routes
POST /api/resume/upload   → Upload + parse resume
GET  /api/resume/         → List user resumes
DELETE /api/resume/{id}   → Delete a resume
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.session import get_db
from db.models import Resume
from schemas.schemas import ResumeUploadResponse
from services.resume_service import process_resume
from core.security import verify_clerk_token, CurrentUser

router = APIRouter(prefix="/api/resume", tags=["Resume"])

ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "txt"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    job_role: str = "Software Engineer",
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(verify_clerk_token),
):
    """Upload a resume file, parse it, and store structured data."""
    ext = (file.filename or "").lower().split(".")[-1]
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type .{ext} not supported. Use PDF, DOCX, or TXT.")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 5 MB)")

    # Process via AI
    processed = await process_resume(content, file.filename or "resume.pdf", job_role)

    # Save to DB (deactivate previous resumes)
    await db.execute(
        Resume.__table__.update()
        .where(Resume.user_id == user["sub"])
        .values(is_active=False)
    )
    resume = Resume(
        user_id=user["sub"],
        filename=file.filename,
        raw_text=processed["raw_text"],
        parsed_data=processed["parsed_data"],
        is_active=True,
    )
    db.add(resume)
    await db.commit()
    await db.refresh(resume)

    return ResumeUploadResponse(
        resume_id=resume.id,
        parsed_data=resume.parsed_data or {},
        message="Resume uploaded and parsed successfully!",
    )


@router.get("/")
async def list_resumes(
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(verify_clerk_token),
):
    result = await db.execute(
        select(Resume).where(Resume.user_id == user["sub"]).order_by(Resume.created_at.desc())
    )
    resumes = result.scalars().all()
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "is_active": r.is_active,
            "parsed_summary": {
                "skills": (r.parsed_data or {}).get("skills", [])[:5],
                "experience_level": (r.parsed_data or {}).get("experience_level"),
            },
            "created_at": r.created_at,
        }
        for r in resumes
    ]


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: int,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(verify_clerk_token),
):
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == user["sub"])
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    await db.delete(resume)
    await db.commit()
    return {"message": "Resume deleted"}
