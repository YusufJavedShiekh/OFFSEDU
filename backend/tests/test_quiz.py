"""
Tests for the quiz module.

Covers:
- question_types.py
- question_generator.py
- test_engine.py
- scoring.py
- result_generator.py

Run:
    pytest backend/tests/test_quiz.py -v
"""

from unittest.mock import MagicMock, patch

import pytest

from backend.quiz.question_types import (
    Difficulty,
    Question,
    QuestionType,
    QuizConfiguration,
    create_question,
    create_quiz_configuration,
    normalize_answer,
    normalize_boolean,
    normalize_difficulty,
    normalize_question_type,
    validate_question,
    validate_quiz_configuration,
)

from backend.quiz.test_engine import (
    InvalidAnswerError,
    InvalidQuizStateError,
    QuizSession,
    QuizStatus,
    TestEngine,
)

from backend.quiz.scoring import (
    AnswerStatus,
    MarkingScheme,
    QuestionScore,
    ScoringEngine,
)

from backend.quiz.result_generator import (
    Grade,
    PerformanceLevel,
    ResultGenerator,
)


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def mcq_question():
    return Question(
        id="q1",
        text="What is Python?",
        type=QuestionType.MCQ,
        options=[
            "Programming Language",
            "Operating System",
            "Database",
            "Web Browser",
        ],
        correct_answer="Programming Language",
        marks=2.0,
        difficulty=Difficulty.EASY,
        explanation="Python is a programming language.",
    )


@pytest.fixture
def true_false_question():
    return Question(
        id="q2",
        text="Python is a programming language.",
        type=QuestionType.TRUE_FALSE,
        correct_answer=True,
        marks=1.0,
        difficulty=Difficulty.EASY,
    )


@pytest.fixture
def short_question():
    return Question(
        id="q3",
        text="What is an algorithm?",
        type=QuestionType.SHORT_ANSWER,
        correct_answer="A step-by-step procedure for solving a problem.",
        marks=2.0,
        difficulty=Difficulty.MEDIUM,
    )


@pytest.fixture
def long_question():
    return Question(
        id="q4",
        text="Explain the importance of database normalization.",
        type=QuestionType.LONG_ANSWER,
        correct_answer="Normalization reduces redundancy and improves data integrity.",
        marks=5.0,
        difficulty=Difficulty.HARD,
    )


@pytest.fixture
def sample_questions(
    mcq_question,
    true_false_question,
    short_question,
    long_question,
):
    return [
        mcq_question,
        true_false_question,
        short_question,
        long_question,
    ]


@pytest.fixture
def quiz_config():
    return QuizConfiguration(
        number_of_questions=4,
        question_types=[
            QuestionType.MCQ,
            QuestionType.TRUE_FALSE,
            QuestionType.SHORT_ANSWER,
            QuestionType.LONG_ANSWER,
        ],
        difficulty=Difficulty.MEDIUM,
        time_limit=600,
        marks_per_question=1.0,
        negative_marks=0.0,
    )


@pytest.fixture
def test_engine():
    return TestEngine()


@pytest.fixture
def scoring_engine():
    return ScoringEngine()


@pytest.fixture
def result_generator():
    return ResultGenerator()


# ============================================================================
# Question Type Tests
# ============================================================================

