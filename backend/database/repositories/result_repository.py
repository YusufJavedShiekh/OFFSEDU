from datetime import datetime

from sqlalchemy.orm import Session

from database.models import (
    QuizAttempt,
    QuizAnswer,
)


# =========================================================
# CREATE QUIZ ATTEMPT
# =========================================================

def create_quiz_attempt(
    db: Session,
    quiz_id: int,
    user_id: int | None,
    total_marks: float,
):
    attempt = QuizAttempt(
        quiz_id=quiz_id,
        user_id=user_id,
        total_marks=total_marks,
        score=0,
        percentage=0,
        completed=False,
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return attempt


# =========================================================
# SAVE QUIZ ANSWER
# =========================================================

def save_quiz_answer(
    db: Session,
    attempt_id: int,
    question_id: int,
    answer: str | None,
    marks_awarded: float = 0,
    is_correct: bool = False,
    feedback: str | None = None,
):
    quiz_answer = QuizAnswer(
        attempt_id=attempt_id,
        question_id=question_id,
        answer=answer,
        marks_awarded=marks_awarded,
        is_correct=is_correct,
        feedback=feedback,
    )

    db.add(quiz_answer)
    db.commit()
    db.refresh(quiz_answer)

    return quiz_answer


# =========================================================
# COMPLETE QUIZ ATTEMPT
# =========================================================

def complete_quiz_attempt(
    db: Session,
    attempt_id: int,
):
    attempt = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.id == attempt_id
        )
        .first()
    )

    if not attempt:
        return None

    answers = (
        db.query(QuizAnswer)
        .filter(
            QuizAnswer.attempt_id == attempt_id
        )
        .all()
    )

    score = sum(
        answer.marks_awarded
        for answer in answers
    )

    attempt.score = score

    if attempt.total_marks > 0:

        attempt.percentage = (
            score /
            attempt.total_marks
        ) * 100

    else:

        attempt.percentage = 0

    attempt.completed = True

    attempt.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(attempt)

    return attempt


# =========================================================
# GET QUIZ RESULT
# =========================================================

def get_quiz_result(
    db: Session,
    attempt_id: int,
):
    return (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.id == attempt_id
        )
        .first()
    )


# =========================================================
# GET USER RESULTS
# =========================================================

def get_user_quiz_results(
    db: Session,
    user_id: int,
):
    return (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.user_id == user_id
        )
        .order_by(
            QuizAttempt.started_at.desc()
        )
        .all()
    )
