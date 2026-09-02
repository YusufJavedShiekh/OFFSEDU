from ai.gemma_service import gemma_service
from ai.prompts import EXPLANATION_PROMPT


class ExplanationService:
    """Service responsible for generating educational explanations."""

    def __init__(self, ai_service=None):
        self.ai_service = ai_service or gemma_service

    def explain(self, topic):
        """Generate an explanation for a topic."""

        if not topic or not topic.strip():
            raise ValueError("Topic cannot be empty.")

        prompt = EXPLANATION_PROMPT.format(
            topic=topic.strip()
        )

        return self.ai_service.generate(prompt)


explanation_service = ExplanationService()
