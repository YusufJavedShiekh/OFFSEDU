"""
StudyGemma - Quiz Question Generator

Responsibilities:
- Generate quiz questions using Gemma
- Support MCQ, True/False, Short Answer and Long Answer
- Support Easy, Medium and Hard difficulty
- Use QuizConfiguration
- Parse structured AI responses
- Validate generated questions
- Remove duplicate questions
- Retry when AI output is invalid

This module does NOT:
- Manage quiz sessions
- Start/stop timers
- Score answers
- Generate final results
"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Mapping, Optional

from ai.gemma_service import GemmaService
from quiz.question_types import (
    Difficulty,
    Question,
    QuestionType,
    QuizConfiguration,
    QuestionValidationError,
    normalize_difficulty,
    normalize_question_type,
)


# ============================================================
# EXCEPTIONS
# ============================================================

class QuestionGenerationError(Exception):
    """Raised when question generation fails."""


# ============================================================
# QUESTION GENERATOR
# ============================================================

class QuestionGenerator:
    """
    Generates validated quiz questions using Gemma.
    """

    DEFAULT_MAX_RETRIES = 3

    def __init__(
        self,
        gemma_service: Optional[GemmaService] = None,
        max_retries: int = DEFAULT_MAX_RETRIES,
    ) -> None:
        self.gemma_service = (
            gemma_service
            if gemma_service is not None
            else GemmaService()
        )

        try:
            max_retries = int(max_retries)
        except (TypeError, ValueError):
            max_retries = self.DEFAULT_MAX_RETRIES

        self.max_retries = max(1, max_retries)

    # ========================================================
    # PUBLIC API
    # ========================================================

    def generate_questions(
        self,
        content: str,
        configuration: QuizConfiguration | Mapping[str, Any],
        topic: Optional[str] = None,
        source_metadata: Optional[
            Mapping[str, Any]
        ] = None,
    ) -> List[Question]:
        """
        Generate questions from supplied study content.
        """

        if not isinstance(content, str):
            raise QuestionGenerationError(
                "Content must be a string."
            )

        content = content.strip()

        if not content:
            raise QuestionGenerationError(
                "Content cannot be empty."
            )

        configuration = self._normalize_configuration(
            configuration
        )

        last_error: Optional[Exception] = None

        for attempt in range(
            1,
            self.max_retries + 1,
        ):
            try:
                prompt = self._build_prompt(
                    content=content,
                    configuration=configuration,
                    topic=topic,
                    source_metadata=source_metadata,
                )

                response = self._call_gemma(prompt)

                raw_questions = self._parse_response(
                    response
                )

                questions = self._convert_questions(
                    raw_questions=raw_questions,
                    configuration=configuration,
                    topic=topic,
                    source_metadata=source_metadata,
                )

                questions = self._remove_duplicates(
                    questions
                )

                if len(questions) < (
                    configuration.number_of_questions
                ):
                    raise QuestionGenerationError(
                        "Gemma generated fewer valid "
                        "questions than requested."
                    )

                return questions[
                    :configuration.number_of_questions
                ]

            except Exception as exc:
                last_error = exc

                if attempt == self.max_retries:
                    break

        raise QuestionGenerationError(
            "Failed to generate valid quiz questions "
            f"after {self.max_retries} attempts."
        ) from last_error

    # ========================================================
    # CONFIGURATION
    # ========================================================

    def _normalize_configuration(
        self,
        configuration: QuizConfiguration | Mapping[str, Any],
    ) -> QuizConfiguration:
        if isinstance(
            configuration,
            QuizConfiguration,
        ):
            return configuration

        if isinstance(
            configuration,
            Mapping,
        ):
            try:
                return QuizConfiguration.from_dict(
                    configuration
                )
            except Exception as exc:
                raise QuestionGenerationError(
                    "Invalid quiz configuration."
                ) from exc

        raise QuestionGenerationError(
            "Configuration must be a "
            "QuizConfiguration or dictionary."
        )

    # ========================================================
    # PROMPT
    # ========================================================

    def _build_prompt(
        self,
        content: str,
        configuration: QuizConfiguration,
        topic: Optional[str] = None,
        source_metadata: Optional[
            Mapping[str, Any]
        ] = None,
    ) -> str:
        """
        Build a structured prompt for Gemma.

        Uses a local prompt builder so this module does not
        depend on an external QuizPrompts class.
        """

        question_types = ", ".join(
            question_type.value
            for question_type
            in configuration.question_types
        )

        difficulty = configuration.difficulty.value

        topic_text = (
            topic.strip()
            if isinstance(topic, str) and topic.strip()
            else "General"
        )

        metadata_text = ""

        if source_metadata:
            metadata_text = (
                "\nSource metadata:\n"
                + json.dumps(
                    dict(source_metadata),
                    ensure_ascii=False,
                    default=str,
                )
            )

        type_instructions = (
            self._build_type_instructions(
                configuration.question_types
            )
        )

        return f"""
