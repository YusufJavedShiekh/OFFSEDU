"""
StudyGemma - Quiz Question Types and Models

Responsibilities:
- Define supported question types
- Define difficulty levels
- Represent quiz questions
- Represent quiz configuration
- Validate question data
- Validate quiz configuration
- Normalize AI/user-provided type and difficulty values
- Provide API-friendly serialization

This module does NOT:
- Generate questions
- Call Gemma
- Manage quiz sessions
- Score answers
- Generate result reports
"""

from __future__ import annotations

import re

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Mapping, Optional


# ============================================================
# ENUMS
# ============================================================

class QuestionType(str, Enum):
    """Supported quiz question types."""

    MCQ = "mcq"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"
    LONG_ANSWER = "long_answer"


class Difficulty(str, Enum):
    """Supported question difficulty levels."""

    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


# ============================================================
# EXCEPTIONS
# ============================================================

class QuestionTypeError(ValueError):
    """Raised when question type data is invalid."""


class DifficultyError(ValueError):
    """Raised when difficulty data is invalid."""


class QuestionValidationError(ValueError):
    """Raised when question data is invalid."""


class QuizConfigurationError(ValueError):
    """Raised when quiz configuration is invalid."""


# ============================================================
# QUESTION
# ============================================================

@dataclass
class Question:
    """
    Represents a single quiz question.
    """

    id: str
    text: str
    type: QuestionType = QuestionType.MCQ
    options: List[str] = field(default_factory=list)
    correct_answer: Any = None
    marks: float = 1.0
    difficulty: Difficulty = Difficulty.MEDIUM
    explanation: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        """Normalize and validate question data."""

        self.id = str(self.id).strip()
        self.text = str(self.text).strip()

        self.type = normalize_question_type(self.type)
        self.difficulty = normalize_difficulty(self.difficulty)

        try:
            self.marks = float(self.marks)
        except (TypeError, ValueError) as exc:
            raise QuestionValidationError(
                f"Invalid marks for question '{self.id}'."
            ) from exc

        if not isinstance(self.metadata, Mapping):
            raise QuestionValidationError(
                f"Metadata for question '{self.id}' must be a dictionary."
            )

        self.metadata = dict(self.metadata)
        self.options = self._normalize_options()

        # Normalize True/False answers before validation.
        if self.type == QuestionType.TRUE_FALSE:
            boolean_value = normalize_boolean(self.correct_answer)

            if boolean_value is not None:
                self.correct_answer = (
                    "True" if boolean_value else "False"
                )

        self.validate()

    # ========================================================
    # VALIDATION
    # ========================================================

    def validate(self) -> None:
        """Validate the complete question."""

        if not self.id:
            raise QuestionValidationError(
                "Question ID cannot be empty."
            )

        if not self.text:
            raise QuestionValidationError(
                f"Question '{self.id}' must contain text."
            )

        if self.marks < 0:
            raise QuestionValidationError(
                f"Marks cannot be negative for question '{self.id}'."
            )

        # ----------------------------------------------------
        # MCQ
        # ----------------------------------------------------

        if self.type == QuestionType.MCQ:
            if len(self.options) < 2:
                raise QuestionValidationError(
                    f"MCQ '{self.id}' must have at least two options."
                )

            if self.correct_answer is None:
                raise QuestionValidationError(
                    f"MCQ '{self.id}' must have a correct answer."
                )

            if not self._answer_exists_in_options():
                raise QuestionValidationError(
                    f"Correct answer for MCQ '{self.id}' "
                    "must match one of its options."
                )

        # ----------------------------------------------------
        # TRUE / FALSE
        # ----------------------------------------------------

        elif self.type == QuestionType.TRUE_FALSE:
            if self.correct_answer is None:
                raise QuestionValidationError(
                    f"True/False question '{self.id}' "
                    "must have a correct answer."
                )

            boolean_value = normalize_boolean(
                self.correct_answer
            )

            if boolean_value is None:
                raise QuestionValidationError(
                    f"True/False question '{self.id}' "
                    "must have a valid True/False answer."
                )

            self.correct_answer = (
                "True" if boolean_value else "False"
            )

            self.options = [
                "True",
                "False",
            ]

        # ----------------------------------------------------
        # SHORT / LONG ANSWER
        # ----------------------------------------------------

        elif self.type in {
            QuestionType.SHORT_ANSWER,
            QuestionType.LONG_ANSWER,
        }:
            # Subjective questions may have a reference answer,
            # but it is not mandatory.
            pass

    # ========================================================
    # SERIALIZATION
    # ========================================================

    def to_dict(self) -> Dict[str, Any]:
        """Convert question into an API-friendly dictionary."""

        return {
            "id": self.id,
            "text": self.text,
            "type": self.type.value,
            "options": list(self.options),
            "correct_answer": self.correct_answer,
            "marks": self.marks,
            "difficulty": self.difficulty.value,
            "explanation": self.explanation,
            "metadata": dict(self.metadata),
        }

    # ========================================================
    # FACTORY
    # ========================================================

    @classmethod
    def from_dict(
        cls,
        data: Mapping[str, Any],
    ) -> "Question":
        """
        Create a Question from a dictionary.
        """

        if not isinstance(data, Mapping):
            raise QuestionValidationError(
                "Question data must be a dictionary."
            )

        return cls(
            id=data.get("id", ""),
            text=data.get(
                "text",
                data.get("question", ""),
            ),
            type=data.get(
                "type",
                QuestionType.MCQ,
            ),
            options=data.get(
                "options",
                [],
            ),
            correct_answer=data.get(
                "correct_answer",
                data.get("answer"),
            ),
            marks=data.get(
                "marks",
                1.0,
            ),
            difficulty=data.get(
                "difficulty",
                Difficulty.MEDIUM,
            ),
            explanation=data.get(
                "explanation"
            ),
            metadata=data.get(
                "metadata",
                {},
            ),
        )

    # ========================================================
    # INTERNAL HELPERS
    # ========================================================

    def _normalize_options(self) -> List[str]:
        """Normalize question options."""

        if self.options is None:
            return []

        if not isinstance(
            self.options,
            (list, tuple),
        ):
            raise QuestionValidationError(
                f"Options for question '{self.id}' "
                "must be a list."
            )

        normalized: List[str] = []

        for option in self.options:
            value = str(option).strip()

            if value and value not in normalized:
                normalized.append(value)

        return normalized

    def _answer_exists_in_options(self) -> bool:
        """Check whether the correct answer matches an option."""

        if self.correct_answer is None:
            return False

        correct = normalize_answer(
            self.correct_answer
        )

        for index, option in enumerate(self.options):
            normalized_option = normalize_answer(option)

            if correct == normalized_option:
                return True

            # Support answers such as A, B, C, D.
            if correct in {"a", "b", "c", "d"}:
                if index == ord(correct) - ord("a"):
                    return True

        return False


