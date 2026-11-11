from app.ml.model_loader import get_whisper

# Whisper tends to drop "um/uh". A prompt containing fillers nudges it to keep them.
FILLER_PROMPT = "Umm, let me think, like, hmm... okay, so, you know, here's what I'm, uh, thinking."


def transcribe(path: str) -> dict:
    model = get_whisper()
    segments, info = model.transcribe(
        path,
        word_timestamps=True,
        vad_filter=True,
        beam_size=1,
        initial_prompt=FILLER_PROMPT,
    )
    texts, words = [], []
    for seg in segments:
        texts.append(seg.text.strip())
        for w in seg.words or []:
            words.append({"word": w.word.strip(), "start": w.start, "end": w.end})
    return {
        "text": " ".join(texts).strip(),
        "words": words,
        "duration": info.duration,
        "language": info.language,
    }