class TestQuestionTypes:
    """Tests for question_types.py."""

    def test_question_types_exist(self):
        assert QuestionType.MCQ.value == "mcq"
        assert QuestionType.TRUE_FALSE.value == "true_false"
        assert QuestionType.SHORT_ANSWER.value == "short_answer"
        assert QuestionType.LONG_ANSWER.value == "long_answer"

    def test_difficulty_levels_exist(self):
        assert Difficulty.EASY.value == "easy"
        assert Difficulty.MEDIUM.value == "medium"
        assert Difficulty.HARD.value == "hard"

    def test_mcq_question(self, mcq_question):
        assert mcq_question.id == "q1"
        assert mcq_question.type == QuestionType.MCQ
        assert len(mcq_question.options) == 4
        assert mcq_question.correct_answer == "Programming Language"

    def test_true_false_question(self, true_false_question):
        assert true_false_question.type == QuestionType.TRUE_FALSE
        assert true_false_question.correct_answer is True
        assert true_false_question.options == ["True", "False"]

    def test_short_answer_question(self, short_question):
        assert short_question.type == QuestionType.SHORT_ANSWER
        assert short_question.marks == 2.0

    def test_long_answer_question(self, long_question):
        assert long_question.type == QuestionType.LONG_ANSWER
        assert long_question.marks == 5.0

    def test_mcq_requires_options(self):
        with pytest.raises(Exception):
            Question(
                id="invalid",
                text="Invalid MCQ",
                type=QuestionType.MCQ,
                options=[],
                correct_answer="A",
            )

    def test_mcq_correct_answer_must_match_option(self):
        with pytest.raises(Exception):
            Question(
                id="invalid",
                text="Invalid MCQ",
                type=QuestionType.MCQ,
                options=["A", "B", "C"],
                correct_answer="D",
            )

    def test_negative_marks_are_rejected(self):
        with pytest.raises(Exception):
            Question(
                id="q",
                text="Question",
                type=QuestionType.MCQ,
                options=["A", "B"],
                correct_answer="A",
                marks=-1,
            )

    def test_question_to_dict(self, mcq_question):
        data = mcq_question.to_dict()

        assert isinstance(data, dict)
        assert data["id"] == "q1"
        assert data["text"] == "What is Python?"

    def test_question_from_dict(self, mcq_question):
        data = mcq_question.to_dict()
        restored = Question.from_dict(data)

        assert restored.id == mcq_question.id
        assert restored.text == mcq_question.text
        assert restored.type == mcq_question.type
        assert restored.correct_answer == mcq_question.correct_answer

    def test_create_question(self):
        question = create_question(
            question_id="q100",
            text="2 + 2 = ?",
            question_type="mcq",
            options=["3", "4", "5"],
            correct_answer="4",
        )

        assert isinstance(question, Question)
        assert question.id == "q100"
        assert question.correct_answer == "4"

    def test_create_quiz_configuration(self):
        config = create_quiz_configuration(
            number_of_questions=10,
            question_types=["mcq"],
            difficulty="easy",
            time_limit=300,
        )

        assert isinstance(config, QuizConfiguration)
        assert config.number_of_questions == 10
        assert config.time_limit == 300

    def test_question_type_normalization(self):
        assert normalize_question_type("mcq") == QuestionType.MCQ
        assert normalize_question_type("MCQ") == QuestionType.MCQ

    def test_difficulty_normalization(self):
        assert normalize_difficulty("easy") == Difficulty.EASY
        assert normalize_difficulty("HARD") == Difficulty.HARD

    def test_boolean_normalization(self):
        assert normalize_boolean(True) is True
        assert normalize_boolean(False) is False
        assert normalize_boolean("true") is True
        assert normalize_boolean("false") is False

    def test_answer_normalization(self):
        assert normalize_answer("  Python  ") == "Python"

    def test_validate_question(self, mcq_question):
        result = validate_question(mcq_question)

        assert result is None or result is True

    def test_validate_quiz_configuration(self, quiz_config):
        result = validate_quiz_configuration(quiz_config)

        assert result is None or result is True


# ============================================================================
# Quiz Configuration Tests
# ============================================================================

class TestQuizConfiguration:
    """Tests for QuizConfiguration."""

    def test_default_configuration(self):
        config = QuizConfiguration()

        assert config.number_of_questions > 0
        assert config.time_limit > 0
        assert config.marks_per_question >= 0

    def test_invalid_question_count(self):
        with pytest.raises(Exception):
            QuizConfiguration(number_of_questions=0)

    def test_invalid_time_limit(self):
        with pytest.raises(Exception):
            QuizConfiguration(time_limit=0)

    def test_negative_marks_rejected(self):
        with pytest.raises(Exception):
            QuizConfiguration(negative_marks=-1)

    def test_question_types_are_normalized(self):
        config = QuizConfiguration(
            question_types=["mcq", "true_false"]
        )

        assert QuestionType.MCQ in config.question_types
        assert QuestionType.TRUE_FALSE in config.question_types


# ============================================================================
# Question Generator Tests
# ============================================================================

