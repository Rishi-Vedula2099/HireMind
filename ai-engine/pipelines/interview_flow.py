"""
HireMind — Interview Flow Pipeline
Adaptive multi-round interview controller.
Manages the full session lifecycle from first question to report.
"""

from pathlib import Path
import json
import asyncio
from typing import Optional

# Add project root to path when running standalone
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

from services.dataset_service import get_next_question, get_company_config
from services.scoring_service import evaluate_answer, adapt_difficulty
from services.ai_service import json_completion


class InterviewFlowController:
    """
    Stateful controller for a single interview session.
    Can be used standalone for testing without the full FastAPI stack.
    """

    def __init__(self, config: dict):
        """
        config: {
            job_role, company, skills, experience_level,
            interview_plan (list of round dicts)
        }
        """
        self.job_role = config["job_role"]
        self.company = config["company"]
        self.skills = config.get("skills", [])
        self.experience_level = config.get("experience_level", "mid")
        self.plan = config.get("interview_plan", [])

        self.current_round_idx = 0
        self.current_question_idx = 0
        self.history: list = []       # All Q&A pairs
        self.scores: list = []

    @property
    def current_round(self) -> Optional[dict]:
        if self.current_round_idx < len(self.plan):
            return self.plan[self.current_round_idx]
        return None

    @property
    def is_complete(self) -> bool:
        return self.current_round_idx >= len(self.plan)

    def _build_context(self) -> dict:
        rnd = self.current_round or {}
        return {
            "job_role": self.job_role,
            "company": self.company,
            "skills": self.skills,
            "experience_level": self.experience_level,
            "difficulty": rnd.get("difficulty", "medium"),
        }

    async def next_question(self) -> Optional[dict]:
        """Get the next adapted question from the hybrid engine."""
        if self.is_complete:
            return None

        rnd = self.current_round
        context = self._build_context()

        # Adapt difficulty based on recent scores
        if self.scores:
            recent_avg = sum(self.scores[-3:]) / len(self.scores[-3:])
            new_diff = adapt_difficulty(context["difficulty"], recent_avg)
            context["difficulty"] = new_diff
            rnd["difficulty"] = new_diff  # update plan in-place

        question_data = await get_next_question(rnd.get("round", "DSA"), context)
        return question_data

    async def submit_answer(self, question_data: dict, answer: str) -> dict:
        """Evaluate the answer and record it."""
        rnd = self.current_round or {}
        evaluation = await evaluate_answer(
            question=question_data.get("question", ""),
            answer=answer,
            question_metadata=question_data,
            round_type=rnd.get("round", "DSA"),
        )

        score = evaluation.get("score", 5)
        self.scores.append(score)
        self.history.append({
            "round": rnd.get("round"),
            "question": question_data,
            "answer": answer,
            "evaluation": evaluation,
        })

        # Advance to next question / round
        self.current_question_idx += 1
        if self.current_question_idx >= rnd.get("num_questions", 2):
            self.current_round_idx += 1
            self.current_question_idx = 0

        return evaluation

    async def generate_final_report(self) -> dict:
        """Summarize the full interview when complete."""
        overall = sum(self.scores) / max(len(self.scores), 1)

        prompt = f"""
You are the hiring manager at {self.company}.

Interview Summary for {self.job_role} candidate:
- Overall Average Score: {overall:.1f}/10
- Total Questions: {len(self.history)}
- Question History (scores only): {self.scores}

Key Evaluations:
{json.dumps([h['evaluation'] for h in self.history[-5:]], indent=2)[:3000]}

Generate hire/no-hire report.
Return JSON:
{{
  "overall_score": {overall:.1f},
  "hire_decision": <true if >= 6.5>,
  "verdict": "Hire | No Hire | Strong Hire",
  "strengths": ["<strength>"],
  "weaknesses": ["<weakness>"],
  "improvement_roadmap": ["<action item>"],
  "summary": "<2-3 sentence hiring summary>"
}}
"""
        return await json_completion(prompt)


async def run_demo_session():
    """Quick demo to test the pipeline end-to-end without the API."""
    print("🚀 Starting HireMind interview flow demo...\n")

    controller = InterviewFlowController({
        "job_role": "Backend Engineer",
        "company": "Google",
        "skills": ["Python", "FastAPI", "Redis"],
        "experience_level": "mid",
        "interview_plan": [
            {"round": "DSA", "difficulty": "medium", "num_questions": 2},
            {"round": "Behavioral", "difficulty": "medium", "num_questions": 1},
        ],
    })

    while not controller.is_complete:
        q = await controller.next_question()
        if not q:
            break
        print(f"❓ Question: {q.get('question')}\n")
        answer = input("Your answer: ")
        evaluation = await controller.submit_answer(q, answer)
        print(f"✅ Score: {evaluation.get('score')}/10")
        print(f"💡 {evaluation.get('improvement')}\n")

    report = await controller.generate_final_report()
    print("\n📊 FINAL REPORT")
    print(f"Verdict: {report.get('verdict')}")
    print(f"Score: {report.get('overall_score')}/10")
    print(f"Summary: {report.get('summary')}")


if __name__ == "__main__":
    asyncio.run(run_demo_session())
