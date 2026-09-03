# ============================================================
# OFFSEDU RAG - Embeddings
# ============================================================

import requests
from sqlalchemy import text

from config import OLLAMA_URL


class EmbeddingService:
    """Create embeddings using a local Ollama embedding model."""

    def __init__(
        self,
        base_url=OLLAMA_URL,
        model="nomic-embed-text",
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model

    def embed(self, text):
        """Create an embedding for a single text."""

        if not text or not text.strip():
            raise ValueError("Text cannot be empty.")

        response = requests.post(
            f"{self.base_url}/api/embed",
            json={
                "model": self.model,
                "input": text.strip(),
            },
            timeout=120,
        )

        response.raise_for_status()

        data = response.json()

        embeddings = data.get("embeddings")

        if not embeddings:
            raise RuntimeError(
                "Ollama did not return an embedding."
            )

        return embeddings[0]

    def embed_many(self, texts):
        """Create embeddings for multiple text chunks."""

        if not texts:
            return []

        return [
            self.embed(text)
            for text in texts
            if text and text.strip()
        ]

    def is_available(self):
        """Check whether the Ollama embedding model is available."""

        try:
            response = requests.get(
                f"{self.base_url}/api/tags",
                timeout=5,
            )

            if not response.ok:
                return False

            models = response.json().get("models", [])

            return any(
                model.get("name", "").split(":")[0]
                == self.model.split(":")[0]
                for model in models
            )

        except requests.RequestException:
            return False


embedding_service = EmbeddingService()
