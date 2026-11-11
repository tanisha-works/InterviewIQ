import re
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.models import Resume
from app.utils.file_handler import delete_file, save_upload
from app.utils.pdf_extractor import extract_text

SKILL_BANK = [
    "python", "java", "javascript", "typescript", "c++", "c#", "sql", "react", "node.js", "fastapi", "django",
    "flask", "postgresql", "mysql", "mongodb", "docker", "git", "aws", "machine learning", "deep learning",
    "nlp", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "power bi", "tableau", "excel",
    "html", "css", "rest api", "data analysis", "statistics",
]


def extract_skills(text: str) -> list[str]:
    low = text.lower()
    return [s for s in SKILL_BANK if re.search(rf"(?<![\w+#]){re.escape(s)}(?![\w+#])", low)]


def create_resume(db: Session, upload: UploadFile, user_id: int) -> Resume:
    if Path(upload.filename or "").suffix.lower() != ".pdf":
        raise HTTPException(400, "Please upload a PDF resume.")
    path = save_upload(upload, subdir="resumes", max_mb=10)
    try:
        text = extract_text(path)
    except Exception:
        raise HTTPException(422, "Could not read this PDF.")
    finally:
        delete_file(path)  # keep only extracted text, not the file

    resume = Resume(user_id=user_id, filename=upload.filename, text=text, skills=extract_skills(text))
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume
