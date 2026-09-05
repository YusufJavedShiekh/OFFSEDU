from ai.gemma_service import gemma_service
from ai.prompts import EXPLANATION_PROMPT


class ExplanationService:
    """Service for generating document-grounded explanations."""

    def __init__(self, ai_service=None):
        self.ai_service = ai_service or gemma_service

    def _prepare_context(self, context):
        """Convert retrieved document context into prompt text."""

        if not context:
            return ""

        if isinstance(context, list):
            documents = []

            for item in context:
                if isinstance(item, dict):
                    document = item.get("document", "")

                    if document:
                        documents.append(str(document))

            return "\n\n".join(documents)

        return str(context)

    def _build_prompt(
        self,
        topic,
        context=None,
        language="English",
        level="Simple",
    ):
        """Build the explanation prompt."""

        if not topic or not topic.strip():
            raise ValueError("Topic cannot be empty.")

        topic = topic.strip()
        context_text = self._prepare_context(context)

        return EXPLANATION_PROMPT.format(
            topic=topic,
            language=language,
            level=level,
            context=context_text,
        )

    def explain(
        self,
        topic,
        context=None,
        language="English",
        level="Simple",
    ):
        """
        Generate a complete explanation.

        This preserves the existing non-streaming behavior.
        """

        prompt = self._build_prompt(
            topic=topic,
            context=context,
            language=language,
            level=level,
        )

        return self.ai_service.generate(prompt)

    def explain_stream(
        self,
        topic,
        context=None,
        language="English",
        level="Simple",
    ):
        """
        Generate an explanation progressively.

        Returns an iterator that yields text chunks from
        the AI service.
        """

        prompt = self._build_prompt(
            topic=topic,
            context=context,
            language=language,
            level=level,
        )

        return self.ai_service.generate_stream(prompt)


explanation_service = ExplanationService()