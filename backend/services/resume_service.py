"""
HireMind — Resume Service
Parses uploaded resumes (PDF/DOCX) into structured JSON
and generates embeddings for FAISS retrieval.
"""

import io
from typing import Optional
import pdfplumber
from docx import Document as DocxDocument
from services.ai_service import json_completion, get_embedding


# ── Text Extraction ───────────────────────────────────────────────────

def extract_text_from_pdf(content: bytes) -> str:
    """Extract raw text from a PDF file."""
    text = ""
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            text += (page.extract_text() or "") + "\n"
    return text.strip()


def extract_text_from_docx(content: bytes) -> str:
    """Extract raw text from a DOCX file."""
    doc = DocxDocument(io.BytesIO(content))
    return "\n".join(para.text for para in doc.paragraphs if para.text.strip())


def extract_text(content: bytes, filename: str) -> str:
    """Dispatch to the correct extractor based on file extension."""
    ext = filename.lower().split(".")[-1]
    if ext == "pdf":
        return extract_text_from_pdf(content)
    elif ext in ("docx", "doc"):
        return extract_text_from_docx(content)
    else:
        # Try UTF-8 for plain text resumes
        return content.decode("utf-8", errors="ignore")


# ── LLM Parsing ───────────────────────────────────────────────────────

RESUME_PARSE_PROMPT = """
You are an expert technical recruiter and resume analyst.

Analyze the following resume text and extract structured information.

Resume:
{resume_text}

Return JSON with this exact schema:
{{
  "skills": ["list of technical skills"],
  "experience_level": "junior | mid | senior",
  "years_of_experience": <integer>,
  "project_domains": ["AI", "Web", "Mobile", etc.],
  "education": ["degree + institution"],
  "certifications": [],
  "weak_areas": ["areas not well represented in resume"],
  "strengths": ["what stands out"],
  "suggested_roles": ["SDE", "Backend", "ML Engineer", etc.]
}}

Be thorough. Weak areas should honestly identify gaps vs typical {role} requirements.
"""


async def parse_resume(raw_text: str, target_role: str = "Software Engineer") -> dict:
    """
    Use LLM to parse raw resume text into structured JSON.
    Returns the parsed dict.
    """
    prompt = RESUME_PARSE_PROMPT.format(resume_text=raw_text[:8000], role=target_role)
    result = await json_completion(prompt)
    return result


async def process_resume(content: bytes, filename: str, target_role: str = "Software Engineer") -> dict:
    """
    Full pipeline: extract text → parse → embed.
    Returns {raw_text, parsed_data, embedding}
    """
    raw_text = extract_text(content, filename)
    parsed_data = await parse_resume(raw_text, target_role)
    embedding = await get_embedding(raw_text[:6000])  # Truncate for token limits

    return {
        "raw_text": raw_text,
        "parsed_data": parsed_data,
        "embedding": embedding,
    }
