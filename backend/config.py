import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent

try:
    from dotenv import load_dotenv

    load_dotenv(PROJECT_DIR / ".env")
    load_dotenv(BASE_DIR / ".env")
except ImportError:
    pass


# Flask
FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
)

HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "5000"))
DEBUG = os.getenv("DEBUG", "true").lower() == "true"


# Ollama / Gemma
OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://localhost:11434"
)

OLLAMA_MODEL = os.getenv(
    "OLLAMA_MODEL",
    "gemma3:4b"
)


# Database
DATABASE_PATH = BASE_DIR / "offsedu.db"

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{DATABASE_PATH.as_posix()}"
)


# Storage
STORAGE_DIR = BASE_DIR / "storage"
UPLOADS_DIR = STORAGE_DIR / "uploads"
PROCESSED_DIR = STORAGE_DIR / "processed"
GENERATED_DIR = STORAGE_DIR / "generated"
COMPRESSED_DIR = STORAGE_DIR / "compressed"
PDFS_DIR = STORAGE_DIR / "pdfs"

for directory in (
    STORAGE_DIR,
    UPLOADS_DIR,
    PROCESSED_DIR,
    GENERATED_DIR,
    COMPRESSED_DIR,
    PDFS_DIR,
):
    directory.mkdir(parents=True, exist_ok=True)
