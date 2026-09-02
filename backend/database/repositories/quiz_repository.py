from sqlalchemy.orm import Session

from database.models import (
    Quiz,
    Question,
)


# =========================================================
# CREATE QUIZ
# =========================================================

def create_quiz(
    db: Session,
    user_id: int | None,
    title: str,
    question_type: str,
    number_of_questions: int,
    duration_minutes: int,
    language: str = "English",
    description: str | None = None,
):
    quiz = Quiz(
        user_id=user_id,
        title=title,
        description=description,
        question_type=question_type,
        number_of_questions=number_of_questions,
        duration_minutes=duration_minutes,
        language=language,
    )

    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    return quiz


# =========================================================
# ADD QUESTION
# =========================================================

def add_question(
    db: Session,
    quiz_id: int,
    question_text: str,
    question_type: str,
    correct_answer: str | None = None,
    explanation: str | None = None,
    marks: float = 1,
    order_number: int = 1,
    option_a: str | None = None,
    option_b: str | None = None,
    option_c: str | None = None,
    option_d: str | None = None,
):
    question = Question(
        quiz_id=quiz_id,
        question_text=question_text,
        question_type=question_type,
        option_a=option_a,
        option_b=option_b,
        option_c=option_c,
        option_d=option_d,
        correct_answer=correct_answer,
        explanation=explanation,
        marks=marks,
        order_number=order_number,
    )

    db.add(question)
    db.commit()
    db.refresh(question)

    return question


# =========================================================
# GET QUIZ
# =========================================================

def get_quiz(
    db: Session,
    quiz_id: int,
):
    return (
        db.query(Quiz)
        .filter(
            Quiz.id == quiz_id
        )
        .first()
    )


# =========================================================
# GET USER QUIZZES
# =========================================================

def get_user_quizzes(
    db: Session,
    user_id: int,
):
    return (
        db.query(Quiz)
        .filter(
            Quiz.user_id == user_id
        )
        .order_by(
            Quiz.created_at.desc()
        )
        .all()
    )


# =========================================================
# GET QUIZ QUESTIONS
# =========================================================

def get_quiz_questions(
    db: Session,
    quiz_id: int,
):
    return (
        db.query(Question)
        .filter(
            Question.quiz_id == quiz_id
        )
        .order_by(
            Question.order_number.asc()
        )
        .all()
    )


# =========================================================
# DELETE QUIZ
# =========================================================

def delete_quiz(
    db: Session,
    quiz_id: int,
):
    quiz = get_quiz(
        db,
        quiz_id
    )

    if not quiz:
        return False

    db.delete(quiz)
    db.commit()

    return True
