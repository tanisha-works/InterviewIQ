"""Heavy models are loaded once (cached) and reused across requests."""
from functools import lru_cache

from app.config import settings


@lru_cache(maxsize=1)
def get_whisper():
    from faster_whisper import WhisperModel

    return WhisperModel(settings.whisper_model, device="cpu", compute_type="int8")


@lru_cache(maxsize=1)
def get_embedder():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(settings.embedding_model)


@lru_cache(maxsize=1)
def get_nlp():
    import spacy

    try:
        return spacy.load("en_core_web_sm")
    except OSError:  # model not installed -> basic tokenizer still works
        return spacy.blank("en")


def load_all():
    get_whisper()
    get_embedder()
    get_nlp()