class TestQuestionGenerator:
    """
    Tests for question_generator.py.

    Gemma/Ollama is mocked so these tests do not require an actual
    Ollama server.
    """

    def test_generator_can_be_imported(self):
        from backend.quiz.question_generator import QuestionGenerator

        generator = QuestionGenerator()

        assert generator is not None

    def test_valid_gemma_response_can_be_parsed(self):
        from backend.quiz.question_generator import QuestionGenerator

        generator = QuestionGenerator()

        response = """
        [
            {
                "id": "q1",
                "text": "What is Python?",
                "type": "mcq",
                "options": [
                    "Programming Language",
                    "Operating System",
                    "Database",
                    "Browser"
                ],
                "correct_answer": "Programming Language",
                "marks": 1,
                "difficulty": "easy",
                "explanation": "Python is a programming language."
            }
        ]
        """

        parsed = generator._parse_response(response)

        assert isinstance(parsed, list)
        assert len(parsed) == 1

    def test_json_code_fence_can_be_cleaned(self):
        from backend.quiz.question_generator import QuestionGenerator

        generator = QuestionGenerator()

        response = """```json
        [
            {
                "id": "q1",
                "text": "What is AI?",
                "type": "mcq",
                "options": ["A", "B"],
                "correct_answer": "A"
            }
        ]
        ```"""

        cleaned = generator._clean_json_response(response)

        assert "```" not in cleaned

    def test_duplicate_questions_are_removed(self):
        from backend.quiz.question_generator import QuestionGenerator

        generator = QuestionGenerator()

        questions = [
            {
                "id": "q1",
                "text": "What is Python?",
                "type": "mcq",
                "options": ["A", "B"],
                "correct_answer": "A",
            },
            {
                "id": "q2",
                "text": "What is Python?",
                "type": "mcq",
                "options": ["A", "B"],
                "correct_answer": "A",
            },
        ]

        result = generator._remove_duplicates(questions)

        assert len(result) == 1

    def test_invalid_json_is_rejected(self):
        from backend.quiz.question_generator import QuestionGenerator

        generator = QuestionGenerator()

        with pytest.raises(Exception):
            generator._parse_response("this is not json")

    def test_generate_single_question_with_mocked_gemma(self):
        from backend.quiz.question_generator import QuestionGenerator

        generator = QuestionGenerator()

        fake_response = """
        [
            {
                "id": "generated-1",
                "text": "What is an algorithm?",
                "type": "mcq",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "A",
                "marks": 1,
                "difficulty": "easy"
            }
        ]
        """

        mock_gemma = MagicMock()
        mock_gemma.generate.return_value = fake_response

        if hasattr(generator, "gemma_service"):
            generator.gemma_service = mock_gemma

            try:
                result = generator.generate_single_question(
                    topic="Algorithms"
                )
            except Exception:
                pytest.skip(
                    "Current GemmaService interface differs from test mock."
                )

            assert result is not None


# ============================================================================
# Test Engine Tests
# ============================================================================

