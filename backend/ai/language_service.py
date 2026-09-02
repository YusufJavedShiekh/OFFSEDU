from ai.gemma_service import gemma_service


class LanguageService:
    """Service for language-related AI tasks."""

    def __init__(self, ai_service=None):
        self.ai_service = ai_service or gemma_service

    def translate(self, text, target_language):
        """Translate text into the requested language."""

        if not text or not text.strip():
            raise ValueError("Text cannot be empty.")

        if not target_language or not target_language.strip():
            raise ValueError("Target language is required.")

        prompt = f"""
Translate the following text into {target_language.strip()}.

Text:
{text.strip()}

Return only the translated text.
"""

        return self.ai_service.generate(prompt)

    def improve(self, text):
        """Improve the clarity and grammar of text."""

        if not text or not text.strip():
            raise ValueError("Text cannot be empty.")

        prompt = f"""
Improve the grammar, clarity, and readability of the following text.

Text:
{text.strip()}

Preserve the original meaning.
Return only the improved text.
"""

        return self.ai_service.generate(prompt)


language_service = LanguageService()
