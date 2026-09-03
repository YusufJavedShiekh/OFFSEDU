"""
StudyGemma - Quiz Scoring Engine

Responsibilities:
- Evaluate student answers
- Score objective questions automatically
- Support negative marking
- Support partial marks
- Handle unanswered questions
- Generate per-question scores
- Generate overall quiz score

This module does NOT:
- Generate questions
- Manage quiz timers
- Manage quiz sessions
- Generate final performance reports
- Save results to the database
"""

from __future__ import annotations

import math

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Mapping, Optional

from quiz.question_types import (
    Difficulty,
    Question,
    QuestionType,
    QuizConfiguration,
    normalize_answer,
    normalize_boolean,
)


# ============================================================
# ENUMS
# ============================================================

class AnswerStatus(str, Enum):
    """Result of evaluating a student's answer."""

    CORRECT = "correct"
    WRONG = "wrong"
    PARTIAL = "partial"
    UNANSWERED = "unanswered"


# ============================================================
# EXCEPTIONS
# ============================================================

class ScoringError(Exception):
    """Base exception for scoring errors."""


class InvalidScoringConfigurationError(ScoringError):
    """Raised when the marking configuration is invalid."""


class InvalidAnswerError(ScoringError):
    """Raised when an answer cannot be evaluated."""


class UnsupportedQuestionTypeError(ScoringError):
    """Raised when a question type is unsupported."""


# ============================================================
# MARKING SCHEME
# ============================================================

@dataclass
class MarkingScheme:
    """
    Defines how marks are awarded.

    marks_per_question:
        Default marks for a question.

    negative_marks:
        Marks deducted for a wrong objective answer.

    unanswered_marks:
        Marks awarded for an unanswered question.

    allow_partial_marks:
        Whether partial marks are allowed.
    """

    marks_per_question: float = 1.0
    negative_marks: float = 0.0
    unanswered_marks: float = 0.0
    allow_partial_marks: bool = False

    def __post_init__(self) -> None:
        try:
            self.marks_per_question = float(
                self.marks_per_question
            )
            self.negative_marks = float(
                self.negative_marks
            )
            self.unanswered_marks = float(
                self.unanswered_marks
            )
        except (TypeError, ValueError) as exc:
            raise InvalidScoringConfigurationError(
                "Marks must be numeric values."
            ) from exc

        values = {
            "marks_per_question": self.marks_per_question,
            "negative_marks": self.negative_marks,
            "unanswered_marks": self.unanswered_marks,
        }

        for name, value in values.items():

            if not math.isfinite(value):
                raise InvalidScoringConfigurationError(
                    f"{name} must be a finite number."
                )

            if value < 0:
                raise InvalidScoringConfigurationError(
                    f"{name} cannot be negative."
                )

        if not isinstance(
            self.allow_partial_marks,
            bool,
        ):
            normalized = normalize_boolean(
                self.allow_partial_marks
            )

            if normalized is None:
                raise InvalidScoringConfigurationError(
                    "allow_partial_marks must be a boolean."
                )

            self.allow_partial_marks = normalized

    @classmethod
    def from_configuration(
        cls,
        configuration: QuizConfiguration,
    ) -> "MarkingScheme":
        """Create a marking scheme from QuizConfiguration."""

        if not isinstance(
            configuration,
            QuizConfiguration,
        ):
            if not isinstance(
                configuration,
                Mapping,
            ):
                raise InvalidScoringConfigurationError(
                    "Invalid quiz configuration."
                )

            try:
                configuration = (
                    QuizConfiguration.from_dict(
                        configuration
                    )
                )
            except Exception as exc:
                raise InvalidScoringConfigurationError(
                    "Invalid quiz configuration."
                ) from exc

        return cls(
            marks_per_question=(
                configuration.marks_per_question
            ),
            negative_marks=(
                configuration.negative_marks
            ),
            allow_partial_marks=(
                configuration.allow_partial_marks
            ),
        )


