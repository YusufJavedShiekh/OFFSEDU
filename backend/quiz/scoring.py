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

        except (
            TypeError,
            ValueError,
        ) as exc:

            raise InvalidScoringConfigurationError(
                "Marks must be numeric values."
            ) from exc

        if self.marks_per_question < 0:
            raise InvalidScoringConfigurationError(
                "marks_per_question cannot be negative."
            )

        if self.negative_marks < 0:
            raise InvalidScoringConfigurationError(
                "negative_marks cannot be negative."
            )

        if self.unanswered_marks < 0:
            raise InvalidScoringConfigurationError(
                "unanswered_marks cannot be negative."
            )

        self.allow_partial_marks = bool(
            self.allow_partial_marks
        )

    @classmethod
    def from_configuration(
        cls,
        configuration: QuizConfiguration,
    ) -> "MarkingScheme":
        """Create a marking scheme from QuizConfiguration."""

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
        return {
            "question_id": self.question_id,
            "question_type": (
                self.question_type.value
                if isinstance(
                    self.question_type,
                    QuestionType,
                )
                else str(
                    self.question_type
                )
            ),
            "student_answer": (
                self.student_answer
            ),
            "correct_answer": (
                self.correct_answer
            ),
            "status": self.status.value,
            "marks_obtained": (
                self.marks_obtained
            ),
            "maximum_marks": (
                self.maximum_marks
            ),
            "explanation": self.explanation,
            "difficulty": (
                self.difficulty.value
                if isinstance(
                    self.difficulty,
                    Difficulty,
                )
                else self.difficulty
            ),
            "metadata": dict(
                self.metadata
            ),
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

    question_scores: List[
        QuestionScore
    ] = field(
        default_factory=list
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_questions": (
                self.total_questions
            ),
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
                for score
                in self.question_scores
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
        marking_scheme: Optional[
            MarkingScheme
        ] = None,
    ) -> None:

        self.marking_scheme = (
            marking_scheme
            or MarkingScheme()
        )

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

        The evaluator must return marks obtained or None.
        """

        try:
            question_type = QuestionType(
                question_type
            )
        except ValueError as exc:

            raise UnsupportedQuestionTypeError(
                f"Invalid question type: "
                f"{question_type}"
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
    ) -> QuestionScore:
        """
        Score one question.

        Args:
            question:
                Question object.

            student_answer:
                Student's answer.

            maximum_marks:
                Optional custom maximum marks.
        """

        if not isinstance(
            question,
            Question,
        ):

            if isinstance(
                question,
                Mapping,
            ):

                question = Question.from_dict(
                    question
                )

            else:

                raise InvalidAnswerError(
                    "Invalid Question object."
                )

        if maximum_marks is None:

            maximum_marks = float(
                question.marks
            )

        try:
            maximum_marks = float(
                maximum_marks
            )

        except (
            TypeError,
            ValueError,
        ) as exc:

            raise ScoringError(
                "Maximum marks must be numeric."
            ) from exc

        if maximum_marks < 0:
            raise ScoringError(
                "Maximum marks cannot be negative."
            )

        # ----------------------------------------------------
        # Unanswered
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
                status=(
                    AnswerStatus.UNANSWERED
                ),
                marks_obtained=(
                    self.marking_scheme
                    .unanswered_marks
                ),
                maximum_marks=maximum_marks,
                explanation=(
                    question.explanation
                ),
                difficulty=(
                    question.difficulty
                ),
                metadata=dict(
                    question.metadata
                ),
            )

        # ----------------------------------------------------
        # MCQ
        # ----------------------------------------------------

        if question.type == QuestionType.MCQ:

            return self._score_mcq(
                question,
                student_answer,
                maximum_marks,
            )

        # ----------------------------------------------------
        # TRUE/FALSE
        # ----------------------------------------------------

        if (
            question.type
            == QuestionType.TRUE_FALSE
        ):

            return self._score_true_false(
                question,
                student_answer,
                maximum_marks,
            )

        # ----------------------------------------------------
        # SHORT ANSWER
        # ----------------------------------------------------

        if (
            question.type
            == QuestionType.SHORT_ANSWER
        ):

            return self._score_subjective(
                question,
                student_answer,
                maximum_marks,
            )

        # ----------------------------------------------------
        # LONG ANSWER
        # ----------------------------------------------------

        if (
            question.type
            == QuestionType.LONG_ANSWER
        ):

            return self._score_subjective(
                question,
                student_answer,
                maximum_marks,
            )

        raise UnsupportedQuestionTypeError(
            f"Unsupported question type: "
            f"{question.type}"
        )

    # ========================================================
    # MCQ
    # ========================================================

    def _score_mcq(
        self,
        question: Question,
        student_answer: Any,
        maximum_marks: float,
    ) -> QuestionScore:

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
                self.marking_scheme.negative_marks,
                maximum_marks,
            )

        return QuestionScore(
            question_id=question.id,
            question_type=question.type,
            student_answer=student_answer,
            correct_answer=(
                question.correct_answer
            ),
            status=status,
            marks_obtained=marks,
            maximum_marks=maximum_marks,
            explanation=(
                question.explanation
            ),
            difficulty=(
                question.difficulty
            ),
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
    ) -> QuestionScore:

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
                self.marking_scheme.negative_marks,
                maximum_marks,
            )

        return QuestionScore(
            question_id=question.id,
            question_type=question.type,
            student_answer=student_value,
            correct_answer=correct_value,
            status=status,
            marks_obtained=marks,
            maximum_marks=maximum_marks,
            explanation=(
                question.explanation
            ),
            difficulty=(
                question.difficulty
            ),
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
    ) -> QuestionScore:
        """
        Score short/long answers.

        If no evaluator is registered, the question remains
        unanswered from an automatic-scoring perspective.

        An external evaluator may return:
            0                    -> WRONG
            0 < marks < maximum  -> PARTIAL
            maximum              -> CORRECT
        """

        evaluator = (
            self._subjective_evaluators.get(
                question.type
            )
        )

        if evaluator is None:

            return QuestionScore(
                question_id=question.id,
                question_type=question.type,
                student_answer=student_answer,
                correct_answer=(
                    question.correct_answer
                ),
                status=(
                    AnswerStatus.PARTIAL
                    if self.marking_scheme
                    .allow_partial_marks
                    else AnswerStatus.WRONG
                ),
                marks_obtained=0.0,
                maximum_marks=maximum_marks,
                explanation=(
                    question.explanation
                ),
                difficulty=(
                    question.difficulty
                ),
                metadata={
                    **question.metadata,
                    "requires_manual_evaluation": True,
                },
            )

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

        if marks is None:

            return QuestionScore(
                question_id=question.id,
                question_type=question.type,
                student_answer=student_answer,
                correct_answer=(
                    question.correct_answer
                ),
                status=AnswerStatus.PARTIAL,
                marks_obtained=0.0,
                maximum_marks=maximum_marks,
                explanation=(
                    question.explanation
                ),
                difficulty=(
                    question.difficulty
                ),
                metadata={
                    **question.metadata,
                    "requires_manual_evaluation": True,
                },
            )

        try:
            marks = float(marks)

        except (
            TypeError,
            ValueError,
        ) as exc:

            raise ScoringError(
                "Subjective evaluator must return "
                "a numeric mark or None."
            ) from exc

        # Keep marks within valid range.
        marks = max(
            0.0,
            min(
                marks,
                maximum_marks,
            ),
        )

        if marks >= maximum_marks:

            status = AnswerStatus.CORRECT

        elif marks > 0:

            status = AnswerStatus.PARTIAL

        else:

            status = AnswerStatus.WRONG

        return QuestionScore(
            question_id=question.id,
            question_type=question.type,
            student_answer=student_answer,
            correct_answer=(
                question.correct_answer
            ),
            status=status,
            marks_obtained=marks,
            maximum_marks=maximum_marks,
            explanation=(
                question.explanation
            ),
            difficulty=(
                question.difficulty
            ),
            metadata=dict(
                question.metadata
            ),
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
                List of Question objects.

            answers:
                Mapping of question ID -> student answer.

            configuration:
                Optional quiz configuration.
        """

        if not questions:

            raise ScoringError(
                "Cannot score an empty quiz."
            )

        answers = answers or {}

        # ----------------------------------------------------
        # Build marking scheme.
        # ----------------------------------------------------

        if configuration is not None:

            if not isinstance(
                configuration,
                QuizConfiguration,
            ):

                configuration = (
                    QuizConfiguration.from_dict(
                        configuration
                    )
                )

            marking_scheme = (
                MarkingScheme.from_configuration(
                    configuration
                )
            )

        else:

            marking_scheme = (
                self.marking_scheme
            )

        # ----------------------------------------------------
        # Score each question.
        # ----------------------------------------------------

        question_scores: List[
            QuestionScore
        ] = []

        for question in questions:

            if not isinstance(
                question,
                Question,
            ):

                if isinstance(
                    question,
                    Mapping,
                ):

                    question = (
                        Question.from_dict(
                            question
                        )
                    )

                else:

                    raise ScoringError(
                        "Invalid question in quiz."
                    )

            student_answer = answers.get(
                question.id
            )

            score = self._score_with_scheme(
                question=question,
                student_answer=student_answer,
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

        # Prevent negative total score from producing
        # a negative percentage.
        percentage = 0.0

        if total_marks > 0:

            percentage = (
                obtained_marks
                / total_marks
            ) * 100

            percentage = max(
                0.0,
                min(
                    percentage,
                    100.0,
                ),
            )

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
            question_scores=(
                question_scores
            ),
        )

    # ========================================================
    # SCORE USING SPECIFIC MARKING SCHEME
    # ========================================================

    def _score_with_scheme(
        self,
        question: Question,
        student_answer: Any,
        marking_scheme: MarkingScheme,
    ) -> QuestionScore:
        """
        Score a question using a specific marking scheme.
        """

        previous_scheme = (
            self.marking_scheme
        )

        try:

            self.marking_scheme = (
                marking_scheme
            )

            return self.score_question(
                question,
                student_answer,
                maximum_marks=(
                    question.marks
                ),
            )

        finally:

            self.marking_scheme = (
                previous_scheme
            )

    # ========================================================
    # ANSWER COMPARISON
    # ========================================================

    def _answers_equal(
        self,
        student_answer: Any,
        correct_answer: Any,
        question_type: QuestionType,
    ) -> bool:
        """Compare answers using normalized values."""

        if (
            question_type
            == QuestionType.TRUE_FALSE
        ):

            student_value = (
                self._normalize_true_false(
                    student_answer
                )
            )

            correct_value = (
                self._normalize_true_false(
                    correct_answer
                )
            )

            return (
                student_value is not None
                and correct_value is not None
                and student_value
                == correct_value
            )

        student_normalized = (
            self._normalize_comparable_answer(
                student_answer
            )
        )

        correct_normalized = (
            self._normalize_comparable_answer(
                correct_answer
            )
        )

        return (
            student_normalized
            == correct_normalized
        )

    # ========================================================
    # NORMALIZATION
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
        - option letters
        """

        if isinstance(
            answer,
            str,
        ):

            value = answer.strip()

            # Remove common MCQ formatting.
            if (
                len(value) >= 2
                and value[0].upper()
                in {"A", "B", "C", "D"}
                and value[1] in {")", ".", ":"}
            ):

                value = value[2:].strip()

            return value.casefold()

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

        return normalize_answer(
            answer
        )

    @staticmethod
    def _normalize_true_false(
        answer: Any,
    ) -> Optional[bool]:
        """Normalize a True/False answer."""

        try:

            return normalize_boolean(
                answer
            )

        except Exception:

            if isinstance(
                answer,
                str,
            ):

                value = (
                    answer.strip()
                    .casefold()
                )

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
    # EMPTY ANSWER
    # ========================================================

    @staticmethod
    def _is_unanswered(
        answer: Any,
    ) -> bool:

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
