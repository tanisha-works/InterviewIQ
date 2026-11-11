from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registers tables)
from app.config import settings
from app.ml.model_loader import load_all
from app.routes import auth, evaluation, interview, resume, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_all()  # load Whisper / embeddings once, not per request
    yield


app = FastAPI(title="InterviewIQ", version="0.1.0", lifespan=lifespan)

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(resume.router)
app.include_router(interview.router)
app.include_router(evaluation.router)


@app.get("/health")
def health():
    return {"status": "ok"}
