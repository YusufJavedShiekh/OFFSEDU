"""
StudyGemma - Quiz Test Engine

Responsibilities:
- Create and manage quiz sessions
- Start quizzes
- Track answers
- Track current question
- Handle navigation
- Mark questions for review
- Manage quiz timer
- Pause/resume quiz
- Submit quiz
- Automatically handle time-up

This module does NOT:
- Generate questions
- Score answers
- Generate final results
- Save results to database
"""

from __future__ import annotations

import time
import uuid

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from threading import RLock
from typing import Any, Dict, List, Mapping, Optional

from quiz.question_types import (
    Question,
    QuizConfiguration,
)


# ============================================================
# ENUMS
# ============================================================

class QuizStatus(str, Enum):
    """Possible states of a quiz session."""

    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    SUBMITTED = "submitted"
    TIME_UP = "time_up"
    CANCELLED = "cancelled"


# ============================================================
# EXCEPTIONS
# ============================================================

class TestEngineError(Exception):
    """Base exception for test engine errors."""


class QuizNotFoundError(TestEngineError):
    """Raised when a quiz session cannot be found."""


class InvalidQuizStateError(TestEngineError):
    """Raised when an operation is invalid for the current state."""


class InvalidQuestionError(TestEngineError):
    """Raised when a question is invalid."""


class InvalidAnswerError(TestEngineError):
    """Raised when an answer is invalid."""


class TimerError(TestEngineError):
    """Raised when a timer operation fails."""


# ============================================================
# QUIZ SESSION
# ============================================================

@dataclass
class QuizSession:
    """
    Represents one student's active quiz session.
    """

    quiz_id: str
    questions: List[Question]
    duration: int
    status: QuizStatus = QuizStatus.NOT_STARTED

    answers: Dict[str, Any] = field(
        default_factory=dict
    )

    current_question_index: int = 0

    marked_for_review: set[str] = field(
        default_factory=set
    )

    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    paused_at: Optional[datetime] = None

    elapsed_before_pause: float = 0.0

    created_at: datetime = field(
        default_factory=datetime.utcnow
    )

    updated_at: datetime = field(
        default_factory=datetime.utcnow
    )

    # Internal monotonic timer.
    _started_monotonic: Optional[float] = field(
        default=None,
        repr=False,
    )

    # --------------------------------------------------------
    # Properties
    # --------------------------------------------------------

    @property
    def total_questions(self) -> int:
        return len(self.questions)

    @property
    def current_question(self) -> Optional[Question]:
        if not self.questions:
            return None

        if not (
            0 <= self.current_question_index
            < len(self.questions)
        ):
            return None

        return self.questions[
            self.current_question_index
        ]

    @property
    def answered_count(self) -> int:
        question_ids = {
            question.id
            for question in self.questions
        }

        return sum(
            1
            for question_id in self.answers
            if question_id in question_ids
        )

    @property
    def unanswered_count(self) -> int:
        return max(
            0,
            self.total_questions
            - self.answered_count,
        )

    @property
    def review_count(self) -> int:
        return len(
            self.marked_for_review
        )

    # --------------------------------------------------------
    # Serialization
    # --------------------------------------------------------

    def to_dict(
        self,
        include_answers: bool = True,
        include_correct_answers: bool = False,
    ) -> Dict[str, Any]:
        """
        Convert the session into an API-friendly dictionary.

        Correct answers are excluded by default so they are not
        accidentally exposed to the frontend during a test.
        """

        question_data = []

        for question in self.questions:
            data = {
                "id": question.id,
                "text": question.text,
                "type": question.type.value,
                "options": list(question.options),
                "marks": question.marks,
                "difficulty": question.difficulty.value,
                "explanation": (
                    question.explanation
                    if self.status
                    in {
                        QuizStatus.SUBMITTED,
                        QuizStatus.TIME_UP,
                    }
                    else None
                ),
                "metadata": dict(
                    question.metadata
                ),
            }

            if include_correct_answers:
                data["correct_answer"] = (
                    question.correct_answer
                )

            question_data.append(data)

        result = {
            "quiz_id": self.quiz_id,
            "questions": question_data,
            "duration": self.duration,
            "status": self.status.value,
            "current_question_index": (
                self.current_question_index
            ),
            "answered_count": self.answered_count,
            "unanswered_count": self.unanswered_count,
            "marked_for_review": list(
                self.marked_for_review
            ),
            "started_at": (
                self.started_at.isoformat()
                if self.started_at
                else None
            ),
            "submitted_at": (
                self.submitted_at.isoformat()
                if self.submitted_at
                else None
            ),
            "paused_at": (
                self.paused_at.isoformat()
                if self.paused_at
                else None
            ),
            "created_at": (
                self.created_at.isoformat()
            ),
            "updated_at": (
                self.updated_at.isoformat()
            ),
        }

        if include_answers:
            result["answers"] = dict(
                self.answers
            )

        return result


