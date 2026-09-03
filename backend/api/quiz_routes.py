from flask import Blueprint, jsonify, request

from ai.quiz_service import quiz_service


quiz_bp = Blueprint(
    "quiz",
    __name__,
    url_prefix="/api/quiz"
)


@quiz_bp.route("/", methods=["POST"])
def generate_quiz():
    """Generate an AI-powered quiz."""

    data = request.get_json(silent=True) or {}

    topic = data.get("topic", "").strip()
    num_questions = data.get("num_questions", 5)

    if not topic:
        return jsonify({
            "success": False,
            "error": "Topic is required"
        }), 400

    try:
        num_questions = int(num_questions)
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "error": "num_questions must be a number"
        }), 400

    if num_questions < 1 or num_questions > 50:
        return jsonify({
            "success": False,
            "error": "num_questions must be between 1 and 50"
        }), 400

    try:
        quiz = quiz_service.generate_quiz(
            topic=topic,
            num_questions=num_questions
        )

        return jsonify({
            "success": True,
            "topic": topic,
            "num_questions": num_questions,
            "questions": quiz
        })

    except ValueError as error:
        return jsonify({
            "success": False,
            "error": str(error)
        }), 400

    except Exception as error:
        return jsonify({
            "success": False,
            "error": "Unable to generate quiz.",
            "details": str(error)
        }), 500