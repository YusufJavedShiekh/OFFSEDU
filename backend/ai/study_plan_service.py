from ai.gemma_service import gemma_service
from ai.prompts import STUDY_PLAN_PROMPT


class StudyPlanService:
    """Service responsible for generating study plans."""

    def __init__(self, ai_service=None):
        self.ai_service = ai_service or gemma_service

    def generate_plan(self, topic, duration):
        """Generate a study plan for a topic."""

        if not topic or not topic.strip():
            raise ValueError("Topic cannot be empty.")

        if duration is None or not str(duration).strip():
            raise ValueError("Duration is required.")

        prompt = STUDY_PLAN_PROMPT.format(
            topic=topic.strip(),
            duration=str(duration).strip(),
        )

        return self.ai_service.generate(prompt)


study_plan_service = StudyPlanService()
