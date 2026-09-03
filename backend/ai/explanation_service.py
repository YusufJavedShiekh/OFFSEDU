from ai.gemma_service import gemma_service
from ai.prompts import EXPLANATION_PROMPT


class ExplanationService:
    """Service for generating document-grounded explanations."""

    def __init__(self, ai_service=None):
        self.ai_service = ai_service or gemma_service

    def explain(
        self,
        topic,
        context=None,
        language="English",
        level="Simple",
    ):
        if not topic or not topic.strip():
            raise ValueError("Topic cannot be empty.")

        topic = topic.strip()

        context_text = ""

        if context:
            if isinstance(context, list):
                context_text = "\n\n".join(
                    str(item.get("document", ""))
                    for item in context
                    if isinstance(item, dict)
                )
            else:
                context_text = str(context)

        prompt = EXPLANATION_PROMPT.format(
            topic=topic,
            language=language,
            level=level,
            context=context_text,
        )

        return self.ai_service.generate(prompt)


explanation_service = ExplanationService()