# ============================================================
# TEST ENGINE
# ============================================================

class TestEngine:
    """
    Manages the lifecycle of quiz sessions.

    Storage is currently in-memory. Database persistence can
    be added later through quiz_repository.py.
    """

    DEFAULT_DURATION = 600

    def __init__(self) -> None:
        self._sessions: Dict[
            str,
            QuizSession,
        ] = {}

        self._lock = RLock()

    # ========================================================
    # CREATE QUIZ
    # ========================================================

    def create_quiz(
        self,
        questions: List[Question],
        duration: Optional[int] = None,
        configuration: Optional[
            QuizConfiguration | Mapping[str, Any]
        ] = None,
        quiz_id: Optional[str] = None,
    ) -> QuizSession:
        """
        Create a new quiz session.
        """

        if not isinstance(
            questions,
            (list, tuple),
        ):
            raise InvalidQuestionError(
                "Questions must be provided as a list."
            )

        if not questions:
            raise InvalidQuestionError(
                "A quiz must contain at least one question."
            )

        validated_questions: List[Question] = []
        seen_question_ids = set()

        # ----------------------------------------------------
        # Validate questions.
        # ----------------------------------------------------

        for question in questions:

            if isinstance(
                question,
                Mapping,
            ):
                try:
                    question = Question.from_dict(
                        question
                    )
                except Exception as exc:
                    raise InvalidQuestionError(
                        "Invalid question data."
                    ) from exc

            if not isinstance(
                question,
                Question,
            ):
                raise InvalidQuestionError(
                    "Every quiz question must be a "
                    "Question object."
                )

            try:
                question.validate()
            except Exception as exc:
                raise InvalidQuestionError(
                    f"Invalid question: {question.id}"
                ) from exc

            question_id = str(
                question.id
            ).strip()

            if not question_id:
                raise InvalidQuestionError(
                    "Question ID cannot be empty."
                )

            if question_id in seen_question_ids:
                raise InvalidQuestionError(
                    f"Duplicate question ID: "
                    f"{question_id}"
                )

            seen_question_ids.add(
                question_id
            )

            validated_questions.append(
                question
            )

        # ----------------------------------------------------
        # Normalize configuration.
        # ----------------------------------------------------

        if configuration is not None:

            if not isinstance(
                configuration,
                QuizConfiguration,
            ):

                if not isinstance(
                    configuration,
                    Mapping,
                ):
                    raise TimerError(
                        "Invalid quiz configuration."
                    )

                try:
                    configuration = (
                        QuizConfiguration.from_dict(
                            configuration
                        )
                    )
                except Exception as exc:
                    raise TimerError(
                        "Invalid quiz configuration."
                    ) from exc

            if duration is None:
                duration = configuration.time_limit

        # ----------------------------------------------------
        # Determine duration.
        # ----------------------------------------------------

        if duration is None:
            duration = self.DEFAULT_DURATION

        try:
            duration = int(duration)
        except (
            TypeError,
            ValueError,
        ) as exc:
            raise TimerError(
                "Quiz duration must be an integer."
            ) from exc

        if duration <= 0:
            raise TimerError(
                "Quiz duration must be greater than zero."
            )

        # ----------------------------------------------------
        # Create session ID.
        # ----------------------------------------------------

        if quiz_id is not None:
            session_id = str(
                quiz_id
            ).strip()

            if not session_id:
                raise TestEngineError(
                    "Quiz ID cannot be empty."
                )
        else:
            session_id = str(
                uuid.uuid4()
            )

        # ----------------------------------------------------
        # Create session.
        # ----------------------------------------------------

        session = QuizSession(
            quiz_id=session_id,
            questions=validated_questions,
            duration=duration,
        )

        with self._lock:

            if session_id in self._sessions:
                raise TestEngineError(
                    f"Quiz ID already exists: "
                    f"{session_id}"
                )

            self._sessions[
                session_id
            ] = session

        return session

    # ========================================================
    # START
    # ========================================================

    def start_quiz(
        self,
        quiz_id: str,
    ) -> QuizSession:
        """Start a quiz session."""

        session = self._get_session(
            quiz_id
        )

        with self._lock:

            if session.status == QuizStatus.IN_PROGRESS:
                return session

            if session.status != QuizStatus.NOT_STARTED:
                raise InvalidQuizStateError(
                    "Only a not-started quiz can be started."
                )

            now = self._now()

            session.status = (
                QuizStatus.IN_PROGRESS
            )

            session.started_at = now

            session._started_monotonic = (
                time.monotonic()
            )

            session.updated_at = now

        return session

    # ========================================================
    # GET QUIZ
    # ========================================================

    def get_quiz(
        self,
        quiz_id: str,
    ) -> QuizSession:
        """
        Return a quiz session and process time-up.
        """

        session = self._get_session(
            quiz_id
        )

        if session.status == QuizStatus.IN_PROGRESS:

            remaining = self.get_remaining_time(
                quiz_id
            )

            if remaining <= 0:
                session = self.handle_time_up(
                    quiz_id
                )

        elif session.status == QuizStatus.PAUSED:

            remaining = self.get_remaining_time(
                quiz_id
            )

            if remaining <= 0:
                session = self.handle_time_up(
                    quiz_id
                )

        return session

    # ========================================================
    # ANSWERS
    # ========================================================

    def submit_answer(
        self,
        quiz_id: str,
        question_id: str,
        answer: Any,
    ) -> QuizSession:
        """
        Save or update an answer for a question.
        """

        session = self.get_quiz(
            quiz_id
        )

        with self._lock:

            self._ensure_in_progress(
                session
            )

            question = self._find_question(
                session,
                question_id,
            )

            if answer is None:
                raise InvalidAnswerError(
                    "Answer cannot be None."
                )

            if (
                isinstance(answer, str)
                and not answer.strip()
            ):
                session.answers.pop(
                    question.id,
                    None,
                )
            else:
                answer = self._validate_answer(
                    question,
                    answer,
                )

                session.answers[
                    question.id
                ] = answer

            session.updated_at = (
                self._now()
            )

        return session

    def clear_answer(
        self,
        quiz_id: str,
        question_id: str,
    ) -> QuizSession:
        """Remove a student's answer."""

        session = self.get_quiz(
            quiz_id
        )

        with self._lock:

            self._ensure_in_progress(
                session
            )

            question = self._find_question(
                session,
                question_id,
            )

            session.answers.pop(
                question.id,
                None,
            )

            session.updated_at = (
                self._now()
            )

        return session

    def get_answer(
        self,
        quiz_id: str,
        question_id: str,
    ) -> Any:
        """Get the student's answer."""

        session = self.get_quiz(
            quiz_id
        )

        question = self._find_question(
            session,
            question_id,
        )

        return session.answers.get(
            question.id
        )

    # ========================================================
    # NAVIGATION
    # ========================================================

    def next_question(
        self,
        quiz_id: str,
    ) -> QuizSession:
        """Move to the next question."""

        session = self.get_quiz(
            quiz_id
        )

        with self._lock:

            self._ensure_in_progress(
                session
            )

            if (
                session.current_question_index
                < session.total_questions - 1
            ):
                session.current_question_index += 1

            session.updated_at = (
                self._now()
            )

        return session

    def previous_question(
        self,
        quiz_id: str,
    ) -> QuizSession:
        """Move to the previous question."""

        session = self.get_quiz(
            quiz_id
        )

        with self._lock:

            self._ensure_in_progress(
                session
            )

            if (
                session.current_question_index
                > 0
            ):
                session.current_question_index -= 1

            session.updated_at = (
                self._now()
            )

        return session

    def go_to_question(
        self,
        quiz_id: str,
        question_index: int,
    ) -> QuizSession:
        """Move directly to a question index."""

        session = self.get_quiz(
            quiz_id
        )

        with self._lock:

            self._ensure_in_progress(
                session
            )

            try:
                question_index = int(
                    question_index
                )
            except (
                TypeError,
                ValueError,
            ) as exc:
                raise InvalidQuestionError(
                    "Question index must be an integer."
                ) from exc

            if not (
                0 <= question_index
                < session.total_questions
            ):
                raise InvalidQuestionError(
                    "Question index is out of range."
                )

            session.current_question_index = (
                question_index
            )

            session.updated_at = (
                self._now()
            )

        return session

    # ========================================================
    # REVIEW
    # ========================================================

    def mark_for_review(
        self,
        quiz_id: str,
        question_id: str,
    ) -> QuizSession:
        """Mark a question for review."""

        session = self.get_quiz(
            quiz_id
        )

        with self._lock:

            self._ensure_in_progress(
                session
            )

            question = self._find_question(
                session,
                question_id,
            )

            session.marked_for_review.add(
                question.id
            )

            session.updated_at = (
                self._now()
            )

        return session

    def unmark_for_review(
        self,
        quiz_id: str,
        question_id: str,
    ) -> QuizSession:
        """Remove review mark."""

        session = self.get_quiz(
            quiz_id
        )

        with self._lock:

            self._ensure_in_progress(
                session
            )

            question = self._find_question(
                session,
                question_id,
            )

            session.marked_for_review.discard(
                question.id
            )

            session.updated_at = (
                self._now()
            )

        return session

    # ========================================================
    # TIMER
    # ========================================================

    def get_remaining_time(
        self,
        quiz_id: str,
    ) -> int:
        """
        Return remaining time in seconds.

        Timer uses monotonic time so system clock changes do
        not incorrectly affect the countdown.
        """

        session = self._get_session(
            quiz_id
        )

        with self._lock:

            if session.status == QuizStatus.NOT_STARTED:
                return session.duration

            if session.status in {
                QuizStatus.SUBMITTED,
                QuizStatus.TIME_UP,
                QuizStatus.CANCELLED,
            }:
                return 0

            if session.status == QuizStatus.PAUSED:
                elapsed = (
                    session.elapsed_before_pause
                )

                return max(
                    0,
                    int(
                        session.duration
                        - elapsed
                    ),
                )

            if session.status == QuizStatus.IN_PROGRESS:

                if (
                    session._started_monotonic
                    is None
                ):
                    raise TimerError(
                        "Quiz timer is not initialized."
                    )

                elapsed = (
                    session.elapsed_before_pause
                    + (
                        time.monotonic()
                        - session._started_monotonic
                    )
                )

                remaining = max(
                    0,
                    int(
                        session.duration
                        - elapsed
                    ),
                )

                return remaining

            raise TimerError(
                "Unable to determine quiz timer state."
            )

    # ========================================================
    # PAUSE
    # ========================================================

    def pause_quiz(
        self,
        quiz_id: str,
    ) -> QuizSession:
        """Pause an active quiz."""

        session = self.get_quiz(
            quiz_id
        )

        with self._lock:

            self._ensure_in_progress(
                session
            )

            if session._started_monotonic is None:
                raise TimerError(
                    "Quiz timer has not been initialized."
                )

            session.elapsed_before_pause += (
                time.monotonic()
                - session._started_monotonic
            )

            session._started_monotonic = None

            now = self._now()

            session.paused_at = now

            session.status = (
                QuizStatus.PAUSED
            )

            session.updated_at = now

        # Handle a timer that expired exactly while pausing.
        if self.get_remaining_time(quiz_id) <= 0:
            return self.handle_time_up(
                quiz_id
            )

        return session

    # ========================================================
    # RESUME
    # ========================================================

    def resume_quiz(
        self,
        quiz_id: str,
    ) -> QuizSession:
        """Resume a paused quiz."""

        session = self._get_session(
            quiz_id
        )

        with self._lock:

            if session.status != QuizStatus.PAUSED:
                raise InvalidQuizStateError(
                    "Only a paused quiz can be resumed."
                )

            elapsed = (
                session.elapsed_before_pause
            )

            if elapsed >= session.duration:

                now = self._now()

                session.status = (
                    QuizStatus.TIME_UP
                )

                session.submitted_at = now
                session.updated_at = now

                return session

            session.status = (
                QuizStatus.IN_PROGRESS
            )

            session._started_monotonic = (
                time.monotonic()
            )

            session.paused_at = None
            session.updated_at = (
                self._now()
            )

        return session

    # ========================================================
    # SUBMIT
    # ========================================================

    def submit_quiz(
        self,
        quiz_id: str,
    ) -> QuizSession:
        """Submit the quiz manually."""

        session = self.get_quiz(
            quiz_id
        )

        with self._lock:

            if session.status not in {
                QuizStatus.IN_PROGRESS,
                QuizStatus.PAUSED,
            }:
                raise InvalidQuizStateError(
                    "Quiz cannot be submitted in its "
                    "current state."
                )

            if (
                session.status
                == QuizStatus.IN_PROGRESS
                and session._started_monotonic
                is not None
            ):
                session.elapsed_before_pause += (
                    time.monotonic()
                    - session._started_monotonic
                )

            session._started_monotonic = None

            now = self._now()

            session.status = (
                QuizStatus.SUBMITTED
            )

            session.submitted_at = now
            session.updated_at = now

        return session

    # ========================================================
    # TIME UP
    # ========================================================

    def handle_time_up(
        self,
        quiz_id: str,
    ) -> QuizSession:
        """Automatically submit a quiz when time expires."""

        session = self._get_session(
            quiz_id
        )

        with self._lock:

            if session.status in {
                QuizStatus.SUBMITTED,
                QuizStatus.TIME_UP,
                QuizStatus.CANCELLED,
            }:
                return session

            if session.status not in {
                QuizStatus.IN_PROGRESS,
                QuizStatus.PAUSED,
            }:
                raise InvalidQuizStateError(
                    "Quiz timer cannot expire in the "
                    "current state."
                )

            if (
                session.status
                == QuizStatus.IN_PROGRESS
                and session._started_monotonic
                is not None
            ):
                session.elapsed_before_pause += (
                    time.monotonic()
                    - session._started_monotonic
                )

            session._started_monotonic = None

            session.elapsed_before_pause = max(
                session.elapsed_before_pause,
                float(session.duration),
            )

            now = self._now()

            session.status = (
                QuizStatus.TIME_UP
            )

            session.submitted_at = now
            session.updated_at = now

        return session

    # ========================================================
    # CANCEL
    # ========================================================

    def cancel_quiz(
        self,
        quiz_id: str,
    ) -> QuizSession:
        """Cancel a quiz session."""

        session = self._get_session(
            quiz_id
        )

        with self._lock:

            if session.status in {
                QuizStatus.SUBMITTED,
                QuizStatus.TIME_UP,
            }:
                raise InvalidQuizStateError(
                    "A submitted or expired quiz "
                    "cannot be cancelled."
                )

            session._started_monotonic = None

            session.status = (
                QuizStatus.CANCELLED
            )

            session.updated_at = (
                self._now()
            )

        return session

    # ========================================================
    # SUMMARY
    # ========================================================

    def get_summary(
        self,
        quiz_id: str,
    ) -> Dict[str, Any]:
        """Return current quiz progress."""

        session = self.get_quiz(
            quiz_id
        )

        return {
            "quiz_id": session.quiz_id,
            "status": session.status.value,
            "total_questions": (
                session.total_questions
            ),
            "answered": (
                session.answered_count
            ),
            "unanswered": (
                session.unanswered_count
            ),
            "marked_for_review": (
                session.review_count
            ),
            "current_question": (
                session.current_question_index + 1
                if session.current_question
                else None
            ),
            "remaining_time": (
                self.get_remaining_time(
                    quiz_id
                )
            ),
        }

    # ========================================================
    # SESSION MANAGEMENT
    # ========================================================

    def delete_quiz(
        self,
        quiz_id: str,
    ) -> None:
        """Delete a quiz session from memory."""

        if quiz_id is None:
            raise QuizNotFoundError(
                "Quiz ID cannot be empty."
            )

        quiz_id = str(
            quiz_id
        ).strip()

        if not quiz_id:
            raise QuizNotFoundError(
                "Quiz ID cannot be empty."
            )

        with self._lock:

            if quiz_id not in self._sessions:
                raise QuizNotFoundError(
                    f"Quiz not found: {quiz_id}"
                )

            del self._sessions[
                quiz_id
            ]

    def list_quizzes(
        self,
    ) -> List[QuizSession]:
        """Return a snapshot of all quiz sessions."""

        with self._lock:
            return list(
                self._sessions.values()
            )

    # ========================================================
    # ANSWER VALIDATION
    # ========================================================

    def _validate_answer(
        self,
        question: Question,
        answer: Any,
    ) -> Any:
        """
        Validate an answer against the question type.

        MCQ answers must match one of the available options.
        True/False answers are normalized to True or False.
        Subjective answers are accepted as non-empty values
        and can be evaluated later by the scoring system.
        """

        if answer is None:
            raise InvalidAnswerError(
                "Answer cannot be None."
            )

        if isinstance(answer, str):
            answer = answer.strip()

        question_type = (
            question.type.value
            if hasattr(question.type, "value")
            else str(question.type).lower()
        )

        # ----------------------------------------------------
        # Multiple Choice
        # ----------------------------------------------------

        if question_type == "mcq":

            if not question.options:
                raise InvalidAnswerError(
                    "MCQ question has no available options."
                )

            if answer not in question.options:
                raise InvalidAnswerError(
                    "Answer must match one of the "
                    "question options."
                )

            return answer

        # ----------------------------------------------------
        # True / False
        # ----------------------------------------------------

        if question_type == "true_false":

            normalized = str(
                answer
            ).strip().lower()

            if normalized not in {
                "true",
                "false",
            }:
                raise InvalidAnswerError(
                    "True/False answers must be "
                    "True or False."
                )

            return (
                "True"
                if normalized == "true"
                else "False"
            )

        # ----------------------------------------------------
        # Subjective Questions
        # ----------------------------------------------------

        if question_type in {
            "short_answer",
            "long_answer",
        }:

            if isinstance(
                answer,
                str,
            ) and not answer:

                raise InvalidAnswerError(
                    "Answer cannot be empty."
                )

            return answer

        # ----------------------------------------------------
        # Unknown question type
        # ----------------------------------------------------

        raise InvalidAnswerError(
            f"Unsupported question type: "
            f"{question_type}"
        )

    # ========================================================
    # INTERNAL HELPERS
    # ========================================================

    @staticmethod
    def _now() -> datetime:
        """Return the current UTC datetime."""

        return datetime.utcnow()

    def _get_session(
        self,
        quiz_id: str,
    ) -> QuizSession:
        """Return a session or raise QuizNotFoundError."""

        if quiz_id is None:
            raise QuizNotFoundError(
                "Quiz ID cannot be empty."
            )

        normalized_id = str(
            quiz_id
        ).strip()

        if not normalized_id:
            raise QuizNotFoundError(
                "Quiz ID cannot be empty."
            )

        with self._lock:

            session = self._sessions.get(
                normalized_id
            )

        if session is None:
            raise QuizNotFoundError(
                f"Quiz not found: {normalized_id}"
            )

        return session

    def _ensure_in_progress(
        self,
        session: QuizSession,
    ) -> None:
        """Ensure the quiz is currently active."""

        if session.status != QuizStatus.IN_PROGRESS:
            raise InvalidQuizStateError(
                "This operation requires an "
                "in-progress quiz."
            )

    def _find_question(
        self,
        session: QuizSession,
        question_id: str,
    ) -> Question:
        """Find a question by ID."""

        if question_id is None:
            raise InvalidQuestionError(
                "Question ID cannot be empty."
            )

        normalized_id = str(
            question_id
        ).strip()

        if not normalized_id:
            raise InvalidQuestionError(
                "Question ID cannot be empty."
            )

        for question in session.questions:

            if str(
                question.id
            ).strip() == normalized_id:
                return question

        raise InvalidQuestionError(
            f"Question not found: {normalized_id}"
        )


# ============================================================
# CONVENIENCE FACTORY
# ============================================================

def create_test_engine() -> TestEngine:
    """Create a new TestEngine instance."""

    return TestEngine()