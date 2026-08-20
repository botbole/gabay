"""
Database engine and session helpers.

Uses SQLite by default (gabay.db file in the project root).
To switch to PostgreSQL, change DATABASE_URL in .env:
    DATABASE_URL=postgresql+psycopg2://user:pass@host/dbname
"""

import sqlalchemy
from sqlmodel import SQLModel, Session, create_engine

from app.core.config import settings

_engine_options = {"echo": settings.DATABASE_ECHO}
if settings.DATABASE_URL.startswith("sqlite"):
    _engine_options["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, **_engine_options)

_MIGRATIONS = [
    "ALTER TABLE azkarot ADD COLUMN year_occurred INTEGER",
    "ALTER TABLE smachot ADD COLUMN year_occurred INTEGER",
    "ALTER TABLE congregants ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE congregants ADD COLUMN archived_at TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE congregants ADD COLUMN mother_name TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE congregants ADD COLUMN gender TEXT NOT NULL DEFAULT 'male'",
]


def create_db_and_tables() -> None:
    """Create all tables defined in SQLModel models. Safe to call on every startup."""
    SQLModel.metadata.create_all(engine)
    _run_migrations()
    _ensure_module_enabled("bulletin")


def _ensure_module_enabled(slug: str) -> None:
    """Append a module slug to an existing TenantConfig row if it is missing."""
    with engine.connect() as conn:
        try:
            row = conn.execute(
                sqlalchemy.text("SELECT enabled_modules FROM tenant_config WHERE id = 1")
            ).fetchone()
            if not row:
                return
            modules = [m.strip() for m in (row[0] or "").split(",") if m.strip()]
            if slug in modules:
                return
            modules.append(slug)
            conn.execute(
                sqlalchemy.text(
                    "UPDATE tenant_config SET enabled_modules = :mods WHERE id = 1"
                ),
                {"mods": ",".join(modules)},
            )
            conn.commit()
        except Exception:
            conn.rollback()


def _run_migrations() -> None:
    """Apply any additive schema migrations that SQLModel cannot auto-detect."""
    with engine.connect() as conn:
        for stmt in _MIGRATIONS:
            try:
                conn.execute(sqlalchemy.text(stmt))
                conn.commit()
            except Exception:
                # Column already exists or other benign error — skip silently
                conn.rollback()


def get_session() -> Session:
    """Return a new database session. Use as a context manager."""
    return Session(engine)