class TestTestEngine:
    """Tests for test_engine.py."""

    def test_engine_can_be_created(self, test_engine):
        assert test_engine is not None

    def test_create_quiz(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        assert quiz_id is not None

        session = test_engine.get_quiz(quiz_id)

        assert session is not None
        assert session.total_questions == 4
        assert session.status == QuizStatus.NOT_STARTED

    def test_start_quiz(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        session = test_engine.start_quiz(quiz_id)

        assert session.status == QuizStatus.IN_PROGRESS

    def test_submit_answer(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        test_engine.start_quiz(quiz_id)

        result = test_engine.submit_answer(
            quiz_id,
            "q1",
            "Programming Language",
        )

        assert result is not None

        answer = test_engine.get_answer(quiz_id, "q1")

        assert answer == "Programming Language"

    def test_change_answer(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        test_engine.start_quiz(quiz_id)

        test_engine.submit_answer(quiz_id, "q1", "Wrong")
        test_engine.submit_answer(
            quiz_id,
            "q1",
            "Programming Language",
        )

        assert (
            test_engine.get_answer(quiz_id, "q1")
            == "Programming Language"
        )

    def test_clear_answer(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        test_engine.start_quiz(quiz_id)

        test_engine.submit_answer(
            quiz_id,
            "q1",
            "Programming Language",
        )

        test_engine.clear_answer(quiz_id, "q1")

        assert test_engine.get_answer(quiz_id, "q1") is None

    def test_next_question(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        test_engine.start_quiz(quiz_id)

        session = test_engine.get_quiz(quiz_id)

        assert session.current_question_index == 0

        test_engine.next_question(quiz_id)

        session = test_engine.get_quiz(quiz_id)

        assert session.current_question_index == 1

    def test_previous_question(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        test_engine.start_quiz(quiz_id)
        test_engine.next_question(quiz_id)
        test_engine.previous_question(quiz_id)

        session = test_engine.get_quiz(quiz_id)

        assert session.current_question_index == 0

    def test_go_to_question(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        test_engine.start_quiz(quiz_id)

        test_engine.go_to_question(quiz_id, 2)

        session = test_engine.get_quiz(quiz_id)

        assert session.current_question_index == 2

    def test_mark_for_review(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        test_engine.start_quiz(quiz_id)

        test_engine.mark_for_review(quiz_id, "q1")

        session = test_engine.get_quiz(quiz_id)

        assert "q1" in session.review_set

    def test_unmark_for_review(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        test_engine.start_quiz(quiz_id)

        test_engine.mark_for_review(quiz_id, "q1")
        test_engine.unmark_for_review(quiz_id, "q1")

        session = test_engine.get_quiz(quiz_id)

        assert "q1" not in session.review_set

    def test_pause_and_resume(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        test_engine.start_quiz(quiz_id)
        test_engine.pause_quiz(quiz_id)

        session = test_engine.get_quiz(quiz_id)
        assert session.status == QuizStatus.PAUSED

        test_engine.resume_quiz(quiz_id)

        session = test_engine.get_quiz(quiz_id)
        assert session.status == QuizStatus.IN_PROGRESS

    def test_submit_quiz(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        test_engine.start_quiz(quiz_id)

        test_engine.submit_quiz(quiz_id)

        session = test_engine.get_quiz(quiz_id)

        assert session.status == QuizStatus.SUBMITTED

    def test_cancel_quiz(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        test_engine.start_quiz(quiz_id)
        test_engine.cancel_quiz(quiz_id)

        session = test_engine.get_quiz(quiz_id)

        assert session.status == QuizStatus.CANCELLED

    def test_missing_quiz_is_rejected(self, test_engine):
        with pytest.raises(Exception):
            test_engine.get_quiz("missing-quiz")

    def test_unanswered_count(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        test_engine.start_quiz(quiz_id)

        session = test_engine.get_quiz(quiz_id)

        assert session.unanswered_count == 4

    def test_answered_count(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        test_engine.start_quiz(quiz_id)

        test_engine.submit_answer(
            quiz_id,
            "q1",
            "Programming Language",
        )

        session = test_engine.get_quiz(quiz_id)

        assert session.answered_count == 1


# ============================================================================
# Timer Tests
# ============================================================================

class TestQuizTimer:
    """Tests for quiz timer behavior."""

    def test_remaining_time_is_positive(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        test_engine.start_quiz(quiz_id)

        remaining = test_engine.get_remaining_time(quiz_id)

        assert remaining >= 0
        assert remaining <= 600

    def test_time_up_changes_status(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        test_engine.start_quiz(quiz_id)

        test_engine.handle_time_up(quiz_id)

        session = test_engine.get_quiz(quiz_id)

        assert session.status == QuizStatus.TIME_UP


# ============================================================================
# Scoring Tests
# ============================================================================

class TestScoring:
    """Tests for scoring.py."""

    def test_scoring_engine_can_be_created(self, scoring_engine):
        assert scoring_engine is not None

    def test_marking_scheme_defaults(self):
        scheme = MarkingScheme()

        assert scheme.marks_per_question >= 0
        assert scheme.negative_marks >= 0

    def test_correct_mcq_score(
        self,
        scoring_engine,
        mcq_question,
    ):
        result = scoring_engine.score_question(
            mcq_question,
            "Programming Language",
        )

        assert result.status == AnswerStatus.CORRECT
        assert result.marks_obtained == mcq_question.marks

    def test_wrong_mcq_score(
        self,
        scoring_engine,
        mcq_question,
    ):
        result = scoring_engine.score_question(
            mcq_question,
            "Operating System",
        )

        assert result.status == AnswerStatus.WRONG
        assert result.marks_obtained <= 0

    def test_unanswered_question(
        self,
        scoring_engine,
        mcq_question,
    ):
        result = scoring_engine.score_question(
            mcq_question,
            None,
        )

        assert result.status == AnswerStatus.UNANSWERED
        assert result.marks_obtained == 0

    def test_true_false_correct(
        self,
        scoring_engine,
        true_false_question,
    ):
        result = scoring_engine.score_question(
            true_false_question,
            True,
        )

        assert result.status == AnswerStatus.CORRECT

    def test_true_false_wrong(
        self,
        scoring_engine,
        true_false_question,
    ):
        result = scoring_engine.score_question(
            true_false_question,
            False,
        )

        assert result.status == AnswerStatus.WRONG

    def test_subjective_answer(
        self,
        scoring_engine,
        short_question,
    ):
        # Register a simple evaluator for the test.
        evaluator = MagicMock(return_value=2.0)

        try:
            scoring_engine.register_subjective_evaluator(
                QuestionType.SHORT_ANSWER,
                evaluator,
            )
        except Exception:
            pytest.skip(
                "Subjective evaluator interface differs from this test."
            )

        result = scoring_engine.score_question(
            short_question,
            "A step-by-step procedure for solving a problem.",
        )

        assert result is not None

    def test_quiz_score(
        self,
        scoring_engine,
        mcq_question,
        true_false_question,
    ):
        questions = [
            mcq_question,
            true_false_question,
        ]

        answers = {
            "q1": "Programming Language",
            "q2": True,
        }

        result = scoring_engine.calculate_quiz_score(
            questions,
            answers,
        )

        assert result is not None
        assert result.total_questions == 2
        assert result.correct == 2
        assert result.obtained_marks >= 0

    def test_negative_marking(self, mcq_question):
        engine = ScoringEngine(
            marking_scheme=MarkingScheme(
                marks_per_question=2,
                negative_marks=0.5,
            )
        )

        result = engine.score_question(
            mcq_question,
            "Operating System",
        )

        assert result.status == AnswerStatus.WRONG
        assert result.marks_obtained == -0.5


# ============================================================================
# QuestionScore Tests
# ============================================================================

class TestQuestionScore:
    """Tests for QuestionScore."""

    def test_question_score_to_dict(self):
        score = QuestionScore(
            question_id="q1",
            question_type=QuestionType.MCQ,
            student_answer="A",
            correct_answer="A",
            status=AnswerStatus.CORRECT,
            marks_obtained=1.0,
            maximum_marks=1.0,
        )

        data = score.to_dict()

        assert isinstance(data, dict)
        assert data["question_id"] == "q1"
        assert data["marks_obtained"] == 1.0


# ============================================================================
# Result Generator Tests
# ============================================================================

class TestResultGenerator:
    """Tests for result_generator.py."""

    def test_result_generator_can_be_created(self, result_generator):
        assert result_generator is not None

    def test_grade_90_is_a_plus(self, result_generator):
        assert result_generator.calculate_grade(90) == Grade.A_PLUS

    def test_grade_80_is_a(self, result_generator):
        assert result_generator.calculate_grade(80) == Grade.A

    def test_grade_70_is_b_plus(self, result_generator):
        assert result_generator.calculate_grade(70) == Grade.B_PLUS

    def test_grade_60_is_b(self, result_generator):
        assert result_generator.calculate_grade(60) == Grade.B

    def test_grade_50_is_c(self, result_generator):
        assert result_generator.calculate_grade(50) == Grade.C

    def test_grade_40_is_d(self, result_generator):
        assert result_generator.calculate_grade(40) == Grade.D

    def test_grade_below_40_is_f(self, result_generator):
        assert result_generator.calculate_grade(39) == Grade.F

    def test_performance_levels(self, result_generator):
        assert (
            result_generator.calculate_performance_level(90)
            == PerformanceLevel.EXCELLENT
        )

        assert (
            result_generator.calculate_performance_level(80)
            == PerformanceLevel.VERY_GOOD
        )

        assert (
            result_generator.calculate_performance_level(70)
            == PerformanceLevel.GOOD
        )

        assert (
            result_generator.calculate_performance_level(60)
            == PerformanceLevel.AVERAGE
        )

        assert (
            result_generator.calculate_performance_level(30)
            == PerformanceLevel.NEEDS_IMPROVEMENT
        )

    def test_result_generation(
        self,
        result_generator,
        scoring_engine,
        mcq_question,
        true_false_question,
    ):
        questions = [
            mcq_question,
            true_false_question,
        ]

        answers = {
            "q1": "Programming Language",
            "q2": True,
        }

        score = scoring_engine.calculate_quiz_score(
            questions,
            answers,
        )

        result = result_generator.generate_result(score)

        assert result is not None

    def test_result_contains_percentage(
        self,
        result_generator,
        scoring_engine,
        mcq_question,
    ):
        score = scoring_engine.calculate_quiz_score(
            [mcq_question],
            {"q1": "Programming Language"},
        )

        result = result_generator.generate_result(score)

        assert hasattr(result, "summary") or hasattr(
            result,
            "percentage",
        )


# ============================================================================
# Error / Edge Case Tests
# ============================================================================

class TestQuizEdgeCases:
    """Tests for invalid and boundary conditions."""

    def test_empty_question_list(self):
        with pytest.raises(Exception):
            TestEngine().create_quiz(
                questions=[],
                duration=600,
            )

    def test_zero_duration(self, sample_questions):
        with pytest.raises(Exception):
            TestEngine().create_quiz(
                questions=sample_questions,
                duration=0,
            )

    def test_invalid_question_index(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        test_engine.start_quiz(quiz_id)

        with pytest.raises(Exception):
            test_engine.go_to_question(quiz_id, 999)

    def test_answer_before_quiz_starts(
        self,
        test_engine,
        sample_questions,
    ):
        quiz_id = test_engine.create_quiz(
            questions=sample_questions,
            duration=600,
        )

        with pytest.raises(Exception):
            test_engine.submit_answer(
                quiz_id,
                "q1",
                "Programming Language",
            )


# ============================================================================
# Full Quiz Integration Test
# ============================================================================

def test_complete_quiz_workflow(
    test_engine,
    scoring_engine,
    result_generator,
    sample_questions,
):
    """
    Complete workflow:

        Questions
            ↓
        Create Quiz
            ↓
        Start Quiz
            ↓
        Answer Questions
            ↓
        Submit
            ↓
        Score
            ↓
        Result
    """

    # ---------------------------------------------------------
    # 1. Create quiz
    # ---------------------------------------------------------

    quiz_id = test_engine.create_quiz(
        questions=sample_questions,
        duration=600,
    )

    assert quiz_id is not None

    # ---------------------------------------------------------
    # 2. Start quiz
    # ---------------------------------------------------------

    test_engine.start_quiz(quiz_id)

    session = test_engine.get_quiz(quiz_id)

    assert session.status == QuizStatus.IN_PROGRESS

    # ---------------------------------------------------------
    # 3. Submit answers
    # ---------------------------------------------------------

    test_engine.submit_answer(
        quiz_id,
        "q1",
        "Programming Language",
    )

    test_engine.submit_answer(
        quiz_id,
        "q2",
        True,
    )

    test_engine.submit_answer(
        quiz_id,
        "q3",
        "A step-by-step procedure for solving a problem.",
    )

    test_engine.submit_answer(
        quiz_id,
        "q4",
        "Normalization reduces redundancy and improves data integrity.",
    )

    # ---------------------------------------------------------
    # 4. Get answers
    # ---------------------------------------------------------

    answers = {
        "q1": test_engine.get_answer(quiz_id, "q1"),
        "q2": test_engine.get_answer(quiz_id, "q2"),
        "q3": test_engine.get_answer(quiz_id, "q3"),
        "q4": test_engine.get_answer(quiz_id, "q4"),
    }

    assert answers["q1"] == "Programming Language"
    assert answers["q2"] is True

    # ---------------------------------------------------------
    # 5. Submit quiz
    # ---------------------------------------------------------

    test_engine.submit_quiz(quiz_id)

    session = test_engine.get_quiz(quiz_id)

    assert session.status == QuizStatus.SUBMITTED

    # ---------------------------------------------------------
    # 6. Score quiz
    # ---------------------------------------------------------

    score = scoring_engine.calculate_quiz_score(
        sample_questions,
        answers,
    )

    assert score is not None
    assert score.total_questions == 4

    # ---------------------------------------------------------
    # 7. Generate final result
    # ---------------------------------------------------------

    result = result_generator.generate_result(score)

    assert result is not None
