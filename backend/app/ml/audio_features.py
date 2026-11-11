PAUSE_THRESHOLD_SEC = 0.7


def compute_audio_features(words: list[dict], duration: float) -> dict:
    """Pace and pause metrics from Whisper word timestamps."""
    n = len(words)
    if n < 2:
        return {"word_count": n, "duration_sec": round(duration or 0, 1), "wpm": 0.0,
                "pause_count": 0, "longest_pause_sec": 0.0, "pause_ratio": 0.0}

    speech_time = max(words[-1]["end"] - words[0]["start"], 1e-6)
    gaps = [words[i + 1]["start"] - words[i]["end"] for i in range(n - 1)]
    pauses = [g for g in gaps if g >= PAUSE_THRESHOLD_SEC]
    return {
        "word_count": n,
        "duration_sec": round(duration, 1),
        "wpm": round(n / speech_time * 60, 1),
        "pause_count": len(pauses),
        "longest_pause_sec": round(max(pauses, default=0.0), 2),
        "pause_ratio": round(sum(pauses) / speech_time, 3),
    }
