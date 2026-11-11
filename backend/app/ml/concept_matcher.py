from app.ml.model_loader import get_nlp


def match_concepts(text: str, concepts: list[str]) -> dict:
    """Which expected key concepts did the candidate mention?"""
    if not concepts:
        return {"matched": [], "missing": [], "coverage": None}

    low = text.lower()
    doc = get_nlp()(low)
    tokens = {t.text for t in doc} | {t.lemma_ for t in doc if t.lemma_}

    matched, missing = [], []
    for c in concepts:
        cl = c.lower()
        if " " in cl or not cl.isalnum():  # phrases / symbols: substring match
            hit = cl in low
        else:                              # single word: token/lemma match (avoids mutable in immutable)
            hit = cl in tokens or cl + "s" in tokens
        (matched if hit else missing).append(c)

    return {"matched": matched, "missing": missing,
            "coverage": round(len(matched) / len(concepts) * 100, 1)}
