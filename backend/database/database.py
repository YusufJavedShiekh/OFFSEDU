from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from config import DATABASE_URL


# ---------------------------------------------------------
# Database configuration
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]

DATABASE_DIR = BASE_DIR / "data" / "database"
DATABASE_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------
# SQLAlchemy engine
# ---------------------------------------------------------

connect_args = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args = {
        "check_same_thread": False
    }


engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)


# ---------------------------------------------------------
# Session
# ---------------------------------------------------------

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ---------------------------------------------------------
# Base model
# ---------------------------------------------------------

Base = declarative_base()


# ---------------------------------------------------------
# Database dependency
# ---------------------------------------------------------

def get_db():
    """
    Provides a database session for FastAPI endpoints.
    """

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ---------------------------------------------------------
# Initialize database
# ---------------------------------------------------------

def init_db():
    """
    Creates all database tables.
    """

    # Import models so SQLAlchemy knows about them.
    from database import models  # noqa: F401

    Base.metadata.create_all(
        bind=engine
    )
