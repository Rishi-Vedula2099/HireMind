"""
HireMind — Dataset Service
Hybrid question selection: dataset + LLM personalization.
Loads JSON datasets, filters by role/difficulty/company, then adapts with AI.
"""

import json
import random
import os
from pathlib import Path
from typing import Optional
from services.ai_service import json_completion

# ── Dataset paths ─────────────────────────────────────────────────────
BASE = Path(__file__).parent.parent.parent / "ai-engine" / "datasets"

def _load(filename: str) -> list:
    path = BASE / filename
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

# Pre-load at startup
DSA_DATA = _load("dsa.json")
SYSTEM_DESIGN_DATA = _load("system_design.json")
BEHAVIORAL_DATA = _load("behavioral.json")

with open(BASE / "company_config.json", "r", encoding="utf-8") as f:
    COMPANY_CONFIG: dict = json.load(f)


# ── Dataset Fetchers ──────────────────────────────────────────────────

def get_dsa_question(role: str, difficulty: str, company: Optional[str] = None) -> Optional[dict]:
    """Filter DSA questions by difficulty + role (+ company if specified)."""
    pool = [
        q for q in DSA_DATA
        if q.get("difficulty") == difficulty
        and (not q.get("role") or role in q["role"])
    ]
    if company:
        company_pool = [q for q in pool if company in q.get("companies", [])]
        if company_pool:
            pool = company_pool
    return random.choice(pool) if pool else (random.choice(DSA_DATA) if DSA_DATA else None)


def get_system_design_question(difficulty: str, company: Optional[str] = None) -> Optional[dict]:
    """Filter system design questions by difficulty (+ company)."""
    pool = [q for q in SYSTEM_DESIGN_DATA if q.get("difficulty") == difficulty]
    if company:
        company_pool = [q for q in pool if company in q.get("companies", [])]
        if company_pool:
            pool = company_pool
    return random.choice(pool) if pool else (random.choice(SYSTEM_DESIGN_DATA) if SYSTEM_DESIGN_DATA else None)


def get_behavioral_question(company: Optional[str] = None) -> Optional[dict]:
    """Filter behavioral questions by company (Amazon, Google, etc.)."""
    if company:
        pool = [q for q in BEHAVIORAL_DATA if company in q.get("companies", [])]
        if pool:
            return random.choice(pool)
    return random.choice(BEHAVIORAL_DATA) if BEHAVIORAL_DATA else None


def get_company_config(company: str) -> dict:
    """Return company-specific interview style config."""
    return COMPANY_CONFIG.get(company, COMPANY_CONFIG.get("default", {}))


# ── Hybrid: Dataset + LLM ────────────────────────────────────────────

async def adapt_question(dataset_q: dict, context: dict) -> dict:
    """
    Use LLM to personalize a dataset question for the specific candidate.
    context expects: skills, experience_level, job_role, company
    """
    prompt = f"""
You are a technical interviewer at {context.get('company', 'a top tech company')}.

Base question from our question bank:
"{dataset_q.get('question', '')}"

Candidate profile:
- Role: {context.get('job_role', 'Software Engineer')}
- Skills: {', '.join(context.get('skills', []))}
- Experience: {context.get('experience_level', 'mid')}

Slightly rephrase the question to:
1. Reference the candidate's actual skills where natural
2. Match {context.get('company', 'the company')}'s interview tone
3. Keep the core concept the same

Return JSON: {{"question": "<adapted question text>"}}
"""
    try:
        result = await json_completion(prompt)
        adapted_text = result.get("question", dataset_q["question"])
    except Exception:
        adapted_text = dataset_q["question"]

    return {**dataset_q, "question": adapted_text, "original": dataset_q["question"]}


async def get_next_question(round_type: str, context: dict) -> dict:
    """
    Main entry point — pick from dataset and adapt with LLM.
    round_type: 'DSA' | 'System Design' | 'Behavioral'
    """
    difficulty = context.get("difficulty", "medium")
    role = context.get("job_role", "SDE")
    company = context.get("company")

    if round_type == "DSA":
        base_q = get_dsa_question(role, difficulty, company)
    elif round_type == "System Design":
        base_q = get_system_design_question(difficulty, company)
    else:  # Behavioral
        base_q = get_behavioral_question(company)

    if not base_q:
        # Fallback: pure LLM generation
        return await _llm_fallback_question(round_type, context)

    return await adapt_question(base_q, context)


async def _llm_fallback_question(round_type: str, context: dict) -> dict:
    """Pure LLM question when dataset has no match."""
    prompt = f"""
You are an interviewer at {context.get('company', 'a tech company')}.
Generate a {context.get('difficulty', 'medium')} {round_type} question for a {context.get('job_role', 'SDE')}.
Candidate skills: {', '.join(context.get('skills', []))}
Return JSON: {{"question": "...", "topic": "...", "hints": [], "expected_concepts": [], "follow_ups": []}}
"""
    return await json_completion(prompt)
