from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", populate_by_name=True)

    app_name: str = "Aurexion Digital API"
    environment: str = "development"
    database_url: str = Field(
        default="postgresql+psycopg://aurexion:aurexion@localhost:5432/aurexion",
        validation_alias=AliasChoices("DATABASE_URL"),
    )
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
    secret_key: str = Field(
        default="dev-only-change-this-jwt-secret-value",
        validation_alias=AliasChoices("SECRET_KEY", "JWT_SECRET"),
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(
        default=15,
        validation_alias=AliasChoices("ACCESS_TOKEN_EXPIRE_MINUTES", "JWT_ACCESS_TTL_MINUTES"),
    )
    refresh_token_expire_days: int = Field(
        default=7,
        validation_alias=AliasChoices("REFRESH_TOKEN_EXPIRE_DAYS", "JWT_REFRESH_TTL_DAYS"),
    )
    password_reset_expire_minutes: int = 30
    payment_provider: str = Field(default="", validation_alias=AliasChoices("PAYMENT_PROVIDER"))
    payment_key_id: str = Field(default="", validation_alias=AliasChoices("PAYMENT_KEY_ID"))
    payment_key_secret: str = Field(default="", validation_alias=AliasChoices("PAYMENT_KEY_SECRET"))
    payment_webhook_secret: str = Field(default="", validation_alias=AliasChoices("PAYMENT_WEBHOOK_SECRET"))
    payment_currency: str = Field(default="INR", validation_alias=AliasChoices("PAYMENT_CURRENCY"))
    download_storage_dir: str = Field(default="", validation_alias=AliasChoices("DOWNLOAD_STORAGE_DIR"))
    public_site_url: str = Field(default="", validation_alias=AliasChoices("PUBLIC_SITE_URL"))

    @field_validator("cors_origins")
    @classmethod
    def reject_wildcard_origin(cls, value: str) -> str:
        origins = [origin.strip() for origin in value.split(",") if origin.strip()]
        if "*" in origins:
            raise ValueError("CORS origins cannot include *")
        return value

    @field_validator("database_url", mode="after")
    @classmethod
    def use_psycopg_driver(cls, value: str) -> str:
        if value.startswith("postgresql://"):
            return "postgresql+psycopg://" + value.removeprefix("postgresql://")
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