# ============================================================
# QUIZ CONFIGURATION
# ============================================================

@dataclass
class QuizConfiguration:
    """
    Configuration used when creating a quiz.
    """

    number_of_questions: int = 10

    question_types: List[QuestionType] = field(
        default_factory=lambda: [
            QuestionType.MCQ
        ]
    )

    difficulty: Difficulty = Difficulty.MEDIUM

    time_limit: int = 10 * 60

    marks_per_question: float = 1.0

    negative_marks: float = 0.0

    allow_partial_marks: bool = False

    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    def __post_init__(self) -> None:
        """Normalize and validate configuration."""

        try:
            self.number_of_questions = int(
                self.number_of_questions
            )
        except (TypeError, ValueError) as exc:
            raise QuizConfigurationError(
                "number_of_questions must be an integer."
            ) from exc

        try:
            self.time_limit = int(
                self.time_limit
            )
        except (TypeError, ValueError) as exc:
            raise QuizConfigurationError(
                "time_limit must be an integer."
            ) from exc

        try:
            self.marks_per_question = float(
                self.marks_per_question
            )
        except (TypeError, ValueError) as exc:
            raise QuizConfigurationError(
                "marks_per_question must be numeric."
            ) from exc

        try:
            self.negative_marks = float(
                self.negative_marks
            )
        except (TypeError, ValueError) as exc:
            raise QuizConfigurationError(
                "negative_marks must be numeric."
            ) from exc

        self.difficulty = normalize_difficulty(
            self.difficulty
        )

        if self.question_types is None:
            self.question_types = []

        if not isinstance(
            self.question_types,
            (list, tuple),
        ):
            raise QuizConfigurationError(
                "question_types must be a list."
            )

        self.question_types = [
            normalize_question_type(question_type)
            for question_type
            in self.question_types
        ]

        # Remove duplicates while preserving order.
        self.question_types = list(
            dict.fromkeys(
                self.question_types
            )
        )

        if not isinstance(self.allow_partial_marks, bool):
            self.allow_partial_marks = (
                normalize_boolean(
                    self.allow_partial_marks
                )
            )

            if self.allow_partial_marks is None:
                raise QuizConfigurationError(
                    "allow_partial_marks must be a boolean."
                )

        if not isinstance(self.metadata, Mapping):
            raise QuizConfigurationError(
                "metadata must be a dictionary."
            )

        self.metadata = dict(self.metadata)

        self.validate()

    # ========================================================
    # VALIDATION
    # ========================================================

    def validate(self) -> None:
        """Validate quiz configuration."""

        if self.number_of_questions <= 0:
            raise QuizConfigurationError(
                "number_of_questions must be greater than 0."
            )

        if self.time_limit <= 0:
            raise QuizConfigurationError(
                "time_limit must be greater than 0 seconds."
            )

        if self.marks_per_question < 0:
            raise QuizConfigurationError(
                "marks_per_question cannot be negative."
            )

        if self.negative_marks < 0:
            raise QuizConfigurationError(
                "negative_marks cannot be negative."
            )

        if not self.question_types:
            raise QuizConfigurationError(
                "At least one question type is required."
            )

    # ========================================================
    # SERIALIZATION
    # ========================================================

    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration into an API-friendly dictionary."""

        return {
            "number_of_questions": (
                self.number_of_questions
            ),
            "question_types": [
                question_type.value
                for question_type
                in self.question_types
            ],
            "difficulty": self.difficulty.value,
            "time_limit": self.time_limit,
            "marks_per_question": (
                self.marks_per_question
            ),
            "negative_marks": self.negative_marks,
            "allow_partial_marks": (
                self.allow_partial_marks
            ),
            "metadata": dict(self.metadata),
        }

    @classmethod
    def from_dict(
        cls,
        data: Mapping[str, Any],
    ) -> "QuizConfiguration":
        """Create configuration from a dictionary."""

        if not isinstance(data, Mapping):
            raise QuizConfigurationError(
                "Quiz configuration must be a dictionary."
            )

        return cls(
            number_of_questions=data.get(
                "number_of_questions",
                10,
            ),
            question_types=data.get(
                "question_types",
                [QuestionType.MCQ],
            ),
            difficulty=data.get(
                "difficulty",
                Difficulty.MEDIUM,
            ),
            time_limit=data.get(
                "time_limit",
                600,
            ),
            marks_per_question=data.get(
                "marks_per_question",
                1.0,
            ),
            negative_marks=data.get(
                "negative_marks",
                0.0,
            ),
            allow_partial_marks=data.get(
                "allow_partial_marks",
                False,
            ),
            metadata=data.get(
                "metadata",
                {},
            ),
        )


# ============================================================
# NORMALIZATION FUNCTIONS
# ============================================================

def normalize_question_type(
    value: Any,
) -> QuestionType:
    """
    Normalize question type aliases.
    """

    if isinstance(
        value,
        QuestionType,
    ):
        return value

    if value is None:
        raise QuestionTypeError(
            "Question type cannot be None."
        )

    normalized = str(value).strip().lower()

    aliases = {
        "mcq": QuestionType.MCQ,
        "multiple choice": QuestionType.MCQ,
        "multiple-choice": QuestionType.MCQ,
        "multiple_choice": QuestionType.MCQ,
        "multiplechoice": QuestionType.MCQ,

        "true false": QuestionType.TRUE_FALSE,
        "true/false": QuestionType.TRUE_FALSE,
        "true-false": QuestionType.TRUE_FALSE,
        "true_false": QuestionType.TRUE_FALSE,
        "truefalse": QuestionType.TRUE_FALSE,

        "short": QuestionType.SHORT_ANSWER,
        "short answer": QuestionType.SHORT_ANSWER,
        "short-answer": QuestionType.SHORT_ANSWER,
        "short_answer": QuestionType.SHORT_ANSWER,

        "long": QuestionType.LONG_ANSWER,
        "long answer": QuestionType.LONG_ANSWER,
        "long-answer": QuestionType.LONG_ANSWER,
        "long_answer": QuestionType.LONG_ANSWER,

        "descriptive": QuestionType.LONG_ANSWER,
        "subjective": QuestionType.SHORT_ANSWER,
    }

    if normalized not in aliases:
        raise QuestionTypeError(
            f"Unsupported question type: {value}"
        )

    return aliases[normalized]


def normalize_difficulty(
    value: Any,
) -> Difficulty:
    """
    Normalize difficulty aliases.
    """

    if isinstance(
        value,
        Difficulty,
    ):
        return value

    if value is None:
        raise DifficultyError(
            "Difficulty cannot be None."
        )

    normalized = str(value).strip().lower()

    aliases = {
        "easy": Difficulty.EASY,
        "beginner": Difficulty.EASY,

        "medium": Difficulty.MEDIUM,
        "moderate": Difficulty.MEDIUM,
        "intermediate": Difficulty.MEDIUM,

        "hard": Difficulty.HARD,
        "difficult": Difficulty.HARD,
        "advanced": Difficulty.HARD,
    }

    if normalized not in aliases:
        raise DifficultyError(
            f"Unsupported difficulty: {value}"
        )

    return aliases[normalized]


# ============================================================
# ANSWER HELPERS
# ============================================================

def normalize_answer(
    answer: Any,
) -> str:
    """
    Normalize an answer for basic comparisons.

    Detailed scoring logic remains inside scoring.py.
    """

    if answer is None:
        return ""

    value = str(answer).strip().lower()

    # Normalize whitespace.
    value = " ".join(
        value.split()
    )

    # Remove common option formatting.
    value = re.sub(
        r"^(?:option\s+)?([abcd])[\.\):\-]\s*",
        r"\1 ",
        value,
    )

    return value.strip()


def normalize_boolean(
    value: Any,
) -> Optional[bool]:
    """
    Normalize common True/False representations.

    Returns:
        True
        False
        None if invalid
    """

    if isinstance(
        value,
        bool,
    ):
        return value

    if isinstance(
        value,
        int,
    ) and value in (0, 1):
        return bool(value)

    if isinstance(
        value,
        str,
    ):
        normalized = (
            value.strip().lower()
        )

        if normalized in {
            "true",
            "t",
            "yes",
            "y",
            "1",
        }:
            return True

        if normalized in {
            "false",
            "f",
            "no",
            "n",
            "0",
        }:
            return False

    return None


# ============================================================
# VALIDATION HELPERS
# ============================================================

def validate_question(
    question: Mapping[str, Any] | Question,
) -> bool:
    """
    Validate a question.

    Returns True when valid.
    """

    if isinstance(
        question,
        Question,
    ):
        question.validate()
        return True

    if not isinstance(
        question,
        Mapping,
    ):
        raise QuestionValidationError(
            "Question must be a dictionary or Question object."
        )

    Question.from_dict(question)

    return True


def validate_quiz_configuration(
    configuration: (
        Mapping[str, Any]
        | QuizConfiguration
    ),
) -> bool:
    """
    Validate quiz configuration.

    Returns True when valid.
    """

    if isinstance(
        configuration,
        QuizConfiguration,
    ):
        configuration.validate()
        return True

    if not isinstance(
        configuration,
        Mapping,
    ):
        raise QuizConfigurationError(
            "Configuration must be a dictionary "
            "or QuizConfiguration object."
        )

    QuizConfiguration.from_dict(
        configuration
    )

    return True


# ============================================================
# CONVENIENCE FACTORIES
# ============================================================

def create_question(
    question_id: str,
    text: str,
    question_type: Any = QuestionType.MCQ,
    options: Optional[List[str]] = None,
    correct_answer: Any = None,
    marks: float = 1.0,
    difficulty: Any = Difficulty.MEDIUM,
    explanation: Optional[str] = None,
    metadata: Optional[Mapping[str, Any]] = None,
) -> Question:
    """Convenience function for creating a Question."""

    return Question(
        id=question_id,
        text=text,
        type=question_type,
        options=options or [],
        correct_answer=correct_answer,
        marks=marks,
        difficulty=difficulty,
        explanation=explanation,
        metadata=dict(metadata or {}),
    )


def create_quiz_configuration(
    number_of_questions: int = 10,
    question_types: Optional[
        List[Any]
    ] = None,
    difficulty: Any = Difficulty.MEDIUM,
    time_limit: int = 600,
    marks_per_question: float = 1.0,
    negative_marks: float = 0.0,
    allow_partial_marks: bool = False,
    metadata: Optional[
        Mapping[str, Any]
    ] = None,
) -> QuizConfiguration:
    """Convenience function for creating quiz configuration."""

    return QuizConfiguration(
        number_of_questions=number_of_questions,
        question_types=(
            question_types
            if question_types is not None
            else [QuestionType.MCQ]
        ),
        difficulty=difficulty,
        time_limit=time_limit,
        marks_per_question=marks_per_question,
        negative_marks=negative_marks,
        allow_partial_marks=allow_partial_marks,
        metadata=dict(metadata or {}),
    )