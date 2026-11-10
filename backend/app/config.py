
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    jwt_secret_key: str = "change-this-secret-key"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    admin_email: str = "admin@bookleaf.com"
    admin_password: str = "Admin@123"

    seeded_author_password: str = "BookLeaf@123"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )
    gemini_api_key: str | None = None

settings = Settings()
