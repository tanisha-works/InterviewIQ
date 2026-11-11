WEIGHTS = {"relevance": 0.30, "content": 0.30, "fluency": 0.15, "pace": 0.15, "length": 0.10}

STAR_HINTS = {
    "situation": "Set the scene: where and when did this happen?",
    "task": "State your responsibility or goal in that situation.",
    "action": "Explain what *you* did, using 'I' rather than 'we'.",
    "result": "Finish with a measurable outcome or what you learned.",
}


def _clamp(v, lo=0.0, hi=100.0):
    return max(lo, min(hi, v))


def pace_score(wpm: float) -> float:
    if wpm == 0:
        return 0.0
    if 110 <= wpm <= 160:
        return 100.0
    return _clamp(100 - (110 - wpm) * 2) if wpm < 110 else _clamp(100 - (wpm - 160) * 2)


def fluency_score(fillers_per_100: float, pause_ratio: float) -> float:
    return _clamp(100 - fillers_per_100 * 8 - max(0.0, pause_ratio - 0.15) * 150)


def length_score(words: int) -> float:
    if 80 <= words <= 250:
        return 100.0
    return _clamp(words / 80 * 100) if words < 80 else _clamp(100 - (words - 250) * 0.3)


def content_score(question: dict, nlp: dict) -> float:
    if question["category"] == "behavioral":
        return nlp["star"]["score"]
    coverage = nlp["concepts"]["coverage"]
    if coverage is None:
        return nlp["relevance_score"]
    return _clamp(coverage * 1.5)  # covering ~2/3 of key concepts = full marks


def build_feedback(question: dict, audio: dict, nlp: dict, overall: float) -> list[str]:
    tips = []
    wpm = audio["wpm"]
    if 0 < wpm < 110:
        tips.append(f"You spoke slowly ({wpm:.0f} WPM). Aim for 120-160 WPM.")
    elif wpm > 160:
        tips.append(f"You spoke fast ({wpm:.0f} WPM). Slow down so key points land.")

    f = nlp["fillers"]
    if f["per_100_words"] > 4:
        top = ", ".join(f'"{w}"' for w in list(f["breakdown"])[:3])
        tips.append(f"Too many filler words ({f['total']}); most used: {top}. Pause silently instead.")

    if audio["longest_pause_sec"] > 2.5:
        tips.append(f"You had a {audio['longest_pause_sec']}s pause. Short pauses are fine; long ones sound unsure.")

    if audio["word_count"] < 60:
        tips.append("Your answer was short. Add an example or more detail.")
    elif audio["word_count"] > 300:
        tips.append("Your answer was long. Be more concise and lead with the key point.")

    if nlp["relevance_score"] < 40:
        tips.append("Your answer drifted from the question. Answer it directly first, then elaborate.")

    if question["category"] == "behavioral":
        for part, ok in nlp["star"]["present"].items():
            if not ok:
                tips.append(f"STAR - missing {part.title()}: {STAR_HINTS[part]}")
    elif nlp["concepts"]["missing"]:
        tips.append("Consider covering: " + ", ".join(nlp["concepts"]["missing"][:5]) + ".")

    if not tips:
        tips.append("Great answer: clear, well paced and on topic.")
    elif overall >= 75:
        tips.insert(0, "Strong answer overall. A few small tweaks below.")
    return tips


def compute_scores(question: dict, audio: dict, nlp: dict) -> dict:
    scores = {
        "relevance": nlp["relevance_score"],
        "content": round(content_score(question, nlp), 1),
        "fluency": round(fluency_score(nlp["fillers"]["per_100_words"], audio["pause_ratio"]), 1),
        "pace": round(pace_score(audio["wpm"]), 1),
        "length": round(length_score(audio["word_count"]), 1),
    }
    overall = round(sum(scores[k] * w for k, w in WEIGHTS.items()), 1)
    return {"scores": scores, "overall": overall, "feedback": build_feedback(question, audio, nlp, overall)}
