from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from config import DATABASE_URL


# =========================================================
# SQLAlchemy Base
# =========================================================

Base = declarative_base()


# =========================================================
# Database Engine
# =========================================================

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


# =========================================================
# Database Session
# =========================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# =========================================================
# FastAPI Database Dependency
# =========================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# =========================================================
# Initialize Database
# =========================================================

def init_db():

    # Import models so SQLAlchemy registers all tables.
    from database import models  # noqa: F401

    Base.metadata.create_all(
        bind=engine
    )


