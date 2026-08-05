from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "Gabay"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: Literal["development", "test", "production"] = "development"
    DEBUG: bool = True

    # CORS – extend in production
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Database
    DATABASE_URL: str = "sqlite:///./gabay.db"
    DATABASE_ECHO: bool = False   # set True to log every SQL statement

    # Authentication
    JWT_SECRET: str = "development-only-change-this-secret"
    JWT_ISSUER: str = "gabay"
    JWT_AUDIENCE: str = "gabay-web"
    ACCESS_TOKEN_MINUTES: int = 15
    REFRESH_TOKEN_DAYS: int = 30
    REFRESH_COOKIE_NAME: str = "gabay_refresh"
    REFRESH_COOKIE_SECURE: bool = False
    REFRESH_COOKIE_SAMESITE: Literal["strict", "lax", "none"] = "strict"
    REFRESH_COOKIE_PATH: str = "/api/v1/auth"

    # Rate limiting
    RATE_LIMIT_BACKEND: Literal["memory", "redis"] = "memory"
    RATE_LIMIT_REDIS_URL: str = ""
    RATE_LIMIT_TRUST_PROXY_HEADERS: bool = False
    LOGIN_FAILED_RATE_LIMIT: int = 5
    LOGIN_FAILED_RATE_WINDOW_SECONDS: int = 900
    REFRESH_RATE_LIMIT: int = 30
    REFRESH_RATE_WINDOW_SECONDS: int = 60
    LLM_CHAT_RATE_LIMIT: int = 20
    LLM_CHAT_RATE_WINDOW_SECONDS: int = 60

    # Zmanim / Shabbat times (Hebcal API) — defaults to the Haifa horizon
    ZMANIM_GEONAME_ID: int = 294801
    ZMANIM_CITY_NAME: str = "חיפה"

    # Modules enabled at startup (can be overridden per-tenant via TenantConfig)
    ENABLED_MODULES: list[str] = [
        "congregants", "payments", "aliyot", "seating",
        "azkarot", "smachot", "calendar", "llm", "prayer_schedule", "auth",
    ]

    # LLM provider settings
    LLM_PROVIDER: str = "openai"          # "openai" | "azure" | "ollama"
    LLM_MODEL: str = "gpt-4o"
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = ""                # override endpoint (Azure / Ollama)
    LLM_MAX_TOKENS: int = 2048
    LLM_TEMPERATURE: float = 0.2

    # System prompt injected into every LLM request
    LLM_SYSTEM_PROMPT: str = (
        "אתה גבאי — עוזר חכם לניהול בית הכנסת. "
        "יש לך גישה לנתוני בית הכנסת דרך כלים (tools): מתפללים, תשלומים, עליות לתורה, מושבים, אזכרות ושמחות.\n\n"

        "## כללי עבודה חובה:\n"
        "1. **תמיד השתמש בכלים לפני שאתה עונה** — כל שאלה לגבי מתפלל, תשלום, אזכרה, שמחה או מושב חייבת לעבור דרך שאילתה במערכת. "
        "אל תנחש ואל תמציא נתונים שלא קיבלת מהכלים.\n"
        "2. **מידע שלא קיים במערכת** — אם שאלת כלי ולא קיבלת נתונים, ציין זאת במפורש: \"לא מצאתי נתונים על כך במערכת.\"\n"
        "3. **פעולות כתיבה** — הוספה/עדכון/מחיקה של נתונים: בצע באמצעות הכלי המתאים ואשר את הביצוע.\n"
        "4. **חיפוש מתפלל** — כאשר צריך למצוא מתפלל, השתמש ב-`get_congregant` עם השם שנמסר. "
        "אם לא נמצא, שאל את המשתמש לפרטים נוספים.\n"
        "5. **שפה** — ענה תמיד בעברית, בנימוס ובשפה מתאימה לקהל מסורתי/דתי. "
        "השתמש בביטויים כמו \"יישר כוח\", \"בשורות טובות\", \"בעזרת ה׳\" במקום מתאים.\n"
        "6. **קיצור וענייניות** — תשובות קצרות וברורות. אם יש רשימה, הצג אותה בסדר מסודר."
    )

    @model_validator(mode="after")
    def validate_security_settings(self) -> "Settings":
        if self.ACCESS_TOKEN_MINUTES <= 0 or self.REFRESH_TOKEN_DAYS <= 0:
            raise ValueError("Token lifetimes must be positive")
        rate_values = (
            self.LOGIN_FAILED_RATE_LIMIT,
            self.LOGIN_FAILED_RATE_WINDOW_SECONDS,
            self.REFRESH_RATE_LIMIT,
            self.REFRESH_RATE_WINDOW_SECONDS,
            self.LLM_CHAT_RATE_LIMIT,
            self.LLM_CHAT_RATE_WINDOW_SECONDS,
        )
        if any(value <= 0 for value in rate_values):
            raise ValueError("Rate limits and windows must be positive")
        if self.RATE_LIMIT_BACKEND == "redis" and not self.RATE_LIMIT_REDIS_URL:
            raise ValueError("Redis rate limiting requires RATE_LIMIT_REDIS_URL")
        if self.REFRESH_COOKIE_SAMESITE == "none" and not self.REFRESH_COOKIE_SECURE:
            raise ValueError("SameSite=None refresh cookies must be secure")
        if self.ENVIRONMENT == "production":
            if len(self.JWT_SECRET) < 32 or self.JWT_SECRET == "development-only-change-this-secret":
                raise ValueError("Production requires a unique JWT_SECRET of at least 32 characters")
            if self.DEBUG:
                raise ValueError("DEBUG must be false in production")
            if not self.REFRESH_COOKIE_SECURE:
                raise ValueError("Production refresh cookies must be secure")
        return self


settings = Settings()
