PAUSE_THRESHOLD_SEC = 0.7


def compute_audio_features(words: list[dict], duration: float) -> dict:
    """Pace and pause metrics from Whisper word timestamps."""
    timed_words = sorted(
        (word for word in words if word["end"] > word["start"]),
        key=lambda word: word["start"],
    )
    n = len(timed_words)
    if n < 2:
        return {"word_count": n, "duration_sec": round(duration or 0, 1), "wpm": 0.0,
                "pause_count": 0, "longest_pause_sec": 0.0, "pause_ratio": 0.0}

    total_time = max(timed_words[-1]["end"] - timed_words[0]["start"], 1e-6)
    gaps = [max(0.0, timed_words[i + 1]["start"] - timed_words[i]["end"]) for i in range(n - 1)]
    pauses = [g for g in gaps if g >= PAUSE_THRESHOLD_SEC]
    pause_time = sum(pauses)
    speaking_time = max(total_time - pause_time, 1e-6)
    return {
        "word_count": n,
        "duration_sec": round(duration, 1),
        "wpm": round(n / speaking_time * 60, 1),
        "pause_count": len(pauses),
        "longest_pause_sec": round(max(pauses, default=0.0), 2),
        "pause_ratio": round(pause_time / total_time, 3),
    }
