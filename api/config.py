from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./receipt.db"

    UPSTAGE_API_KEY: str | None = None
    UPSTAGE_IE_URL: str = "https://api.upstage.ai/v1/information-extraction"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("DATABASE_URL")
    @classmethod
    def _normalize_postgres_driver(cls, v: str) -> str:
        # Vercel/Neon/Heroku 등이 주입하는 postgres:// 또는 postgresql:// 형식을
        # SQLAlchemy + psycopg v3 형식으로 자동 변환.
        if v.startswith("postgres://"):
            return "postgresql+psycopg://" + v[len("postgres://"):]
        if v.startswith("postgresql://") and not v.startswith("postgresql+"):
            return "postgresql+psycopg://" + v[len("postgresql://"):]
        return v


settings = Settings()
