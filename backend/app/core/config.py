import json
from typing import List
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "Kushal Chat AI"
    ENVIRONMENT: str = Field(default="development", alias="ENVIRONMENT")

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://kushl@localhost:5432/kushalchat",
        alias="DATABASE_URL"
    )

    # OpenRouter
    OPENROUTER_API_KEY: str = Field(default="", alias="OPENROUTER_API_KEY")
    OPENROUTER_MODEL: str = Field(default="openai/gpt-4o-mini", alias="OPENROUTER_MODEL")
    OPENROUTER_BASE_URL: str = Field(default="https://openrouter.ai/api/v1", alias="OPENROUTER_BASE_URL")

    # Neon Auth
    NEON_AUTH_JWKS_URL: str = Field(
        default="https://ep-calm-hat-b5ikjjbs.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json",
        alias="NEON_AUTH_JWKS_URL"
    )
    NEON_AUTH_BASE_URL: str = Field(
        default="https://ep-calm-hat-b5ikjjbs.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth",
        alias="NEON_AUTH_BASE_URL"
    )

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    CORS_ORIGIN_REGEX: str = Field(
        default=r"https://.*\.netlify\.app",
        alias="CORS_ORIGIN_REGEX"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v


settings = Settings()

# Verified Free OpenRouter Models
FREE_MODELS = [
    {
        "id": "nvidia/nemotron-3-ultra-550b-a55b:free",
        "name": "NVIDIA Nemotron 3 Ultra",
        "tagline": "Complex reasoning",
        "description": "Difficult questions, planning, deep analysis, advanced coding",
    },
    {
        "id": "nvidia/nemotron-3.5-lightning:free",
        "name": "NVIDIA Nemotron 3.5 Lightning",
        "tagline": "Fast everyday answers",
        "description": "Quick questions, explanations, brainstorming, simple coding",
    },
    {
        "id": "google/gemma-4-31b-it:free",
        "name": "Google Gemma 4 31B",
        "tagline": "General + multimodal",
        "description": "General chat, coding, reasoning, supported image/document tasks",
    },
    {
        "id": "thinkingmachines/inkling-small:free",
        "name": "Thinking Machines Inkling Small",
        "tagline": "Coding + reasoning",
        "description": "Programming, debugging, technical questions, structured reasoning",
    },
]

MODEL_ALIASES = {
    "google/gemma-4-31b:free": "google/gemma-4-31b-it:free",
    "thinkingmachines/inkling:free": "thinkingmachines/inkling-small:free",
}

# Set of allowed model IDs
ALLOWED_MODELS = {m["id"] for m in FREE_MODELS} | set(MODEL_ALIASES.keys())
if settings.OPENROUTER_MODEL:
    ALLOWED_MODELS.add(settings.OPENROUTER_MODEL)

DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free"


def validate_and_resolve_model(model_name: str | None) -> str:
    """
    Validates the requested model against the allowed model list and resolves any known aliases.
    Raises ValueError if the model is not permitted.
    """
    if not model_name or not model_name.strip():
        return DEFAULT_MODEL

    cleaned = model_name.strip()
    if cleaned not in ALLOWED_MODELS:
        raise ValueError(f"Model '{cleaned}' is not supported. Choose from available free models.")

    # Resolve alias if present
    return MODEL_ALIASES.get(cleaned, cleaned)
