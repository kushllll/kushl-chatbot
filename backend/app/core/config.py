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
