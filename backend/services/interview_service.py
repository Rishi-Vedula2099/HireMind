"""
HireMind — Interview Service
Orchestrates the full multi-round adaptive interview lifecycle.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pathlib import Path

from db.models import (
    InterviewSession, InterviewRound, QuestionAnswer,
    RoundType, Difficulty, InterviewStatus, Report
)
from services.dataset_service import get_next_question, get_company_config
from services.scoring_service import evaluate_answer, adapt_difficulty
from services.ai_service import json_completion

PLANNER_PROMPT_PATH = Path(__file__).parent.parent.parent / "ai-engine" / "prompts" / "planner.txt"


async def create_interview_plan(
    resume_data: dict,
    job_role: str,
    company: str,
    job_description: str = "",
) -> list:
    """
    LLM generates a full multi-round interview plan based on
    the candidate's resume, job role, and company style.
    """
    company_config = get_company_config(company)

    prompt = f"""
You are an expert technical recruiter at {company}.

Candidate Profile:
- Skills: {', '.join(resume_data.get('skills', []))}
- Experience Level: {resume_data.get('experience_level', 'junior')}
- Weak Areas: {', '.join(resume_data.get('weak_areas', []))}
- Project Domains: {', '.join(resume_data.get('project_domains', []))}

Job Role: {job_role}
Company Interview Style: {company_config.get('style_description', 'balanced')}
Focus: {', '.join(company_config.get('focus', ['DSA', 'System Design', 'Behavioral']))}

Job Description Summary:
{job_description[:1000] if job_description else 'Not provided'}

Create a structured multi-round interview plan. Rules:
- Total 3-5 rounds
- Focus more on candidate weak areas
- Match company interview style exactly
- Adjust difficulty based on experience level (junior=easy/medium, senior=medium/hard)

Return JSON array:
[
  {{
    "round": "DSA | System Design | Behavioral",
    "difficulty": "easy | medium | hard",
    "focus_topics": ["topic1", "topic2"],
    "num_questions": <2-3>
  }}
]
"""
    result = await json_completion(prompt)
    if isinstance(result, list):
        return result
    return result.get("plan", result.get("rounds", []))


async def generate_report(session: InterviewSession, db: AsyncSession) -> dict:
    """
    Generate a final hire/no-hire report for a completed session.
    Aggregates all round evaluations and asks LLM for final judgment.
    """
    rounds_data = []
    for rnd in session.rounds:
        scores = [qa.score for qa in rnd.questions if qa.score is not None]
        avg_score = sum(scores) / len(scores) if scores else 0
        rounds_data.append({
            "round_type": rnd.round_type.value,
            "average_score": avg_score,
            "questions_answered": len(rnd.questions),
            "evaluations": [qa.evaluation for qa in rnd.questions if qa.evaluation],
        })

    overall = sum(r["average_score"] for r in rounds_data) / max(len(rounds_data), 1)

    prompt = f"""
You are an expert hiring manager at {session.company}.

A candidate just completed a multi-round interview for the role of {session.job_role}.

Round Scores:
{rounds_data}

Overall Average Score: {overall:.1f}/10

Generate a comprehensive hire/no-hire report.

Return JSON:
{{
  "overall_score": {overall:.1f},
  "hire_decision": <true if score >= 6.5>,
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1"],
  "improvement_roadmap": ["action item 1", "action item 2", "action item 3"],
  "summary": "<2-3 sentence hiring summary>"
}}
"""
    result = await json_completion(prompt)
    result["round_breakdown"] = rounds_data
    return result


async def get_session_context(session: InterviewSession, db: AsyncSession) -> dict:
    """Build the context dict needed for question generation."""
    resume_data = {}
    if session.resume_id:
        from db.models import Resume
        result = await db.execute(select(Resume).where(Resume.id == session.resume_id))
        resume = result.scalar_one_or_none()
        if resume and resume.parsed_data:
            resume_data = resume.parsed_data

    return {
        "job_role": session.job_role,
        "company": session.company,
        "skills": resume_data.get("skills", []),
        "experience_level": resume_data.get("experience_level", "mid"),
        "difficulty": "medium",  # will be overridden per-round
    }
