import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.config import settings


def save_upload(upload: UploadFile, subdir: str = "audio", max_mb: int | None = None) -> str:
    max_bytes = (max_mb or settings.max_audio_mb) * 1024 * 1024
    folder = Path(settings.upload_dir) / subdir
    folder.mkdir(parents=True, exist_ok=True)
    dest = folder / f"{uuid.uuid4().hex}{Path(upload.filename or '').suffix.lower()}"

    size, too_big = 0, False
    with open(dest, "wb") as out:
        while chunk := upload.file.read(1024 * 1024):
            size += len(chunk)
            if size > max_bytes:
                too_big = True
                break
            out.write(chunk)
    if too_big:
        dest.unlink(missing_ok=True)
        raise HTTPException(413, f"File too large (max {max_mb or settings.max_audio_mb} MB).")
    return str(dest)


def delete_file(path: str) -> None:
    Path(path).unlink(missing_ok=True)