You are the quiz generation engine for StudyGemma.

Generate exactly {configuration.number_of_questions}
high-quality quiz questions from the supplied study
content.

TOPIC:
{topic_text}

DIFFICULTY:
{difficulty}

ALLOWED QUESTION TYPES:
{question_types}

MARKS PER QUESTION:
{configuration.marks_per_question}

NEGATIVE MARKS:
{configuration.negative_marks}

PARTIAL MARKS:
{configuration.allow_partial_marks}

QUESTION TYPE RULES:
{type_instructions}

SOURCE CONTENT:
----------------
{content}
----------------
{metadata_text}

IMPORTANT RULES:

1. Use ONLY information supported by the supplied content.
2. Do not invent facts.
3. Questions must be clear and unambiguous.
4. Do not repeat questions.
5. Match the requested difficulty.
6. Use ONLY the allowed question types.
7. Every question must use exactly {configuration.marks_per_question} marks.
8. For MCQ questions, provide exactly four plausible options.
9. For MCQ, correct_answer must exactly match one option.
10. For True/False, options must be True and False.
11. For True/False, correct_answer must be True or False.
12. Short and long answer questions may contain a reference answer.
13. Return ONLY valid JSON.
14. Do not include Markdown code fences.
15. Return an array of question objects.

Required JSON format:

