from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)

from sqlalchemy.orm import relationship

from database.database import Base


# =========================================================
# USER
# =========================================================

class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(100),
        nullable=False,
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash = Column(
        String(255),
        nullable=True,
    )

    preferred_language = Column(
        String(20),
        default="English",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    # Relationships

    documents = relationship(
        "Document",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    chat_sessions = relationship(
        "ChatSession",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    quizzes = relationship(
        "Quiz",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    quiz_attempts = relationship(
        "QuizAttempt",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    study_plans = relationship(
        "StudyPlan",
        back_populates="user",
        cascade="all, delete-orphan",
    )


# =========================================================
# DOCUMENT
# =========================================================

class Document(Base):

    __tablename__ = "documents"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    original_filename = Column(
        String(255),
        nullable=False,
    )

    stored_filename = Column(
        String(255),
        nullable=False,
    )

    file_path = Column(
        String(500),
        nullable=False,
    )

    file_type = Column(
        String(50),
        nullable=False,
    )

    file_size = Column(
        Integer,
        nullable=True,
    )

    extracted_text = Column(
        Text,
        nullable=True,
    )

    language = Column(
        String(20),
        default="English",
    )

    status = Column(
        String(50),
        default="uploaded",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    # Relationship

    user = relationship(
        "User",
        back_populates="documents",
    )


# =========================================================
# CHAT SESSION
# =========================================================

class ChatSession(Base):

    __tablename__ = "chat_sessions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    title = Column(
        String(255),
        default="New Chat",
    )

    language = Column(
        String(20),
        default="English",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # Relationships

    user = relationship(
        "User",
        back_populates="chat_sessions",
    )

    messages = relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
    )


# =========================================================
# CHAT MESSAGE
# =========================================================

class ChatMessage(Base):

    __tablename__ = "chat_messages"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    session_id = Column(
        Integer,
        ForeignKey("chat_sessions.id"),
        nullable=False,
        index=True,
    )

    role = Column(
        String(20),
        nullable=False,
    )

    message = Column(
        Text,
        nullable=False,
    )

    language = Column(
        String(20),
        default="English",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    # Relationship

    session = relationship(
        "ChatSession",
        back_populates="messages",
    )


# =========================================================
# QUIZ
# =========================================================

class Quiz(Base):

    __tablename__ = "quizzes"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    title = Column(
        String(255),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    question_type = Column(
        String(50),
        nullable=False,
    )

    number_of_questions = Column(
        Integer,
        default=10,
    )

    duration_minutes = Column(
        Integer,
        default=30,
    )

    language = Column(
        String(20),
        default="English",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    # Relationships

    user = relationship(
        "User",
        back_populates="quizzes",
    )

    questions = relationship(
        "Question",
        back_populates="quiz",
        cascade="all, delete-orphan",
    )

    attempts = relationship(
        "QuizAttempt",
        back_populates="quiz",
        cascade="all, delete-orphan",
    )


# =========================================================
# QUESTION
# =========================================================

class Question(Base):

    __tablename__ = "questions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    quiz_id = Column(
        Integer,
        ForeignKey("quizzes.id"),
        nullable=False,
        index=True,
    )

    question_text = Column(
        Text,
        nullable=False,
    )

    question_type = Column(
        String(50),
        nullable=False,
    )

    option_a = Column(
        Text,
        nullable=True,
    )

    option_b = Column(
        Text,
        nullable=True,
    )

    option_c = Column(
        Text,
        nullable=True,
    )

    option_d = Column(
        Text,
        nullable=True,
    )

    correct_answer = Column(
        Text,
        nullable=True,
    )

    explanation = Column(
        Text,
        nullable=True,
    )

    marks = Column(
        Float,
        default=1,
    )

    order_number = Column(
        Integer,
        default=1,
    )

    # Relationship

    quiz = relationship(
        "Quiz",
        back_populates="questions",
    )


# =========================================================
# QUIZ ATTEMPT
# =========================================================

class QuizAttempt(Base):

    __tablename__ = "quiz_attempts"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    quiz_id = Column(
        Integer,
        ForeignKey("quizzes.id"),
        nullable=False,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    score = Column(
        Float,
        default=0,
    )

    total_marks = Column(
        Float,
        default=0,
    )

    percentage = Column(
        Float,
        default=0,
    )

    completed = Column(
        Boolean,
        default=False,
    )

    started_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    completed_at = Column(
        DateTime,
        nullable=True,
    )

    # Relationships

    quiz = relationship(
        "Quiz",
        back_populates="attempts",
    )

    user = relationship(
        "User",
        back_populates="quiz_attempts",
    )

    answers = relationship(
        "QuizAnswer",
        back_populates="attempt",
        cascade="all, delete-orphan",
    )


# =========================================================
# QUIZ ANSWER
# =========================================================

class QuizAnswer(Base):

    __tablename__ = "quiz_answers"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    attempt_id = Column(
        Integer,
        ForeignKey("quiz_attempts.id"),
        nullable=False,
        index=True,
    )

    question_id = Column(
        Integer,
        ForeignKey("questions.id"),
        nullable=False,
        index=True,
    )

    answer = Column(
        Text,
        nullable=True,
    )

    marks_awarded = Column(
        Float,
        default=0,
    )

    is_correct = Column(
        Boolean,
        default=False,
    )

    feedback = Column(
        Text,
        nullable=True,
    )

    # Relationship

    attempt = relationship(
        "QuizAttempt",
        back_populates="answers",
    )

    question = relationship(
        "Question",
    )


# =========================================================
# STUDY PLAN
# =========================================================

class StudyPlan(Base):

    __tablename__ = "study_plans"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    title = Column(
        String(255),
        nullable=False,
    )

    subjects = Column(
        Text,
        nullable=False,
    )

    duration_days = Column(
        Integer,
        nullable=False,
    )

    hours_per_day = Column(
        Float,
        nullable=False,
    )

    language = Column(
        String(20),
        default="English",
    )

    plan_data = Column(
        Text,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    # Relationship

    user = relationship(
        "User",
        back_populates="study_plans",
    )


# =========================================================
# GENERATED FILE
# =========================================================

class GeneratedFile(Base):

    __tablename__ = "generated_files"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    original_filename = Column(
        String(255),
        nullable=True,
    )

    generated_filename = Column(
        String(255),
        nullable=False,
    )

    file_path = Column(
        String(500),
        nullable=False,
    )

    file_type = Column(
        String(50),
        nullable=False,
    )

    operation = Column(
        String(50),
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )
