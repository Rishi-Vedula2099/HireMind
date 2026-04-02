"""
HireMind — Scoring Service
Evaluates candidate answers using the dataset's expected concepts + LLM.
Returns a rich evaluation JSON matching the EvaluationResponse schema.
"""

from pathlib import Path
from services.ai_service import json_completion

EVALUATOR_PROMPT_PATH = Path(__file__).parent.parent.parent / "ai-engine" / "prompts" / "evaluator.txt"


def _load_evaluator_prompt() -> str:
    if EVALUATOR_PROMPT_PATH.exists():
        return EVALUATOR_PROMPT_PATH.read_text(encoding="utf-8")
    return ""  # fallback to inline prompt below


INLINE_EVALUATOR = """
You are a FAANG-level senior interviewer evaluating a candidate's answer.

=== Interview Context ===
Round Type: {round_type}
Question: {question}
Expected Concepts: {expected_concepts}
Expected Points: {expected_points}
Topic: {topic}

=== Candidate's Answer ===
{answer}

=== Evaluation Criteria ===
1. Correctness — Is the answer technically accurate?
2. Depth — Does the candidate show real understanding beyond surface level?
3. Communication — Is the explanation clear and structured?
4. Real-world applicability — Can they apply this in production?
5. Concept coverage — Which expected concepts did they actually hit?

Be strict but fair. Score honestly.

Return JSON:
{
  "score": <1-10 float>,
  "correctness": "<brief assessment>",
  "depth": "<brief assessment>",
  "communication": "<brief assessment>",
  "real_world": "<brief assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>"],
  "improvement": "<specific, actionable feedback>",
  "follow_up_question": "<a logical follow-up to probe deeper>",
  "concept_match": ["<concepts candidate covered>"],
  "missing_concepts": ["<expected concepts candidate missed>"]
}
"""


async def evaluate_answer(
    question: str,
    answer: str,
    question_metadata: dict,
    round_type: str = "DSA",
) -> dict:
    """
    Core evaluation function.
    question_metadata may contain: topic, expected_concepts, expected_points, follow_ups
    """
    expected_concepts = question_metadata.get("expected_concepts", [])
    expected_points = question_metadata.get("expected_points", [])
    topic = question_metadata.get("topic", "")

    prompt = INLINE_EVALUATOR.format(
        round_type=round_type,
        question=question,
        expected_concepts=", ".join(expected_concepts) if expected_concepts else "N/A",
        expected_points=", ".join(expected_points) if expected_points else "N/A",
        topic=topic or round_type,
        answer=answer or "(No answer provided)",
    )

    try:
        result = await json_completion(prompt)
    except Exception as exc:
        # Graceful degradation — return a stub result
        result = {
            "score": 5.0,
            "correctness": "Could not evaluate",
            "depth": "Could not evaluate",
            "communication": "Could not evaluate",
            "real_world": "Could not evaluate",
            "strengths": [],
            "weaknesses": [str(exc)],
            "improvement": "Please retry",
            "follow_up_question": "",
            "concept_match": [],
            "missing_concepts": expected_concepts,
        }

    # Clamp score to 1–10
    result["score"] = max(1.0, min(10.0, float(result.get("score", 5.0))))
    return result


def adapt_difficulty(current_difficulty: str, score: float) -> str:
    """
    Adaptive difficulty engine.
    Score ≥ 7 → increase difficulty
    Score ≤ 4 → decrease difficulty
    """
    order = ["easy", "medium", "hard"]
    idx = order.index(current_difficulty) if current_difficulty in order else 1

    if score >= 7.0 and idx < 2:
        return order[idx + 1]
    elif score <= 4.0 and idx > 0:
        return order[idx - 1]
    return current_difficulty