# ============================================================
# QUESTION SCORE
# ============================================================

@dataclass
class QuestionScore:
    """Stores the scoring result for one question."""

    question_id: str
    question_type: QuestionType
    student_answer: Any
    correct_answer: Any
    status: AnswerStatus
    marks_obtained: float
    maximum_marks: float
    explanation: Optional[str] = None
    difficulty: Optional[Difficulty] = None
    metadata: Dict[str, Any] = field(
        default_factory=dict
    )

    @property
    def is_correct(self) -> bool:
        return self.status == AnswerStatus.CORRECT

    @property
    def is_attempted(self) -> bool:
        return self.status != AnswerStatus.UNANSWERED

    def to_dict(self) -> Dict[str, Any]:
        """Convert score into an API-friendly dictionary."""

        return {
            "question_id": self.question_id,
            "question_type": (
                self.question_type.value
                if isinstance(
                    self.question_type,
                    QuestionType,
                )
                else str(self.question_type)
            ),
            "student_answer": self.student_answer,
            "correct_answer": self.correct_answer,
            "status": self.status.value,
            "marks_obtained": self.marks_obtained,
            "maximum_marks": self.maximum_marks,
            "explanation": self.explanation,
            "difficulty": (
                self.difficulty.value
                if isinstance(
                    self.difficulty,
                    Difficulty,
                )
                else self.difficulty
            ),
            "metadata": dict(self.metadata),
        }


# ============================================================
# QUIZ SCORE
# ============================================================

