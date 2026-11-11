from pathlib import Path

from fastapi import HTTPException

ALLOWED_EXT = {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".flac", ".mp4"}


def validate_audio_filename(filename: str | None) -> None:
    if Path(filename or "").suffix.lower() not in ALLOWED_EXT:
        raise HTTPException(400, f"Unsupported audio format. Allowed: {', '.join(sorted(ALLOWED_EXT))}")


def validate_audio_file(path: str, min_bytes: int = 2000) -> None:
    if Path(path).stat().st_size < min_bytes:
        raise HTTPException(400, "Audio is empty or too short.")
