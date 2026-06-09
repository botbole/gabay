from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "Gabay"
    APP_VERSION: str = "0.1.0"

    # CORS – extend in production
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Database
    DATABASE_URL: str = "sqlite:///./gabay.db"
    DATABASE_ECHO: bool = False   # set True to log every SQL statement

    # LLM provider settings
    LLM_PROVIDER: str = "openai"          # "openai" | "azure" | "ollama"
    LLM_MODEL: str = "gpt-4o"
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = ""                # override endpoint (Azure / Ollama)
    LLM_MAX_TOKENS: int = 2048
    LLM_TEMPERATURE: float = 0.2

    # System prompt injected into every LLM request
    LLM_SYSTEM_PROMPT: str = (
        "You are Gabay, an intelligent assistant for managing synagogue operations. "
        "You help with scheduling, member management, and administrative tasks. "
        "Respond concisely and accurately."
    )


settings = Settings()
