from ai.gemma_service import gemma_service
from ai.prompts import CHAT_PROMPT


class ChatService:
    """Service responsible for OFFSEDU chat interactions."""

    def __init__(self, ai_service=None):
        self.ai_service = ai_service or gemma_service

    def chat(self, message):
        """Send a student message to Gemma and return the response."""

        if not message or not message.strip():
            raise ValueError("Message cannot be empty.")

        prompt = CHAT_PROMPT.format(
            message=message.strip()
        )

        return self.ai_service.generate(prompt)


chat_service = ChatService()