[
  {{
    "id": "q1",
    "text": "Question text",
    "type": "mcq",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correct_answer": "Option A",
    "marks": {configuration.marks_per_question},
    "difficulty": "{difficulty}",
    "explanation": "Explanation",
    "metadata": {{
      "topic": "{topic_text}"
    }}
  }}
]
""".strip()

    def _build_type_instructions(
        self,
        question_types: List[QuestionType],
    ) -> str:
        instructions: List[str] = []

        if QuestionType.MCQ in question_types:
            instructions.append(
                "- MCQ: exactly 4 plausible options "
                "and one correct answer."
            )

        if QuestionType.TRUE_FALSE in question_types:
            instructions.append(
                "- TRUE/FALSE: use True and False as "
                "the two options."
            )

        if QuestionType.SHORT_ANSWER in question_types:
            instructions.append(
                "- SHORT ANSWER: concise question with "
                "a reference answer."
            )

        if QuestionType.LONG_ANSWER in question_types:
            instructions.append(
                "- LONG ANSWER: descriptive question "
                "requiring a detailed response."
            )

        return "\n".join(instructions)

    # ========================================================
    # GEMMA CALL
    # ========================================================

    def _call_gemma(
        self,
        prompt: str,
    ) -> Any:
        """
        Call Gemma through GemmaService.

        The current GemmaService exposes generate().
        Fallback method names are retained for compatibility.
        """

        methods = (
            "generate",
            "generate_response",
            "chat",
        )

        for method_name in methods:
            method = getattr(
                self.gemma_service,
                method_name,
                None,
            )

            if not callable(method):
                continue

            return method(prompt)

        raise QuestionGenerationError(
            "GemmaService does not provide a supported "
            "generation method."
        )

    # ========================================================
    # RESPONSE PARSING
    # ========================================================

    def _parse_response(
        self,
        response: Any,
    ) -> List[Mapping[str, Any]]:
        """
        Convert Gemma output into a list of dictionaries.
        """

        if response is None:
            raise QuestionGenerationError(
                "Gemma returned an empty response."
            )

        if isinstance(response, list):
            return self._validate_raw_list(response)

        if isinstance(response, Mapping):
            if "questions" in response:
                questions = response["questions"]

                if isinstance(questions, list):
                    return self._validate_raw_list(
                        questions
                    )

            if (
                "text" in response
                or "question" in response
            ):
                return [response]

            raise QuestionGenerationError(
                "Gemma response dictionary does not "
                "contain questions."
            )

        if isinstance(response, str):
            cleaned = self._clean_json_response(
                response
            )

            try:
                parsed = json.loads(cleaned)
            except json.JSONDecodeError as exc:
                raise QuestionGenerationError(
                    "Gemma returned invalid JSON."
                ) from exc

            if isinstance(parsed, Mapping):
                parsed = parsed.get(
                    "questions",
                    parsed,
                )

            if isinstance(parsed, Mapping):
                parsed = [parsed]

            if not isinstance(parsed, list):
                raise QuestionGenerationError(
                    "Parsed Gemma response is not "
                    "a question list."
                )

            return self._validate_raw_list(parsed)

        raise QuestionGenerationError(
            "Unsupported Gemma response type."
        )

    def _clean_json_response(
        self,
        response: str,
    ) -> str:
        """
        Remove common Markdown/code-fence wrapping.
        """

        text = response.strip()

        text = re.sub(
            r"^```(?:json)?\s*",
            "",
            text,
            flags=re.IGNORECASE,
        )

        text = re.sub(
            r"\s*```$",
            "",
            text,
        )

        text = text.strip()

        start = text.find("[")
        end = text.rfind("]")

        if start != -1 and end != -1 and start < end:
            text = text[start:end + 1]

        return text.strip()

    def _validate_raw_list(
        self,
        questions: List[Any],
    ) -> List[Mapping[str, Any]]:
        if not questions:
            raise QuestionGenerationError(
                "Gemma returned no questions."
            )

        valid: List[Mapping[str, Any]] = []

        for item in questions:
            if not isinstance(item, Mapping):
                continue

            valid.append(item)

        if not valid:
            raise QuestionGenerationError(
                "Gemma response contains no valid "
                "question objects."
            )

        return valid

    # ========================================================
    # CONVERSION
    # ========================================================

    def _convert_questions(
        self,
        raw_questions: List[Mapping[str, Any]],
        configuration: QuizConfiguration,
        topic: Optional[str],
        source_metadata: Optional[
            Mapping[str, Any]
        ],
    ) -> List[Question]:
        questions: List[Question] = []

        for index, raw in enumerate(
            raw_questions,
            start=1,
        ):
            try:
                question_data = (
                    self._normalize_raw_question(
                        raw=raw,
                        index=index,
                        configuration=configuration,
                        topic=topic,
                        source_metadata=source_metadata,
                    )
                )

                question = Question.from_dict(
                    question_data
                )

                questions.append(question)

            except (
                QuestionValidationError,
                ValueError,
                TypeError,
            ):
                # Invalid AI-generated question is skipped.
                continue

        return questions

    def _normalize_raw_question(
        self,
        raw: Mapping[str, Any],
        index: int,
        configuration: QuizConfiguration,
        topic: Optional[str],
        source_metadata: Optional[
            Mapping[str, Any]
        ],
    ) -> Dict[str, Any]:

        text = raw.get(
            "text",
            raw.get(
                "question",
                "",
            ),
        )

        try:
            question_type = normalize_question_type(
                raw.get(
                    "type",
                    QuestionType.MCQ,
                )
            )
        except (ValueError, TypeError) as exc:
            raise QuestionValidationError(
                "Invalid question type."
            ) from exc

        # AI must respect configured question types.
        if question_type not in configuration.question_types:
            raise QuestionValidationError(
                f"Question type '{question_type.value}' "
                "is not allowed by the quiz configuration."
            )

        try:
            difficulty = normalize_difficulty(
                raw.get(
                    "difficulty",
                    configuration.difficulty,
                )
            )
        except (ValueError, TypeError) as exc:
            raise QuestionValidationError(
                "Invalid question difficulty."
            ) from exc

        # Keep the configured difficulty authoritative.
        difficulty = configuration.difficulty

        options = raw.get(
            "options",
            [],
        )

        if options is None:
            options = []

        correct_answer = raw.get(
            "correct_answer",
            raw.get(
                "answer"
            ),
        )

        # Configuration controls marks.
        marks = configuration.marks_per_question

        explanation = raw.get(
            "explanation"
        )

        # ----------------------------------------------------
        # True/False normalization.
        # ----------------------------------------------------

        if question_type == QuestionType.TRUE_FALSE:
            options = [
                "True",
                "False",
            ]

            boolean_value = (
                self._normalize_boolean_answer(
                    correct_answer
                )
            )

            if boolean_value is not None:
                correct_answer = (
                    "True"
                    if boolean_value
                    else "False"
                )

        # ----------------------------------------------------
        # Metadata.
        # ----------------------------------------------------

        raw_metadata = raw.get(
            "metadata",
            {},
        )

        if raw_metadata is None:
            raw_metadata = {}

        if not isinstance(
            raw_metadata,
            Mapping,
        ):
            raise QuestionValidationError(
                "Question metadata must be a mapping."
            )

        metadata = dict(raw_metadata)

        if topic:
            metadata.setdefault(
                "topic",
                topic.strip(),
            )

        if source_metadata:
            for key, value in source_metadata.items():
                metadata.setdefault(
                    key,
                    value,
                )

        metadata.setdefault(
            "generated_by",
            "gemma",
        )

        return {
            "id": str(
                raw.get(
                    "id",
                    f"q{index}",
                )
            ).strip(),

            "text": str(
                text
            ).strip(),

            "type": question_type,

            "options": options,

            "correct_answer": correct_answer,

            "marks": marks,

            "difficulty": difficulty,

            "explanation": explanation,

            "metadata": metadata,
        }

    # ========================================================
    # BOOLEAN NORMALIZATION
    # ========================================================

    def _normalize_boolean_answer(
        self,
        answer: Any,
    ) -> Optional[bool]:

        if isinstance(
            answer,
            bool,
        ):
            return answer

        if isinstance(
            answer,
            str,
        ):
            value = answer.strip().lower()

            if value in {
                "true",
                "t",
                "yes",
                "y",
                "1",
            }:
                return True

            if value in {
                "false",
                "f",
                "no",
                "n",
                "0",
            }:
                return False

        return None

    # ========================================================
    # DUPLICATE REMOVAL
    # ========================================================

    def _remove_duplicates(
        self,
        questions: List[Question],
    ) -> List[Question]:
        """
        Remove duplicate questions using normalized text.
        """

        unique: List[Question] = []
        seen = set()

        for question in questions:
            normalized_text = self._normalize_text(
                question.text
            )

            if not normalized_text:
                continue

            if normalized_text in seen:
                continue

            seen.add(normalized_text)
            unique.append(question)

        return unique

    def _normalize_text(
        self,
        text: str,
    ) -> str:

        text = text.strip().lower()

        text = re.sub(
            r"\s+",
            " ",
            text,
        )

        text = re.sub(
            r"[^\w\s]",
            "",
            text,
        )

        return text

    # ========================================================
    # SINGLE QUESTION
    # ========================================================

    def generate_single_question(
        self,
        content: str,
        question_type: Any = QuestionType.MCQ,
        difficulty: Any = Difficulty.MEDIUM,
        topic: Optional[str] = None,
    ) -> Question:
        """
        Generate exactly one question.
        """

        configuration = QuizConfiguration(
            number_of_questions=1,
            question_types=[
                normalize_question_type(
                    question_type
                )
            ],
            difficulty=normalize_difficulty(
                difficulty
            ),
        )

        questions = self.generate_questions(
            content=content,
            configuration=configuration,
            topic=topic,
        )

        if not questions:
            raise QuestionGenerationError(
                "Unable to generate a question."
            )

        return questions[0]


# ============================================================
# CONVENIENCE FUNCTION
# ============================================================

def generate_questions(
    content: str,
    configuration: QuizConfiguration | Mapping[str, Any],
    topic: Optional[str] = None,
    source_metadata: Optional[
        Mapping[str, Any]
    ] = None,
    gemma_service: Optional[GemmaService] = None,
) -> List[Question]:
    """
    Convenience wrapper around QuestionGenerator.
    """

    generator = QuestionGenerator(
        gemma_service=gemma_service
    )

    return generator.generate_questions(
        content=content,
        configuration=configuration,
        topic=topic,
        source_metadata=source_metadata,
    )