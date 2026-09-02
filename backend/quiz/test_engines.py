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
    QuestionType,
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
        return sum(
            1
            for question in self.questions
            if question.id in self.answers
        )

    @property
    def unanswered_count(self) -> int:
        return (
            self.total_questions
            - self.answered_count
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
                "options": list(
                    question.options
                ),
                "marks": question.marks,
                "difficulty": (
                    question.difficulty.value
                ),
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
            "answered_count": (
                self.answered_count
            ),
            "unanswered_count": (
                self.unanswered_count
            ),
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
            QuizConfiguration
        ] = None,
        quiz_id: Optional[str] = None,
    ) -> QuizSession:
        """
        Create a new quiz session.

        Args:
            questions:
                List of Question objects.

            duration:
                Quiz duration in seconds.

            configuration:
                Optional QuizConfiguration.

            quiz_id:
                Optional custom quiz ID.
        """

        if not isinstance(
            questions,
            list,
        ):
            raise InvalidQuestionError(
                "Questions must be provided as a list."
            )

        if not questions:
            raise InvalidQuestionError(
                "A quiz must contain at least one question."
            )

        validated_questions: List[Question] = []

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

            validated_questions.append(
                question
            )

        # ----------------------------------------------------
        # Determine duration.
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

            if duration is None:
                duration = (
                    configuration.time_limit
                )

        if duration is None:
            duration = 600

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
        # Create session.
        # ----------------------------------------------------

        session_id = (
            str(quiz_id)
            if quiz_id
            else str(uuid.uuid4())
        )

        session = QuizSession(
            quiz_id=session_id,
            questions=validated_questions,
            duration=duration,
        )

        with self._lock:

            if session_id in self._sessions:
                raise TestEngineError(
                    f"Quiz ID already exists: {session_id}"
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

            session.status = (
                QuizStatus.IN_PROGRESS
            )

            session.started_at = (
                datetime.utcnow()
            )

            session._started_monotonic = (
                time.monotonic()
            )

            session.updated_at = (
                datetime.utcnow()
            )

        return session

    # ========================================================
    # GET QUIZ
    # ========================================================

    def get_quiz(
        self,
        quiz_id: str,
    ) -> QuizSession:
        """Return a quiz session."""

        session = self._get_session(
            quiz_id
        )

        # Automatically process time-up.
        if session.status == QuizStatus.IN_PROGRESS:

            remaining = (
                self.get_remaining_time(
                    quiz_id
                )
            )

            if remaining <= 0:

                self.handle_time_up(
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
        Save/update an answer for a question.
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

            # Convert empty strings to unanswered.
            if isinstance(
                answer,
                str,
            ) and not answer.strip():

                session.answers.pop(
                    question_id,
                    None,
                )

            else:

                session.answers[
                    question_id
                ] = answer

            session.updated_at = (
                datetime.utcnow()
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

            self._find_question(
                session,
                question_id,
            )

            session.answers.pop(
                question_id,
                None,
            )

            session.updated_at = (
                datetime.utcnow()
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

        self._find_question(
            session,
            question_id,
        )

        return session.answers.get(
            question_id
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
                datetime.utcnow()
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
                datetime.utcnow()
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
                datetime.utcnow()
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

            self._find_question(
                session,
                question_id,
            )

            session.marked_for_review.add(
                question_id
            )

            session.updated_at = (
                datetime.utcnow()
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

            self._find_question(
                session,
                question_id,
            )

            session.marked_for_review.discard(
                question_id
            )

            session.updated_at = (
                datetime.utcnow()
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

            if session.status == (
                QuizStatus.NOT_STARTED
            ):
                return session.duration

            if session.status in {
                QuizStatus.SUBMITTED,
                QuizStatus.TIME_UP,
                QuizStatus.CANCELLED,
            }:

                return 0

            # ------------------------------------------------
            # Paused state.
            # ------------------------------------------------

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

            # ------------------------------------------------
            # In-progress state.
            # ------------------------------------------------

            if (
                session.status
                == QuizStatus.IN_PROGRESS
                and session._started_monotonic
                is not None
            ):

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

                if remaining <= 0:
                    # Do not recursively call handle_time_up
                    # while holding the lock.
                    pass

                return remaining

            return session.duration

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

            if (
                session._started_monotonic
                is None
            ):
                raise TimerError(
                    "Quiz timer has not been initialized."
                )

            session.elapsed_before_pause += (
                time.monotonic()
                - session._started_monotonic
            )

            session._started_monotonic = None

            session.paused_at = (
                datetime.utcnow()
            )

            session.status = (
                QuizStatus.PAUSED
            )

            session.updated_at = (
                datetime.utcnow()
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

            remaining = max(
                0,
                int(
                    session.duration
                    - session.elapsed_before_pause
                ),
            )

            if remaining <= 0:

                session.status = (
                    QuizStatus.TIME_UP
                )

                session.submitted_at = (
                    datetime.utcnow()
                )

                session.updated_at = (
                    datetime.utcnow()
                )

                return session

            session.status = (
                QuizStatus.IN_PROGRESS
            )

            session._started_monotonic = (
                time.monotonic()
            )

            session.paused_at = None

            session.updated_at = (
                datetime.utcnow()
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

            session.status = (
                QuizStatus.SUBMITTED
            )

            session.submitted_at = (
                datetime.utcnow()
            )

            session.updated_at = (
                datetime.utcnow()
            )

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

            session._started_monotonic = None

            session.status = (
                QuizStatus.TIME_UP
            )

            session.submitted_at = (
                datetime.utcnow()
            )

            session.updated_at = (
                datetime.utcnow()
            )

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
                    "A submitted quiz cannot be cancelled."
                )

            session._started_monotonic = None

            session.status = (
                QuizStatus.CANCELLED
            )

            session.updated_at = (
                datetime.utcnow()
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
        """Return all quiz sessions."""

        with self._lock:
            return list(
                self._sessions.values()
            )

    # ========================================================
    # INTERNAL HELPERS
    # ========================================================

    def _get_session(
        self,
        quiz_id: str,
    ) -> QuizSession:

        if not quiz_id:
            raise QuizNotFoundError(
                "Quiz ID cannot be empty."
            )

        with self._lock:

            session = self._sessions.get(
                str(quiz_id)
            )

        if session is None:
            raise QuizNotFoundError(
                f"Quiz not found: {quiz_id}"
            )

        return session

    def _ensure_in_progress(
        self,
        session: QuizSession,
    ) -> None:

        if session.status != (
            QuizStatus.IN_PROGRESS
        ):

            raise InvalidQuizStateError(
                "This operation requires an "
                "in-progress quiz."
            )

    def _find_question(
        self,
        session: QuizSession,
        question_id: str,
    ) -> Question:

        for question in session.questions:

            if question.id == question_id:
                return question

        raise InvalidQuestionError(
            f"Question not found: {question_id}"
        )


# ============================================================
# CONVENIENCE FACTORY
# ============================================================

def create_test_engine() -> TestEngine:
    """Create a new TestEngine instance."""

    return TestEngine()
