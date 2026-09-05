from ai.ollama_client import ollama_client
from ai.prompts import SYSTEM_PROMPT


class GemmaService:
    """Service layer for communicating with the configured AI model."""

    def __init__(self, client=None):
        self.client = client or ollama_client

    def generate(
        self,
        prompt,
        system_prompt=None,
        images=None,
    ):
        """Generate a complete AI response."""

        if not prompt or not prompt.strip():
            raise ValueError("Prompt cannot be empty.")

        system = system_prompt or SYSTEM_PROMPT

        return self.client.generate(
            prompt=prompt,
            system=system,
            images=images,
        )

    def generate_stream(
        self,
        prompt,
        system_prompt=None,
        images=None,
    ):
        """
        Generate an AI response progressively.

        Returns an iterator that yields text chunks from
        the configured Ollama client.
        """

        if not prompt or not prompt.strip():
            raise ValueError("Prompt cannot be empty.")

        system = system_prompt or SYSTEM_PROMPT

        return self.client.generate_stream(
            prompt=prompt,
            system=system,
            images=images,
        )

    def is_available(self):
        """Check whether the AI backend is available."""

        return self.client.is_available()


gemma_service = GemmaService()