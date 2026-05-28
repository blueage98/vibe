from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./receipt.db"

    UPSTAGE_API_KEY: str | None = None
    UPSTAGE_IE_URL: str = "https://api.upstage.ai/v1/information-extraction"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
