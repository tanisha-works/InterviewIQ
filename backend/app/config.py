from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./interviewiq.db"
    whisper_model: str = "base"
    embedding_model: str = "all-MiniLM-L6-v2"
    upload_dir: str = "uploads"
    max_audio_mb: int = 25
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    jwt_secret: SecretStr = Field(min_length=32)
    jwt_issuer: str = "interviewiq"
    jwt_audience: str = "interviewiq-client"
    access_token_minutes: int = Field(default=10, ge=1, le=60)
    refresh_token_days: int = Field(default=30, ge=1, le=90)
    auth_cookie_secure: bool = True
    auth_cookie_samesite: Literal["strict", "lax", "none"] = "strict"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
