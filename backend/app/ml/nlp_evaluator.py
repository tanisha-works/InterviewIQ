import re
from math import sqrt

from app.ml.concept_matcher import match_concepts

FILLER_RE = re.compile(
    r"\b(um+|uh+|erm|er|hmm+|you know|i mean|basically|actually|literally|kind of|sort of|like)\b"
)
RELEVANCE_STOP_WORDS = {
    "about", "after", "also", "and", "are", "because", "been", "before", "being", "but",
    "can", "could", "did", "does", "during", "each", "for", "from", "had", "has", "have",
    "into", "its", "just", "more", "most", "not", "our", "out", "over", "same", "should",
    "some", "such", "than", "that", "the", "their", "them", "then", "there", "these",
    "they", "this", "those", "through", "under", "use", "used", "using", "was", "were",
    "what", "when", "where", "which", "while", "who", "will", "with", "would", "your",
}

STAR_CUES = {
    "situation": [r"\bwhen\b", r"\bduring\b", r"\bat my\b", r"\bin my (previous|last|current)\b",
                  r"\bproject\b", r"\bonce\b", r"\bsituation\b", r"\bcontext\b"],
    "task": [r"\bresponsible\b", r"\bmy (task|role|goal|job)\b", r"\bneeded to\b", r"\bhad to\b",
             r"\bgoal\b", r"\bobjective\b", r"\bchallenge\b"],
    "action": [r"\bi (built|created|implemented|designed|developed|decided|led|wrote|analy[sz]ed|"
               r"organi[sz]ed|fixed|used|started|worked|set up|proposed|automated|took|talked|listened)\b",
               r"\bso i\b"],
    "result": [r"\bresult(ed)?\b", r"\bas a result\b", r"\bimproved\b", r"\breduced\b", r"\bincreased\b",
               r"\bachieved\b", r"\bsaved\b", r"\b\d+\s?%", r"\boutcome\b", r"\bin the end\b",
               r"\blearn(ed|t)\b"],
}


def count_fillers(text: str) -> dict:
    found = []
    for m in FILLER_RE.finditer(text.lower()):
        f = m.group(1)
        for base in ("um", "uh", "hmm"):
            if f.startswith(base):
                f = base
        found.append(f)
    breakdown: dict[str, int] = {}
    for f in found:
        breakdown[f] = breakdown.get(f, 0) + 1
    words = max(len(text.split()), 1)
    return {"total": len(found), "per_100_words": round(len(found) / words * 100, 1),
            "breakdown": dict(sorted(breakdown.items(), key=lambda kv: -kv[1]))}


def relevance(text: str, question: dict) -> tuple[float, float]:
    """Compare answer vocabulary with the question and ideal answer without loading a model."""
    targets = [t for t in (question.get("ideal_answer"), question["question"]) if t]
    answer_terms = {
        term for term in re.findall(r"[a-z0-9]+", text.lower())
        if len(term) > 2 and term not in RELEVANCE_STOP_WORDS
    }
    if not answer_terms:
        return 0.0, 0.0

    similarities = []
    for target in targets:
        target_terms = {
            term for term in re.findall(r"[a-z0-9]+", target.lower())
            if len(term) > 2 and term not in RELEVANCE_STOP_WORDS
        }
        if target_terms:
            similarities.append(
                len(answer_terms & target_terms) / sqrt(len(answer_terms) * len(target_terms))
            )
    sim = max(similarities, default=0.0)
    score = max(0.0, min(1.0, (sim - 0.15) / 0.45)) * 100
    return round(sim, 3), round(score, 1)


def detect_star(text: str) -> dict:
    low = text.lower()
    present = {part: any(re.search(p, low) for p in pats) for part, pats in STAR_CUES.items()}
    return {"present": present, "score": sum(present.values()) / 4 * 100}


def evaluate_text(text: str, question: dict) -> dict:
    sim, rel_score = relevance(text, question)
    return {
        "fillers": count_fillers(text),
        "relevance_similarity": sim,
        "relevance_score": rel_score,
        "star": detect_star(text),
        "concepts": match_concepts(text, question.get("concepts", [])),
    }
