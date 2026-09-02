import json

from ai.gemma_service import gemma_service
from ai.prompts import QUIZ_PROMPT


class QuizService:
    """Service responsible for generating quizzes with Gemma."""

    def __init__(self, ai_service=None):
        self.ai_service = ai_service or gemma_service

    def generate_quiz(self, topic, num_questions=5):
        """Generate a quiz for the given topic."""

        if not topic or not topic.strip():
            raise ValueError("Topic cannot be empty.")

        try:
            num_questions = int(num_questions)
        except (TypeError, ValueError):
            raise ValueError("num_questions must be a number.")

        if num_questions < 1 or num_questions > 50:
            raise ValueError(
                "num_questions must be between 1 and 50."
            )

        prompt = QUIZ_PROMPT.format(
            topic=topic.strip(),
            num_questions=num_questions,
        )

        response = self.ai_service.generate(prompt)

        return self._parse_response(response)

    @staticmethod
    def _parse_response(response):
        """Try to parse a JSON quiz response."""

        if not response:
            return []

        try:
            return json.loads(response)
        except (json.JSONDecodeError, TypeError):
            return {
                "raw_response": response
            }


quiz_service = QuizService()
