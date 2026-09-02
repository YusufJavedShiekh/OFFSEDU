"""
StudyGemma - Quiz Result Generator

Responsibilities:
- Convert QuizScore into a complete student result
- Calculate grade
- Determine performance level
- Generate strengths
- Generate improvement areas
- Generate question-wise analysis
- Produce frontend/API-friendly result data

This module does NOT:
- Generate questions
- Manage quiz sessions
- Run timers
- Score answers
- Save results to database
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

from quiz.scoring import (
    AnswerStatus,
    QuestionScore,
    QuizScore,
)


# ============================================================
# ENUMS
# ============================================================

class PerformanceLevel(str, Enum):
    """Overall performance category."""

    EXCELLENT = "excellent"
    VERY_GOOD = "very_good"
    GOOD = "good"
    AVERAGE = "average"
    NEEDS_IMPROVEMENT = "needs_improvement"


class Grade(str, Enum):
    """Academic grade."""

    A_PLUS = "A+"
    A = "A"
    B_PLUS = "B+"
    B = "B"
    C = "C"
    D = "D"
    F = "F"


# ============================================================
# EXCEPTIONS
# ============================================================

class ResultGenerationError(Exception):
    """Base exception for result generation."""


class InvalidQuizScoreError(ResultGenerationError):
    """Raised when QuizScore is invalid."""


# ============================================================
# THRESHOLDS
# ============================================================

GRADE_THRESHOLDS = {
    Grade.A_PLUS: 90.0,
    Grade.A: 80.0,
    Grade.B_PLUS: 70.0,
    Grade.B: 60.0,
    Grade.C: 50.0,
    Grade.D: 40.0,
    Grade.F: 0.0,
}


PERFORMANCE_THRESHOLDS = {
    PerformanceLevel.EXCELLENT: 90.0,
    PerformanceLevel.VERY_GOOD: 80.0,
    PerformanceLevel.GOOD: 65.0,
    PerformanceLevel.AVERAGE: 50.0,
    PerformanceLevel.NEEDS_IMPROVEMENT: 0.0,
}


# ============================================================
# RESULT SUMMARY
# ============================================================

@dataclass
class ResultSummary:
    """Basic numerical summary of a quiz."""

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

    grade: Grade

    performance_level: PerformanceLevel

    def to_dict(self) -> Dict[str, Any]:
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
            "grade": self.grade.value,
            "performance_level": (
                self.performance_level.value
            ),
        }


# ============================================================
# PERFORMANCE ANALYSIS
# ============================================================

@dataclass
class PerformanceAnalysis:
    """Qualitative analysis of quiz performance."""

    strengths: List[str] = field(
        default_factory=list
    )

    areas_to_improve: List[str] = field(
        default_factory=list
    )

    feedback: str = ""

    recommendations: List[str] = field(
        default_factory=list
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "strengths": list(
                self.strengths
            ),
            "areas_to_improve": list(
                self.areas_to_improve
            ),
            "feedback": self.feedback,
            "recommendations": list(
                self.recommendations
            ),
        }


# ============================================================
# QUIZ RESULT
# ============================================================

@dataclass
class QuizResult:
    """Complete generated result for a quiz."""

    quiz_id: Optional[str]

    summary: ResultSummary

    analysis: PerformanceAnalysis

    question_scores: List[
        QuestionScore
    ] = field(
        default_factory=list
    )

    passed: bool = False

    generated_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "quiz_id": self.quiz_id,
            "summary": self.summary.to_dict(),
            "analysis": self.analysis.to_dict(),
            "question_scores": [
                score.to_dict()
                for score in self.question_scores
            ],
            "passed": self.passed,
            "generated_at": self.generated_at,
        }


# ============================================================
# RESULT GENERATOR
# ============================================================

class ResultGenerator:
    """
    Generates a complete result from QuizScore.
    """

    def __init__(
        self,
        passing_percentage: float = 40.0,
    ) -> None:

        try:
            self.passing_percentage = float(
                passing_percentage
            )

        except (
            TypeError,
            ValueError,
        ) as exc:

            raise ResultGenerationError(
                "Passing percentage must be numeric."
            ) from exc

        if not (
            0.0
            <= self.passing_percentage
            <= 100.0
        ):

            raise ResultGenerationError(
                "Passing percentage must be between "
                "0 and 100."
            )

    # ========================================================
    # MAIN RESULT GENERATION
    # ========================================================

    def generate_result(
        self,
        quiz_score: QuizScore,
        quiz_id: Optional[str] = None,
    ) -> QuizResult:
        """
        Generate a complete result from QuizScore.
        """

        self._validate_score(
            quiz_score
        )

        grade = self.calculate_grade(
            quiz_score.percentage
        )

        performance = (
            self.calculate_performance_level(
                quiz_score.percentage
            )
        )

        summary = ResultSummary(
            total_questions=(
                quiz_score.total_questions
            ),
            attempted=(
                quiz_score.attempted
            ),
            correct=(
                quiz_score.correct
            ),
            wrong=(
                quiz_score.wrong
            ),
            partial=(
                quiz_score.partial
            ),
            unanswered=(
                quiz_score.unanswered
            ),
            total_marks=(
                quiz_score.total_marks
            ),
            obtained_marks=(
                quiz_score.obtained_marks
            ),
            percentage=(
                quiz_score.percentage
            ),
            accuracy=(
                quiz_score.accuracy
            ),
            grade=grade,
            performance_level=performance,
        )

        analysis = (
            self.generate_performance_analysis(
                quiz_score
            )
        )

        passed = (
            quiz_score.percentage
            >= self.passing_percentage
        )

        from datetime import datetime

        return QuizResult(
            quiz_id=quiz_id,
            summary=summary,
            analysis=analysis,
            question_scores=(
                list(
                    quiz_score.question_scores
                )
            ),
            passed=passed,
            generated_at=(
                datetime.utcnow().isoformat()
            ),
        )

    # ========================================================
    # GRADE
    # ========================================================

    def calculate_grade(
        self,
        percentage: float,
    ) -> Grade:
        """Calculate academic grade."""

        percentage = self._normalize_percentage(
            percentage
        )

        for grade, threshold in (
            GRADE_THRESHOLDS.items()
        ):

            if percentage >= threshold:
                return grade

        return Grade.F

    # ========================================================
    # PERFORMANCE LEVEL
    # ========================================================

    def calculate_performance_level(
        self,
        percentage: float,
    ) -> PerformanceLevel:
        """Determine overall performance level."""

        percentage = self._normalize_percentage(
            percentage
        )

        for (
            level,
            threshold,
        ) in PERFORMANCE_THRESHOLDS.items():

            if percentage >= threshold:
                return level

        return PerformanceLevel.NEEDS_IMPROVEMENT

    # ========================================================
    # PERFORMANCE ANALYSIS
    # ========================================================

    def generate_performance_analysis(
        self,
        quiz_score: QuizScore,
    ) -> PerformanceAnalysis:
        """
        Generate strengths, weaknesses and feedback.
        """

        strengths: List[str] = []

        areas_to_improve: List[str] = []

        recommendations: List[str] = []

        # ----------------------------------------------------
        # Accuracy
        # ----------------------------------------------------

        if quiz_score.accuracy >= 90:

            strengths.append(
                "Excellent answer accuracy."
            )

        elif quiz_score.accuracy >= 75:

            strengths.append(
                "Good answer accuracy."
            )

        elif quiz_score.accuracy < 50:

            areas_to_improve.append(
                "Improve answer accuracy."
            )

        # ----------------------------------------------------
        # Attempt rate
        # ----------------------------------------------------

        attempt_rate = 0.0

        if quiz_score.total_questions > 0:

            attempt_rate = (
                quiz_score.attempted
                / quiz_score.total_questions
            ) * 100

        if attempt_rate >= 90:

            strengths.append(
                "You attempted almost all questions."
            )

        elif attempt_rate < 60:

            areas_to_improve.append(
                "Try to attempt more questions."
            )

            recommendations.append(
                "Manage your test time so you can "
                "review unanswered questions."
            )

        # ----------------------------------------------------
        # Correct answers
        # ----------------------------------------------------

        if quiz_score.total_questions > 0:

            correct_rate = (
                quiz_score.correct
                / quiz_score.total_questions
            ) * 100

        else:

            correct_rate = 0.0

        if correct_rate >= 80:

            strengths.append(
                "Strong understanding of the tested concepts."
            )

        elif correct_rate < 50:

            areas_to_improve.append(
                "Review the concepts behind incorrect answers."
            )

            recommendations.append(
                "Revise the relevant topics and practice "
                "similar questions."
            )

        # ----------------------------------------------------
        # Wrong answers
        # ----------------------------------------------------

        if quiz_score.wrong > 0:

            wrong_rate = (
                quiz_score.wrong
                / max(
                    quiz_score.attempted,
                    1,
                )
            ) * 100

            if wrong_rate >= 40:

                areas_to_improve.append(
                    "Reduce incorrect answers."
                )

                recommendations.append(
                    "Read each question carefully before "
                    "selecting an answer."
                )

        # ----------------------------------------------------
        # Unanswered
        # ----------------------------------------------------

        if quiz_score.unanswered > 0:

            recommendations.append(
                "Review unanswered questions before "
                "submitting when time permits."
            )

        # ----------------------------------------------------
        # Partial marks
        # ----------------------------------------------------

        if quiz_score.partial > 0:

            areas_to_improve.append(
                "Work on giving more complete answers "
                "to subjective questions."
            )

            recommendations.append(
                "Include important points, definitions "
                "and examples in descriptive answers."
            )

        # ----------------------------------------------------
        # Negative marking
        # ----------------------------------------------------

        negative_marks = sum(
            abs(
                score.marks_obtained
            )
            for score in (
                quiz_score.question_scores
            )
            if score.status
            == AnswerStatus.WRONG
            and score.marks_obtained < 0
        )

        if negative_marks > 0:

            recommendations.append(
                "Avoid guessing when negative marking "
                "makes an incorrect answer costly."
            )

        # ----------------------------------------------------
        # Overall feedback
        # ----------------------------------------------------

        performance = (
            self.calculate_performance_level(
                quiz_score.percentage
            )
        )

        feedback = self._generate_feedback(
            performance,
            quiz_score.percentage,
        )

        # ----------------------------------------------------
        # Ensure useful output.
        # ----------------------------------------------------

        if not strengths:

            strengths.append(
                "You completed the assessment."
            )

        if not areas_to_improve:

            areas_to_improve.append(
                "Continue practicing to maintain "
                "your performance."
            )

        return PerformanceAnalysis(
            strengths=self._unique(
                strengths
            ),
            areas_to_improve=self._unique(
                areas_to_improve
            ),
            feedback=feedback,
            recommendations=self._unique(
                recommendations
            ),
        )

    # ========================================================
    # FEEDBACK
    # ========================================================

    @staticmethod
    def _generate_feedback(
        performance: PerformanceLevel,
        percentage: float,
    ) -> str:
        """Generate concise overall feedback."""

        if performance == PerformanceLevel.EXCELLENT:

            return (
                f"Excellent performance with "
                f"{percentage:.2f}% score. "
                "Keep up the strong preparation."
            )

        if performance == PerformanceLevel.VERY_GOOD:

            return (
                f"Very good performance with "
                f"{percentage:.2f}% score. "
                "A little more practice can make "
                "your performance even stronger."
            )

        if performance == PerformanceLevel.GOOD:

            return (
                f"Good performance with "
                f"{percentage:.2f}% score. "
                "Review the questions you missed "
                "and continue practicing."
            )

        if performance == PerformanceLevel.AVERAGE:

            return (
                f"Average performance with "
                f"{percentage:.2f}% score. "
                "Focus on revising key concepts "
                "and solving more practice questions."
            )

        return (
            f"Your score is {percentage:.2f}%. "
            "Review the tested concepts and "
            "practice regularly to improve."
        )

    # ========================================================
    # QUESTION ANALYSIS
    # ========================================================

    @staticmethod
    def get_question_analysis(
        quiz_score: QuizScore,
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Group questions according to their result.
        """

        analysis = {
            "correct": [],
            "wrong": [],
            "partial": [],
            "unanswered": [],
        }

        for score in (
            quiz_score.question_scores
        ):

            status = score.status.value

            if status not in analysis:
                continue

            analysis[status].append(
                score.to_dict()
            )

        return analysis

    # ========================================================
    # DIFFICULTY ANALYSIS
    # ========================================================

    @staticmethod
    def get_difficulty_analysis(
        quiz_score: QuizScore,
    ) -> Dict[str, Dict[str, Any]]:
        """
        Generate performance statistics by difficulty.
        """

        result: Dict[
            str,
            Dict[str, Any],
        ] = {}

        for score in (
            quiz_score.question_scores
        ):

            difficulty = score.difficulty

            if difficulty is None:

                difficulty_name = "unknown"

            elif hasattr(
                difficulty,
                "value",
            ):

                difficulty_name = (
                    difficulty.value
                )

            else:

                difficulty_name = str(
                    difficulty
                )

            if difficulty_name not in result:

                result[
                    difficulty_name
                ] = {
                    "total": 0,
                    "correct": 0,
                    "wrong": 0,
                    "partial": 0,
                    "unanswered": 0,
                    "marks_obtained": 0.0,
                    "maximum_marks": 0.0,
                }

            data = result[
                difficulty_name
            ]

            data["total"] += 1

            data["marks_obtained"] += (
                score.marks_obtained
            )

            data["maximum_marks"] += (
                score.maximum_marks
            )

            if (
                score.status
                == AnswerStatus.CORRECT
            ):

                data["correct"] += 1

            elif (
                score.status
                == AnswerStatus.WRONG
            ):

                data["wrong"] += 1

            elif (
                score.status
                == AnswerStatus.PARTIAL
            ):

                data["partial"] += 1

            elif (
                score.status
                == AnswerStatus.UNANSWERED
            ):

                data["unanswered"] += 1

        # Calculate percentage for each difficulty.
        for data in result.values():

            maximum = data[
                "maximum_marks"
            ]

            if maximum > 0:

                data["percentage"] = round(
                    max(
                        0.0,
                        min(
                            (
                                data[
                                    "marks_obtained"
                                ]
                                / maximum
                            )
                            * 100,
                            100.0,
                        ),
                    ),
                    2,
                )

            else:

                data["percentage"] = 0.0

            data[
                "marks_obtained"
            ] = round(
                data["marks_obtained"],
                2,
            )

            data[
                "maximum_marks"
            ] = round(
                data["maximum_marks"],
                2,
            )

        return result

    # ========================================================
    # VALIDATION
    # ========================================================

    @staticmethod
    def _validate_score(
        quiz_score: QuizScore,
    ) -> None:
        """Validate QuizScore before generating result."""

        if not isinstance(
            quiz_score,
            QuizScore,
        ):

            raise InvalidQuizScoreError(
                "quiz_score must be a QuizScore object."
            )

        if quiz_score.total_questions < 0:

            raise InvalidQuizScoreError(
                "Total questions cannot be negative."
            )

        if quiz_score.attempted < 0:

            raise InvalidQuizScoreError(
                "Attempted count cannot be negative."
            )

        if quiz_score.correct < 0:

            raise InvalidQuizScoreError(
                "Correct count cannot be negative."
            )

        if quiz_score.wrong < 0:

            raise InvalidQuizScoreError(
                "Wrong count cannot be negative."
            )

        if quiz_score.partial < 0:

            raise InvalidQuizScoreError(
                "Partial count cannot be negative."
            )

        if quiz_score.unanswered < 0:

            raise InvalidQuizScoreError(
                "Unanswered count cannot be negative."
            )

        if quiz_score.total_marks < 0:

            raise InvalidQuizScoreError(
                "Total marks cannot be negative."
            )

        if not (
            0.0
            <= quiz_score.percentage
            <= 100.0
        ):

            raise InvalidQuizScoreError(
                "Percentage must be between 0 and 100."
            )

        if not (
            0.0
            <= quiz_score.accuracy
            <= 100.0
        ):

            raise InvalidQuizScoreError(
                "Accuracy must be between 0 and 100."
            )

    # ========================================================
    # HELPERS
    # ========================================================

    @staticmethod
    def _normalize_percentage(
        percentage: float,
    ) -> float:

        try:

            percentage = float(
                percentage
            )

        except (
            TypeError,
            ValueError,
        ) as exc:

            raise ResultGenerationError(
                "Percentage must be numeric."
            ) from exc

        return max(
            0.0,
            min(
                percentage,
                100.0,
            ),
        )

    @staticmethod
    def _unique(
        values: List[str],
    ) -> List[str]:

        seen = set()

        result = []

        for value in values:

            if value not in seen:

                seen.add(value)

                result.append(value)

        return result


# ============================================================
# CONVENIENCE FUNCTION
# ============================================================

def generate_quiz_result(
    quiz_score: QuizScore,
    quiz_id: Optional[str] = None,
    passing_percentage: float = 40.0,
) -> QuizResult:
    """
    Convenience function for generating a quiz result.
    """

    generator = ResultGenerator(
        passing_percentage=passing_percentage
    )

    return generator.generate_result(
        quiz_score=quiz_score,
        quiz_id=quiz_id,
    )