@dataclass
class QuizScore:
    """Complete score for a quiz."""

    total_questions: int
    attempted: int
    correct: int
    wrong: int
    partial: int
    unanswered: int
    total_marks: float
    obtained_marks: float
    percentage: float
    accuracy: float
    question_scores: List[QuestionScore] = field(
        default_factory=list
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert quiz score into an API-friendly dictionary."""

        return {
            "total_questions": self.total_questions,
            "attempted": self.attempted,
            "correct": self.correct,
            "wrong": self.wrong,
            "partial": self.partial,
            "unanswered": self.unanswered,
            "total_marks": self.total_marks,
            "obtained_marks": self.obtained_marks,
            "percentage": self.percentage,
            "accuracy": self.accuracy,
            "question_scores": [
                score.to_dict()
                for score in self.question_scores
            ],
        }


# ============================================================
# SCORING ENGINE
# ============================================================

class ScoringEngine:
    """
    Evaluates quiz answers and calculates marks.

    Objective questions:
        - MCQ
        - True/False

    Subjective questions:
        - Short answer
        - Long answer

    Subjective questions can optionally receive marks from
    an external evaluator.
    """

    def __init__(
        self,
        marking_scheme: Optional[MarkingScheme] = None,
    ) -> None:

        if marking_scheme is None:
            marking_scheme = MarkingScheme()

        if not isinstance(
            marking_scheme,
            MarkingScheme,
        ):
            raise InvalidScoringConfigurationError(
                "marking_scheme must be a MarkingScheme."
            )

        self.marking_scheme = marking_scheme

        self._subjective_evaluators: Dict[
            QuestionType,
            Callable[
                [Question, Any],
                Optional[float],
            ],
        ] = {}

    # ========================================================
    # EVALUATOR REGISTRATION
    # ========================================================

    def register_subjective_evaluator(
        self,
        question_type: QuestionType,
        evaluator: Callable[
            [Question, Any],
            Optional[float],
        ],
    ) -> None:
        """
        Register an evaluator for subjective questions.

        The evaluator must return:
        - numeric marks, or
        - None when manual evaluation is required.
        """

        try:
            question_type = QuestionType(
                question_type
            )
        except (ValueError, TypeError) as exc:
            raise UnsupportedQuestionTypeError(
                f"Invalid question type: {question_type}"
            ) from exc

        if question_type not in {
            QuestionType.SHORT_ANSWER,
            QuestionType.LONG_ANSWER,
        }:
            raise UnsupportedQuestionTypeError(
                "Subjective evaluator can only be "
                "registered for short or long answers."
            )

        if not callable(evaluator):
            raise ScoringError(
                "Evaluator must be callable."
            )

        self._subjective_evaluators[
            question_type
        ] = evaluator

    # ========================================================
    # SINGLE QUESTION
    # ========================================================

    def score_question(
        self,
        question: Question,
        student_answer: Any = None,
        maximum_marks: Optional[float] = None,
        marking_scheme: Optional[MarkingScheme] = None,
    ) -> QuestionScore:
        """
        Score one question.

        Args:
            question:
                Question object or dictionary.

            student_answer:
                Student's answer.

            maximum_marks:
                Optional custom maximum marks.

            marking_scheme:
                Optional marking scheme for this question.
        """

        # ----------------------------------------------------
        # Normalize question.
        # ----------------------------------------------------

        question = self._normalize_question(
            question
        )

        # ----------------------------------------------------
        # Determine marking scheme.
        # ----------------------------------------------------

        scheme = (
            marking_scheme
            if marking_scheme is not None
            else self.marking_scheme
        )

        if not isinstance(
            scheme,
            MarkingScheme,
        ):
            raise InvalidScoringConfigurationError(
                "Invalid marking scheme."
            )

        # ----------------------------------------------------
        # Determine maximum marks.
        # ----------------------------------------------------

        if maximum_marks is None:
            maximum_marks = question.marks

        maximum_marks = self._validate_marks(
            maximum_marks,
            "Maximum marks",
        )

        # ----------------------------------------------------
        # Unanswered.
        # ----------------------------------------------------

        if self._is_unanswered(
            student_answer
        ):
            return QuestionScore(
                question_id=question.id,
                question_type=question.type,
                student_answer=None,
                correct_answer=(
                    question.correct_answer
                ),
                status=AnswerStatus.UNANSWERED,
                marks_obtained=min(
                    scheme.unanswered_marks,
                    maximum_marks,
                ),
                maximum_marks=maximum_marks,
                explanation=question.explanation,
                difficulty=question.difficulty,
                metadata=dict(
                    question.metadata
                ),
            )

        # ----------------------------------------------------
        # Validate objective answer.
        # ----------------------------------------------------

        student_answer = self._normalize_student_answer(
            question,
            student_answer,
        )

        # ----------------------------------------------------
        # MCQ.
        # ----------------------------------------------------

        if question.type == QuestionType.MCQ:

            return self._score_mcq(
                question,
                student_answer,
                maximum_marks,
                scheme,
            )

        # ----------------------------------------------------
        # TRUE/FALSE.
        # ----------------------------------------------------

        if question.type == QuestionType.TRUE_FALSE:

            return self._score_true_false(
                question,
                student_answer,
                maximum_marks,
                scheme,
            )

        # ----------------------------------------------------
        # SHORT ANSWER.
        # ----------------------------------------------------

        if question.type == QuestionType.SHORT_ANSWER:

            return self._score_subjective(
                question,
                student_answer,
                maximum_marks,
                scheme,
            )

        # ----------------------------------------------------
        # LONG ANSWER.
        # ----------------------------------------------------

        if question.type == QuestionType.LONG_ANSWER:

            return self._score_subjective(
                question,
                student_answer,
                maximum_marks,
                scheme,
            )

        raise UnsupportedQuestionTypeError(
            f"Unsupported question type: {question.type}"
        )

    # ========================================================
    # MCQ
    # ========================================================

    def _score_mcq(
        self,
        question: Question,
        student_answer: Any,
        maximum_marks: float,
        marking_scheme: MarkingScheme,
    ) -> QuestionScore:
        """Score a multiple-choice question."""

        correct = self._answers_equal(
            student_answer,
            question.correct_answer,
            question.type,
        )

        if correct:
            status = AnswerStatus.CORRECT
            marks = maximum_marks
        else:
            status = AnswerStatus.WRONG
            marks = -min(
                marking_scheme.negative_marks,
                maximum_marks,
            )

        return QuestionScore(
            question_id=question.id,
            question_type=question.type,
            student_answer=student_answer,
            correct_answer=question.correct_answer,
            status=status,
            marks_obtained=marks,
            maximum_marks=maximum_marks,
            explanation=question.explanation,
            difficulty=question.difficulty,
            metadata=dict(
                question.metadata
            ),
        )

    # ========================================================
    # TRUE/FALSE
    # ========================================================

    def _score_true_false(
        self,
        question: Question,
        student_answer: Any,
        maximum_marks: float,
        marking_scheme: MarkingScheme,
    ) -> QuestionScore:
        """Score a True/False question."""

        student_value = self._normalize_true_false(
            student_answer
        )

        correct_value = self._normalize_true_false(
            question.correct_answer
        )

        if student_value is None:
            raise InvalidAnswerError(
                f"Invalid True/False answer for "
                f"question {question.id}."
            )

        if correct_value is None:
            raise InvalidAnswerError(
                f"Invalid correct answer for "
                f"question {question.id}."
            )

        correct = (
            student_value == correct_value
        )

        if correct:
            status = AnswerStatus.CORRECT
            marks = maximum_marks
        else:
            status = AnswerStatus.WRONG
            marks = -min(
                marking_scheme.negative_marks,
                maximum_marks,
            )

        return QuestionScore(
            question_id=question.id,
            question_type=question.type,
            student_answer=(
                "True"
                if student_value
                else "False"
            ),
            correct_answer=(
                "True"
                if correct_value
                else "False"
            ),
            status=status,
            marks_obtained=marks,
            maximum_marks=maximum_marks,
            explanation=question.explanation,
            difficulty=question.difficulty,
            metadata=dict(
                question.metadata
            ),
        )

    # ========================================================
    # SUBJECTIVE
    # ========================================================

    def _score_subjective(
        self,
        question: Question,
        student_answer: Any,
        maximum_marks: float,
        marking_scheme: MarkingScheme,
    ) -> QuestionScore:
        """
        Score short/long answers.

        If no evaluator is registered, the answer is marked as
        requiring manual evaluation.

        An evaluator may return:

            None
                -> manual evaluation required

            0
                -> WRONG

            0 < marks < maximum
                -> PARTIAL when partial marks are enabled

            maximum
                -> CORRECT
        """

        evaluator = (
            self._subjective_evaluators.get(
                question.type
            )
        )

        base_metadata = dict(
            question.metadata
        )

        # ----------------------------------------------------
        # No evaluator.
        # ----------------------------------------------------

        if evaluator is None:

            base_metadata[
                "requires_manual_evaluation"
            ] = True

            return QuestionScore(
                question_id=question.id,
                question_type=question.type,
                student_answer=student_answer,
                correct_answer=(
                    question.correct_answer
                ),
                status=AnswerStatus.UNANSWERED,
                marks_obtained=0.0,
                maximum_marks=maximum_marks,
                explanation=question.explanation,
                difficulty=question.difficulty,
                metadata=base_metadata,
            )

        # ----------------------------------------------------
        # Run evaluator.
        # ----------------------------------------------------

        try:
            marks = evaluator(
                question,
                student_answer,
            )
        except Exception as exc:
            raise ScoringError(
                f"Subjective evaluation failed for "
                f"question {question.id}."
            ) from exc

        # ----------------------------------------------------
        # Evaluator requires manual evaluation.
        # ----------------------------------------------------

        if marks is None:

            base_metadata[
                "requires_manual_evaluation"
            ] = True

            return QuestionScore(
                question_id=question.id,
                question_type=question.type,
                student_answer=student_answer,
                correct_answer=(
                    question.correct_answer
                ),
                status=AnswerStatus.UNANSWERED,
                marks_obtained=0.0,
                maximum_marks=maximum_marks,
                explanation=question.explanation,
                difficulty=question.difficulty,
                metadata=base_metadata,
            )

        # ----------------------------------------------------
        # Validate evaluator result.
        # ----------------------------------------------------

        try:
            marks = float(marks)
        except (TypeError, ValueError) as exc:
            raise ScoringError(
                "Subjective evaluator must return "
                "a numeric mark or None."
            ) from exc

        if not math.isfinite(marks):
            raise ScoringError(
                "Subjective evaluator returned "
                "a non-finite mark."
            )

        # ----------------------------------------------------
        # Keep marks within valid range.
        # ----------------------------------------------------

        marks = max(
            0.0,
            min(
                marks,
                maximum_marks,
            ),
        )

        # ----------------------------------------------------
        # Determine status.
        # ----------------------------------------------------

        if marks >= maximum_marks:

            status = AnswerStatus.CORRECT
            marks = maximum_marks

        elif marks > 0:

            if marking_scheme.allow_partial_marks:
                status = AnswerStatus.PARTIAL

            else:
                marks = 0.0
                status = AnswerStatus.WRONG

        else:

            status = AnswerStatus.WRONG
            marks = 0.0

        return QuestionScore(
            question_id=question.id,
            question_type=question.type,
            student_answer=student_answer,
            correct_answer=question.correct_answer,
            status=status,
            marks_obtained=marks,
            maximum_marks=maximum_marks,
            explanation=question.explanation,
            difficulty=question.difficulty,
            metadata=base_metadata,
        )

    # ========================================================
    # COMPLETE QUIZ
    # ========================================================

    def calculate_quiz_score(
        self,
        questions: List[Question],
        answers: Optional[
            Mapping[str, Any]
        ] = None,
        configuration: Optional[
            QuizConfiguration
        ] = None,
    ) -> QuizScore:
        """
        Calculate the complete quiz score.

        Args:
            questions:
                List of Question objects or dictionaries.

            answers:
                Mapping of question ID -> student answer.

            configuration:
                Optional quiz configuration.
        """

        if not isinstance(
            questions,
            (list, tuple),
        ):
            raise ScoringError(
                "questions must be a list or tuple."
            )

        if not questions:
            raise ScoringError(
                "Cannot score an empty quiz."
            )

        if answers is None:
            answers = {}

        if not isinstance(
            answers,
            Mapping,
        ):
            raise ScoringError(
                "answers must be a dictionary or mapping."
            )

        # ----------------------------------------------------
        # Build marking scheme.
        # ----------------------------------------------------

        marking_scheme = (
            self._build_marking_scheme(
                configuration
            )
        )

        # ----------------------------------------------------
        # Score each question.
        # ----------------------------------------------------

        question_scores: List[
            QuestionScore
        ] = []

        seen_question_ids = set()

        for raw_question in questions:

            question = self._normalize_question(
                raw_question
            )

            question_id = str(
                question.id
            ).strip()

            if not question_id:
                raise ScoringError(
                    "Question ID cannot be empty."
                )

            if question_id in seen_question_ids:
                raise ScoringError(
                    f"Duplicate question ID: "
                    f"{question_id}"
                )

            seen_question_ids.add(
                question_id
            )

            student_answer = answers.get(
                question_id
            )

            score = self.score_question(
                question=question,
                student_answer=student_answer,
                maximum_marks=question.marks,
                marking_scheme=marking_scheme,
            )

            question_scores.append(
                score
            )

        # ----------------------------------------------------
        # Calculate statistics.
        # ----------------------------------------------------

        total_questions = len(
            question_scores
        )

        attempted = sum(
            1
            for score in question_scores
            if score.status
            != AnswerStatus.UNANSWERED
        )

        correct = sum(
            1
            for score in question_scores
            if score.status
            == AnswerStatus.CORRECT
        )

        wrong = sum(
            1
            for score in question_scores
            if score.status
            == AnswerStatus.WRONG
        )

        partial = sum(
            1
            for score in question_scores
            if score.status
            == AnswerStatus.PARTIAL
        )

        unanswered = sum(
            1
            for score in question_scores
            if score.status
            == AnswerStatus.UNANSWERED
        )

        total_marks = sum(
            score.maximum_marks
            for score in question_scores
        )

        obtained_marks = sum(
            score.marks_obtained
            for score in question_scores
        )

        # ----------------------------------------------------
        # Percentage.
        # ----------------------------------------------------

        percentage = 0.0

        if total_marks > 0:

            percentage = (
                obtained_marks
                / total_marks
            ) * 100

            # Negative marking can produce a negative
            # raw score. For a percentage displayed to
            # students, keep it within 0-100.
            percentage = max(
                0.0,
                min(
                    percentage,
                    100.0,
                ),
            )

        # ----------------------------------------------------
        # Accuracy.
        # ----------------------------------------------------

        accuracy = 0.0

        if attempted > 0:

            accuracy = (
                correct
                / attempted
            ) * 100

        return QuizScore(
            total_questions=total_questions,
            attempted=attempted,
            correct=correct,
            wrong=wrong,
            partial=partial,
            unanswered=unanswered,
            total_marks=round(
                total_marks,
                2,
            ),
            obtained_marks=round(
                obtained_marks,
                2,
            ),
            percentage=round(
                percentage,
                2,
            ),
            accuracy=round(
                accuracy,
                2,
            ),
            question_scores=question_scores,
        )

    # ========================================================
    # QUESTION NORMALIZATION
    # ========================================================

    @staticmethod
    def _normalize_question(
        question: Question,
    ) -> Question:
        """Convert and validate a question."""

        if not isinstance(
            question,
            Question,
        ):

            if isinstance(
                question,
                Mapping,
            ):

                try:
                    question = (
                        Question.from_dict(
                            question
                        )
                    )

                except Exception as exc:

                    raise ScoringError(
                        "Invalid question data."
                    ) from exc

            else:

                raise ScoringError(
                    "Invalid Question object."
                )

        try:
            question.validate()

        except Exception as exc:

            raise ScoringError(
                f"Invalid question: {question.id}"
            ) from exc

        return question

    # ========================================================
    # MARKING SCHEME
    # ========================================================

    def _build_marking_scheme(
        self,
        configuration: Optional[
            QuizConfiguration
        ],
    ) -> MarkingScheme:
        """Build a marking scheme for a quiz."""

        if configuration is None:
            return self.marking_scheme

        if not isinstance(
            configuration,
            QuizConfiguration,
        ):

            if not isinstance(
                configuration,
                Mapping,
            ):
                raise InvalidScoringConfigurationError(
                    "Invalid quiz configuration."
                )

            try:
                configuration = (
                    QuizConfiguration.from_dict(
                        configuration
                    )
                )

            except Exception as exc:

                raise InvalidScoringConfigurationError(
                    "Invalid quiz configuration."
                ) from exc

        return MarkingScheme.from_configuration(
            configuration
        )

    # ========================================================
    # ANSWER NORMALIZATION
    # ========================================================

    @staticmethod
    def _normalize_student_answer(
        question: Question,
        answer: Any,
    ) -> Any:
        """Normalize a student's answer according to question type."""

        if question.type == QuestionType.TRUE_FALSE:

            normalized = normalize_boolean(
                answer
            )

            if normalized is None:
                raise InvalidAnswerError(
                    f"Invalid True/False answer for "
                    f"question {question.id}."
                )

            return (
                "True"
                if normalized
                else "False"
            )

        if question.type == QuestionType.MCQ:

            if not question.options:
                raise InvalidAnswerError(
                    f"MCQ question {question.id} "
                    "has no options."
                )

            if not isinstance(
                answer,
                str,
            ):
                raise InvalidAnswerError(
                    f"MCQ answer for question "
                    f"{question.id} must be text."
                )

            answer = answer.strip()

            if not answer:
                raise InvalidAnswerError(
                    f"MCQ answer for question "
                    f"{question.id} cannot be empty."
                )

            # Accept exact option text.
            for option in question.options:

                if answer == str(option).strip():
                    return option

            # Accept normalized option text.
            normalized_answer = (
                normalize_answer(answer)
            )

            for option in question.options:

                if normalized_answer == (
                    normalize_answer(option)
                ):
                    return option

            raise InvalidAnswerError(
                f"Answer for question {question.id} "
                "must match one of the available options."
            )

        # Subjective answers are intentionally preserved.
        return answer

    # ========================================================
    # ANSWER COMPARISON
    # ========================================================

    @staticmethod
    def _answers_equal(
        student_answer: Any,
        correct_answer: Any,
        question_type: QuestionType,
    ) -> bool:
        """Compare answers using normalized values."""

        if question_type == QuestionType.TRUE_FALSE:

            student_value = normalize_boolean(
                student_answer
            )

            correct_value = normalize_boolean(
                correct_answer
            )

            return (
                student_value is not None
                and correct_value is not None
                and student_value
                == correct_value
            )

        student_normalized = (
            ScoringEngine._normalize_comparable_answer(
                student_answer
            )
        )

        correct_normalized = (
            ScoringEngine._normalize_comparable_answer(
                correct_answer
            )
        )

        return (
            student_normalized
            == correct_normalized
        )

    # ========================================================
    # COMPARABLE ANSWER NORMALIZATION
    # ========================================================

    @staticmethod
    def _normalize_comparable_answer(
        answer: Any,
    ) -> Any:
        """
        Normalize common answer formats.

        Handles:
        - strings
        - numbers
        - booleans
        - option text
        """

        if answer is None:
            return None

        if isinstance(
            answer,
            bool,
        ):
            return answer

        if isinstance(
            answer,
            (int, float),
        ):
            return answer

        if isinstance(
            answer,
            str,
        ):

            value = answer.strip()

            if not value:
                return ""

            return normalize_answer(
                value
            )

        try:
            return normalize_answer(
                answer
            )
        except Exception:
            return answer

    # ========================================================
    # TRUE/FALSE NORMALIZATION
    # ========================================================

    @staticmethod
    def _normalize_true_false(
        answer: Any,
    ) -> Optional[bool]:
        """Normalize a True/False answer."""

        return normalize_boolean(
            answer
        )

    # ========================================================
    # EMPTY ANSWER
    # ========================================================

    @staticmethod
    def _is_unanswered(
        answer: Any,
    ) -> bool:
        """Determine whether an answer was left blank."""

        if answer is None:
            return True

        if isinstance(
            answer,
            str,
        ) and not answer.strip():
            return True

        if isinstance(
            answer,
            (list, tuple, set),
        ) and not answer:
            return True

        return False

    # ========================================================
    # MARK VALIDATION
    # ========================================================

    @staticmethod
    def _validate_marks(
        value: Any,
        label: str,
    ) -> float:
        """Validate and normalize a marks value."""

        try:
            value = float(value)

        except (TypeError, ValueError) as exc:

            raise ScoringError(
                f"{label} must be numeric."
            ) from exc

        if not math.isfinite(value):
            raise ScoringError(
                f"{label} must be a finite number."
            )

        if value < 0:
            raise ScoringError(
                f"{label} cannot be negative."
            )

        return value


# ============================================================
# CONVENIENCE FUNCTION
# ============================================================

def calculate_quiz_score(
    questions: List[Question],
    answers: Optional[
        Mapping[str, Any]
    ] = None,
    configuration: Optional[
        QuizConfiguration
    ] = None,
) -> QuizScore:
    """
    Convenience function for calculating quiz score.
    """

    engine = ScoringEngine()

    return engine.calculate_quiz_score(
        questions=questions,
        answers=answers,
        configuration=configuration,
    )