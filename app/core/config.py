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


settings = Settings()
