from ai.gemma_service import gemma_service
from ai.prompts import CHAT_PROMPT


class ChatService:
    """Service responsible for OFFSEDU chat interactions."""

    MAX_HISTORY_MESSAGES = 10

    def __init__(self, ai_service=None):
        self.ai_service = ai_service or gemma_service

    def chat(
        self,
        message,
        history=None,
        language="English",
        intent="chat",
        image=None,
    ):
        if not message or not message.strip():
            raise ValueError("Message cannot be empty.")

        prompt = CHAT_PROMPT.format(
            message=message.strip(),
            history=self._build_history(history),
            language=language or "English",
            intent=intent or "chat",
        )

        return self.ai_service.generate(
            prompt,
            images=[image] if image else None,
        )

    def _build_history(self, history):
        if not history:
            return "No previous conversation."

        lines = []

        for item in history[-self.MAX_HISTORY_MESSAGES:]:
            role = getattr(item, "role", None)
            content = getattr(item, "message", None)

            if isinstance(item, dict):
                role = item.get("role")
                content = item.get("message") or item.get("text")

            if not role or not content:
                continue

            role_name = (
                "Student"
                if role == "user"
                else "OFFSEDU"
                if role == "assistant"
                else str(role).capitalize()
            )

            lines.append(f"{role_name}: {content}")

        return "\n".join(lines) if lines else "No previous conversation."


chat_service = ChatService()