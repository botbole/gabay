"""
Database engine and session helpers.

Uses SQLite by default (gabay.db file in the project root).
To switch to PostgreSQL, change DATABASE_URL in .env:
    DATABASE_URL=postgresql+psycopg2://user:pass@host/dbname
"""

from sqlmodel import SQLModel, Session, create_engine

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,  # set to False in production
    connect_args={"check_same_thread": False},  # needed for SQLite only
)


def create_db_and_tables() -> None:
    """Create all tables defined in SQLModel models. Safe to call on every startup."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Session:
    """Return a new database session. Use as a context manager."""
    return Session(engine)
