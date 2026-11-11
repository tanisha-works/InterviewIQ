from app.ml.audio_features import compute_audio_features
from app.ml.concept_matcher import match_concepts
from app.ml.nlp_evaluator import count_fillers, detect_star
from app.ml.scoring import compute_scores, pace_score
from app.services.question_generator import build_question_set


def test_fillers():
    r = count_fillers("Um, I basically, uh, built it and ummm it was like great")
    assert r["breakdown"]["um"] == 2 and r["breakdown"]["uh"] == 1 and r["total"] >= 5


def test_audio_features():
    words = [{"word": "a", "start": 0.0, "end": 0.4}, {"word": "b", "start": 0.5, "end": 0.9},
             {"word": "c", "start": 2.5, "end": 3.0}]
    f = compute_audio_features(words, 3.0)
    assert f["pause_count"] == 1 and f["longest_pause_sec"] == 1.6 and f["wpm"] == 60.0


def test_star_detection():
    text = "During my project I had to fix a bug. I built a script and as a result we reduced errors by 40%."
    assert detect_star(text)["score"] == 100.0


def test_concepts():
    r = match_concepts("A tuple is immutable and hashable", ["mutable", "immutable", "hashable"])
    assert r["matched"] == ["immutable", "hashable"] and r["missing"] == ["mutable"]


def test_scoring():
    q = {"category": "technical", "question": "x", "concepts": ["a", "b"]}
    audio = {"word_count": 120, "wpm": 130, "pause_count": 0, "longest_pause_sec": 0, "pause_ratio": 0}
    nlp = {"fillers": {"per_100_words": 0, "total": 0, "breakdown": {}}, "relevance_score": 80,
           "star": {"present": {}, "score": 0}, "concepts": {"matched": ["a", "b"], "missing": [], "coverage": 100}}
    r = compute_scores(q, audio, nlp)
    assert r["overall"] > 85 and pace_score(130) == 100


def test_question_generator_respects_type_and_fulfills_setup_count():
    technical = build_question_set("python_developer", 8, interview_type="Technical", difficulty="Hard")
    hr = build_question_set("software_developer", 8, interview_type="HR", difficulty="Easy")
    assert len(technical) == 8
    assert all(question["category"] == "technical" for question in technical)
    assert len(hr) == 8
    assert all(question["category"] in {"hr", "behavioral"} for question in hr)
