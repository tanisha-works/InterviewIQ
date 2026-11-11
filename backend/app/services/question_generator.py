import json
import random
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "questions.json"


def load_bank() -> list[dict]:
    with open(DATA_FILE, encoding="utf-8") as f:
        return json.load(f)


def resume_questions(skills: list[str], k: int = 2) -> list[dict]:
    picked = random.sample(skills, min(k, len(skills)))
    return [
        {"id": f"res-{i + 1}", "role": "resume", "category": "behavioral", "difficulty": "Medium", "concepts": [s], "ideal_answer": "",
         "question": f"Tell me about a project where you used {s}. What was your role and what was the outcome?"}
        for i, s in enumerate(picked)
    ]


def build_question_set(
    role: str,
    n: int,
    skills: list[str] | None = None,
    interview_type: str = "Mixed",
    difficulty: str = "Medium",
) -> list[dict]:
    bank = load_bank()
    role_pool = [q for q in bank if q["role"] == role]
    general = [q for q in bank if q["role"] == "general"]
    category_filter = {
        "Technical": {"technical"},
        "HR": {"hr", "behavioral"},
        "Mixed": None,
    }.get(interview_type)
    if category_filter:
        role_pool = [q for q in role_pool if q["category"] in category_filter]
        general = [q for q in general if q["category"] in category_filter]
        if not role_pool and not general:
            role_pool = [q for q in bank if q["role"] == role]
            general = [q for q in bank if q["role"] == "general"]

    preference_order = {
        "Easy": ("Easy", "Medium", "Hard"),
        "Medium": ("Medium", "Easy", "Hard"),
        "Hard": ("Hard", "Medium", "Easy"),
    }.get(difficulty, ("Medium", "Easy", "Hard"))
    selected = []
    for level in preference_order:
        level_pool = [q for q in role_pool if q.get("difficulty", "Medium") == level]
        level_general = [q for q in general if q.get("difficulty", "Medium") == level]
        random.shuffle(level_pool)
        random.shuffle(level_general)
        selected.extend(level_pool + level_general)

    chosen = resume_questions(skills, min(2, n)) if skills and interview_type != "Technical" else []
    for question in selected:
        if len(chosen) >= n:
            break
        if question not in chosen:
            chosen.append(question)
    return chosen
