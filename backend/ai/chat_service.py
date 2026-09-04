from ai.gemma_service import gemma_service
from ai.prompts import CHAT_PROMPT


class ChatService:
    """Service responsible for OFFSEDU chat interactions."""

    MAX_HISTORY_MESSAGES = 10

    def __init__(self, ai_service=None):
        self.ai_service = ai_service or gemma_service

    def chat(self, message, history=None):
        """Send a student message to Gemma with recent conversation context."""

        if not message or not message.strip():
            raise ValueError("Message cannot be empty.")

        history_text = self._build_history(history)

        prompt = CHAT_PROMPT.format(
            message=message.strip(),
            history=history_text,
        )

        return self.ai_service.generate(prompt)

    def _build_history(self, history):
        """Build a bounded conversation history for the AI prompt."""

        if not history:
            return "No previous conversation."

        recent_history = history[-self.MAX_HISTORY_MESSAGES:]

        lines = []

        for item in recent_history:
            role = getattr(item, "role", None)
            content = getattr(item, "message", None)

            if isinstance(item, dict):
                role = item.get("role")
                content = item.get("message")

            if not role or not content:
                continue

            if role == "user":
                role_name = "Student"
            elif role == "assistant":
                role_name = "OFFSEDU"
            else:
                role_name = str(role).capitalize()

            lines.append(f"{role_name}: {content}")

        if not lines:
            return "No previous conversation."

        return "\n".join(lines)


chat_service = ChatService()